import OpenAI from "openai";
import { getEnv } from "../config/env.js";

export function getOpenAIClient(): OpenAI {
  const env = getEnv();
  return new OpenAI({ apiKey: env.OPENAI_API_KEY });
}

const SUPPORT_ONLY_DEFAULT =
  "Only respond if this email is a direct customer support request, help request, question about an order/account/refund, or complaint. Do NOT respond to marketing, promotions, newsletters, bulk mail, automated notifications, or anything that is not a genuine support request from a person.";

const DEFAULT_SYSTEM =
  "You are an email assistant helping resolve customer service issues. Be professional, firm but respectful. Work toward resolution. Include a clear ask/CTA. Keep it concise. Output only the email body, no subject line.\n\nSTRICT ANTI-HALLUCINATION (you have NO access to external systems or records):\n- Use ONLY information explicitly stated in the thread. Do not invent names, ticket numbers, dates, documents, attachments, or any details.\n- NEVER claim that something has already been done (e.g. 'we have processed your request', 'we have received your document', 'your order has been shipped', 'we've updated your account') unless the thread explicitly states that. We do not have access to orders, records, or back-office systems.\n- Do NOT say 'as per our records', 'our records show', 'we have on file' — we do not have records. Only refer to what the sender wrote in this thread.\n- Do not promise to send documents, files, or information you do not have. If the sender asked for something you cannot provide, acknowledge the request and say a team member will follow up — do not pretend to have or send it.\n- Never invent outcomes, resolutions, or past actions. Only acknowledge what the sender wrote and state what you will do or ask for next.";

/** Returns true if the email thread matches the user's trigger description (e.g. customer support). When empty, uses support-only default. */
export async function shouldTriggerReply(
  latestFrom: string,
  latestSubject: string,
  latestBody: string,
  triggerDescription: string
): Promise<boolean> {
  const env = getEnv();
  if (!env.OPENAI_API_KEY) return false;
  const criteria = triggerDescription.trim()
    ? triggerDescription.trim()
    : SUPPORT_ONLY_DEFAULT;
  const openai = getOpenAIClient();
  const model = env.VALIDATOR_MODEL ?? "gpt-4o-mini";
  const prompt = `You decide whether to auto-respond to this email.

Criteria for when to trigger a reply:
"""
${criteria}
"""

Email to classify:
From: ${latestFrom}
Subject: ${latestSubject}

Body:
${latestBody.slice(0, 2000)}

Answer with only YES or NO: should we auto-reply to this email?`;
  const completion = await openai.chat.completions.create({
    model,
    messages: [
      {
        role: "system",
        content:
          "You output only YES or NO. YES only if the email clearly matches the criteria. NO for marketing, promos, newsletters, or non-support. NO otherwise.",
      },
      { role: "user", content: prompt },
    ],
    max_tokens: 10,
  });
  const answer = completion.choices[0]?.message?.content?.trim().toUpperCase();
  return answer === "YES" || answer?.startsWith("YES");
}

/** Classification result: whether we can auto-reply, need human, or should escalate. */
export type InboundClassification = {
  action: "reply" | "escalate" | "needs_human";
  /** Short reason (required for needs_human, optional for others). */
  reason?: string;
  /** Email address to escalate/forward to (required when action is escalate). */
  escalateTo?: string;
};

/**
 * Classify the inbound email: can we reply safely, does it need human intervention, or should we escalate?
 * Uses full thread context so the AI sees who it's from, what they said, and any escalation/document requests.
 */
export async function classifyInboundEmail(
  threadHistory: Array<{ from: string; body: string }>,
  latestFrom: string,
  latestSubject: string,
  latestBody: string
): Promise<InboundClassification> {
  const env = getEnv();
  if (!env.OPENAI_API_KEY) {
    return { action: "reply" };
  }
  const openai = getOpenAIClient();
  const model = env.VALIDATOR_MODEL ?? "gpt-4o-mini";

  const threadText = threadHistory
    .map((m) => `From: ${m.from}\n${m.body}`)
    .join("\n\n---\n\n");

  const systemContent = `You classify inbound emails for an automated support system. Output valid JSON only.

PREFER auto-reply when safe: Use "reply" whenever we can answer from the thread without claiming past actions or needing data we don't have. Most support questions (status, next steps, clarification) can be "reply".

Rules:
- action "reply": Safe to auto-reply using only the thread. Use for: general questions, requests for next steps, clarification, acknowledgments, follow-ups we can answer. The reply must NOT claim any past action (e.g. "we have processed", "we received your document") unless the thread explicitly states it.
- action "escalate": The sender explicitly asked to forward/escalate to another email address. Set escalateTo to that address.
- action "needs_human": ONLY when we would have to assume or claim something critical. Use when:
  - The sender asked for documents, attachments, or specific info we don't have access to.
  - The sender is asking "did you receive X?" or "has Y been processed?" and we cannot verify (reply would have to assume).
  - Legal, compliance, or highly sensitive.
  - Unclear or disputed so a wrong auto-reply could cause harm.
Do NOT use needs_human for normal support questions we can answer from the thread. Prefer "reply" when in doubt unless data is critical or we'd be assuming.
Set "reason" when needs_human: short summary for the user.

Output JSON: { "action": "reply" | "escalate" | "needs_human", "reason": "string or omit", "escalateTo": "email or omit" }`;

  const userContent = `Thread so far:
${threadText}

Latest message to classify:
From: ${latestFrom}
Subject: ${latestSubject}

Body:
${latestBody.slice(0, 4000)}

Output JSON only:`;

  const completion = await openai.chat.completions.create({
    model,
    messages: [
      { role: "system", content: systemContent },
      { role: "user", content: userContent },
    ],
    response_format: { type: "json_object" },
    max_tokens: 300,
  });

  const raw = completion.choices[0]?.message?.content?.trim();
  if (!raw) return { action: "reply" };

  try {
    const parsed = JSON.parse(raw) as {
      action?: string;
      reason?: string;
      escalateTo?: string;
    };
    const action = parsed.action === "escalate" ? "escalate" : parsed.action === "needs_human" ? "needs_human" : "reply";
    const reason = typeof parsed.reason === "string" ? parsed.reason.trim().slice(0, 500) : undefined;
    let escalateTo: string | undefined;
    if (action === "escalate" && typeof parsed.escalateTo === "string") {
      const email = parsed.escalateTo.trim();
      if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) escalateTo = email;
    }
    return { action, reason, escalateTo };
  } catch {
    return { action: "reply" };
  }
}

/** Parse display name from From header: "Name <email>" -> "Name", or return empty. */
export function parseSenderName(fromHeader: string): string {
  const trimmed = (fromHeader ?? "").trim();
  const match = trimmed.match(/^([^<]+)</);
  if (match) {
    const name = match[1].replace(/^["']|["']$/g, "").trim();
    return name.length > 0 ? name : "";
  }
  return "";
}

export async function generateReply(
  threadHistory: Array<{ from: string; body: string }>,
  replyInstructions?: string | null,
  senderName?: string | null
): Promise<string> {
  const env = getEnv();
  if (!env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not set");
  }
  const openai = getOpenAIClient();
  const model = env.REPLY_MODEL ?? "gpt-4o";

  const threadText = threadHistory
    .map((m) => `From: ${m.from}\n${m.body}`)
    .join("\n\n---\n\n");

  let systemContent = DEFAULT_SYSTEM;
  if (senderName?.trim()) {
    const name = senderName.trim().slice(0, 100).replace(/\s+/g, " ").trim();
    const firstName = name.split(" ")[0] ?? name;
    systemContent += ` The person you are replying to is: ${name}. Use their first name in the greeting if appropriate (e.g. Hi ${firstName},).`;
  }
  if ((replyInstructions?.trim()?.length ?? 0) > 0) {
    systemContent += `\n\nAdditional instructions from the user:\n${replyInstructions!.trim()}`;
  }
  systemContent +=
    "\n\nOutput only the email body. No placeholders, no [brackets], no invented details. Use only facts from the thread. Do not claim we did something or have records — only what is in the thread.";

  const completion = await openai.chat.completions.create({
    model,
    messages: [
      { role: "system", content: systemContent },
      {
        role: "user",
        content: `Email Thread:\n\n${threadText}\n\nGenerate a reply email (body only, no subject):`,
      },
    ],
  });

  return completion.choices[0]?.message?.content?.trim() ?? "";
}

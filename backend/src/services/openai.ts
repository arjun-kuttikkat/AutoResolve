import OpenAI from "openai";
import { getEnv } from "../config/env.js";

export function getOpenAIClient(): OpenAI {
  const env = getEnv();
  return new OpenAI({ apiKey: env.OPENAI_API_KEY });
}

const DEFAULT_SYSTEM =
  "You are John, a customer negotiating with a company. Your goal is to resolve an issue effectively. Be professional but firm. Output only the email body. DO NOT include any subject line. DO NOT include any placeholders like [Your Name] or [Order Number] unless specifically asked. DO NOT include the AutoResolve Case Reference ID.";

export interface CaseContext {
  merchantName?: string | null;
  issueDescription?: string | null;
  desiredOutcome?: string | null;
  caseReferenceId?: string | null;
}

/** Returns true if the email thread matches the user's trigger description (e.g. customer support). */
export async function shouldTriggerReply(
  latestFrom: string,
  latestSubject: string,
  latestBody: string,
  triggerDescription: string
): Promise<boolean> {
  const env = getEnv();
  if (!env.OPENAI_API_KEY || !triggerDescription.trim()) return true;
  const openai = getOpenAIClient();
  const model = env.VALIDATOR_MODEL ?? "gpt-4o-mini";
  const prompt = `You decide whether to auto-respond to an email.

User's criteria for when to trigger a reply:
"""
${triggerDescription.trim()}
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
          "You output only YES or NO. YES if the email matches the user's criteria for when to auto-respond. NO otherwise.",
      },
      { role: "user", content: prompt },
    ],
    max_tokens: 10,
  });
  const answer = completion.choices[0]?.message?.content?.trim().toUpperCase();
  return answer === "YES" || (answer?.startsWith("YES") ?? false);
}

export async function generateReply(
  threadHistory: Array<{ from: string; body: string }>,
  replyInstructions?: string | null,
  tone?: string,
  userContext?: string,
  images?: string[],
  caseContext?: CaseContext
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

  if (caseContext) {
    systemContent += `\n\nCONTEXT:\nYou are negotiating with: ${caseContext.merchantName || "Unknown Merchant"
      }.\nIssue: ${caseContext.issueDescription || "General Inquiry"}.\nDesired Outcome: ${caseContext.desiredOutcome || "Resolution"
      }.`;
    if (caseContext.caseReferenceId) {
      systemContent += `\nIMPORTANT: Internal Case ID is ${caseContext.caseReferenceId}. DO NOT reveal this ID to the seller.`;
    }
  }

  if (replyInstructions?.trim()) {
    systemContent += `\n\nAdditional Instructions: ${replyInstructions.trim()}`;
  }

  if (tone) {
    systemContent += `\n\nTONE: ${tone}`;
  }

  const userPromptStart = `Email Thread History (Read carefully):\n\n${threadText}\n\n`;
  let userPromptEnd = "Generate the reply email body (Text only, no subject, no signatures with placeholders):";

  if (userContext) {
    userPromptEnd = `EXTRA USER NOTE:\n${userContext}\n\n${userPromptEnd}`;
  }

  if (images && images.length > 0) {
    // Vision request
    // "gpt-4o" supports vision. verify if model supports it, but gpt-4o does.
    const contentParts: Array<
      | { type: "text"; text: string }
      | { type: "image_url"; image_url: { url: string } }
    > = [{ type: "text", text: userPromptStart + userPromptEnd }];

    for (const base64 of images) {
      // base64 might contain "data:image/png;base64," prefix or might not.
      // OpenAI expects data URL or URL.
      // Ensure it's a data URL.
      let url = base64;
      if (!base64.startsWith("data:")) {
        url = `data:image/jpeg;base64,${base64}`;
      }
      contentParts.push({
        type: "image_url",
        image_url: { url },
      });
    }

    const completion = await openai.chat.completions.create({
      model,
      messages: [
        { role: "system", content: systemContent },
        { role: "user", content: contentParts },
      ],
    });
    return completion.choices[0]?.message?.content?.trim() ?? "";
  }

  const completion = await openai.chat.completions.create({
    model,
    messages: [
      { role: "system", content: systemContent },
      {
        role: "user",
        content: userPromptStart + userPromptEnd,
      },
    ],
  });

  return completion.choices[0]?.message?.content?.trim() ?? "";
}

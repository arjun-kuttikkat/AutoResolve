import OpenAI from "openai";
import { getEnv } from "../config/env.js";

export function getOpenAIClient(): OpenAI {
  const env = getEnv();
  return new OpenAI({ apiKey: env.OPENAI_API_KEY });
}

const DEFAULT_SYSTEM =
  "You are an email assistant helping resolve customer service issues. Be professional, firm but respectful. Work toward resolution. Include a clear ask/CTA. Keep it concise. Output only the email body, no subject line.";

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
  return answer === "YES" || answer?.startsWith("YES");
}

export async function generateReply(
  threadHistory: Array<{ from: string; body: string }>,
  replyInstructions?: string | null
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

  const systemContent =
    (replyInstructions?.trim()?.length ?? 0) > 0
      ? `${DEFAULT_SYSTEM}\n\nAdditional instructions from the user:\n${replyInstructions!.trim()}`
      : DEFAULT_SYSTEM;

  const completion = await openai.chat.completions.create({
    model,
    messages: [
      { role: "system", content: systemContent },
      {
        role: "user",
        content: `Email Thread:\n\n${threadText}\n\nGenerate a reply email (body only):`,
      },
    ],
  });

  return completion.choices[0]?.message?.content?.trim() ?? "";
}

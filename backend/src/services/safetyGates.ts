import OpenAI from "openai";
import { getEnv } from "../config/env.js";

export interface SafetyResult {
  passed: boolean;
  reasons: string[];
  confidence: number;
}

/** Phrases that suggest the reply is claiming past actions we cannot verify (hallucination). */
const HALLUCINATION_PHRASES = [
  /\bwe've?\s+(received|processed|updated|sent|shipped|completed)\b/i,
  /\bwe\s+have\s+(received|processed|updated|sent|shipped|completed)\b/i,
  /\bas\s+per\s+(our\s+)?records?\b/i,
  /\bour\s+records?\s+show\b/i,
  /\b(our|we)\s+have\s+on\s+file\b/i,
  /\byour\s+(request|order|application)\s+has\s+been\s+(processed|shipped|approved|updated)\b/i,
  /\b(already\s+)?(processed|received|shipped)\s+your\b/i,
];

function quickRegexCheck(replyContent: string): SafetyResult {
  const hasThreats = /(sue|legal action|lawyer|attorney|lawsuit)/i.test(replyContent);
  const hasFraudAdmission = /(fraud|stole|illegal|committed)/i.test(replyContent);
  const hasSensitiveInfo = /(ssn|social security|password|credit card|account number)/i.test(
    replyContent
  );
  const hasHallucination = HALLUCINATION_PHRASES.some((re) => re.test(replyContent));
  const hasCTA = /(please|request|would like|need|ask)/i.test(replyContent);
  const isCoherent =
    replyContent.length > 50 && replyContent.length < 2000;

  const reasons: string[] = [];
  if (hasThreats) reasons.push("hasThreats");
  if (hasFraudAdmission) reasons.push("hasFraudAdmission");
  if (hasSensitiveInfo) reasons.push("hasSensitiveInfo");
  if (hasHallucination) reasons.push("possibleHallucination");
  if (!hasCTA) reasons.push("missingCTA");
  if (!isCoherent) reasons.push("notCoherent");

  const passed =
    !hasThreats &&
    !hasFraudAdmission &&
    !hasSensitiveInfo &&
    !hasHallucination &&
    hasCTA &&
    isCoherent;

  return {
    passed,
    reasons,
    confidence: passed ? 80 : 0,
  };
}

export async function checkSafetyGates(replyContent: string): Promise<SafetyResult> {
  const regexResult = quickRegexCheck(replyContent);
  if (!regexResult.passed) {
    return regexResult;
  }

  const env = getEnv();
  if (!env.OPENAI_API_KEY) {
    return { passed: false, reasons: ["OPENAI_API_KEY not set"], confidence: 0 };
  }
  const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });
  const model = env.VALIDATOR_MODEL ?? "gpt-4o-mini";

  const completion = await openai.chat.completions.create({
    model,
    messages: [
      {
        role: "system",
        content:
          "You are a safety validator for email replies. Output JSON only. STRICT: Set allow_auto_send to false if the reply claims any past action (e.g. 'we have received', 'we've processed', 'your order has been shipped', 'as per our records') that could be hallucinated — we have no access to external systems or records. Only allow auto_send if the reply uses only information from the thread and does not invent outcomes or actions that have already occurred.",
      },
      {
        role: "user",
        content: `Validate this email reply for safety and possible hallucination:\n\n${replyContent}\n\nOutput JSON: { "allow_auto_send": boolean, "reasons": string[], "confidence": 0-100 }. Set allow_auto_send false if it claims we did something or have records we cannot verify.`,
      },
    ],
    response_format: { type: "json_object" },
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) {
    return { passed: false, reasons: ["validator_no_response"], confidence: 0 };
  }

  try {
    const validation = JSON.parse(raw) as {
      allow_auto_send?: boolean;
      reasons?: string[];
      confidence?: number;
    };
    const confidence = typeof validation.confidence === "number" ? validation.confidence : 0;
    const passed =
      Boolean(validation.allow_auto_send) && confidence >= 70;
    return {
      passed,
      reasons: Array.isArray(validation.reasons) ? validation.reasons : [],
      confidence,
    };
  } catch {
    return { passed: false, reasons: ["validator_invalid_json"], confidence: 0 };
  }
}

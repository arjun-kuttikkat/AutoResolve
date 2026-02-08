import { getDb } from "../db/index.js";
import {
  users,
  oauthTokens,
  userGuardrails,
  emailThreads,
  emails,
  emailReplies,
} from "../db/schema.js";
import { eq, and, desc } from "drizzle-orm";
import { getGmailClient, getProfile, createClientWithTokens } from "./gmail.js";
import { decrypt } from "./tokenManager.js";
import { refreshIfNeeded } from "./tokenManager.js";
import { checkSafetyGates } from "./safetyGates.js";
import { generateReply, shouldTriggerReply } from "./openai.js";
import { getEnv } from "../config/env.js";
import type { gmail_v1 } from "googleapis";

const AUTO_HEADERS = [
  "auto-submitted",
  "x-auto-response-suppress",
  "precedence",
  "list-id",
];
const AUTO_VALUES = ["bulk", "junk", "list", "auto-replied"];

function normalizeEmail(addr: string): string {
  const lower = addr.toLowerCase().trim();
  const match = lower.match(/<([^>]+)>/);
  const email = match ? match[1].trim() : lower;
  const plusIdx = email.indexOf("+");
  if (plusIdx > 0 && email.includes("@")) {
    const local = email.slice(0, plusIdx);
    const domain = email.slice(email.indexOf("@"));
    return local + domain;
  }
  return email;
}

function getHeader(headers: gmail_v1.Schema$MessagePartHeader[] | undefined, name: string): string | null {
  if (!headers) return null;
  const lower = name.toLowerCase();
  const h = headers.find((x) => x.name?.toLowerCase() === lower);
  return h?.value ?? null;
}

function parseBody(payload: gmail_v1.Schema$MessagePart | undefined): string {
  if (!payload) return "";
  if (payload.body?.data) {
    try {
      return Buffer.from(payload.body.data, "base64url").toString("utf8");
    } catch {
      return "";
    }
  }
  const parts = payload.parts;
  if (parts) {
    for (const part of parts) {
      if (part.mimeType === "text/plain" && part.body?.data) {
        try {
          return Buffer.from(part.body.data, "base64url").toString("utf8");
        } catch {
          //
        }
      }
    }
  }
  return "";
}

export async function processMessage(userId: string, messageId: string): Promise<void> {
  const db = getDb();
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) throw new Error(`User not found: ${userId}`);

  const [tokenRow] = await db
    .select()
    .from(oauthTokens)
    .where(eq(oauthTokens.userId, userId))
    .limit(1);
  if (!tokenRow) throw new Error(`No tokens for user: ${userId}`);

  let accessToken = decrypt(tokenRow.accessToken);
  let refreshToken = decrypt(tokenRow.refreshToken);
  let expiresAt = tokenRow.expiresAt;

  const refreshed = await refreshIfNeeded(accessToken, refreshToken, expiresAt);
  if (refreshed.refreshed) {
    const { encrypt } = await import("./tokenManager.js");
    await db
      .update(oauthTokens)
      .set({
        accessToken: encrypt(refreshed.accessToken),
        refreshToken: encrypt(refreshed.refreshToken),
        expiresAt: refreshed.expiresAt,
        updatedAt: new Date(),
      })
      .where(eq(oauthTokens.userId, userId));
    accessToken = refreshed.accessToken;
    refreshToken = refreshed.refreshToken;
  }

  const client = createClientWithTokens(accessToken, refreshToken);
  const gmail = getGmailClient(client);

  const msgRes = await gmail.users.messages.get({
    userId: "me",
    id: messageId,
    format: "full",
  });
  const msg = msgRes.data;
  const threadId = msg.threadId!;
  const payload = msg.payload;
  const headers = payload?.headers ?? [];
  const from = getHeader(headers, "From") ?? "";
  const to = getHeader(headers, "To") ?? "";
  const subject = getHeader(headers, "Subject") ?? "";
  const rfcMessageId = getHeader(headers, "Message-ID");
  const body = parseBody(payload);

  // Get or create thread
  const [existingThread] = await db
    .select()
    .from(emailThreads)
    .where(and(eq(emailThreads.userId, userId), eq(emailThreads.threadId, threadId)))
    .limit(1);
  let thread = existingThread ?? null;
  if (!thread) {
    const [inserted] = await db
      .insert(emailThreads)
      .values({
        userId,
        threadId,
        subject,
        status: "pending",
      })
      .returning();
    thread = inserted!;
  }

  // Store email (message_id UNIQUE)
  try {
    await db.insert(emails).values({
      threadId: thread.id,
      messageId,
      rfcMessageId: rfcMessageId ?? null,
      fromEmail: from,
      toEmail: to,
      subject,
      body,
      isFromUser: false, // We will update this or logic needs to check if from user
    });
  } catch (e) {
    // Duplicate message_id - already processed
    const [existing] = await db
      .select({ id: emails.id })
      .from(emails)
      .where(eq(emails.messageId, messageId))
      .limit(1);
    // If it exists, we just continue (idempotent)
    if (!existing) throw e;
  }

  // Update isFromUser correctly
  const profile = await getProfile(client);
  const userEmailNormalized = normalizeEmail(profile.emailAddress);
  const fromNormalized = normalizeEmail(from);
  const isSelf = fromNormalized === userEmailNormalized;

  await db.update(emails).set({ isFromUser: isSelf }).where(eq(emails.messageId, messageId));

  // Loop prevention: skip if from user (with alias)
  if (isSelf) {
    return;
  }

  // Skip auto-response / mailing list
  for (const h of headers) {
    const name = (h.name ?? "").toLowerCase();
    const value = (h.value ?? "").toLowerCase();
    if (name === "auto-submitted" || name === "x-auto-response-suppress") return;
    if (name === "precedence" && AUTO_VALUES.some((v) => value.includes(v))) return;
    if (name === "list-id") return; // mailing list unless user allows later
  }
  if (getHeader(headers, "X-AutoResolve") === "1") return;


  const [emailRow] = await db
    .select()
    .from(emails)
    .where(eq(emails.messageId, messageId))
    .limit(1);
  if (!emailRow) return;

  // Already replied to this specific message?
  const [existingReply] = await db
    .select({ id: emailReplies.id })
    .from(emailReplies)
    .where(and(eq(emailReplies.userId, userId), eq(emailReplies.inboundMessageId, messageId)))
    .limit(1);
  if (existingReply) return;

  // Guardrails: only trigger if email matches user's trigger description
  const [guardrails] = await db
    .select()
    .from(userGuardrails)
    .where(eq(userGuardrails.userId, userId))
    .limit(1);
  const triggerDescription = guardrails?.triggerDescription?.trim() ?? "";
  if (triggerDescription) {
    try {
      const shouldTrigger = await shouldTriggerReply(from, subject, body, triggerDescription);
      if (!shouldTrigger) return;
    } catch (err) {
      console.warn("Trigger check failed, skipping reply:", err instanceof Error ? err.message : err);
      return;
    }
  }

  // Build thread history for reply (10 most recent, then chronological for prompt)
  const threadEmails = await db
    .select()
    .from(emails)
    .where(eq(emails.threadId, thread.id))
    .orderBy(desc(emails.createdAt))
    .limit(10);
  const threadHistory = threadEmails.slice().reverse().map((e) => ({
    from: e.fromEmail,
    body: e.body ?? "",
  }));

  const replyInstructions = guardrails?.replyInstructions ?? null;
  let generatedContent: string;
  let safety: { confidence: number; passed: boolean };
  try {
    generatedContent = await generateReply(threadHistory, replyInstructions);
    safety = await checkSafetyGates(generatedContent);
  } catch (err) {
    // OPENAI_API_KEY not set or reply generation failed; thread and email are already stored
    console.warn("Reply generation skipped:", err instanceof Error ? err.message : err);
    return;
  }

  const [reply] = await db
    .insert(emailReplies)
    .values({
      userId,
      emailId: emailRow.id,
      threadId: thread.id,
      inboundMessageId: messageId,
      generatedContent,
      status: "draft",
      confidenceScore: safety.confidence,
      safetyCheckPassed: safety.passed,
    })
    .returning();

  if (!reply) return;

  const mode = user.mode ?? "approval";
  const shouldSend = mode === "auto" && safety.passed;

  if (shouldSend) {
    try {
      const replyTo = from;
      const replyFrom = to;
      let replySubject = subject;
      if (!replySubject.toLowerCase().startsWith("re:")) {
        replySubject = `Re: ${replySubject}`;
      }
      const refs = rfcMessageId ? `References: ${rfcMessageId}\r\n` : "";
      const inReplyTo = rfcMessageId ? `In-Reply-To: ${rfcMessageId}\r\n` : "";
      const headers = [
        `From: ${replyFrom}`,
        `To: ${replyTo}`,
        `Subject: ${replySubject}`,
        inReplyTo,
        refs,
      ]
        .filter(Boolean)
        .join("\r\n");
      const raw = headers + "\r\n\r\n" + generatedContent;
      const encoded = Buffer.from(raw, "utf8").toString("base64url");
      const sendRes = await gmail.users.messages.send({
        userId: "me",
        requestBody: {
          raw: encoded,
          threadId,
        },
      });
      const sentId = sendRes.data.id ?? `sent-${Date.now()}`;
      await db
        .update(emailReplies)
        .set({
          status: "sent",
          providerMessageId: sentId,
          sentAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(emailReplies.id, reply.id));
      await db
        .update(emailThreads)
        .set({ status: "replied", updatedAt: new Date() })
        .where(eq(emailThreads.id, thread.id));

      // INSERT SENT EMAIL
      await db.insert(emails).values({
        threadId: thread.id,
        messageId: sentId,
        fromEmail: to, // we reply from 'to'
        toEmail: from, // we reply to 'from'
        subject: replySubject,
        body: generatedContent,
        isFromUser: true,
      }).catch(console.error);


    } catch (err) {
      await db
        .update(emailReplies)
        .set({
          status: "failed",
          error: err instanceof Error ? err.message : String(err),
          updatedAt: new Date(),
        })
        .where(eq(emailReplies.id, reply.id));
    }
  } else {
    await db
      .update(emailThreads)
      .set({ status: "processing", updatedAt: new Date() })
      .where(eq(emailThreads.id, thread.id));
  }
}

export type GenerateReplyForThreadResult =
  | { sent: true; messageId?: string }
  | { sent: false; draft: string; replyId: string; subject: string; threadId: string };

/** Generate (and optionally send) a reply for a thread. Used by the agentic reply modal. */
export async function generateReplyForThread(
  userId: string,
  gmailThreadId: string,
  options?: {
    takeOver?: boolean;
    tone?: string;
    userContext?: string;
    imageContext?: string[];
  }
): Promise<GenerateReplyForThreadResult> {
  const takeOver = options?.takeOver === true;
  const { tone, userContext, imageContext } = options ?? {};
  const db = getDb();
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) throw new Error(`User not found: ${userId}`);

  const [guardrails] = await db
    .select()
    .from(userGuardrails)
    .where(eq(userGuardrails.userId, userId))
    .limit(1);
  const replyInstructions = guardrails?.replyInstructions ?? null;

  const [tokenRow] = await db
    .select()
    .from(oauthTokens)
    .where(eq(oauthTokens.userId, userId))
    .limit(1);
  if (!tokenRow) throw new Error("No tokens for user");

  const client = createClientWithTokens(
    decrypt(tokenRow.accessToken),
    decrypt(tokenRow.refreshToken)
  );
  const gmail = getGmailClient(client);

  const [threadRow] = await db
    .select()
    .from(emailThreads)
    .where(and(eq(emailThreads.userId, userId), eq(emailThreads.threadId, gmailThreadId)))
    .limit(1);
  if (!threadRow) throw new Error("Thread not found");

  // Update draft configuration
  if (tone || userContext || (imageContext && imageContext.length > 0)) {
    await db
      .update(emailThreads)
      .set({
        draftConfiguration: { tone, context: userContext, images: imageContext },
        updatedAt: new Date(),
      })
      .where(eq(emailThreads.id, threadRow.id));
  }

  const threadEmails = await db
    .select()
    .from(emails)
    .where(eq(emails.threadId, threadRow.id))
    .orderBy(desc(emails.createdAt))
    .limit(20);
  const latestInbound = threadEmails.find((e) => !e.isFromUser);
  if (!latestInbound) throw new Error("No inbound message in thread");

  // HANDLE DUPLICATE/MULTIPLE REPLIES
  let inboundMessageIdToUse = latestInbound.messageId;
  const [existingReply] = await db
    .select()
    .from(emailReplies)
    .where(and(eq(emailReplies.userId, userId), eq(emailReplies.inboundMessageId, latestInbound.messageId)))
    .limit(1);

  if (existingReply) {
    if (existingReply.status === "draft") {
      return {
        sent: false,
        draft: existingReply.generatedContent,
        replyId: existingReply.id,
        subject: latestInbound.subject ?? "",
        threadId: gmailThreadId,
      };
    }
    // Allow multiple replies by appending suffix to bypass unique constraint
    inboundMessageIdToUse = `${latestInbound.messageId}_${Date.now()}`.slice(0, 64);
  }

  const threadHistory = threadEmails.slice().reverse().map((e) => ({
    from: e.fromEmail,
    body: e.body ?? "",
  }));

  let generatedContent: string;
  let safety: { confidence: number; passed: boolean };
  try {
    generatedContent = await generateReply(threadHistory, replyInstructions);
    safety = await checkSafetyGates(generatedContent);
  } catch (err) {
    throw new Error(err instanceof Error ? err.message : "Reply generation failed");
  }

  const [reply] = await db
    .insert(emailReplies)
    .values({
      userId,
      emailId: latestInbound.id,
      threadId: threadRow.id,
      inboundMessageId: inboundMessageIdToUse,
      generatedContent,
      status: "draft",
      confidenceScore: safety.confidence,
      safetyCheckPassed: safety.passed,
    })
    .returning();
  if (!reply) throw new Error("Failed to save draft");

  const mode = user.mode ?? "approval";
  const from = latestInbound.fromEmail;
  const to = latestInbound.toEmail;
  const subject = latestInbound.subject ?? "";
  const rfcMessageId = latestInbound.rfcMessageId;

  if (!takeOver && mode === "auto" && safety.passed) {
    try {
      let replySubject = subject;
      if (!replySubject.toLowerCase().startsWith("re:")) replySubject = `Re: ${replySubject}`;
      const refs = rfcMessageId ? `References: ${rfcMessageId}\r\n` : "";
      const inReplyTo = rfcMessageId ? `In-Reply-To: ${rfcMessageId}\r\n` : "";
      const headers = [
        `From: ${to}`,
        `To: ${from}`,
        `Subject: ${replySubject}`,
        inReplyTo,
        refs,
      ]
        .filter(Boolean)
        .join("\r\n");
      const raw = headers + "\r\n\r\n" + generatedContent;
      const encoded = Buffer.from(raw, "utf8").toString("base64url");
      const sendRes = await gmail.users.messages.send({
        userId: "me",
        requestBody: { raw: encoded, threadId: gmailThreadId },
      });

      const sentId = sendRes.data.id ?? `sent-${Date.now()}`;

      await db
        .update(emailReplies)
        .set({
          status: "sent",
          providerMessageId: sentId,
          sentAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(emailReplies.id, reply.id));
      await db
        .update(emailThreads)
        .set({ status: "replied", updatedAt: new Date() })
        .where(eq(emailThreads.id, threadRow.id));

      // INSERT SENT EMAIL INTO EMAILS TABLE
      await db.insert(emails).values({
        threadId: threadRow.id,
        messageId: sentId,
        fromEmail: to,
        toEmail: from,
        subject: replySubject,
        body: generatedContent,
        isFromUser: true,
      }).catch(console.error); // Low risk failure

      return { sent: true, messageId: sentId };
    } catch (err) {
      await db
        .update(emailReplies)
        .set({
          status: "failed",
          error: err instanceof Error ? err.message : String(err),
          updatedAt: new Date(),
        })
        .where(eq(emailReplies.id, reply.id));
      throw err;
    }
  }

  return {
    sent: false,
    draft: generatedContent,
    replyId: reply.id,
    subject: subject.startsWith("re:") ? subject : `Re: ${subject}`,
    threadId: gmailThreadId,
  };
}

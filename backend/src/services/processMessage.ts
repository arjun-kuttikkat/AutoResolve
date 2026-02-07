import { getDb } from "../db/index.js";
import {
  users,
  oauthTokens,
  userGuardrails,
  emailThreads,
  emails,
  emailReplies,
  notifications,
  type EmailReply,
} from "../db/schema.js";
import { eq, and, desc } from "drizzle-orm";
import { getGmailClient, getProfile, createClientWithTokens } from "./gmail.js";
import { decrypt } from "./tokenManager.js";
import { refreshIfNeeded } from "./tokenManager.js";
import { checkSafetyGates } from "./safetyGates.js";
import {
  generateReply,
  shouldTriggerReply,
  parseSenderName,
  classifyInboundEmail,
} from "./openai.js";
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

  // Loop prevention: skip if from user (with alias)
  const profile = await getProfile(client);
  const userEmailNormalized = normalizeEmail(profile.emailAddress);
  const fromNormalized = normalizeEmail(from);
  if (fromNormalized === userEmailNormalized) {
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
      isFromUser: false,
    });
  } catch (e) {
    // Duplicate message_id - already processed
    const [existing] = await db
      .select({ id: emails.id })
      .from(emails)
      .where(eq(emails.messageId, messageId))
      .limit(1);
    if (!existing) throw e;
    return;
  }

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
  try {
    const shouldTrigger = await shouldTriggerReply(from, subject, body, triggerDescription);
    if (!shouldTrigger) return;
  } catch (err) {
    console.warn("Trigger check failed, skipping reply:", err instanceof Error ? err.message : err);
    return;
  }

  // Build thread history for classification and reply (10 most recent, chronological)
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

  // Classify: can we reply, need human, or escalate?
  let classification: { action: "reply" | "escalate" | "needs_human"; reason?: string; escalateTo?: string };
  try {
    classification = await classifyInboundEmail(threadHistory, from, subject, body);
  } catch (err) {
    console.warn("Classification failed, defaulting to reply:", err instanceof Error ? err.message : err);
    classification = { action: "reply" };
  }

  if (classification.action === "needs_human") {
    await db.insert(notifications).values({
      userId,
      type: "human_intervention",
      title: "Human intervention needed",
      message: classification.reason ?? "Sender requested something that needs your attention.",
      subject: subject ?? null,
      threadId,
    });
    await db
      .update(emailThreads)
      .set({ status: "processing", updatedAt: new Date() })
      .where(eq(emailThreads.id, thread.id));
    return;
  }

  if (classification.action === "escalate" && classification.escalateTo) {
    const escalateTo = classification.escalateTo;
    const fwdSubject = subject?.toLowerCase().startsWith("fwd:") ? subject : `Fwd: ${subject ?? "Email"}`;
    const fwdBody = `---------- Forwarded message ---------\nFrom: ${from}\nDate: ${new Date().toISOString()}\nSubject: ${subject ?? ""}\nTo: ${to}\n\n${body}`;
    const raw = [
      `From: ${to}`,
      `To: ${escalateTo}`,
      `Subject: ${fwdSubject}`,
      "",
      fwdBody,
    ].join("\r\n");
    const encoded = Buffer.from(raw, "utf8").toString("base64url");
    try {
      await gmail.users.messages.send({
        userId: "me",
        requestBody: { raw: encoded },
      });
      await db.insert(notifications).values({
        userId,
        type: "autonomous_reply",
        title: "Escalated",
        message: `Forwarded to ${escalateTo}`,
        subject: subject ?? null,
        threadId,
      });
    } catch (err) {
      console.warn("Escalation forward failed:", err instanceof Error ? err.message : err);
      await db.insert(notifications).values({
        userId,
        type: "human_intervention",
        title: "Escalation failed",
        message: `Could not forward to ${escalateTo}. Please forward manually.`,
        subject: subject ?? null,
        threadId,
      });
    }
    await db
      .update(emailThreads)
      .set({ status: "replied", updatedAt: new Date() })
      .where(eq(emailThreads.id, thread.id));
    return;
  }

  const replyInstructions = guardrails?.replyInstructions ?? null;
  const senderName = parseSenderName(from);
  let generatedContent: string;
  let safety: { confidence: number; passed: boolean };
  try {
    generatedContent = await generateReply(threadHistory, replyInstructions, senderName);
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
    .onConflictDoUpdate({
      target: [emailReplies.userId, emailReplies.inboundMessageId],
      set: {
        emailId: emailRow.id,
        threadId: thread.id,
        generatedContent,
        status: "draft",
        confidenceScore: safety.confidence,
        safetyCheckPassed: safety.passed,
        updatedAt: new Date(),
      },
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
      const sentId = sendRes.data.id ?? null;
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
      await db.insert(notifications).values({
        userId,
        type: "reply_sent",
        title: "Reply sent",
        message: `Auto-replied to ${replyTo} about: ${subject?.slice(0, 80) ?? "no subject"}`,
        subject: subject ?? null,
        threadId,
      });
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
  | { sent: false; draft: string; replyId: string; subject: string; threadId: string }
  | { needsHuman: true; reason: string; threadId: string };

/** Generate (and optionally send) a reply for a thread. Used by the agentic reply modal. */
export async function generateReplyForThread(
  userId: string,
  gmailThreadId: string,
  options?: { takeOver?: boolean; context?: string }
): Promise<GenerateReplyForThreadResult> {
  const takeOver = options?.takeOver === true;
  const humanContext = options?.context?.trim() ?? "";
  const db = getDb();
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) throw new Error(`User not found: ${userId}`);

  const [guardrails] = await db
    .select()
    .from(userGuardrails)
    .where(eq(userGuardrails.userId, userId))
    .limit(1);
  let replyInstructions = guardrails?.replyInstructions ?? null;
  if (humanContext) {
    replyInstructions = [replyInstructions, `Context from user (use this to generate an accurate reply): ${humanContext}`]
      .filter(Boolean)
      .join("\n\n");
  }

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

  const threadEmails = await db
    .select()
    .from(emails)
    .where(eq(emails.threadId, threadRow.id))
    .orderBy(desc(emails.createdAt))
    .limit(20);
  const latestInbound = threadEmails.find((e) => !e.isFromUser);
  if (!latestInbound) throw new Error("No inbound message in thread");

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
    throw new Error("Already replied to this message");
  }

  const threadHistory = threadEmails.slice().reverse().map((e) => ({
    from: e.fromEmail,
    body: e.body ?? "",
  }));

  // When human provided context or user chose "take over", skip classification and generate
  if (!humanContext && !takeOver) {
    // Classify: if this needs human intervention, notify and don't generate a reply
    try {
      const classification = await classifyInboundEmail(
        threadHistory,
        latestInbound.fromEmail,
        latestInbound.subject ?? "",
        latestInbound.body ?? ""
      );
      if (classification.action === "needs_human") {
        await db.insert(notifications).values({
          userId,
          type: "human_intervention",
          title: "Human intervention needed",
          message: classification.reason ?? "This thread needs your attention.",
          subject: latestInbound.subject ?? null,
          threadId: gmailThreadId,
        });
        return {
          needsHuman: true,
          reason: classification.reason ?? "This thread needs your attention.",
          threadId: gmailThreadId,
        };
      }
      if (classification.action === "escalate" && classification.escalateTo) {
      const escalateTo = classification.escalateTo;
      const body = latestInbound.body ?? "";
      const subject = latestInbound.subject ?? "";
      const from = latestInbound.fromEmail;
      const fwdSubject = subject.toLowerCase().startsWith("fwd:") ? subject : `Fwd: ${subject || "Email"}`;
      const fwdBody = `---------- Forwarded message ---------\nFrom: ${from}\nSubject: ${subject}\n\n${body}`;
      const raw = [
        `To: ${escalateTo}`,
        `Subject: ${fwdSubject}`,
        "",
        fwdBody,
      ].join("\r\n");
      const profile = await getProfile(client);
      const toEmail = profile.emailAddress ?? "";
      const encoded = Buffer.from(
        `From: ${toEmail}\r\nTo: ${escalateTo}\r\nSubject: ${fwdSubject}\r\n\r\n${fwdBody}`,
        "utf8"
      ).toString("base64url");
      try {
        await gmail.users.messages.send({
          userId: "me",
          requestBody: { raw: encoded },
        });
        await db.insert(notifications).values({
          userId,
          type: "autonomous_reply",
          title: "Escalated",
          message: `Forwarded to ${escalateTo}`,
          subject: latestInbound.subject ?? null,
          threadId: gmailThreadId,
        });
      } catch {
        await db.insert(notifications).values({
          userId,
          type: "human_intervention",
          title: "Escalation failed",
          message: `Could not forward to ${escalateTo}. Please forward manually.`,
          subject: latestInbound.subject ?? null,
          threadId: gmailThreadId,
        });
      }
      return { sent: true, messageId: undefined };
    }
  } catch (err) {
    console.warn("Classification in generateReplyForThread failed, continuing:", err instanceof Error ? err.message : err);
  }
  }

  const senderName = parseSenderName(latestInbound.fromEmail);
  let generatedContent: string;
  let safety: { confidence: number; passed: boolean };
  try {
    generatedContent = await generateReply(threadHistory, replyInstructions, senderName);
    safety = await checkSafetyGates(generatedContent);
  } catch (err) {
    throw new Error(err instanceof Error ? err.message : "Reply generation failed");
  }

  let row: EmailReply | null = null;
  try {
    const [reply] = await db
      .insert(emailReplies)
      .values({
        userId,
        emailId: latestInbound.id,
        threadId: threadRow.id,
        inboundMessageId: latestInbound.messageId,
        generatedContent,
        status: "draft",
        confidenceScore: safety.confidence,
        safetyCheckPassed: safety.passed,
      })
      .onConflictDoUpdate({
        target: [emailReplies.userId, emailReplies.inboundMessageId],
        set: {
          emailId: latestInbound.id,
          threadId: threadRow.id,
          generatedContent,
          status: "draft",
          confidenceScore: safety.confidence,
          safetyCheckPassed: safety.passed,
          updatedAt: new Date(),
        },
        where: eq(emailReplies.status, "draft"),
      })
      .returning();
    row = reply ?? null;
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code;
    if (code === "23505") {
      const [existing] = await db
        .select()
        .from(emailReplies)
        .where(
          and(
            eq(emailReplies.userId, userId),
            eq(emailReplies.inboundMessageId, latestInbound.messageId)
          )
        )
        .limit(1);
      if (existing) {
        if (existing.status === "sent") {
          return { sent: true, messageId: existing.providerMessageId ?? undefined };
        }
        row = existing;
      }
    }
    if (!row) throw err;
  }
  if (!row) {
    const [existing] = await db
      .select()
      .from(emailReplies)
      .where(
        and(
          eq(emailReplies.userId, userId),
          eq(emailReplies.inboundMessageId, latestInbound.messageId)
        )
      )
      .limit(1);
    if (existing?.status === "sent") {
      return { sent: true, messageId: existing.providerMessageId ?? undefined };
    }
    throw new Error("Failed to save draft");
  }
  if (row.status === "sent") {
    return { sent: true, messageId: row.providerMessageId ?? undefined };
  }

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
      await db
        .update(emailReplies)
        .set({
          status: "sent",
          providerMessageId: sendRes.data.id ?? null,
          sentAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(emailReplies.id, row.id));
      await db
        .update(emailThreads)
        .set({ status: "replied", updatedAt: new Date() })
        .where(eq(emailThreads.id, threadRow.id));
      await db.insert(notifications).values({
        userId,
        type: "reply_sent",
        title: "Reply sent",
        message: `Replied to ${from} about: ${subject?.slice(0, 80) ?? "no subject"}`,
        subject: subject ?? null,
        threadId: gmailThreadId,
      });
      return { sent: true, messageId: sendRes.data.id ?? undefined };
    } catch (err) {
      await db
        .update(emailReplies)
        .set({
          status: "failed",
          error: err instanceof Error ? err.message : String(err),
          updatedAt: new Date(),
        })
        .where(eq(emailReplies.id, row.id));
      throw err;
    }
  }

  return {
    sent: false,
    draft: generatedContent,
    replyId: row.id,
    subject: subject.startsWith("re:") ? subject : `Re: ${subject}`,
    threadId: gmailThreadId,
  };
}

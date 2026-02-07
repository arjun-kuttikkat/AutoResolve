import { Router, type Request, type Response } from "express";
import { getDb } from "../db/index.js";
import { emailThreads, emailReplies, emails } from "../db/schema.js";
import { eq, and, desc } from "drizzle-orm";
import { enqueueSyncMailbox } from "../lib/queue.js";
import { syncMailbox } from "../services/syncMailbox.js";
import { generateReplyForThread } from "../services/processMessage.js";
import { getGmailClient } from "../services/gmail.js";
import { createClientWithTokens } from "../services/gmail.js";
import { decrypt } from "../services/tokenManager.js";
import { oauthTokens } from "../db/schema.js";

const router = Router();

function getUserId(req: Request): string | null {
  return (req.query.userId as string) ?? (req.body?.userId as string) ?? null;
}

router.post("/sync", async (req: Request, res: Response) => {
  const userId = getUserId(req);
  if (!userId) {
    return res.status(400).json({ error: "userId required" });
  }
  try {
    await syncMailbox(userId);
    return res.json({ ok: true, message: "Sync complete. Threads will appear as they are processed." });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Sync failed:", message, err);
    return res.status(500).json({
      error: "Sync failed",
      details: message,
    });
  }
});

router.get("/threads", async (req: Request, res: Response) => {
  const userId = getUserId(req);
  if (!userId) {
    return res.status(400).json({ error: "userId required" });
  }
  const db = getDb();
  const list = await db
    .select({
      id: emailThreads.id,
      threadId: emailThreads.threadId,
      subject: emailThreads.subject,
      status: emailThreads.status,
      updatedAt: emailThreads.updatedAt,
    })
    .from(emailThreads)
    .where(eq(emailThreads.userId, userId))
    .orderBy(desc(emailThreads.updatedAt))
    .limit(100);
  return res.json({ threads: list });
});

router.get("/threads/:threadId", async (req: Request, res: Response) => {
  const userId = getUserId(req);
  const threadId = req.params.threadId;
  if (!userId || !threadId) {
    return res.status(400).json({ error: "userId and threadId required" });
  }
  const db = getDb();
  const [thread] = await db
    .select()
    .from(emailThreads)
    .where(and(eq(emailThreads.userId, userId), eq(emailThreads.threadId, threadId)))
    .limit(1);
  if (!thread) {
    return res.status(404).json({ error: "Thread not found" });
  }
  const messages = await db
    .select()
    .from(emails)
    .where(eq(emails.threadId, thread.id))
    .orderBy(desc(emails.createdAt));
  return res.json({ thread, messages });
});

router.post("/threads/:threadId/generate-reply", async (req: Request, res: Response) => {
  const userId = getUserId(req);
  const threadId = req.params.threadId;
  const body = req.body as { takeOver?: boolean; context?: string };
  const takeOver = body.takeOver === true;
  const context = typeof body.context === "string" ? body.context.trim() : undefined;
  if (!userId || !threadId) {
    return res.status(400).json({ error: "userId and threadId required" });
  }
  try {
    const result = await generateReplyForThread(userId, threadId, { takeOver, context });
    return res.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Generate reply failed:", message, err);
    return res.status(500).json({ error: "Generate reply failed", details: message });
  }
});

router.get("/replies", async (req: Request, res: Response) => {
  const userId = getUserId(req);
  if (!userId) {
    return res.status(400).json({ error: "userId required" });
  }
  const db = getDb();
  const list = await db.query.emailReplies.findMany({
    where: eq(emailReplies.userId, userId),
    orderBy: [desc(emailReplies.createdAt)],
    limit: 50,
  });
  const drafts = list.filter((r) => r.status === "draft");
  return res.json({ replies: drafts });
});

router.post("/replies/:replyId/approve", async (req: Request, res: Response) => {
  const userId = getUserId(req);
  const replyId = req.params.replyId;
  const bodyContent = (req.body as { content?: string }).content;
  if (!userId || !replyId) {
    return res.status(400).json({ error: "userId and replyId required" });
  }
  const db = getDb();
  const reply = await db.query.emailReplies.findFirst({
    where: and(
      eq(emailReplies.id, replyId),
      eq(emailReplies.userId, userId)
    ),
  });
  if (!reply || reply.status !== "draft") {
    return res.status(404).json({ error: "Draft reply not found" });
  }

  const tokenRow = await db.query.oauthTokens.findFirst({
    where: eq(oauthTokens.userId, userId),
  });
  if (!tokenRow) {
    return res.status(401).json({ error: "Not connected" });
  }

  const client = createClientWithTokens(
    decrypt(tokenRow.accessToken),
    decrypt(tokenRow.refreshToken)
  );
  const gmail = getGmailClient(client);
  const emailRow = await db.query.emails.findFirst({
    where: eq(emails.id, reply.emailId),
  });
  if (!emailRow) {
    return res.status(404).json({ error: "Email not found" });
  }

  const thread = await db.query.emailThreads.findFirst({
    where: eq(emailThreads.id, reply.threadId),
  });
  if (!thread) {
    return res.status(404).json({ error: "Thread not found" });
  }

  const replyTo = emailRow.fromEmail;
  const replyFrom = emailRow.toEmail;
  let replySubject = emailRow.subject ?? "";
  if (!replySubject.toLowerCase().startsWith("re:")) {
    replySubject = `Re: ${replySubject}`;
  }
  const rfcMessageId = emailRow.rfcMessageId;
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
  const body =
    typeof bodyContent === "string" && bodyContent.trim() ? bodyContent.trim() : reply.generatedContent;
  const raw = headers + "\r\n\r\n" + body;
  const encoded = Buffer.from(raw, "utf8").toString("base64url");

  try {
    const sendRes = await gmail.users.messages.send({
      userId: "me",
      requestBody: {
        raw: encoded,
        threadId: thread.threadId,
      },
    });
    await db
      .update(emailReplies)
      .set({
        status: "sent",
        providerMessageId: sendRes.data.id ?? null,
        sentAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(emailReplies.id, reply.id));
    await db
      .update(emailThreads)
      .set({ status: "replied", updatedAt: new Date() })
      .where(eq(emailThreads.id, thread.id));
    return res.json({ ok: true, messageId: sendRes.data.id });
  } catch (err) {
    await db
      .update(emailReplies)
      .set({
        status: "failed",
        error: err instanceof Error ? err.message : String(err),
        updatedAt: new Date(),
      })
      .where(eq(emailReplies.id, reply.id));
    return res.status(500).json({
      error: err instanceof Error ? err.message : "Send failed",
    });
  }
});

router.post("/replies/:replyId/reject", async (req: Request, res: Response) => {
  const userId = getUserId(req);
  const replyId = req.params.replyId;
  if (!userId || !replyId) {
    return res.status(400).json({ error: "userId and replyId required" });
  }
  const db = getDb();
  await db
    .delete(emailReplies)
    .where(and(eq(emailReplies.id, replyId), eq(emailReplies.userId, userId)));
  return res.json({ ok: true });
});

export default router;

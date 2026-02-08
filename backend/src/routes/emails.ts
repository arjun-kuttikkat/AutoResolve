import { Router, type Request, type Response } from "express";
import { getDb } from "../db/index.js";
import { emailThreads, emailReplies, emails } from "../db/schema.js";
import { eq, and, desc, inArray } from "drizzle-orm";
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

// ... imports


// ...

router.get("/threads", async (req: Request, res: Response) => {
  const userId = getUserId(req);
  if (!userId) {
    return res.status(400).json({ error: "userId required" });
  }
  const db = getDb();

  // Fetch threads
  const list = await db
    .select({
      id: emailThreads.id,
      threadId: emailThreads.threadId,
      subject: emailThreads.subject,
      status: emailThreads.status,
      updatedAt: emailThreads.updatedAt,
      caseId: emailThreads.caseId, // Fetch caseId
    })
    .from(emailThreads)
    .where(eq(emailThreads.userId, userId))
    .orderBy(desc(emailThreads.updatedAt))
    .limit(50);

  // Fetch all messages for these threads to calculate metrics
  // This is better than N+1 queries
  const threadIds = list.map(t => t.id);
  let messageMap: Record<string, any[]> = {};

  if (threadIds.length > 0) {
    const allMessages = await db
      .select({
        threadId: emails.threadId,
        isFromUser: emails.isFromUser,
        createdAt: emails.createdAt,
      })
      .from(emails)
      .where(inArray(emails.threadId, threadIds));

    allMessages.forEach(m => {
      if (!m.threadId) return;
      if (!messageMap[m.threadId]) messageMap[m.threadId] = [];
      messageMap[m.threadId].push(m);
    });
  }

  const enriched = list.map(t => {
    const msgs = messageMap[t.id] || [];
    const sent = msgs.filter(m => m.isFromUser).length;
    const received = msgs.filter(m => !m.isFromUser).length;

    // Determine last sender (based on sorting messages by date if needed, assuming DB returns or we sort)
    // metrics are enough for now.

    return {
      ...t,
      metrics: {
        sent,
        received,
        total: msgs.length
      }
    };
  });

  return res.json({ threads: enriched });
});

router.get("/threads/:threadId", async (req: Request, res: Response) => {
  const userId = getUserId(req);
  const threadId = req.params.threadId as string;
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
  const threadId = req.params.threadId as string;
  const { takeOver, tone, userContext, imageContext } = req.body as {
    takeOver?: boolean;
    tone?: string;
    userContext?: string;
    imageContext?: string[];
  };
  if (!userId || !threadId) {
    return res.status(400).json({ error: "userId and threadId required" });
  }
  try {
    const result = await generateReplyForThread(userId, threadId, {
      takeOver,
      tone,
      userContext,
      imageContext,
    });
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
  const replyId = req.params.replyId as string;
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
      fromEmail: replyFrom,
      toEmail: replyTo,
      subject: replySubject,
      body: body,
      isFromUser: true,
    }).catch(console.error);

    return res.json({ ok: true, messageId: sentId });
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
  const replyId = req.params.replyId as string;
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

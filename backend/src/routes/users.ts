import { Router, type Request, type Response } from "express";
import { getDb } from "../db/index.js";
import { users, userGuardrails, notifications } from "../db/schema.js";
import { eq, desc } from "drizzle-orm";

const router = Router();

function getUserId(req: Request): string | null {
  return (req.query.userId as string) ?? (req.body?.userId as string) ?? null;
}

router.get("/me", async (req: Request, res: Response) => {
  const userId = getUserId(req);
  if (!userId) {
    return res.status(400).json({ error: "userId required" });
  }
  const db = getDb();
  const [row] = await db
    .select({ mode: users.mode })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!row) {
    return res.status(404).json({ error: "User not found" });
  }
  return res.json({ mode: row.mode ?? "approval" });
});

router.patch("/me", async (req: Request, res: Response) => {
  const userId = getUserId(req);
  const mode = req.body?.mode as string | undefined;
  if (!userId) {
    return res.status(400).json({ error: "userId required" });
  }
  if (mode !== "auto" && mode !== "approval") {
    return res.status(400).json({ error: "mode must be 'auto' or 'approval'" });
  }
  const db = getDb();
  await db
    .update(users)
    .set({ mode, updatedAt: new Date() })
    .where(eq(users.id, userId));
  return res.json({ ok: true, mode });
});

router.get("/guardrails", async (req: Request, res: Response) => {
  const userId = getUserId(req);
  if (!userId) return res.status(400).json({ error: "userId required" });
  const db = getDb();
  const [row] = await db
    .select()
    .from(userGuardrails)
    .where(eq(userGuardrails.userId, userId))
    .limit(1);
  return res.json({
    triggerDescription: row?.triggerDescription ?? "",
    replyInstructions: row?.replyInstructions ?? "",
  });
});

router.put("/guardrails", async (req: Request, res: Response) => {
  const userId = getUserId(req);
  if (!userId) return res.status(400).json({ error: "userId required" });
  const triggerDescription = (req.body?.triggerDescription as string) ?? "";
  const replyInstructions = (req.body?.replyInstructions as string) ?? "";
  const db = getDb();
  await db
    .insert(userGuardrails)
    .values({
      userId,
      triggerDescription: triggerDescription || null,
      replyInstructions: replyInstructions || null,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: userGuardrails.userId,
      set: {
        triggerDescription: triggerDescription || null,
        replyInstructions: replyInstructions || null,
        updatedAt: new Date(),
      },
    });
  return res.json({ ok: true, triggerDescription, replyInstructions });
});

const NOTIFICATION_TYPES = [
  "autonomous_reply",
  "reply_sent",
  "support_detected",
  "human_intervention",
] as const;

router.get("/notifications", async (req: Request, res: Response) => {
  const userId = getUserId(req);
  if (!userId) return res.status(400).json({ error: "userId required" });
  const limit = Math.min(Math.max(0, Number(req.query.limit) || 10), 50);
  const offset = Math.max(0, Number(req.query.offset) || 0);
  const db = getDb();
  const list = await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(limit)
    .offset(offset);
  return res.json({
    notifications: list.map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      message: n.message ?? undefined,
      subject: n.subject ?? undefined,
      threadId: n.threadId ?? undefined,
      timestamp: n.createdAt?.getTime() ?? Date.now(),
    })),
    hasMore: list.length === limit,
  });
});

router.post("/notifications", async (req: Request, res: Response) => {
  const userId = getUserId(req);
  if (!userId) return res.status(400).json({ error: "userId required" });
  const type = (req.body?.type as string) ?? "";
  const title = (req.body?.title as string) ?? "";
  if (!NOTIFICATION_TYPES.includes(type as (typeof NOTIFICATION_TYPES)[number])) {
    return res.status(400).json({ error: "Invalid type" });
  }
  if (!title.trim()) return res.status(400).json({ error: "title required" });
  const message = (req.body?.message as string) ?? null;
  const subject = (req.body?.subject as string) ?? null;
  const threadId = (req.body?.threadId as string)?.trim() || null;
  const db = getDb();
  const [row] = await db
    .insert(notifications)
    .values({
      userId,
      type: type as (typeof NOTIFICATION_TYPES)[number],
      title: title.trim(),
      message: message?.trim() || null,
      subject: subject?.trim() || null,
      threadId: threadId || null,
    })
    .returning();
  if (!row) return res.status(500).json({ error: "Failed to create notification" });
  return res.status(201).json({
    id: row.id,
    type: row.type,
    title: row.title,
    message: row.message ?? undefined,
    subject: row.subject ?? undefined,
    threadId: row.threadId ?? undefined,
    timestamp: row.createdAt?.getTime() ?? Date.now(),
  });
});

export default router;

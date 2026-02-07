import { Router, type Request, type Response } from "express";
import { getDb } from "../db/index.js";
import { users, userGuardrails } from "../db/schema.js";
import { eq } from "drizzle-orm";

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

export default router;

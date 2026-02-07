import { Router, type Request, type Response } from "express";
import { getDb } from "../db/index.js";
import { users, oauthTokens } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { getAuthUrl, getTokensFromCode, getProfile, setWatch, createClientWithTokens } from "../services/gmail.js";
import { encrypt } from "../services/tokenManager.js";
import { getEnv } from "../config/env.js";

function serializeErr(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}

const router = Router();

router.get("/gmail", (req: Request, res: Response) => {
  const env = getEnv();
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
    return res.redirect(`${env.FRONTEND_URL}/dashboard?error=google_not_configured`);
  }
  const state = (req.query.state as string) || undefined;
  const url = getAuthUrl(state);
  res.redirect(url);
});

router.get("/gmail/callback", async (req: Request, res: Response) => {
  const code = req.query.code as string;
  const state = req.query.state as string | undefined;
  if (!code) {
    return res.redirect(`${getEnv().FRONTEND_URL}/dashboard?error=missing_code`);
  }
  try {
    const tokens = await getTokensFromCode(code);
    const client = createClientWithTokens(tokens.accessToken, tokens.refreshToken);
    const profile = await getProfile(client);

    const db = getDb();
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, profile.emailAddress))
      .limit(1);

    let user = existingUser ?? null;
    if (!user) {
      const [inserted] = await db
        .insert(users)
        .values({
          email: profile.emailAddress,
          name: profile.emailAddress.split("@")[0],
          mode: "approval",
        })
        .returning();
      user = inserted!;
    }

    const encryptedAccess = encrypt(tokens.accessToken);
    const encryptedRefresh = encrypt(tokens.refreshToken);

    await db
      .insert(oauthTokens)
      .values({
        userId: user.id,
        accessToken: encryptedAccess,
        refreshToken: encryptedRefresh,
        expiresAt: tokens.expiresAt,
        scope: tokens.scope,
      })
      .onConflictDoUpdate({
        target: oauthTokens.userId,
        set: {
          accessToken: encryptedAccess,
          refreshToken: encryptedRefresh,
          expiresAt: tokens.expiresAt,
          scope: tokens.scope,
          updatedAt: new Date(),
        },
      });

    // Start watch if Pub/Sub is configured
    const env = getEnv();
    if (env.GOOGLE_CLOUD_PROJECT_ID && env.GOOGLE_PUBSUB_TOPIC) {
      try {
        const watchResult = await setWatch(client);
        const expiresAt = watchResult.expiration ? new Date(Number(watchResult.expiration)) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        await db
          .update(users)
          .set({
            lastHistoryId: watchResult.historyId,
            watchEnabled: true,
            watchExpiresAt: expiresAt,
            updatedAt: new Date(),
          })
          .where(eq(users.id, user.id));
      } catch (watchErr) {
        // Watch optional for demo (e.g. without Pub/Sub)
        console.warn("Gmail watch failed:", watchErr);
      }
    } else {
      // No watch: set initial historyId from profile if returned
      if (profile.historyId) {
        await db
          .update(users)
          .set({
            lastHistoryId: profile.historyId,
            updatedAt: new Date(),
          })
          .where(eq(users.id, user.id));
      }
    }

    const redirectUrl = `${getEnv().FRONTEND_URL}/dashboard?connected=1&userId=${user.id}`;
    res.redirect(redirectUrl);
  } catch (err) {
    const msg = serializeErr(err);
    console.error("OAuth callback error:", msg, err);
    const redirectUrl = new URL(`${getEnv().FRONTEND_URL}/dashboard`);
    const isDbUnreachable =
      msg.includes("ENOTFOUND") ||
      msg.includes("ECONNREFUSED") ||
      msg.includes("ETIMEDOUT") ||
      msg.includes("getaddrinfo");
    if (isDbUnreachable) {
      redirectUrl.searchParams.set("error", "database_unreachable");
    } else {
      redirectUrl.searchParams.set("error", "oauth_failed");
      redirectUrl.searchParams.set("hint", msg.includes("redirect_uri") ? "redirect_uri_mismatch" : "");
    }
    res.redirect(redirectUrl.toString());
  }
});

router.get("/status", async (req: Request, res: Response) => {
  const userId = req.query.userId as string | undefined;
  if (!userId) {
    return res.json({ connected: false });
  }
  const db = getDb();
  const [token] = await db
    .select({ userId: oauthTokens.userId })
    .from(oauthTokens)
    .where(eq(oauthTokens.userId, userId))
    .limit(1);
  return res.json({ connected: !!token });
});

router.post("/gmail/disconnect", async (req: Request, res: Response) => {
  const userId = (req.body?.userId ?? req.query.userId) as string | undefined;
  if (!userId) {
    return res.status(400).json({ error: "userId required" });
  }
  const db = getDb();
  await db.delete(oauthTokens).where(eq(oauthTokens.userId, userId));
  await db
    .update(users)
    .set({ watchEnabled: false, watchExpiresAt: null, updatedAt: new Date() })
    .where(eq(users.id, userId));
  return res.json({ ok: true });
});

export default router;

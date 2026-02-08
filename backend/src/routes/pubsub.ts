import { Router, type Request, type Response } from "express";
import { OAuth2Client } from "google-auth-library";
import { getDb } from "../db/index.js";
import { users } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { enqueueSyncMailbox } from "../lib/queue.js";
import { getEnv } from "../config/env.js";

const router = Router();

/**
 * Pub/Sub push subscription handler.
 * 1. Verify OIDC token (google-auth-library verifyIdToken)
 * 2. Decode message.data (base64) -> JSON { emailAddress, historyId }
 * 3. Look up user by users.email == emailAddress
 * 4. Enqueue syncMailbox(dbUserId)
 * 5. Return 200 immediately (no heavy work before ack)
 */
router.post("/gmail", async (req: Request, res: Response) => {
  const env = getEnv();
  if (env.GOOGLE_PUBSUB_VERIFICATION_ENABLED && env.GOOGLE_PUBSUB_AUDIENCE) {
    const authHeader = req.headers.authorization;
    const idToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!idToken) {
      return res.status(401).send("Unauthorized");
    }
    try {
      const client = new OAuth2Client();
      await client.verifyIdToken({
        idToken,
        audience: env.GOOGLE_PUBSUB_AUDIENCE,
      });
    } catch {
      return res.status(401).send("Unauthorized");
    }
  }

  const message = (req.body as { message?: { data?: string } })?.message;
  if (!message?.data) {
    return res.status(400).send("Bad Request");
  }

  let payload: { emailAddress?: string; historyId?: string };
  try {
    const decoded = Buffer.from(message.data, "base64").toString("utf8");
    payload = JSON.parse(decoded) as { emailAddress?: string; historyId?: string };
  } catch {
    return res.status(400).send("Bad Request");
  }

  const emailAddress = payload.emailAddress;
  if (!emailAddress) {
    return res.status(400).send("Bad Request");
  }

  const db = getDb();
  const user = await db.query.users.findFirst({
    where: eq(users.email, emailAddress),
  });
  if (!user) {
    return res.status(200).send("OK");
  }

  await enqueueSyncMailbox(user.id);
  res.status(200).send("OK");
});

export default router;

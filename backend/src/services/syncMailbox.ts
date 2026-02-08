import { getDb } from "../db/index.js";
import { users, emails, emailThreads } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { enqueueProcessMessage } from "../lib/queue.js";
import { getGmailClient } from "./gmail.js";
import { decrypt } from "./tokenManager.js";
import { refreshIfNeeded } from "./tokenManager.js";
import { oauthTokens } from "../db/schema.js";

export type GmailHistoryListResult = {
  history?: Array<{
    id?: string;
    messagesAdded?: Array<{ message?: { id?: string } }>;
  }>;
  historyId?: string;
  nextPageToken?: string;
};

/**
 * Sync mailbox using history.list. Only discovers messageIds and enqueues processMessage jobs.
 * Updates last_history_id once per run (not inside loop).
 * Handles pagination, empty response, and expired historyId (404 → full resync).
 */
export async function syncMailbox(userId: string): Promise<void> {
  const db = getDb();
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) throw new Error(`User not found: ${userId}`);

  const [tokenRow] = await db
    .select()
    .from(oauthTokens)
    .where(eq(oauthTokens.userId, userId))
    .limit(1);
  if (!tokenRow) {
    // User disconnected; job may have been queued before disconnect. Complete without error.
    return;
  }

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
    expiresAt = refreshed.expiresAt;
  }

  const { createClientWithTokens } = await import("./gmail.js");
  const client = createClientWithTokens(accessToken, refreshToken);
  const gmail = getGmailClient(client);

  let lastHistoryId = user.lastHistoryId ?? undefined;
  let nextPageToken: string | undefined;
  let latestHistoryIdSeen: string | undefined;

  // If user has no threads yet, do a full pull of past emails (messages.list)
  const existingThreads = await db
    .select({ id: emailThreads.id })
    .from(emailThreads)
    .where(eq(emailThreads.userId, userId))
    .limit(1);
  const hasNoThreads = existingThreads.length === 0;

  // First-time sync, no history, or no threads yet: pull 10 latest emails from Gmail (messages.list)
  if (!lastHistoryId || hasNoThreads) {
    const recent = await gmail.users.messages.list({
      userId: "me",
      maxResults: 10,
      q: "-in:trash -in:spam",
    });
    const list = recent.data.messages ?? [];
    for (const msg of list) {
      if (!msg.id) continue;
      const [existing] = await db
        .select({ id: emails.id })
        .from(emails)
        .where(eq(emails.messageId, msg.id))
        .limit(1);
      if (!existing) {
        await enqueueProcessMessage(userId, msg.id);
      }
    }
    // Set historyId from profile so next sync uses history.list
    const profile = await (await import("./gmail.js")).getProfile(client);
    if (profile.historyId) {
      await db
        .update(users)
        .set({ lastHistoryId: profile.historyId, updatedAt: new Date() })
        .where(eq(users.id, userId));
    }
    return;
  }

  try {
    do {
      const historyRes: any = await gmail.users.history.list({
        userId: "me",
        startHistoryId: lastHistoryId,
        historyTypes: ["messageAdded"],
        pageToken: nextPageToken ?? undefined,
      });

      nextPageToken = historyRes.data.nextPageToken ?? undefined;
      if (historyRes.data.historyId) latestHistoryIdSeen = String(historyRes.data.historyId);

      if (!historyRes.data.history || historyRes.data.history.length === 0) {
        break;
      }

      for (const historyItem of historyRes.data.history) {
        const messagesAdded = historyItem.messagesAdded;
        if (!messagesAdded) continue;
        for (const msg of messagesAdded) {
          const messageId = msg.message?.id;
          if (!messageId) continue;
          const [existing] = await db
            .select({ id: emails.id })
            .from(emails)
            .where(eq(emails.messageId, messageId))
            .limit(1);
          if (!existing) {
            await enqueueProcessMessage(userId, messageId);
          }
        }
      }

      lastHistoryId = latestHistoryIdSeen ?? lastHistoryId;
    } while (nextPageToken);

    if (latestHistoryIdSeen) {
      await db
        .update(users)
        .set({
          lastHistoryId: latestHistoryIdSeen,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));
    }
  } catch (err: unknown) {
    const code = (err as { code?: number })?.code;
    const message = (err as { message?: string })?.message ?? "";
    if (code === 404 && String(message).includes("History id not found")) {
      // Full resync
      const recent = await gmail.users.messages.list({
        userId: "me",
        maxResults: 50,
        q: "-in:trash -in:spam",
      });
      const list = recent.data.messages ?? [];
      for (const msg of list) {
        if (!msg.id) continue;
        const [existing] = await db
          .select({ id: emails.id })
          .from(emails)
          .where(eq(emails.messageId, msg.id))
          .limit(1);
        if (!existing) {
          await enqueueProcessMessage(userId, msg.id);
        }
      }
      if (list.length > 0 && list[0].id) {
        const latest: any = await gmail.users.messages.get({
          userId: "me",
          id: list[0].id,
          format: "metadata",
        });
        const newHistoryId = latest.data.historyId ? String(latest.data.historyId) : null;
        if (newHistoryId) {
          await db
            .update(users)
            .set({
              lastHistoryId: newHistoryId,
              updatedAt: new Date(),
            })
            .where(eq(users.id, userId));
        }
      }
    } else {
      throw err;
    }
  }
}

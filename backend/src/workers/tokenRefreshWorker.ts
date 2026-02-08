import { getDb } from "../db/index.js";
import { oauthTokens } from "../db/schema.js";
import { eq, lt } from "drizzle-orm";
import { decrypt, encrypt, refreshIfNeeded } from "../services/tokenManager.js";

const MARGIN_MS = 15 * 60 * 1000; // 15 minutes
const INTERVAL_MS = 30 * 60 * 1000; // 30 minutes

async function run() {
  const db = getDb();
  const soon = new Date(Date.now() + MARGIN_MS);
  const rows = await db
    .select()
    .from(oauthTokens)
    .where(lt(oauthTokens.expiresAt, soon));

  for (const row of rows) {
    try {
      const accessToken = decrypt(row.accessToken);
      const refreshToken = decrypt(row.refreshToken);
      const result = await refreshIfNeeded(
        accessToken,
        refreshToken,
        row.expiresAt,
        MARGIN_MS
      );
      if (result.refreshed) {
        await db
          .update(oauthTokens)
          .set({
            accessToken: encrypt(result.accessToken),
            refreshToken: encrypt(result.refreshToken),
            expiresAt: result.expiresAt,
            updatedAt: new Date(),
          })
          .where(eq(oauthTokens.userId, row.userId));
        console.log(`Refreshed token for user ${row.userId}`);
      }
    } catch (err) {
      console.error(`Token refresh failed for user ${row.userId}:`, err);
    }
  }
}

console.log("Token refresh worker started");
setInterval(run, INTERVAL_MS);
run();

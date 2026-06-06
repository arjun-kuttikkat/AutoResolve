import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema.js";
import { getEnv } from "../config/env.js";

const { Pool } = pg;

let pool: pg.Pool | null = null;

export function getDb() {
  if (!pool) {
    const env = getEnv();
    const url = env.DATABASE_URL;
    const isSupabase =
      url.includes("supabase.com") || url.includes("pooler.supabase");
    const newPool = new Pool({
      connectionString: url,
      max: 10,
      idleTimeoutMillis: 30_000, // close idle connections after 30s to avoid stale EADDRNOTAVAIL
      connectionTimeoutMillis: 10_000,
      ...(isSupabase && {
        // Supabase pooler cert chain can trigger SELF_SIGNED_CERT_IN_CHAIN in Node
        ssl: { rejectUnauthorized: false },
      }),
    });
    // Must attach synchronously so pool 'error' never goes unhandled (would crash process)
    newPool.on("error", (err: Error) => {
      console.error("DB pool error:", err.message);
    });
    pool = newPool;
  }
  return drizzle(pool, { schema });
}

export type Db = ReturnType<typeof getDb>;
export { schema };

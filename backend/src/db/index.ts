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
    pool = new Pool({
      connectionString: url,
      max: 10,
      ...(isSupabase && {
        // Supabase pooler cert chain can trigger SELF_SIGNED_CERT_IN_CHAIN in Node
        ssl: { rejectUnauthorized: false },
      }),
    });
    pool.on("error", (err) => {
      console.error("DB pool error:", err.message);
    });
  }
  return drizzle(pool, { schema });
}

export type Db = ReturnType<typeof getDb>;
export { schema };

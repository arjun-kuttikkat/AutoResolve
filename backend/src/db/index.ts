import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema.js";
import { getEnv } from "../config/env.js";

const { Pool } = pg;

let pool: pg.Pool | null = null;

export function getDb() {
  if (!pool) {
    const env = getEnv();
    pool = new Pool({
      connectionString: env.DATABASE_URL,
      max: 10,
    });
  }
  return drizzle(pool, { schema });
}

export type Db = ReturnType<typeof getDb>;
export { schema };

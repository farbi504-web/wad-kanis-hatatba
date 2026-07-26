import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "@/db/schema";

const globalForDb = globalThis as unknown as { pool: Pool | undefined };

function getPool(): Pool {
  if (globalForDb.pool) return globalForDb.pool;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }

  const pool = new Pool({
    connectionString,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
    ssl:
      process.env.NODE_ENV === "production"
        ? { rejectUnauthorized: false }
        : undefined,
  });

  pool.on("error", (err) => {
    console.error("[db] Unexpected pool error:", err);
  });

  globalForDb.pool = pool;
  return pool;
}

export const db = drizzle(getPool(), { schema });
export { schema };

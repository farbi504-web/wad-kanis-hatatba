import { drizzle } from "drizzle-orm/node-postgres";
import { Pool, type PoolConfig } from "pg";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required");
}

const isProduction = process.env.NODE_ENV === "production";
// In sandboxed environments NODE_ENV may be 'production' even without HTTPS
// We disable SSL by default unless explicitly requested

/**
 * Connection Pool Configuration
 */
function buildPoolConfig(): PoolConfig {
  const config: PoolConfig = {
    connectionString: databaseUrl,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  };

  // SSL فقط عند طلب صريح
  if (process.env.DATABASE_SSL === "true") {
    config.ssl = {
      rejectUnauthorized: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== "false",
    };
  }

  return config;
}

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
};

export const pool =
  globalForDb.__arenaNextJsPostgresqlPool ?? new Pool(buildPoolConfig());

if (!isProduction) {
  globalForDb.__arenaNextJsPostgresqlPool = pool;
}

// Error handling للـ pool
pool.on("error", (err) => {
  console.error("[db] unexpected error on idle client:", err);
});

export const db = drizzle(pool);

/**
 * Helper: تنفيذ استعلام مع timing
 */
export async function executeQuery<T>(
  queryName: string,
  queryFn: () => Promise<T>,
): Promise<T> {
  const start = Date.now();
  try {
    const result = await queryFn();
    const duration = Date.now() - start;
    if (duration > 1000) {
      console.warn(`[db] slow query: ${queryName} took ${duration}ms`);
    }
    return result;
  } catch (e) {
    const duration = Date.now() - start;
    console.error(`[db] query failed: ${queryName} after ${duration}ms`, e);
    throw e;
  }
}

export async function closePool() {
  await pool.end();
}

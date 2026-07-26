import { db } from "@/db";
import { sql } from "drizzle-orm";
import { pool } from "@/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const result = await pool.query("SELECT 1 as ok");
    return Response.json({ ok: true, result: result.rows });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("[health] db error:", e);
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}

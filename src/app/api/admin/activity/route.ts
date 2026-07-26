import { NextRequest } from "next/server";
import { db } from "@/db";
import { activityLogs, users } from "@/db/schema";
import { desc, eq, sql } from "drizzle-orm";
import { handleError, ok } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(req.url);
    const limit = Math.min(Number(searchParams.get("limit") ?? 100), 200);
    const rows = await db
      .select({
        id: activityLogs.id,
        action: activityLogs.action,
        entity: activityLogs.entity,
        entityId: activityLogs.entityId,
        meta: activityLogs.meta,
        ip: activityLogs.ip,
        createdAt: activityLogs.createdAt,
        actorId: activityLogs.actorId,
        actorName: sql<string | null>`(SELECT full_name FROM users WHERE id = ${activityLogs.actorId})`,
        actorEmail: sql<string | null>`(SELECT email FROM users WHERE id = ${activityLogs.actorId})`,
      })
      .from(activityLogs)
      .orderBy(desc(activityLogs.createdAt))
      .limit(limit);
    return ok(rows);
  } catch (e) {
    return handleError(e);
  }
}

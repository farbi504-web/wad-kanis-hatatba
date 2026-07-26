import { NextRequest } from "next/server";
import { db } from "@/db";
import { reports, users, listings } from "@/db/schema";
import { desc, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import { handleError, ok, parseJson } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { logActivity } from "@/lib/activity";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const conds = [];
    if (status) conds.push(eq(reports.status, status as "pending"));
    const where = conds.length ? conds[0] : undefined;
    const rows = await db
      .select({
        id: reports.id,
        targetType: reports.targetType,
        targetId: reports.targetId,
        reason: reports.reason,
        status: reports.status,
        adminNote: reports.adminNote,
        createdAt: reports.createdAt,
        resolvedAt: reports.resolvedAt,
        reporterId: reports.reporterId,
        reporterName: sql<string>`(SELECT full_name FROM users WHERE id = ${reports.reporterId})`,
        reporterEmail: sql<string>`(SELECT email FROM users WHERE id = ${reports.reporterId})`,
      })
      .from(reports)
      .where(where ?? sql`true`)
      .orderBy(desc(reports.createdAt))
      .limit(200);
    return ok(rows);
  } catch (e) {
    return handleError(e);
  }
}

const patchSchema = z.object({
  ids: z.array(z.string().uuid()).min(1),
  status: z.enum(["pending", "reviewed", "resolved", "dismissed"]),
  adminNote: z.string().max(500).optional(),
});

export async function PATCH(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await parseJson(req, patchSchema);
    await db
      .update(reports)
      .set({
        status: body.status,
        adminNote: body.adminNote ?? null,
        resolvedAt: body.status === "resolved" || body.status === "dismissed" ? new Date() : null,
      })
      .where(inArray(reports.id, body.ids));
    await logActivity({
      actorId: admin.id,
      action: "update",
      entity: "report",
      meta: { ids: body.ids, status: body.status },
    });
    return ok({ ok: true });
  } catch (e) {
    return handleError(e);
  }
}

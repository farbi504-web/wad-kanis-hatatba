import { NextRequest } from "next/server";
import { db } from "@/db";
import { reports } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { handleError, ok, parseJson, fail } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { reportSchema } from "@/lib/validation";
import { logActivity } from "@/lib/activity";

export async function GET(req: NextRequest) {
  try {
    const me = await requireUser();
    if (me.role !== "admin") return fail("غير مصرح", 403);
    const rows = await db
      .select()
      .from(reports)
      .orderBy(desc(reports.createdAt));
    return ok(rows);
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const me = await requireUser();
    const body = await parseJson(req, reportSchema);
    const [row] = await db
      .insert(reports)
      .values({
        reporterId: me.id,
        targetType: body.targetType,
        targetId: body.targetId,
        reason: body.reason,
        status: "pending",
      })
      .returning();
    await logActivity({
      actorId: me.id,
      action: "create",
      entity: "report",
      entityId: row.id,
      meta: { type: body.targetType },
    });
    return ok(row, { status: 201 });
  } catch (e) {
    return handleError(e);
  }
}

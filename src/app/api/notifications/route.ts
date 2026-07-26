import { NextRequest } from "next/server";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { and, desc, eq, sql } from "drizzle-orm";
import { handleError, ok } from "@/lib/api";
import { requireUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const me = await requireUser();
    const { searchParams } = new URL(req.url);
    const limit = Math.min(
      Number(searchParams.get("limit") ?? 50),
      100,
    );
    const rows = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, me.id))
      .orderBy(desc(notifications.createdAt))
      .limit(limit);
    return ok(rows);
  } catch (e) {
    return handleError(e);
  }
}

export async function PATCH() {
  try {
    const me = await requireUser();
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(
        and(eq(notifications.userId, me.id), eq(notifications.isRead, false)),
      );
    return ok({ ok: true });
  } catch (e) {
    return handleError(e);
  }
}

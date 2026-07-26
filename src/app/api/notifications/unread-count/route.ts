import { NextResponse } from "next/server";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ data: { count: 0 } });
  const [row] = await db
    .select({ count: sql<number>`cast(count(*) as integer)` })
    .from(notifications)
    .where(
      and(eq(notifications.userId, me.id), eq(notifications.isRead, false)),
    );
  return NextResponse.json({ data: { count: Number(row?.count ?? 0) } });
}

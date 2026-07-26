import { NextResponse } from "next/server";
import { db } from "@/db";
import { banners, sponsors } from "@/db/schema";
import { and, asc, desc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const b = await db
      .select()
      .from(banners)
      .where(eq(banners.isActive, true))
      .orderBy(asc(banners.sortOrder), desc(banners.createdAt));
    const s = await db
      .select()
      .from(sponsors)
      .where(eq(sponsors.isActive, true))
      .orderBy(desc(sponsors.createdAt))
      .limit(20);
    return NextResponse.json({ data: { banners: b, sponsors: s } });
  } catch (e) {
    const message = e instanceof Error ? e.message : "خطأ";
    return NextResponse.json({ error: { message } }, { status: 500 });
  }
}

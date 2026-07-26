import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { categories } from "@/db/schema";
import { asc } from "drizzle-orm";

export async function GET() {
  try {
    const results = await db
      .select()
      .from(categories)
      .orderBy(asc(categories.id));

    // Group into parents and children
    const parents = results.filter((c) => !c.parentId);
    const children = results.filter((c) => c.parentId);

    const tree = parents.map((p) => ({
      ...p,
      children: children.filter((c) => c.parentId === p.id),
    }));

    return NextResponse.json({ categories: tree });
  } catch (err) {
    console.error("[categories] Error:", err);
    return NextResponse.json(
      { error: "حدث خطأ" },
      { status: 500 },
    );
  }
}

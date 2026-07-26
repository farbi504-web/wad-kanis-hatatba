import { NextRequest } from "next/server";
import { db } from "@/db";
import { categories } from "@/db/schema";
import { asc, eq } from "drizzle-orm";
import { handleError, ok, parseJson, fail } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { categorySchema } from "@/lib/validation";
import { logActivity } from "@/lib/activity";

export async function GET() {
  try {
    const rows = await db
      .select()
      .from(categories)
      .where(eq(categories.isActive, true))
      .orderBy(asc(categories.sortOrder), asc(categories.name));
    return ok(rows);
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await parseJson(req, categorySchema);
    const [row] = await db.insert(categories).values(body).returning();
    await logActivity({
      actorId: admin.id,
      action: "create",
      entity: "category",
      entityId: row.id,
      meta: { name: row.name },
    });
    return ok(row, { status: 201 });
  } catch (e) {
    return handleError(e);
  }
}

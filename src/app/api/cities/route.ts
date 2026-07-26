import { NextRequest } from "next/server";
import { db } from "@/db";
import { cities } from "@/db/schema";
import { asc, eq } from "drizzle-orm";
import { handleError, ok, parseJson, fail } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { citySchema } from "@/lib/validation";
import { logActivity } from "@/lib/activity";

export async function GET() {
  try {
    const rows = await db
      .select()
      .from(cities)
      .where(eq(cities.isActive, true))
      .orderBy(asc(cities.name));
    return ok(rows);
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await parseJson(req, citySchema);
    const [row] = await db.insert(cities).values(body).returning();
    await logActivity({
      actorId: admin.id,
      action: "create",
      entity: "city",
      entityId: row.id,
      meta: { name: row.name },
    });
    return ok(row, { status: 201 });
  } catch (e) {
    return handleError(e);
  }
}

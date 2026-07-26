import { NextRequest } from "next/server";
import { db } from "@/db";
import { cities } from "@/db/schema";
import { asc, desc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { handleError, ok, parseJson, fail } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { logActivity } from "@/lib/activity";

export async function GET() {
  try {
    await requireAdmin();
    const rows = await db
      .select({
        id: cities.id,
        name: cities.name,
        slug: cities.slug,
        isActive: cities.isActive,
        createdAt: cities.createdAt,
        count: sql<number>`(SELECT cast(count(*) as integer) FROM listings WHERE listings.city_id = ${cities.id})`,
      })
      .from(cities)
      .orderBy(asc(cities.name));
    return ok(rows);
  } catch (e) {
    return handleError(e);
  }
}

const createSchema = z.object({
  name: z.string().min(2).max(80),
  slug: z
    .string()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9-]+$/),
  isActive: z.coerce.boolean().default(true),
});

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await parseJson(req, createSchema);
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

const patchSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2).max(80).optional(),
  slug: z.string().min(2).max(80).optional(),
  isActive: z.coerce.boolean().optional(),
});

export async function PATCH(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await parseJson(req, patchSchema);
    const { id, ...updates } = body;
    const [row] = await db
      .update(cities)
      .set(updates)
      .where(eq(cities.id, id))
      .returning();
    if (!row) return fail("المدينة غير موجودة", 404);
    await logActivity({
      actorId: admin.id,
      action: "update",
      entity: "city",
      entityId: id,
    });
    return ok(row);
  } catch (e) {
    return handleError(e);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return fail("id مطلوب", 400);
    await db.delete(cities).where(eq(cities.id, id));
    await logActivity({
      actorId: admin.id,
      action: "delete",
      entity: "city",
      entityId: id,
    });
    return ok({ ok: true });
  } catch (e) {
    return handleError(e);
  }
}

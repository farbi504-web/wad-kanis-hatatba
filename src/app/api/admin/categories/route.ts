import { NextRequest } from "next/server";
import { db } from "@/db";
import { categories, cities, banners, sponsors } from "@/db/schema";
import { and, asc, eq, ilike, sql } from "drizzle-orm";
import { z } from "zod";
import { handleError, ok, parseJson, fail } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { logActivity } from "@/lib/activity";

export async function GET() {
  try {
    await requireAdmin();
    const cats = await db
      .select({
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
        icon: categories.icon,
        sortOrder: categories.sortOrder,
        isActive: categories.isActive,
        createdAt: categories.createdAt,
        count: sql<number>`(SELECT cast(count(*) as integer) FROM listings WHERE listings.category_id = ${categories.id})`,
      })
      .from(categories)
      .orderBy(asc(categories.sortOrder), asc(categories.name));
    return ok(cats);
  } catch (e) {
    return handleError(e);
  }
}

const createSchema = z.object({
  name: z.string().min(2).max(100),
  slug: z
    .string()
    .min(2)
    .max(100)
    .regex(/^[a-z0-9-]+$/),
  icon: z.string().max(60).optional(),
  description: z.string().max(500).optional(),
  sortOrder: z.coerce.number().int().default(0),
  isActive: z.coerce.boolean().default(true),
});

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await parseJson(req, createSchema);
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

const patchSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2).max(100).optional(),
  slug: z.string().min(2).max(100).optional(),
  icon: z.string().max(60).optional(),
  description: z.string().max(500).optional(),
  sortOrder: z.coerce.number().int().optional(),
  isActive: z.coerce.boolean().optional(),
});

export async function PATCH(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await parseJson(req, patchSchema);
    const { id, ...updates } = body;
    const [row] = await db
      .update(categories)
      .set(updates)
      .where(eq(categories.id, id))
      .returning();
    if (!row) return fail("الفئة غير موجودة", 404);
    await logActivity({
      actorId: admin.id,
      action: "update",
      entity: "category",
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
    await db.delete(categories).where(eq(categories.id, id));
    await logActivity({
      actorId: admin.id,
      action: "delete",
      entity: "category",
      entityId: id,
    });
    return ok({ ok: true });
  } catch (e) {
    return handleError(e);
  }
}

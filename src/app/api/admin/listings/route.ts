import { NextRequest } from "next/server";
import { db } from "@/db";
import { listings, users, categories, cities } from "@/db/schema";
import { and, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import { z } from "zod";
import { handleError, ok, parseJson } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { logActivity } from "@/lib/activity";

const querySchema = z.object({
  q: z.string().optional(),
  status: z.string().optional(),
  featured: z.coerce.boolean().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(req.url);
    const q = querySchema.parse(Object.fromEntries(searchParams.entries()));
    const conds = [];
    if (q.q) conds.push(ilike(listings.title, `%${q.q}%`));
    if (q.status) {
      const arr = q.status.split(",") as ("pending" | "active" | "rejected" | "closed" | "sold" | "draft")[];
      conds.push(inArray(listings.status, arr));
    }
    if (typeof q.featured === "boolean")
      conds.push(eq(listings.isFeatured, q.featured));
    const where = conds.length ? and(...conds) : undefined;
    const rows = await db
      .select({
        id: listings.id,
        title: listings.title,
        slug: listings.slug,
        price: listings.price,
        status: listings.status,
        isFeatured: listings.isFeatured,
        viewsCount: listings.viewsCount,
        createdAt: listings.createdAt,
        userName: users.fullName,
        userId: users.id,
        userEmail: users.email,
        category: categories.name,
        city: cities.name,
      })
      .from(listings)
      .leftJoin(users, eq(users.id, listings.userId))
      .leftJoin(categories, eq(categories.id, listings.categoryId))
      .leftJoin(cities, eq(cities.id, listings.cityId))
      .where(where ?? sql`true`)
      .orderBy(desc(listings.createdAt))
      .limit(q.limit)
      .offset((q.page - 1) * q.limit);
    const [totalRow] = await db
      .select({ count: sql<number>`cast(count(*) as integer)` })
      .from(listings)
      .where(where ?? sql`true`);
    return ok({
      items: rows,
      total: Number(totalRow?.count ?? 0),
      page: q.page,
      limit: q.limit,
    });
  } catch (e) {
    return handleError(e);
  }
}

const patchSchema = z.object({
  ids: z.array(z.string().uuid()).min(1),
  action: z.enum([
    "approve",
    "reject",
    "feature",
    "unfeature",
    "delete",
    "close",
  ]),
  rejectedReason: z.string().max(500).optional(),
});

export async function PATCH(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await parseJson(req, patchSchema);
    if (body.action === "delete") {
      await db.delete(listings).where(inArray(listings.id, body.ids));
    } else if (body.action === "approve") {
      await db
        .update(listings)
        .set({
          status: "active",
          publishedAt: new Date(),
          updatedAt: new Date(),
          rejectedReason: null,
        })
        .where(inArray(listings.id, body.ids));
    } else if (body.action === "reject") {
      await db
        .update(listings)
        .set({
          status: "rejected",
          rejectedReason: body.rejectedReason ?? "غير مطابق للسياسات",
          updatedAt: new Date(),
        })
        .where(inArray(listings.id, body.ids));
    } else if (body.action === "feature") {
      await db
        .update(listings)
        .set({ isFeatured: true, updatedAt: new Date() })
        .where(inArray(listings.id, body.ids));
    } else if (body.action === "unfeature") {
      await db
        .update(listings)
        .set({ isFeatured: false, updatedAt: new Date() })
        .where(inArray(listings.id, body.ids));
    } else if (body.action === "close") {
      await db
        .update(listings)
        .set({ status: "closed", updatedAt: new Date() })
        .where(inArray(listings.id, body.ids));
    }
    await logActivity({
      actorId: admin.id,
      action:
        body.action === "approve"
          ? "approve"
          : body.action === "reject"
            ? "reject"
            : body.action === "feature"
              ? "feature"
              : body.action === "unfeature"
                ? "unfeature"
                : body.action === "delete"
                  ? "delete"
                  : "update",
      entity: "listing",
      entityId: null,
      meta: { ids: body.ids, action: body.action },
    });
    return ok({ ok: true });
  } catch (e) {
    return handleError(e);
  }
}

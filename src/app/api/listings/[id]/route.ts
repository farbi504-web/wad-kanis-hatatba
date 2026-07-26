import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import {
  listings,
  listingImages,
  users,
  categories,
  cities,
  favorites,
  reviews,
} from "@/db/schema";
import { and, asc, desc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { handleError, ok, parseJson, fail } from "@/lib/api";
import { requireUser, getCurrentUser, HttpError } from "@/lib/auth";
import { listingSchema } from "@/lib/validation";
import { logActivity } from "@/lib/activity";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const me = await getCurrentUser();
    const [row] = await db
      .select({
        id: listings.id,
        title: listings.title,
        slug: listings.slug,
        description: listings.description,
        price: listings.price,
        currency: listings.currency,
        condition: listings.condition,
        status: listings.status,
        isFeatured: listings.isFeatured,
        viewsCount: listings.viewsCount,
        contactPhone: listings.contactPhone,
        location: listings.location,
        rejectedReason: listings.rejectedReason,
        publishedAt: listings.publishedAt,
        expiresAt: listings.expiresAt,
        createdAt: listings.createdAt,
        updatedAt: listings.updatedAt,
        userId: listings.userId,
        categoryId: listings.categoryId,
        cityId: listings.cityId,
      })
      .from(listings)
      .where(eq(listings.id, id))
      .limit(1);
    if (!row) return fail("الإعلان غير موجود", 404);
    const isOwner = me?.id === row.userId;
    const isAdmin = me?.role === "admin";
    if (row.status !== "active" && !isOwner && !isAdmin) {
      return fail("الإعلان غير متاح", 403);
    }
    const [seller] = await db
      .select({
        id: users.id,
        fullName: users.fullName,
        avatarUrl: users.avatarUrl,
        ratingAvg: users.ratingAvg,
        ratingCount: users.ratingCount,
        isVerified: users.isVerified,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, row.userId));
    const [cat] = await db
      .select()
      .from(categories)
      .where(eq(categories.id, row.categoryId));
    const [city] = await db
      .select()
      .from(cities)
      .where(eq(cities.id, row.cityId));
    const imgs = await db
      .select()
      .from(listingImages)
      .where(eq(listingImages.listingId, id))
      .orderBy(asc(listingImages.sortOrder));
    const sellerReviews = await db
      .select({
        id: reviews.id,
        rating: reviews.rating,
        comment: reviews.comment,
        createdAt: reviews.createdAt,
        reviewerId: reviews.reviewerId,
        reviewerName: users.fullName,
        reviewerAvatar: users.avatarUrl,
      })
      .from(reviews)
      .leftJoin(users, eq(users.id, reviews.reviewerId))
      .where(eq(reviews.sellerId, row.userId))
      .orderBy(desc(reviews.createdAt))
      .limit(20);

    // increment views (best-effort)
    if (!isOwner) {
      await db
        .update(listings)
        .set({ viewsCount: sql`${listings.viewsCount} + 1` })
        .where(eq(listings.id, id));
    }

    let isFavorite = false;
    if (me) {
      const [fav] = await db
        .select()
        .from(favorites)
        .where(
          and(eq(favorites.userId, me.id), eq(favorites.listingId, id)),
        )
        .limit(1);
      isFavorite = !!fav;
    }

    return ok({
      ...row,
      seller,
      category: cat,
      city,
      images: imgs,
      reviews: sellerReviews,
      isFavorite,
      isOwner,
    });
  } catch (e) {
    return handleError(e);
  }
}

const patchSchema = listingSchema.partial().extend({
  status: z
    .enum(["draft", "pending", "active", "rejected", "closed", "sold"])
    .optional(),
  isFeatured: z.boolean().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const me = await requireUser();
    const [row] = await db
      .select()
      .from(listings)
      .where(eq(listings.id, id))
      .limit(1);
    if (!row) return fail("الإعلان غير موجود", 404);
    const isOwner = row.userId === me.id;
    const isAdmin = me.role === "admin";
    if (!isOwner && !isAdmin) {
      return fail("غير مصرح لك بتعديل هذا الإعلان", 403);
    }
    const body = await parseJson(req, patchSchema);
    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (isOwner && !isAdmin) {
      // sellers cannot self-approve
      if (body.title != null) updates.title = body.title;
      if (body.description != null) updates.description = body.description;
      if (body.price != null) updates.price = body.price;
      if (body.currency != null) updates.currency = body.currency;
      if (body.condition != null) updates.condition = body.condition;
      if (body.categoryId != null) updates.categoryId = body.categoryId;
      if (body.cityId != null) updates.cityId = body.cityId;
      if (body.contactPhone !== undefined)
        updates.contactPhone = body.contactPhone || null;
      if (body.location !== undefined) updates.location = body.location || null;
      if (body.status === "closed" || body.status === "active") {
        updates.status = body.status;
        if (body.status === "active" && row.status !== "active") {
          updates.publishedAt = new Date();
        }
      }
    } else if (isAdmin) {
      Object.assign(updates, body);
      if (body.status === "active" && row.status !== "active") {
        updates.publishedAt = new Date();
      }
    }
    const [updated] = await db
      .update(listings)
      .set(updates)
      .where(eq(listings.id, id))
      .returning();
    await logActivity({
      actorId: me.id,
      action: "update",
      entity: "listing",
      entityId: id,
      meta: updates,
    });
    return ok(updated);
  } catch (e) {
    return handleError(e);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const me = await requireUser();
    const [row] = await db
      .select()
      .from(listings)
      .where(eq(listings.id, id))
      .limit(1);
    if (!row) return fail("الإعلان غير موجود", 404);
    if (row.userId !== me.id && me.role !== "admin") {
      return fail("غير مصرح لك بحذف هذا الإعلان", 403);
    }
    await db.delete(listings).where(eq(listings.id, id));
    await logActivity({
      actorId: me.id,
      action: "delete",
      entity: "listing",
      entityId: id,
      meta: { title: row.title },
    });
    return ok({ ok: true });
  } catch (e) {
    return handleError(e);
  }
}

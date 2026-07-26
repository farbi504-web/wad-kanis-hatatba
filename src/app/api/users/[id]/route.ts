import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, listings, reviews, listingImages } from "@/db/schema";
import { and, desc, eq, inArray, sql } from "drizzle-orm";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const [u] = await db
      .select({
        id: users.id,
        fullName: users.fullName,
        avatarUrl: users.avatarUrl,
        bio: users.bio,
        isVerified: users.isVerified,
        ratingAvg: users.ratingAvg,
        ratingCount: users.ratingCount,
        role: users.role,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    if (!u) {
      return NextResponse.json(
        { error: { message: "المستخدم غير موجود" } },
        { status: 404 },
      );
    }
    const list = await db
      .select({
        id: listings.id,
        title: listings.title,
        slug: listings.slug,
        price: listings.price,
        currency: listings.currency,
        condition: listings.condition,
        publishedAt: listings.publishedAt,
        status: listings.status,
        isFeatured: listings.isFeatured,
      })
      .from(listings)
      .where(and(eq(listings.userId, id), eq(listings.status, "active")))
      .orderBy(desc(listings.publishedAt))
      .limit(24);
    const ids = list.map((l) => l.id);
    let imgMap = new Map<string, { url: string; isPrimary: boolean }[]>();
    if (ids.length) {
      const imgs = await db
        .select()
        .from(listingImages)
        .where(inArray(listingImages.listingId, ids));
      for (const i of imgs) {
        const arr = imgMap.get(i.listingId) ?? [];
        arr.push({ url: i.url, isPrimary: i.isPrimary });
        imgMap.set(i.listingId, arr);
      }
    }
    const sellerReviews = await db
      .select({
        id: reviews.id,
        rating: reviews.rating,
        comment: reviews.comment,
        createdAt: reviews.createdAt,
        reviewerId: reviews.reviewerId,
      })
      .from(reviews)
      .where(eq(reviews.sellerId, id))
      .orderBy(desc(reviews.createdAt))
      .limit(20);

    return NextResponse.json({
      data: {
        user: u,
        listings: list.map((l) => ({ ...l, images: imgMap.get(l.id) ?? [] })),
        reviews: sellerReviews,
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "خطأ";
    return NextResponse.json({ error: { message } }, { status: 500 });
  }
}

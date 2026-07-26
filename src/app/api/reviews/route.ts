import { NextRequest } from "next/server";
import { db } from "@/db";
import { reviews, users, listings } from "@/db/schema";
import { desc, eq, sql } from "drizzle-orm";
import { handleError, ok, parseJson, fail } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { reviewSchema } from "@/lib/validation";
import { logActivity } from "@/lib/activity";
import { pushNotification } from "@/lib/notifications";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sellerId = searchParams.get("sellerId");
    if (!sellerId) return fail("sellerId مطلوب", 400);
    const rows = await db
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
      .where(eq(reviews.sellerId, sellerId))
      .orderBy(desc(reviews.createdAt));
    return ok(rows);
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const me = await requireUser();
    const body = await parseJson(req, reviewSchema);
    if (body.sellerId === me.id) return fail("لا يمكنك تقييم نفسك", 400);
    const [seller] = await db
      .select()
      .from(users)
      .where(eq(users.id, body.sellerId))
      .limit(1);
    if (!seller) return fail("البائع غير موجود", 404);
    const [row] = await db
      .insert(reviews)
      .values({
        sellerId: body.sellerId,
        reviewerId: me.id,
        listingId: body.listingId || null,
        rating: body.rating,
        comment: body.comment || null,
      })
      .returning();
    // recompute avg
    const [agg] = await db
      .select({
        avg: sql<number>`cast(avg(${reviews.rating}) as double precision)`,
        count: sql<number>`cast(count(*) as integer)`,
      })
      .from(reviews)
      .where(eq(reviews.sellerId, body.sellerId));
    await db
      .update(users)
      .set({
        ratingAvg: Number(agg?.avg ?? 0),
        ratingCount: Number(agg?.count ?? 0),
      })
      .where(eq(users.id, body.sellerId));
    await logActivity({
      actorId: me.id,
      action: "create",
      entity: "review",
      entityId: row.id,
      meta: { rating: body.rating, seller: body.sellerId },
    });
    await pushNotification({
      userId: body.sellerId,
      type: "review",
      title: "تقييم جديد",
      body: `حصلت على تقييم ${body.rating} من 5`,
      link: `/seller/${body.sellerId}`,
    });
    return ok(row, { status: 201 });
  } catch (e) {
    return handleError(e);
  }
}

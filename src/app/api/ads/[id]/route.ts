import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { ads, categories, users } from "@/db/schema";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const adId = parseInt(id);

    if (isNaN(adId)) {
      return NextResponse.json(
        { error: "معرف الإعلان غير صالح" },
        { status: 400 },
      );
    }

    const [result] = await db
      .select({
        id: ads.id,
        title: ads.title,
        description: ads.description,
        price: ads.price,
        currency: ads.currency,
        adType: ads.adType,
        categoryId: ads.categoryId,
        userId: ads.userId,
        wilaya: ads.wilaya,
        commune: ads.commune,
        images: ads.images,
        status: ads.status,
        views: ads.views,
        isFeatured: ads.isFeatured,
        isPremium: ads.isPremium,
        createdAt: ads.createdAt,
        updatedAt: ads.updatedAt,
        categoryName: categories.name,
        categoryNameAr: categories.nameAr,
        categoryIcon: categories.icon,
        userName: users.fullName,
        userPhone: users.phone,
      })
      .from(ads)
      .leftJoin(categories, eq(ads.categoryId, categories.id))
      .leftJoin(users, eq(ads.userId, users.id))
      .where(eq(ads.id, adId))
      .limit(1);

    if (!result) {
      return NextResponse.json(
        { error: "الإعلان غير موجود" },
        { status: 404 },
      );
    }

    // Increment view count (fire and forget)
    db.update(ads)
      .set({ views: (result.views || 0) + 1 })
      .where(eq(ads.id, adId))
      .execute()
      .catch(() => {});

    return NextResponse.json({ ad: result });
  } catch (err) {
    console.error("[ad-detail] Error:", err);
    return NextResponse.json(
      { error: "حدث خطأ" },
      { status: 500 },
    );
  }
}

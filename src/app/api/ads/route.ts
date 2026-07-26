import { NextResponse } from "next/server";
import { eq, desc, and, ilike, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { ads, categories } from "@/db/schema";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20")));
    const offset = (page - 1) * limit;
    const category = searchParams.get("category");
    const search = searchParams.get("q");
    const wilaya = searchParams.get("wilaya");
    const adType = searchParams.get("type");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const sort = searchParams.get("sort") || "latest";

    // Build where conditions
    const conditions = [eq(ads.status, "active")];

    if (category) {
      conditions.push(eq(ads.categoryId, parseInt(category)));
    }
    if (wilaya) {
      conditions.push(eq(ads.wilaya, wilaya));
    }
    if (adType) {
      conditions.push(eq(ads.adType, adType as any));
    }
    if (search) {
      conditions.push(
        or(
          ilike(ads.title, `%${search}%`),
          ilike(ads.description, `%${search}%`),
        )!,
      );
    }

    // Build order
    let orderBy = desc(ads.createdAt);
    if (sort === "price_asc") orderBy = ads.price as any;
    if (sort === "price_desc") orderBy = desc(ads.price as any);
    if (sort === "views") orderBy = desc(ads.views);

    // Query with join
    const results = await db
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
        categoryName: categories.name,
        categoryNameAr: categories.nameAr,
        categoryIcon: categories.icon,
      })
      .from(ads)
      .leftJoin(categories, eq(ads.categoryId, categories.id))
      .where(and(...conditions))
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    // Count total
    const countResult = await db
      .select({ id: ads.id })
      .from(ads)
      .where(and(...conditions));

    const total = countResult.length;

    return NextResponse.json({
      ads: results,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("[ads] Error:", err);
    return NextResponse.json(
      { error: "حدث خطأ أثناء جلب الإعلانات" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const { getSession } = await import("@/lib/auth");
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: "يجب تسجيل الدخول أولاً" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const { title, description, price, adType, categoryId, images, wilaya, commune } = body;

    if (!title || !description || !categoryId) {
      return NextResponse.json(
        { error: "العنوان والوصف والفئة مطلوبة" },
        { status: 400 },
      );
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days expiry

    const [ad] = await db
      .insert(ads)
      .values({
        title,
        description,
        price: price ? String(price) : null,
        adType: (adType as "sale" | "rent" | "service" | "job") || "sale",
        categoryId: Number(categoryId),
        userId: session.userId,
        wilaya: wilaya || session.wilaya || "Tipaza",
        commune: commune || session.commune || "Hatatba",
        images: images || [],
        expiresAt,
      })
      .returning();

    return NextResponse.json({ success: true, ad }, { status: 201 });
  } catch (err) {
    console.error("[ads] Create error:", err);
    return NextResponse.json(
      { error: "حدث خطأ أثناء نشر الإعلان" },
      { status: 500 },
    );
  }
}

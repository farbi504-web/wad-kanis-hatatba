import { NextResponse } from "next/server";
import { db } from "@/db";
import {
  categories,
  cities,
  listings,
  listingImages,
  users,
} from "@/db/schema";
import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const cats = await db
      .select({
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
        icon: categories.icon,
        count: sql<number>`(SELECT cast(count(*) as integer) FROM listings WHERE listings.category_id = ${categories.id} AND listings.status = 'active')`,
      })
      .from(categories)
      .where(eq(categories.isActive, true))
      .orderBy(asc(categories.sortOrder), asc(categories.name))
      .limit(20);

    const citiesRows = await db
      .select({
        id: cities.id,
        name: cities.name,
        slug: cities.slug,
        count: sql<number>`(SELECT cast(count(*) as integer) FROM listings WHERE listings.city_id = ${cities.id} AND listings.status = 'active')`,
      })
      .from(cities)
      .where(eq(cities.isActive, true))
      .orderBy(asc(cities.name))
      .limit(20);

    const featured = await db
      .select({
        id: listings.id,
        title: listings.title,
        slug: listings.slug,
        price: listings.price,
        currency: listings.currency,
        condition: listings.condition,
        publishedAt: listings.publishedAt,
        category: categories.name,
        city: cities.name,
        sellerId: users.id,
        sellerName: users.fullName,
        sellerAvatar: users.avatarUrl,
      })
      .from(listings)
      .leftJoin(users, eq(users.id, listings.userId))
      .leftJoin(categories, eq(categories.id, listings.categoryId))
      .leftJoin(cities, eq(cities.id, listings.cityId))
      .where(
        and(eq(listings.status, "active"), eq(listings.isFeatured, true)),
      )
      .orderBy(desc(listings.publishedAt))
      .limit(8);

    const recent = await db
      .select({
        id: listings.id,
        title: listings.title,
        slug: listings.slug,
        price: listings.price,
        currency: listings.currency,
        condition: listings.condition,
        publishedAt: listings.publishedAt,
        category: categories.name,
        city: cities.name,
        sellerId: users.id,
        sellerName: users.fullName,
        sellerAvatar: users.avatarUrl,
      })
      .from(listings)
      .leftJoin(users, eq(users.id, listings.userId))
      .leftJoin(categories, eq(categories.id, listings.categoryId))
      .leftJoin(cities, eq(cities.id, listings.cityId))
      .where(eq(listings.status, "active"))
      .orderBy(desc(listings.publishedAt))
      .limit(12);

    const ids = [...featured, ...recent].map((l) => l.id);
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

    return NextResponse.json({
      data: {
        categories: cats,
        cities: citiesRows,
        featured: featured.map((l) => ({
          ...l,
          images: imgMap.get(l.id) ?? [],
        })),
        recent: recent.map((l) => ({
          ...l,
          images: imgMap.get(l.id) ?? [],
        })),
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "خطأ";
    return NextResponse.json({ error: { message } }, { status: 500 });
  }
}

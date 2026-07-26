import { NextRequest } from "next/server";
import { db } from "@/db";
import {
  favorites,
  listings,
  listingImages,
  users,
  categories,
  cities,
} from "@/db/schema";
import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { handleError, ok } from "@/lib/api";
import { requireUser } from "@/lib/auth";

export async function GET() {
  try {
    const me = await requireUser();
    const rows = await db
      .select({
        id: listings.id,
        title: listings.title,
        slug: listings.slug,
        price: listings.price,
        currency: listings.currency,
        condition: listings.condition,
        status: listings.status,
        isFeatured: listings.isFeatured,
        publishedAt: listings.publishedAt,
        createdAt: listings.createdAt,
        category: categories.name,
        city: cities.name,
        seller: users.fullName,
        sellerId: users.id,
        sellerAvatar: users.avatarUrl,
        addedAt: favorites.createdAt,
      })
      .from(favorites)
      .innerJoin(listings, eq(listings.id, favorites.listingId))
      .leftJoin(users, eq(users.id, listings.userId))
      .leftJoin(categories, eq(categories.id, listings.categoryId))
      .leftJoin(cities, eq(cities.id, listings.cityId))
      .where(eq(favorites.userId, me.id))
      .orderBy(desc(favorites.createdAt));

    const ids = rows.map((r) => r.id);
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

    return ok(
      rows.map((r) => ({
        ...r,
        images: imgMap.get(r.id) ?? [],
      })),
    );
  } catch (e) {
    return handleError(e);
  }
}

import { PageShell } from "@/components/page-shell";
import { ListingsView } from "@/components/listings/listings-view";
import { db } from "@/db";
import {
  listings,
  listingImages,
  users,
  categories,
  cities,
} from "@/db/schema";
import { and, desc, eq, inArray, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

async function getData(params: {
  q?: string;
  category?: string;
  city?: string;
  condition?: string;
  minPrice?: number;
  maxPrice?: number;
  featured?: boolean;
  sort?: string;
  page?: number;
}) {
  const page = params.page ?? 1;
  const limit = 24;
  const offset = (page - 1) * limit;
  const conds = [eq(listings.status, "active")];
  if (params.q) {
    conds.push(sql`(${listings.title} ILIKE ${`%${params.q}%`} OR ${listings.description} ILIKE ${`%${params.q}%`})`);
  }
  if (params.category) conds.push(eq(listings.categoryId, params.category));
  if (params.city) conds.push(eq(listings.cityId, params.city));
  if (params.condition) conds.push(eq(listings.condition, params.condition as "new"));
  if (params.minPrice != null)
    conds.push(sql`${listings.price} >= ${params.minPrice}`);
  if (params.maxPrice != null)
    conds.push(sql`${listings.price} <= ${params.maxPrice}`);
  if (params.featured) conds.push(eq(listings.isFeatured, true));
  const where = and(...conds);
  const orderBy =
    params.sort === "oldest"
      ? listings.createdAt
      : params.sort === "price_asc"
        ? sql`${listings.price} asc`
        : params.sort === "price_desc"
          ? sql`${listings.price} desc`
          : params.sort === "popular"
            ? desc(listings.viewsCount)
            : desc(listings.publishedAt);

  const rows = await db
    .select({
      id: listings.id,
      title: listings.title,
      slug: listings.slug,
      price: listings.price,
      currency: listings.currency,
      condition: listings.condition,
      isFeatured: listings.isFeatured,
      publishedAt: listings.publishedAt,
      viewsCount: listings.viewsCount,
      sellerId: users.id,
      sellerName: users.fullName,
      sellerAvatar: users.avatarUrl,
      category: categories.name,
      city: cities.name,
    })
    .from(listings)
    .leftJoin(users, eq(users.id, listings.userId))
    .leftJoin(categories, eq(categories.id, listings.categoryId))
    .leftJoin(cities, eq(cities.id, listings.cityId))
    .where(where)
    .orderBy(orderBy)
    .limit(limit)
    .offset(offset);

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

  const [totalRow] = await db
    .select({ count: sql<number>`cast(count(*) as integer)` })
    .from(listings)
    .where(where);
  return {
    items: rows.map((r) => ({ ...r, images: imgMap.get(r.id) ?? [] })),
    total: Number(totalRow?.count ?? 0),
    page,
    limit,
  };
}

export default async function ListingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const sp = await searchParams;
  const cats = await db
    .select({ id: categories.id, name: categories.name, slug: categories.slug })
    .from(categories)
    .where(eq(categories.isActive, true))
    .orderBy(categories.sortOrder);
  const citiesRows = await db
    .select({ id: cities.id, name: cities.name, slug: cities.slug })
    .from(cities)
    .where(eq(cities.isActive, true))
    .orderBy(cities.name);

  const data = await getData({
    q: sp.q,
    category: sp.category,
    city: sp.city,
    condition: sp.condition,
    minPrice: sp.minPrice ? Number(sp.minPrice) : undefined,
    maxPrice: sp.maxPrice ? Number(sp.maxPrice) : undefined,
    featured: sp.featured === "true",
    sort: sp.sort,
    page: sp.page ? Number(sp.page) : 1,
  });
  return (
    <PageShell>
      <ListingsView
        data={data}
        categories={cats}
        cities={citiesRows}
        initialParams={sp}
      />
    </PageShell>
  );
}

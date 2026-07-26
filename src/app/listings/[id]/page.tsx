import { PageShell } from "@/components/page-shell";
import { ListingDetailsView } from "@/components/listings/listing-details-view";
import { db } from "@/db";
import {
  listings,
  listingImages,
  users,
  categories,
  cities,
  reviews,
  favorites,
} from "@/db/schema";
import { and, asc, desc, eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ListingDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [row] = await db
    .select()
    .from(listings)
    .where(eq(listings.id, id))
    .limit(1);
  if (!row) {
    // try slug
    const [bySlug] = await db
      .select()
      .from(listings)
      .where(eq(listings.slug, id))
      .limit(1);
    if (!bySlug) notFound();
    return render(bySlug.id);
  }
  return render(row.id);
}

async function render(id: string) {
  const [row] = await db
    .select()
    .from(listings)
    .where(eq(listings.id, id))
    .limit(1);
  if (!row) notFound();
  const me = await getCurrentUser();
  if (row.status !== "active" && row.userId !== me?.id && me?.role !== "admin") {
    notFound();
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
    .limit(10);
  let isFavorite = false;
  if (me) {
    const [fav] = await db
      .select()
      .from(favorites)
      .where(and(eq(favorites.userId, me.id), eq(favorites.listingId, id)))
      .limit(1);
    isFavorite = !!fav;
  }
  return (
    <PageShell>
      <ListingDetailsView
        listing={{
          ...row,
          publishedAt: row.publishedAt ? row.publishedAt.toISOString() : null,
          createdAt: row.createdAt.toISOString(),
          updatedAt: row.updatedAt.toISOString(),
          expiresAt: row.expiresAt ? row.expiresAt.toISOString() : null,
        } as never}
        seller={seller}
        category={cat}
        city={city}
        images={imgs}
        reviews={sellerReviews.map((r) => ({
          ...r,
          createdAt: r.createdAt.toISOString(),
        }))}
        isFavorite={isFavorite}
        isOwner={me?.id === row.userId}
        me={
          me
            ? {
                id: me.id,
                fullName: me.fullName,
                email: me.email,
                avatarUrl: me.avatarUrl,
                role: me.role,
              }
            : null
        }
      />
    </PageShell>
  );
}

import { db } from "@/db";
import {
  users,
  listings,
  listingImages,
  reviews,
} from "@/db/schema";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/page-shell";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Star, MapPin, Calendar, BadgeCheck, List } from "lucide-react";
import { ListingCard, type ListingCardData } from "@/components/listings/listing-card";
import { timeAgo } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function SellerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
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
  if (!u) notFound();
  const list = await db
    .select({
      id: listings.id,
      title: listings.title,
      slug: listings.slug,
      price: listings.price,
      currency: listings.currency,
      condition: listings.condition,
      publishedAt: listings.publishedAt,
      isFeatured: listings.isFeatured,
      viewsCount: listings.viewsCount,
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

  return (
    <PageShell>
      <div className="container-app py-6 md:py-8">
        <div className="card p-6 mb-6 bg-gradient-to-l from-[#00A86B]/8 to-transparent">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
            <Avatar src={u.avatarUrl} name={u.fullName} size={96} />
            <div className="flex-1 text-center sm:text-right">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <h1 className="text-2xl font-black">{u.fullName}</h1>
                {u.isVerified && (
                  <BadgeCheck className="size-5 text-[#00A86B]" />
                )}
              </div>
              {u.bio && (
                <p className="text-sm text-soft mt-1">{u.bio}</p>
              )}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-3 text-xs text-soft">
                <span className="flex items-center gap-1">
                  <Star className="size-3.5 fill-[#F4B400] text-[#F4B400]" />
                  <span className="font-bold text-app">
                    {Number(u.ratingAvg).toFixed(1)}
                  </span>
                  ({u.ratingCount} تقييم)
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="size-3.5" /> منذ{" "}
                  {timeAgo(u.createdAt)}
                </span>
                <span className="flex items-center gap-1">
                  <List className="size-3.5" /> {list.length} إعلان نشط
                </span>
              </div>
            </div>
          </div>
        </div>

        <h2 className="text-lg md:text-xl font-black mb-4 flex items-center gap-2">
          <List className="size-5 text-[#00A86B]" /> إعلانات البائع
        </h2>
        {list.length === 0 ? (
          <div className="card p-8 text-center text-soft">
            لا توجد إعلانات حالياً
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">
            {list.map((l) => (
              <ListingCard
                key={l.id}
                listing={
                  {
                    ...l,
                    publishedAt: l.publishedAt
                      ? l.publishedAt.toISOString()
                      : null,
                    images: imgMap.get(l.id) ?? [],
                    sellerId: u.id,
                    sellerName: u.fullName,
                    sellerAvatar: u.avatarUrl,
                  } as unknown as ListingCardData
                }
              />
            ))}
          </div>
        )}

        {sellerReviews.length > 0 && (
          <div className="mt-8">
            <h2 className="text-lg md:text-xl font-black mb-4">التقييمات</h2>
            <div className="space-y-2">
              {sellerReviews.map((r) => (
                <div key={r.id} className="card p-4">
                  <div className="flex items-center gap-1 mb-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`size-3.5 ${
                          i < r.rating
                            ? "fill-[#F4B400] text-[#F4B400]"
                            : "text-soft"
                        }`}
                      />
                    ))}
                    <span className="text-xs text-soft mr-2">
                      {timeAgo(r.createdAt)}
                    </span>
                  </div>
                  {r.comment && (
                    <p className="text-sm text-app">{r.comment}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
}

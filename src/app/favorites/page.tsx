"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import { PageShell } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { ListingCardSkeleton } from "@/components/ui/skeleton";
import { SafeImage } from "@/components/ui/safe-image";
import { ListingCard, type ListingCardData } from "@/components/listings/listing-card";

export default function FavoritesPage() {
  const [items, setItems] = useState<ListingCardData[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch("/api/favorites")
      .then((r) => {
        if (r.status === 401) {
          window.location.href = "/auth/login?next=/favorites";
          return null;
        }
        return r.json();
      })
      .then((j) => {
        if (!j) return;
        setItems(j.data ?? []);
        setLoading(false);
      });
  }, []);
  return (
    <PageShell>
      <div className="container-app py-6 md:py-8">
        <h1 className="text-2xl md:text-3xl font-black mb-1 flex items-center gap-2">
          <Heart className="size-7 text-red-500 fill-red-500" /> المفضلة
        </h1>
        <p className="text-sm text-soft mb-6">
          الإعلانات التي حفظتها للرجوع إليها لاحقاً
        </p>
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <ListingCardSkeleton key={i} />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="card p-10 text-center">
            <div className="size-16 mx-auto rounded-2xl bg-red-100 dark:bg-red-950/30 flex items-center justify-center mb-3">
              <Heart className="size-7 text-red-500" />
            </div>
            <h3 className="text-lg font-bold mb-1">لا توجد مفضلات</h3>
            <p className="text-sm text-soft mb-4">
              ابدأ بإضافة إعلانات للمفضلة من أي صفحة
            </p>
            <Link href="/listings">
              <Button>تصفح الإعلانات</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">
            {items.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
        )}
      </div>
    </PageShell>
  );
}

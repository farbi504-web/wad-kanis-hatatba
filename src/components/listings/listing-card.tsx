"use client";

import Link from "next/link";
import {
  Heart,
  MapPin,
  Eye,
  Star,
  BadgeCheck,
  Sparkles,
} from "lucide-react";
import { useEffect, useState } from "react";
import { cn, formatPrice, timeAgo } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast-helper";
import { SafeImage } from "@/components/ui/safe-image";

export interface ListingCardData {
  id: string;
  title: string;
  slug?: string;
  price: number;
  currency: string;
  condition: string;
  status?: string;
  isFeatured?: boolean;
  publishedAt?: Date | string | null;
  viewsCount?: number;
  category?: string | null;
  city?: string | null;
  sellerId?: string | null;
  sellerName?: string | null;
  sellerAvatar?: string | null;
  images?: { url: string; isPrimary?: boolean }[];
  isFavorite?: boolean;
}

const conditionLabel: Record<string, string> = {
  new: "جديد",
  like_new: "شبه جديد",
  good: "حالة جيدة",
  fair: "مقبول",
  used: "مستعمل",
};

export function ListingCard({ listing }: { listing: ListingCardData }) {
  const [fav, setFav] = useState(!!listing.isFavorite);
  const [favLoading, setFavLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    setFav(!!listing.isFavorite);
  }, [listing.isFavorite]);

  const primary =
    listing.images?.find((i) => i.isPrimary)?.url ||
    listing.images?.[0]?.url ||
    "";
  const slugOrId = listing.slug || listing.id;

  const toggleFav = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setFavLoading(true);
    try {
      const r = await fetch(`/api/listings/${listing.id}/favorite`, {
        method: fav ? "DELETE" : "POST",
      });
      if (r.status === 401) {
        toast.info("سجّل دخولك لإضافة المفضلة");
        return;
      }
      if (r.ok) {
        setFav((v) => !v);
        toast.success(fav ? "تمت الإزالة من المفضلة" : "أضيف للمفضلة");
      }
    } catch {
      toast.error("حدث خطأ");
    } finally {
      setFavLoading(false);
    }
  };

  return (
    <Link
      href={`/listings/${slugOrId}`}
      className="group card card-hover overflow-hidden"
    >
      <div className="relative aspect-listing overflow-hidden bg-soft">
        {primary ? (
          <SafeImage
            src={primary}
            alt={listing.title}
            className="w-full h-full group-hover:scale-105 transition-transform duration-500"
            aspectRatio="4/3"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-soft text-xs">
            لا توجد صورة
          </div>
        )}
        <div className="absolute top-2 right-2 flex flex-col gap-1.5">
          {listing.isFeatured && (
            <span className="badge badge-accent shadow">
              <Sparkles className="size-3" /> مميز
            </span>
          )}
          {listing.condition && (
            <span className="badge bg-white/95 dark:bg-black/70 text-app shadow">
              {conditionLabel[listing.condition] || listing.condition}
            </span>
          )}
        </div>
        <button
          onClick={toggleFav}
          disabled={favLoading}
          aria-label="إضافة للمفضلة"
          className={cn(
            "absolute top-2 left-2 size-9 rounded-full bg-white/95 dark:bg-black/70 backdrop-blur flex items-center justify-center shadow transition-colors",
            fav
              ? "text-red-500"
              : "text-soft hover:text-red-500",
          )}
        >
          <Heart className={cn("size-4", fav && "fill-current")} />
        </button>
        {typeof listing.viewsCount === "number" && listing.viewsCount > 0 && (
          <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full bg-black/60 text-white text-[10px] flex items-center gap-1 backdrop-blur">
            <Eye className="size-3" /> {listing.viewsCount}
          </div>
        )}
      </div>
      <div className="p-3 md:p-4">
        <h3 className="text-sm md:text-base font-bold text-app clamp-1 group-hover:text-[#00A86B] transition-colors">
          {listing.title}
        </h3>
        <div className="mt-1 text-base md:text-lg font-black text-[#00A86B]">
          {formatPrice(listing.price, listing.currency)}
        </div>
        <div className="mt-2 flex items-center justify-between gap-2 text-[11px] md:text-xs text-soft">
          <span className="flex items-center gap-1 clamp-1">
            <MapPin className="size-3 shrink-0" />
            {listing.city || "حطاطبة"}
          </span>
          <span className="shrink-0">
            {listing.publishedAt ? timeAgo(listing.publishedAt) : ""}
          </span>
        </div>
        {listing.sellerName && (
          <div className="mt-2 pt-2 border-t border-app flex items-center gap-2 text-xs">
            <span className="size-5 rounded-full bg-gradient-to-br from-[#00A86B] to-[#0D1F3C] text-white text-[10px] font-bold flex items-center justify-center">
              {listing.sellerName[0]}
            </span>
            <span className="text-soft clamp-1 flex-1">
              {listing.sellerName}
            </span>
            <BadgeCheck className="size-3.5 text-[#00A86B] shrink-0" />
          </div>
        )}
      </div>
    </Link>
  );
}

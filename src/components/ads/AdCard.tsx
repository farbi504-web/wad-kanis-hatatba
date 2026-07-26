import Link from "next/link";
import { MapPin, Eye, Clock } from "lucide-react";
import { formatPrice, timeAgo } from "@/lib/utils";

interface AdCardProps {
  id: number;
  title: string;
  price: string | number | null;
  currency: string;
  images: string[] | null;
  wilaya: string | null;
  commune: string | null;
  views: number | null;
  createdAt: string;
  isFeatured?: boolean;
  isPremium?: boolean;
  categoryNameAr?: string | null;
}

export default function AdCard({
  id,
  title,
  price,
  currency,
  images,
  wilaya,
  commune,
  views,
  createdAt,
  isFeatured,
  isPremium,
  categoryNameAr,
}: AdCardProps) {
  const imageUrl =
    images && Array.isArray(images) && images.length > 0
      ? images[0]
      : "/placeholder-ad.jpg";

  return (
    <Link
      href={`/ads/${id}`}
      className="group bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-lg hover:border-wdk-200 transition-all duration-300 flex flex-col"
    >
      {/* Image */}
      <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
        <div className="w-full h-full bg-gradient-to-br from-wdk-100 to-wdk-50 flex items-center justify-center">
          {images && images.length > 0 ? (
            <img
              src={imageUrl}
              alt={title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          ) : (
            <div className="text-center p-4">
              <div className="w-16 h-16 mx-auto bg-wdk-200 rounded-2xl flex items-center justify-center mb-2">
                <Eye className="w-8 h-8 text-wdk-500" />
              </div>
              <p className="text-sm text-gray-400">لا توجد صورة</p>
            </div>
          )}
        </div>

        {/* Badges */}
        <div className="absolute top-2 right-2 flex flex-col gap-1">
          {isPremium && (
            <span className="bg-yellow-500 text-white text-xs px-2 py-0.5 rounded-full font-medium shadow">
              مميز
            </span>
          )}
          {isFeatured && (
            <span className="bg-wdk-600 text-white text-xs px-2 py-0.5 rounded-full font-medium shadow">
              بارز
            </span>
          )}
        </div>

        {/* Price tag */}
        {price && (
          <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur text-white text-sm font-bold px-3 py-1 rounded-xl">
            {formatPrice(price, currency)}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col">
        {categoryNameAr && (
          <span className="text-xs text-wdk-600 font-medium mb-1">
            {categoryNameAr}
          </span>
        )}
        <h3 className="font-semibold text-gray-900 line-clamp-2 leading-snug group-hover:text-wdk-700 transition">
          {title}
        </h3>

        <div className="mt-auto pt-3 flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5" />
            <span>
              {commune || wilaya || "—"}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Eye className="w-3.5 h-3.5" />
              {views || 0}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {timeAgo(createdAt)}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

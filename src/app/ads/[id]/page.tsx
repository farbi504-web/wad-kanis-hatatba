"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  MapPin,
  Calendar,
  Eye,
  Phone,
  Tag,
  ArrowRight,
  Heart,
  Share2,
  Loader2,
  AlertCircle,
  User,
} from "lucide-react";
import { formatPrice, timeAgo } from "@/lib/utils";
import { toast } from "sonner";

interface AdDetail {
  id: number;
  title: string;
  description: string;
  price: string | number | null;
  currency: string;
  adType: string;
  images: string[] | null;
  wilaya: string | null;
  commune: string | null;
  views: number;
  isFeatured: boolean;
  isPremium: boolean;
  createdAt: string;
  updatedAt: string;
  categoryNameAr?: string | null;
  categoryName?: string | null;
  userName?: string | null;
  userPhone?: string | null;
}

export default function AdDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [ad, setAd] = useState<AdDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/ads/${params.id}`);
        if (!res.ok) throw new Error("الإعلان غير موجود");
        const data = await res.json();
        setAd(data.ad);
      } catch (err: any) {
        setError(err.message || "حدث خطأ");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [params.id]);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: ad?.title,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("تم نسخ الرابط!");
    }
  };

  const handleContact = () => {
    if (ad?.userPhone) {
      window.open(`tel:${ad.userPhone}`, "_self");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-40">
        <Loader2 className="w-8 h-8 text-wdk-600 animate-spin" />
      </div>
    );
  }

  if (error || !ad) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <AlertCircle className="w-16 h-16 mx-auto text-red-400 mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {error || "الإعلان غير موجود"}
        </h1>
        <p className="text-gray-500 mb-6">
          ربما تم حذف الإعلان أو انتهت صلاحيته
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-wdk-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-wdk-700 transition"
        >
          <ArrowRight className="w-4 h-4" /> العودة للرئيسية
        </Link>
      </div>
    );
  }

  const images = ad.images && Array.isArray(ad.images) ? ad.images : [];
  const typeLabels: Record<string, string> = {
    sale: "بيع",
    rent: "كراء",
    service: "خدمة",
    job: "وظيفة",
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
        <Link href="/" className="hover:text-wdk-600">
          الرئيسية
        </Link>
        <span>/</span>
        {ad.categoryNameAr && (
          <>
            <span>{ad.categoryNameAr}</span>
            <span>/</span>
          </>
        )}
        <span className="text-gray-900 truncate">{ad.title}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Image Gallery */}
          <div className="bg-gray-100 rounded-2xl overflow-hidden">
            {images.length > 0 ? (
              <>
                <div className="aspect-[16/10]">
                  <img
                    src={images[selectedImage]}
                    alt={ad.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                {images.length > 1 && (
                  <div className="flex gap-2 p-3 bg-white overflow-x-auto">
                    {images.map((img, i) => (
                      <button
                        key={i}
                        onClick={() => setSelectedImage(i)}
                        className={`w-16 h-16 rounded-xl overflow-hidden border-2 shrink-0 transition ${
                          i === selectedImage
                            ? "border-wdk-600"
                            : "border-transparent opacity-60 hover:opacity-100"
                        }`}
                      >
                        <img
                          src={img}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="aspect-[16/10] flex items-center justify-center bg-gradient-to-br from-wdk-50 to-wdk-100">
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto bg-wdk-200 rounded-2xl flex items-center justify-center mb-3">
                    <Tag className="w-10 h-10 text-wdk-500" />
                  </div>
                  <p className="text-gray-400 font-medium">لا توجد صور</p>
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="bg-white rounded-2xl border p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-3">الوصف</h2>
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
              {ad.description}
            </p>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Price & Actions */}
          <div className="bg-white rounded-2xl border p-6 sticky top-20">
            {/* Price */}
            <div className="text-center mb-5">
              {ad.price ? (
                <div className="text-3xl font-bold text-wdk-700">
                  {formatPrice(ad.price, ad.currency)}
                </div>
              ) : (
                <div className="text-lg font-bold text-gray-500">السعر غير محدد</div>
              )}
              <div className="flex items-center justify-center gap-2 mt-1 text-sm text-gray-500">
                <span className="bg-wdk-100 text-wdk-700 px-2 py-0.5 rounded-full text-xs font-medium">
                  {typeLabels[ad.adType] || ad.adType}
                </span>
                {ad.categoryNameAr && (
                  <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full text-xs font-medium">
                    {ad.categoryNameAr}
                  </span>
                )}
              </div>
            </div>

            {/* Contact Button */}
            {ad.userPhone && (
              <button
                onClick={handleContact}
                className="w-full bg-wdk-600 text-white py-3 rounded-xl font-bold hover:bg-wdk-700 transition flex items-center justify-center gap-2 mb-3"
              >
                <Phone className="w-5 h-5" />
                <span>اتصل بالمعلن</span>
              </button>
            )}

            {/* Share & Save */}
            <div className="flex gap-2">
              <button
                onClick={handleShare}
                className="flex-1 border border-gray-200 py-2.5 rounded-xl text-sm hover:bg-gray-50 transition flex items-center justify-center gap-1.5"
              >
                <Share2 className="w-4 h-4" /> مشاركة
              </button>
              <button
                onClick={() => toast.success("تمت الإضافة للمفضلة!")}
                className="flex-1 border border-gray-200 py-2.5 rounded-xl text-sm hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition flex items-center justify-center gap-1.5"
              >
                <Heart className="w-4 h-4" /> حفظ
              </button>
            </div>

            {/* Meta info */}
            <div className="mt-5 pt-4 border-t space-y-2.5 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <MapPin className="w-4 h-4 text-gray-400" />
                <span>
                  {ad.commune && ad.wilaya
                    ? `${ad.commune}، ${ad.wilaya}`
                    : ad.wilaya || "الجزائر"}
                </span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span>نُشر {timeAgo(ad.createdAt)}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Eye className="w-4 h-4 text-gray-400" />
                <span>{ad.views || 0} مشاهدة</span>
              </div>
              {ad.userName && (
                <div className="flex items-center gap-2 text-gray-600">
                  <User className="w-4 h-4 text-gray-400" />
                  <span>{ad.userName}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

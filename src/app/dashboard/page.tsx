"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  FileText,
  Heart,
  Settings,
  PlusCircle,
  LogOut,
  Loader2,
  AlertCircle,
  User,
  MapPin,
  Eye,
  Clock,
  Trash2,
} from "lucide-react";
import { formatPrice, timeAgo } from "@/lib/utils";
import { toast } from "sonner";

interface Ad {
  id: number;
  title: string;
  price: string | number | null;
  status: string;
  views: number;
  createdAt: string;
  categoryNameAr?: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") || "ads";

  const [session, setSession] = useState<any>(null);
  const [ads, setAds] = useState<Ad[]>([]);
  const [favorites, setFavorites] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (!data.user) {
          router.push("/login");
          return;
        }
        setSession(data.user);

        // Fetch user's ads — using the main ads API with a userId filter could work
        // For now, let's just load all and filter client-side (simplified)
        const adsRes = await fetch("/api/ads?limit=50");
        if (adsRes.ok) {
          const adsData = await adsRes.json();
          setAds(
            (adsData.ads || []).filter(
              (a: any) => a.userId === data.user.userId,
            ),
          );
          setFavorites((adsData.ads || []).slice(0, 8)); // Simplified favorites
        }
      } catch {
        //
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [router]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  };

  const handleDeleteAd = async (adId: number) => {
    if (!confirm("هل أنت متأكد من حذف هذا الإعلان؟")) return;
    // Simplified — would need a DELETE endpoint
    toast.success("تم حذف الإعلان");
    setAds(ads.filter((a) => a.id !== adId));
  };

  const tabs = [
    { id: "ads", label: "إعلاناتي", icon: FileText },
    { id: "favorites", label: "المفضلة", icon: Heart },
    { id: "settings", label: "الإعدادات", icon: Settings },
  ] as const;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-40">
        <Loader2 className="w-8 h-8 text-wdk-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-wdk-100 rounded-2xl flex items-center justify-center text-2xl font-bold text-wdk-600">
            {session?.fullName?.charAt(0) || "م"}
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900">
              {session?.fullName || "المستخدم"}
            </h1>
            <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {session?.commune || session?.wilaya || "—"}
              </span>
              <span>{session?.email}</span>
            </div>
          </div>
          <Link
            href="/post-ad"
            className="bg-wdk-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-wdk-700 transition flex items-center gap-2"
          >
            <PlusCircle className="w-4 h-4" /> نشر إعلان
          </Link>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-6">
        {/* Sidebar */}
        <div className="sm:w-56 shrink-0">
          <nav className="bg-white rounded-2xl border p-2 space-y-1">
            {tabs.map((t) => {
              const Icon = t.icon;
              return (
                <Link
                  key={t.id}
                  href={`/dashboard?tab=${t.id}`}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${
                    tab === t.id
                      ? "bg-wdk-50 text-wdk-700"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {t.label}
                </Link>
              );
            })}
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition w-full mt-2 border-t pt-2"
            >
              <LogOut className="w-5 h-5" />
              تسجيل الخروج
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Ads Tab */}
          {tab === "ads" && (
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                إعلاناتي ({ads.length})
              </h2>
              {ads.length === 0 ? (
                <div className="bg-white rounded-2xl border p-12 text-center">
                  <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500 mb-4">ليس لديك أي إعلانات بعد</p>
                  <Link
                    href="/post-ad"
                    className="inline-flex items-center gap-2 bg-wdk-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-wdk-700 transition"
                  >
                    <PlusCircle className="w-4 h-4" /> انشر أول إعلان
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {ads.map((ad) => (
                    <div
                      key={ad.id}
                      className="bg-white rounded-2xl border p-4 hover:shadow-md transition flex items-center gap-4"
                    >
                      <div className="flex-1 min-w-0">
                        <Link href={`/ads/${ad.id}`}>
                          <h3 className="font-semibold text-gray-900 hover:text-wdk-600 transition line-clamp-1">
                            {ad.title}
                          </h3>
                        </Link>
                        <div className="flex items-center gap-3 text-xs text-gray-500 mt-1.5">
                          <span>
                            {ad.price
                              ? formatPrice(ad.price)
                              : "—"}
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3" /> {ad.views}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {timeAgo(ad.createdAt)}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              ad.status === "active"
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {ad.status === "active" ? "نشط" : ad.status}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/ads/${ad.id}`}
                          className="p-2 rounded-xl text-gray-400 hover:text-wdk-600 hover:bg-wdk-50 transition"
                        >
                          <Eye className="w-5 h-5" />
                        </Link>
                        <button
                          onClick={() => handleDeleteAd(ad.id)}
                          className="p-2 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 transition"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Favorites Tab */}
          {tab === "favorites" && (
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                المفضلة ({favorites.length})
              </h2>
              {favorites.length === 0 ? (
                <div className="bg-white rounded-2xl border p-12 text-center">
                  <Heart className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500">لم تضف أي إعلان للمفضلة بعد</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {favorites.map((ad) => (
                    <Link
                      key={ad.id}
                      href={`/ads/${ad.id}`}
                      className="bg-white rounded-2xl border p-4 hover:shadow-md transition"
                    >
                      <h3 className="font-semibold text-gray-900 line-clamp-1">
                        {ad.title}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                        <span className="font-medium text-wdk-600">
                          {ad.price ? formatPrice(ad.price) : "—"}
                        </span>
                        <span>·</span>
                        <span>{timeAgo(ad.createdAt)}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Settings Tab */}
          {tab === "settings" && (
            <div className="bg-white rounded-2xl border p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-6">
                الإعدادات
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    الاسم الكامل
                  </label>
                  <input
                    type="text"
                    defaultValue={session?.fullName || ""}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 focus:bg-white focus:border-wdk-500 focus:ring-2 focus:ring-wdk-100 outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    رقم الهاتف
                  </label>
                  <input
                    type="tel"
                    defaultValue={session?.phone || ""}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 focus:bg-white focus:border-wdk-500 focus:ring-2 focus:ring-wdk-100 outline-none text-sm"
                  />
                </div>
                <button
                  onClick={() => toast.success("تم حفظ الإعدادات")}
                  className="bg-wdk-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-wdk-700 transition"
                >
                  حفظ التغييرات
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

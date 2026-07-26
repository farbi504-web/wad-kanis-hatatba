"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import AdCard from "@/components/ads/AdCard";
import FilterBar from "@/components/ads/FilterBar";
import CategoryGrid from "@/components/ads/CategoryGrid";
import Pagination from "@/components/ads/Pagination";
import { Search, Loader2, AlertCircle } from "lucide-react";

interface Ad {
  id: number;
  title: string;
  price: string | number | null;
  currency: string;
  images: string[] | null;
  wilaya: string | null;
  commune: string | null;
  views: number;
  isFeatured: boolean;
  isPremium: boolean;
  createdAt: string;
  categoryNameAr?: string | null;
  categoryName?: string | null;
}

interface Category {
  id: number;
  name: string;
  nameAr: string;
  slug: string;
  icon: string;
  children?: Category[];
}

export default function HomeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [ads, setAds] = useState<Ad[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchAds = useCallback(
    async (filters?: Record<string, string>) => {
      setLoading(true);
      setError("");
      try {
        const params = new URLSearchParams();
        params.set("page", String(page));
        params.set("limit", "20");
        if (searchParams.get("q")) params.set("q", searchParams.get("q")!);
        if (filters?.wilaya) params.set("wilaya", filters.wilaya);
        if (filters?.category) params.set("category", filters.category);
        if (filters?.type) params.set("type", filters.type);
        if (filters?.minPrice) params.set("minPrice", filters.minPrice);
        if (filters?.maxPrice) params.set("maxPrice", filters.maxPrice);
        if (filters?.sort) params.set("sort", filters.sort);

        const res = await fetch(`/api/ads?${params.toString()}`);
        if (!res.ok) throw new Error("فشل في جلب الإعلانات");
        const data = await res.json();
        setAds(data.ads || []);
        setTotalPages(data.pagination?.totalPages || 1);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "حدث خطأ");
      } finally {
        setLoading(false);
      }
    },
    [page, searchParams],
  );

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch("/api/categories");
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories || []);
      }
    } catch {
      // silently fail
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchAds();
  }, [fetchAds]);

  const handleFilter = (filters: Record<string, string>) => {
    setPage(1);
    fetchAds(filters);
  };

  const searchQuery = searchParams.get("q");

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Hero */}
      {!searchQuery && (
        <div className="bg-gradient-to-l from-wdk-700 to-wdk-900 rounded-3xl p-6 sm:p-10 mb-8 text-white text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full translate-y-1/2 -translate-x-1/2" />
          </div>
          <div className="relative">
            <h1 className="text-3xl sm:text-4xl font-bold mb-3">
              واد كنيس حطاطبة 🏘️
            </h1>
            <p className="text-white/80 text-lg max-w-2xl mx-auto">
              أول وأكبر منصة إعلانات مبوبة في حطاطبة، تيبازة والمناطق المجاورة.
              بيع واشتري، اجر واكتري، لقى خدمات ووظائف — كل شيء في مكان واحد.
            </p>

            {/* Quick search in hero */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const q = formData.get("search") as string;
                if (q.trim())
                  router.push(`/?q=${encodeURIComponent(q.trim())}`);
              }}
              className="mt-6 max-w-lg mx-auto flex gap-2"
            >
              <input
                name="search"
                type="text"
                placeholder="شنو تحب تلقى اليوم؟"
                className="flex-1 px-4 py-3 rounded-xl text-gray-900 bg-white border-0 outline-none focus:ring-4 focus:ring-white/30 text-sm"
              />
              <button
                type="submit"
                className="bg-white text-wdk-700 px-6 py-3 rounded-xl font-bold hover:bg-gray-100 transition flex items-center gap-2"
              >
                <Search className="w-4 h-4" />
                <span className="hidden sm:inline">بحث</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Search results header */}
      {searchQuery && (
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            نتائج البحث عن: <span className="text-wdk-600">{searchQuery}</span>
          </h2>
        </div>
      )}

      {/* Categories */}
      {!searchQuery && categories.length > 0 && (
        <CategoryGrid categories={categories} />
      )}

      {/* Filters & Ads */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">
            {searchQuery ? "نتائج البحث" : "آخر الإعلانات"}
          </h2>
        </div>

        <FilterBar
          onFilter={handleFilter}
          categories={categories}
          initial={Object.fromEntries(searchParams.entries())}
        />

        {/* Loading state */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-wdk-600 animate-spin" />
          </div>
        )}

        {/* Error state */}
        {error && !loading && (
          <div className="flex items-center justify-center py-20 text-red-500 gap-2">
            <AlertCircle className="w-6 h-6" />
            <span>{error}</span>
          </div>
        )}

        {/* Ads Grid */}
        {!loading && !error && (
          <>
            {ads.length === 0 ? (
              <div className="text-center py-20 text-gray-500">
                <Search className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <p className="text-lg">لا توجد إعلانات حالياً</p>
                <p className="text-sm mt-1">كن أول من ينشر إعلاناً!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {ads.map((ad) => (
                  <AdCard key={ad.id} {...ad} />
                ))}
              </div>
            )}
          </>
        )}

        {!loading && !error && ads.length > 0 && (
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        )}
      </div>
    </div>
  );
}

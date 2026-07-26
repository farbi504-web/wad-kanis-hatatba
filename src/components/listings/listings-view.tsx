"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { Filter, X, SlidersHorizontal, Grid3x3, List } from "lucide-react";
import { ListingCard, type ListingCardData } from "@/components/listings/listing-card";
import { Button } from "@/components/ui/button";
import { ListingCardSkeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface Props {
  data: { items: ListingCardData[]; total: number; page: number; limit: number };
  categories: { id: string; name: string; slug: string }[];
  cities: { id: string; name: string; slug: string }[];
  initialParams: Record<string, string>;
}

const CONDITIONS = [
  { value: "new", label: "جديد" },
  { value: "like_new", label: "شبه جديد" },
  { value: "good", label: "حالة جيدة" },
  { value: "fair", label: "مقبول" },
  { value: "used", label: "مستعمل" },
];

const SORTS = [
  { value: "newest", label: "الأحدث" },
  { value: "oldest", label: "الأقدم" },
  { value: "price_asc", label: "السعر: الأقل" },
  { value: "price_desc", label: "السعر: الأعلى" },
  { value: "popular", label: "الأكثر مشاهدة" },
];

export function ListingsView({
  data,
  categories,
  cities,
  initialParams,
}: Props) {
  const router = useRouter();
  const sp = useSearchParams();
  const [filterOpen, setFilterOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [localQ, setLocalQ] = useState(initialParams.q || "");

  const update = (key: string, value?: string) => {
    const params = new URLSearchParams(sp?.toString() || "");
    if (!value) params.delete(key);
    else params.set(key, value);
    params.delete("page");
    startTransition(() => {
      router.push(`/listings?${params.toString()}`);
    });
  };

  const clearAll = () => {
    startTransition(() => {
      router.push("/listings");
    });
  };

  const activeChips = useMemo(() => {
    const chips: { key: string; label: string; value: string }[] = [];
    if (initialParams.q)
      chips.push({ key: "q", label: `بحث: ${initialParams.q}`, value: initialParams.q });
    if (initialParams.category) {
      const c = categories.find((x) => x.id === initialParams.category);
      if (c) chips.push({ key: "category", label: c.name, value: c.id });
    }
    if (initialParams.city) {
      const c = cities.find((x) => x.id === initialParams.city);
      if (c) chips.push({ key: "city", label: c.name, value: c.id });
    }
    if (initialParams.condition) {
      const c = CONDITIONS.find((x) => x.value === initialParams.condition);
      if (c) chips.push({ key: "condition", label: c.label, value: c.value });
    }
    if (initialParams.featured === "true")
      chips.push({ key: "featured", label: "مميز", value: "true" });
    if (initialParams.minPrice)
      chips.push({
        key: "minPrice",
        label: `من ${initialParams.minPrice}`,
        value: initialParams.minPrice,
      });
    if (initialParams.maxPrice)
      chips.push({
        key: "maxPrice",
        label: `إلى ${initialParams.maxPrice}`,
        value: initialParams.maxPrice,
      });
    return chips;
  }, [initialParams, categories, cities]);

  const totalPages = Math.max(1, Math.ceil(data.total / data.limit));

  return (
    <div className="container-app py-6 md:py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-app">
            {initialParams.q
              ? `نتائج البحث: ${initialParams.q}`
              : "جميع الإعلانات"}
          </h1>
          <p className="text-sm text-soft mt-1">
            {pending
              ? "جاري التحميل..."
              : `${data.total} إعلان${data.total === 1 ? "" : ""}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterOpen(true)}
            className="md:hidden btn btn-outline !py-2 !px-3 !text-sm"
          >
            <SlidersHorizontal className="size-4" /> فلاتر
          </button>
          <select
            value={initialParams.sort || "newest"}
            onChange={(e) => update("sort", e.target.value)}
            className="select !w-auto !py-2 !text-sm"
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-6">
        {/* Sidebar filters (desktop) */}
        <aside className="hidden md:block">
          <FiltersPanel
            initial={initialParams}
            categories={categories}
            cities={cities}
            onChange={update}
            onClear={clearAll}
            activeChips={activeChips}
          />
        </aside>

        <div>
          {/* Active chips */}
          {activeChips.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {activeChips.map((c) => (
                <button
                  key={c.key}
                  onClick={() => update(c.key, undefined)}
                  className="badge badge-primary !gap-1.5 !py-1 !px-2.5"
                >
                  {c.label}
                  <X className="size-3" />
                </button>
              ))}
              <button
                onClick={clearAll}
                className="text-xs text-soft hover:text-app"
              >
                مسح الكل
              </button>
            </div>
          )}

          {/* Grid */}
          {pending ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">
              {Array.from({ length: 8 }).map((_, i) => (
                <ListingCardSkeleton key={i} />
              ))}
            </div>
          ) : data.items.length === 0 ? (
            <div className="card p-10 text-center">
              <div className="size-16 mx-auto rounded-2xl bg-soft flex items-center justify-center mb-3">
                <Filter className="size-7 text-soft" />
              </div>
              <h3 className="text-lg font-bold mb-1">لا توجد نتائج</h3>
              <p className="text-sm text-soft mb-4">
                جرّب تعديل الفلاتر أو ابحث بكلمات أخرى
              </p>
              <Button variant="outline" onClick={clearAll}>
                مسح الفلاتر
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">
              {data.items.map((l) => (
                <ListingCard key={l.id} listing={l} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-1 mt-8">
              {Array.from({ length: totalPages }).map((_, i) => {
                const p = i + 1;
                const active = p === data.page;
                const params = new URLSearchParams(sp?.toString() || "");
                params.set("page", String(p));
                return (
                  <button
                    key={p}
                    onClick={() =>
                      startTransition(() => {
                        router.push(`/listings?${params.toString()}`);
                      })
                    }
                    className={cn(
                      "size-10 rounded-lg text-sm font-bold transition-colors",
                      active
                        ? "bg-[#00A86B] text-white"
                        : "bg-soft text-soft hover:bg-card border border-app",
                    )}
                  >
                    {p}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Mobile filter drawer */}
      {filterOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm animate-fade-in"
          onClick={() => setFilterOpen(false)}
        >
          <div
            className="absolute bottom-0 inset-x-0 bg-card rounded-t-3xl p-5 max-h-[85vh] overflow-y-auto animate-slide-in"
            onClick={(e) => e.stopPropagation()}
            style={{ animationName: "fade-in" }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">الفلاتر</h3>
              <button
                onClick={() => setFilterOpen(false)}
                className="size-9 rounded-lg bg-soft flex items-center justify-center"
              >
                <X className="size-4" />
              </button>
            </div>
            <FiltersPanel
              initial={initialParams}
              categories={categories}
              cities={cities}
              onChange={(k, v) => {
                update(k, v);
              }}
              onClear={() => {
                clearAll();
                setFilterOpen(false);
              }}
              activeChips={activeChips}
            />
            <Button
              className="w-full mt-4"
              onClick={() => setFilterOpen(false)}
            >
              عرض النتائج
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function FiltersPanel({
  initial,
  categories,
  cities,
  onChange,
  onClear,
  activeChips,
}: {
  initial: Record<string, string>;
  categories: { id: string; name: string; slug: string }[];
  cities: { id: string; name: string; slug: string }[];
  onChange: (key: string, value?: string) => void;
  onClear: () => void;
  activeChips: { key: string; label: string; value: string }[];
}) {
  return (
    <div className="space-y-4 sticky top-20">
      <div className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-app flex items-center gap-2">
            <Filter className="size-4 text-[#00A86B]" />
            فلاتر البحث
          </h3>
          {activeChips.length > 0 && (
            <button
              onClick={onClear}
              className="text-xs text-[#00A86B] hover:underline"
            >
              مسح
            </button>
          )}
        </div>
        <div className="space-y-4">
          <div>
            <label className="label">الفئة</label>
            <select
              className="select"
              value={initial.category || ""}
              onChange={(e) => onChange("category", e.target.value || undefined)}
            >
              <option value="">جميع الفئات</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">المدينة</label>
            <select
              className="select"
              value={initial.city || ""}
              onChange={(e) => onChange("city", e.target.value || undefined)}
            >
              <option value="">جميع المدن</option>
              {cities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">الحالة</label>
            <select
              className="select"
              value={initial.condition || ""}
              onChange={(e) =>
                onChange("condition", e.target.value || undefined)
              }
            >
              <option value="">الكل</option>
              {CONDITIONS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">السعر (دج)</label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                placeholder="من"
                className="input"
                defaultValue={initial.minPrice || ""}
                onBlur={(e) =>
                  onChange("minPrice", e.target.value || undefined)
                }
              />
              <input
                type="number"
                placeholder="إلى"
                className="input"
                defaultValue={initial.maxPrice || ""}
                onBlur={(e) =>
                  onChange("maxPrice", e.target.value || undefined)
                }
              />
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={initial.featured === "true"}
              onChange={(e) =>
                onChange("featured", e.target.checked ? "true" : undefined)
              }
              className="size-4 accent-[#00A86B]"
            />
            <span className="text-sm font-semibold">إعلانات مميزة فقط</span>
          </label>
        </div>
      </div>
    </div>
  );
}

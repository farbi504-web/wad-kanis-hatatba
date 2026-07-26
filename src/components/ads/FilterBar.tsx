"use client";

import { useState } from "react";
import { Search, SlidersHorizontal, MapPin, X } from "lucide-react";
import { ALGERIA_WILAYAS } from "@/lib/utils";

interface FiltersProps {
  onFilter: (filters: {
    wilaya?: string;
    category?: string;
    type?: string;
    minPrice?: string;
    maxPrice?: string;
    sort?: string;
  }) => void;
  categories: { id: number; nameAr: string; name: string }[];
  initial?: Record<string, string>;
}

export default function FilterBar({ onFilter, categories, initial }: FiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [wilaya, setWilaya] = useState(initial?.wilaya || "");
  const [category, setCategory] = useState(initial?.category || "");
  const [type, setType] = useState(initial?.type || "");
  const [minPrice, setMinPrice] = useState(initial?.minPrice || "");
  const [maxPrice, setMaxPrice] = useState(initial?.maxPrice || "");
  const [sort, setSort] = useState(initial?.sort || "latest");

  const handleApply = () => {
    onFilter({
      wilaya: wilaya || undefined,
      category: category || undefined,
      type: type || undefined,
      minPrice: minPrice || undefined,
      maxPrice: maxPrice || undefined,
      sort,
    });
    setIsOpen(false);
  };

  const handleReset = () => {
    setWilaya("");
    setCategory("");
    setType("");
    setMinPrice("");
    setMaxPrice("");
    setSort("latest");
    onFilter({ sort: "latest" });
    setIsOpen(false);
  };

  const hasFilters = wilaya || category || type || minPrice || maxPrice;

  return (
    <div className="mb-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-sm text-gray-600 hover:text-wdk-600 bg-white border rounded-xl px-4 py-2.5 transition"
      >
        <SlidersHorizontal className="w-4 h-4" />
        <span>تصفية</span>
        {hasFilters && (
          <span className="bg-wdk-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            !
          </span>
        )}
      </button>

      {isOpen && (
        <div className="bg-white border rounded-2xl p-4 mt-2 shadow-lg animate-[slideDown_0.2s_ease-out]">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Wilaya */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الولاية</label>
              <select
                value={wilaya}
                onChange={(e) => setWilaya(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm bg-white focus:border-wdk-500 focus:ring-2 focus:ring-wdk-100 outline-none"
              >
                <option value="">كل الولايات</option>
                {ALGERIA_WILAYAS.map((w) => (
                  <option key={w.code} value={w.nameFr}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الفئة</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm bg-white focus:border-wdk-500 focus:ring-2 focus:ring-wdk-100 outline-none"
              >
                <option value="">كل الفئات</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nameAr}
                  </option>
                ))}
              </select>
            </div>

            {/* Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">نوع الإعلان</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm bg-white focus:border-wdk-500 focus:ring-2 focus:ring-wdk-100 outline-none"
              >
                <option value="">الكل</option>
                <option value="sale">بيع</option>
                <option value="rent">كراء</option>
                <option value="service">خدمة</option>
                <option value="job">وظيفة</option>
              </select>
            </div>

            {/* Price range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">السعر الأدنى (دج)</label>
              <input
                type="number"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                placeholder="0"
                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm bg-white focus:border-wdk-500 focus:ring-2 focus:ring-wdk-100 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">السعر الأقصى (دج)</label>
              <input
                type="number"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                placeholder="غير محدد"
                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm bg-white focus:border-wdk-500 focus:ring-2 focus:ring-wdk-100 outline-none"
              />
            </div>

            {/* Sort */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الترتيب</label>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm bg-white focus:border-wdk-500 focus:ring-2 focus:ring-wdk-100 outline-none"
              >
                <option value="latest">الأحدث</option>
                <option value="price_asc">السعر: من الأقل إلى الأعلى</option>
                <option value="price_desc">السعر: من الأعلى إلى الأقل</option>
                <option value="views">الأكثر مشاهدة</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3 mt-4 pt-3 border-t">
            <button
              onClick={handleApply}
              className="bg-wdk-600 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-wdk-700 transition"
            >
              تطبيق
            </button>
            <button
              onClick={handleReset}
              className="text-gray-500 px-4 py-2.5 rounded-xl text-sm hover:bg-gray-100 transition"
            >
              إعادة تعيين
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 mr-auto hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

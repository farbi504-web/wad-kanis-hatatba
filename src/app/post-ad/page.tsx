"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  PlusCircle,
  Loader2,
  AlertCircle,
  Image as ImageIcon,
  X,
  Upload,
  Tag,
  MapPin,
  FileText,
} from "lucide-react";
import { toast } from "sonner";

interface Category {
  id: number;
  nameAr: string;
  name: string;
  children?: Category[];
}

export default function PostAdPage() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    adType: "sale",
    categoryId: "",
    wilaya: "Tipaza",
    commune: "Hatatba",
  });
  const [images, setImages] = useState<string[]>([]);
  const [imageUrl, setImageUrl] = useState("");

  useEffect(() => {
    async function init() {
      try {
        const [sessionRes, catRes] = await Promise.all([
          fetch("/api/auth/me"),
          fetch("/api/categories"),
        ]);

        const sessionData = await sessionRes.json();
        if (!sessionData.user) {
          router.push("/login");
          return;
        }
        setSession(sessionData.user);

        const catData = await catRes.json();
        const allCats = (catData.categories || []).flatMap(
          (c: Category) => c.children || [c],
        );
        setCategories(allCats);
      } catch {
        setError("فشل تحميل البيانات");
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [router]);

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const addImage = () => {
    const url = imageUrl.trim();
    if (!url) return;
    if (images.length >= 8) {
      toast.error("الحد الأقصى 8 صور");
      return;
    }
    setImages([...images, url]);
    setImageUrl("");
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    if (!form.title || !form.description || !form.categoryId) {
      setError("العنوان والوصف والفئة مطلوبة");
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch("/api/ads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          price: form.price || null,
          categoryId: parseInt(form.categoryId),
          images,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "فشل نشر الإعلان");
      }

      toast.success("تم نشر الإعلان بنجاح!");
      router.push(`/ads/${data.ad.id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-40">
        <Loader2 className="w-8 h-8 text-wdk-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="bg-white rounded-3xl border shadow-xl p-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-wdk-100 rounded-2xl flex items-center justify-center">
            <PlusCircle className="w-6 h-6 text-wdk-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">نشر إعلان جديد</h1>
            <p className="text-sm text-gray-500">املأ التفاصيل أدناه لنشر إعلانك</p>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 mb-5 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              عنوان الإعلان <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => handleChange("title", e.target.value)}
              required
              placeholder="مثلاً: شقة للبيع في حطاطبة"
              maxLength={255}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 focus:bg-white focus:border-wdk-500 focus:ring-2 focus:ring-wdk-100 outline-none transition text-sm"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              الفئة <span className="text-red-500">*</span>
            </label>
            <select
              value={form.categoryId}
              onChange={(e) => handleChange("categoryId", e.target.value)}
              required
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm bg-white focus:border-wdk-500 focus:ring-2 focus:ring-wdk-100 outline-none"
            >
              <option value="">اختر الفئة...</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nameAr}
                </option>
              ))}
            </select>
          </div>

          {/* Ad Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              نوع الإعلان
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { value: "sale", label: "بيع" },
                { value: "rent", label: "كراء" },
                { value: "service", label: "خدمة" },
                { value: "job", label: "وظيفة" },
              ].map((t) => (
                <label
                  key={t.value}
                  className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border text-sm cursor-pointer transition ${
                    form.adType === t.value
                      ? "bg-wdk-50 border-wdk-300 text-wdk-700 font-medium"
                      : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <input
                    type="radio"
                    name="adType"
                    value={t.value}
                    checked={form.adType === t.value}
                    onChange={(e) => handleChange("adType", e.target.value)}
                    className="sr-only"
                  />
                  {t.label}
                </label>
              ))}
            </div>
          </div>

          {/* Price */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              السعر (دج)
            </label>
            <input
              type="number"
              value={form.price}
              onChange={(e) => handleChange("price", e.target.value)}
              placeholder="مثلاً: 5000000"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 focus:bg-white focus:border-wdk-500 focus:ring-2 focus:ring-wdk-100 outline-none transition text-sm"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              الوصف <span className="text-red-500">*</span>
            </label>
            <textarea
              value={form.description}
              onChange={(e) => handleChange("description", e.target.value)}
              required
              rows={5}
              placeholder="اكتب وصفاً مفصلاً للإعلان..."
              className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 focus:bg-white focus:border-wdk-500 focus:ring-2 focus:ring-wdk-100 outline-none transition text-sm resize-y"
            />
          </div>

          {/* Images */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              الصور (رابط الصورة)
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 focus:bg-white focus:border-wdk-500 focus:ring-2 focus:ring-wdk-100 outline-none transition text-sm"
              />
              <button
                type="button"
                onClick={addImage}
                className="bg-gray-100 text-gray-700 px-4 rounded-xl hover:bg-gray-200 transition flex items-center gap-1.5"
              >
                <Upload className="w-4 h-4" /> إضافة
              </button>
            </div>

            {/* Image Preview */}
            {images.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {images.map((url, i) => (
                  <div
                    key={i}
                    className="relative w-20 h-20 rounded-xl overflow-hidden bg-gray-100 border"
                  >
                    <img
                      src={url}
                      alt=""
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100'><rect fill='%23f1f5f9' width='100' height='100'/><text x='50' y='55' text-anchor='middle' fill='%2394a3b8' font-size='12'>!</text></svg>";
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="absolute top-0.5 right-0.5 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center hover:bg-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <p className="text-xs text-gray-400 mt-1.5">
              يمكنك إضافة روابط صور مباشرة (الحد الأقصى 8 صور)
            </p>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-wdk-600 text-white py-3.5 rounded-xl font-bold hover:bg-wdk-700 transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg"
          >
            {submitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <PlusCircle className="w-5 h-5" />
            )}
            <span>{submitting ? "جاري النشر..." : "نشر الإعلان"}</span>
          </button>
        </form>
      </div>
    </div>
  );
}

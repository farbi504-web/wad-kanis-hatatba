"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Save,
  ArrowRight,
  Upload,
  X,
  Image as ImageIcon,
  Star,
  CheckCircle2,
} from "lucide-react";
import { PageShell } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea, Select, FieldError } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast-helper";

const CONDITIONS = [
  { value: "new", label: "جديد" },
  { value: "like_new", label: "شبه جديد" },
  { value: "good", label: "حالة جيدة" },
  { value: "fair", label: "مقبول" },
  { value: "used", label: "مستعمل" },
];

export default function NewListingPage() {
  const router = useRouter();
  const toast = useToast();
  const [cats, setCats] = useState<{ id: string; name: string }[]>([]);
  const [cities, setCities] = useState<{ id: string; name: string }[]>([]);
  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    currency: "DZD",
    condition: "used",
    categoryId: "",
    cityId: "",
    contactPhone: "",
    location: "",
  });
  const [images, setImages] = useState<{ id?: string; url: string; isPrimary?: boolean; file?: File }[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const [, startTransition] = useTransition();

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (!j?.data) {
          router.push("/auth/login?next=/listings/new");
        }
      });
    Promise.all([
      fetch("/api/categories").then((r) => r.json()),
      fetch("/api/cities").then((r) => r.json()),
    ]).then(([c, ci]) => {
      setCats(c.data || []);
      setCities(ci.data || []);
    });
  }, [router]);

  const onFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    setUploading(true);
    try {
      for (const f of Array.from(files)) {
        if (!["image/jpeg", "image/png", "image/webp"].includes(f.type)) continue;
        if (f.size > 5 * 1024 * 1024) {
          toast.error(`${f.name} يتجاوز 5 ميغابايت`);
          continue;
        }
        const fd = new FormData();
        fd.append("file", f);
        fd.append("bucket", "listing-images");
        const r = await fetch("/api/upload", { method: "POST", body: fd });
        const j = await r.json();
        if (r.ok) {
          setImages((arr) => [
            ...arr,
            { url: j.data.url, isPrimary: arr.length === 0 },
          ]);
        }
      }
    } catch {
      toast.error("فشل رفع بعض الصور");
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (idx: number) => {
    setImages((arr) => arr.filter((_, i) => i !== idx));
  };

  const setPrimary = (idx: number) => {
    setImages((arr) =>
      arr.map((img, i) => ({ ...img, isPrimary: i === idx })),
    );
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (images.length === 0) {
      setError("الرجاء إضافة صورة واحدة على الأقل");
      setStep(2);
      return;
    }
    setLoading(true);
    try {
      const r = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          price: Number(form.price) || 0,
        }),
      });
      const j = await r.json();
      if (!r.ok) {
        setError(j.error?.message || "فشل إنشاء الإعلان");
        return;
      }
      const listingId = j.data.id;
      // attach images
      for (const img of images) {
        // we already uploaded files to storage; here we re-link them via image POST
        const fd = new FormData();
        const blob = await fetch(img.url).then((r) => r.blob());
        fd.append(
          "files",
          new File([blob], img.url.split("/").pop() || "img.jpg", {
            type: "image/jpeg",
          }),
        );
        await fetch(`/api/listings/${listingId}/images`, {
          method: "POST",
          body: fd,
        });
      }
      // reorder
      if (images[0]?.isPrimary) {
        const ids = (
          await (await fetch(`/api/listings/${listingId}/images`)).json()
        ).data as { id: string; isPrimary: boolean }[];
        if (ids?.length) {
          const primary = ids.find((i) => i.isPrimary)?.id ?? ids[0].id;
          await fetch(`/api/listings/${listingId}/images`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              imageIds: ids.map((i) => i.id),
              primaryId: primary,
            }),
          });
        }
      }
      toast.success("تم نشر إعلانك، سيتم مراجعته قريباً");
      startTransition(() => router.push(`/listings/${listingId}`));
    } catch {
      setError("فشل إنشاء الإعلان");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageShell>
      <div className="container-app py-6 md:py-8 max-w-3xl">
        <h1 className="text-2xl md:text-3xl font-black mb-1">إضافة إعلان جديد</h1>
        <p className="text-sm text-soft mb-6">
          املأ التفاصيل وأضف الصور لنشر إعلانك
        </p>

        {/* Stepper */}
        <div className="flex items-center gap-2 mb-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="flex items-center gap-2 flex-1">
              <div
                className={`size-9 rounded-full flex items-center justify-center font-bold text-sm ${
                  step >= n
                    ? "bg-[#00A86B] text-white"
                    : "bg-soft text-soft"
                }`}
              >
                {step > n ? <CheckCircle2 className="size-5" /> : n}
              </div>
              <div className="text-xs font-semibold text-app">
                {n === 1 ? "التفاصيل" : n === 2 ? "الصور" : "المراجعة"}
              </div>
              {n < 3 && <div className="flex-1 h-px bg-app" />}
            </div>
          ))}
        </div>

        <form onSubmit={submit} className="card p-6 space-y-4">
          <FieldError>{error}</FieldError>

          {step === 1 && (
            <>
              <div>
                <Label>عنوان الإعلان *</Label>
                <Input
                  required
                  value={form.title}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, title: e.target.value }))
                  }
                  placeholder="مثلاً: آيفون 14 برو ماكس 256 جيجا"
                />
              </div>
              <div>
                <Label>الوصف *</Label>
                <Textarea
                  required
                  rows={5}
                  value={form.description}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, description: e.target.value }))
                  }
                  placeholder="اشرح تفاصيل المنتج، حالته، مميزاته..."
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <Label>السعر (دج) *</Label>
                  <Input
                    type="number"
                    min="0"
                    required
                    value={form.price}
                    onChange={(e) =>
                      setForm((s) => ({ ...s, price: e.target.value }))
                    }
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label>الحالة *</Label>
                  <Select
                    value={form.condition}
                    onChange={(e) =>
                      setForm((s) => ({ ...s, condition: e.target.value }))
                    }
                  >
                    {CONDITIONS.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </Select>
                </div>
                <div>
                  <Label>العملة</Label>
                  <Select
                    value={form.currency}
                    onChange={(e) =>
                      setForm((s) => ({ ...s, currency: e.target.value }))
                    }
                  >
                    <option value="DZD">دج</option>
                    <option value="EUR">€</option>
                    <option value="USD">$</option>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label>الفئة *</Label>
                  <Select
                    required
                    value={form.categoryId}
                    onChange={(e) =>
                      setForm((s) => ({ ...s, categoryId: e.target.value }))
                    }
                  >
                    <option value="">اختر فئة</option>
                    {cats.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </Select>
                </div>
                <div>
                  <Label>المدينة *</Label>
                  <Select
                    required
                    value={form.cityId}
                    onChange={(e) =>
                      setForm((s) => ({ ...s, cityId: e.target.value }))
                    }
                  >
                    <option value="">اختر مدينة</option>
                    {cities.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label>رقم التواصل</Label>
                  <Input
                    value={form.contactPhone}
                    onChange={(e) =>
                      setForm((s) => ({ ...s, contactPhone: e.target.value }))
                    }
                    placeholder="0555 000 000"
                  />
                </div>
                <div>
                  <Label>الموقع (حي، شارع)</Label>
                  <Input
                    value={form.location}
                    onChange={(e) =>
                      setForm((s) => ({ ...s, location: e.target.value }))
                    }
                    placeholder="حي 1000 مسكن"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button type="button" onClick={() => setStep(2)}>
                  التالي: الصور <ArrowRight className="size-4 flip-x" />
                </Button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div>
                <Label>صور الإعلان (حتى 5 ميغابايت لكل صورة)</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-2">
                  {images.map((img, i) => (
                    <div
                      key={i}
                      className="relative aspect-square rounded-xl overflow-hidden border-2 border-app group"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img.url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100">
                        <button
                          type="button"
                          onClick={() => setPrimary(i)}
                          className="size-8 rounded-full bg-white text-app flex items-center justify-center"
                          title="تعيين كصورة رئيسية"
                        >
                          <Star
                            className={`size-4 ${
                              img.isPrimary
                                ? "fill-[#F4B400] text-[#F4B400]"
                                : ""
                            }`}
                          />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeImage(i)}
                          className="size-8 rounded-full bg-red-500 text-white flex items-center justify-center"
                          title="حذف"
                        >
                          <X className="size-4" />
                        </button>
                      </div>
                      {img.isPrimary && (
                        <div className="absolute top-1 right-1 badge badge-accent !text-[10px]">
                          رئيسية
                        </div>
                      )}
                    </div>
                  ))}
                  <label
                    htmlFor="img"
                    className="aspect-square rounded-xl border-2 border-dashed border-app flex flex-col items-center justify-center text-soft hover:border-[#00A86B] hover:text-[#00A86B] cursor-pointer transition-colors"
                  >
                    {uploading ? (
                      <span className="size-8 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Upload className="size-7 mb-1" />
                        <span className="text-xs font-semibold">رفع صور</span>
                      </>
                    )}
                    <input
                      id="img"
                      type="file"
                      multiple
                      accept="image/jpeg,image/png,image/webp"
                      onChange={onFiles}
                      className="hidden"
                      disabled={uploading}
                    />
                  </label>
                </div>
                <p className="help">
                  أضف من 3 إلى 8 صور. الصورة الأولى هي الرئيسية. JPG/PNG/WEBP حتى 5MB.
                </p>
              </div>
              <div className="flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                >
                  السابق
                </Button>
                <Button type="button" onClick={() => setStep(3)}>
                  التالي: المراجعة{" "}
                  <ArrowRight className="size-4 flip-x" />
                </Button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div className="rounded-xl bg-soft p-4 space-y-2 text-sm">
                <div className="font-bold text-app">{form.title}</div>
                <div className="text-[#00A86B] font-extrabold text-lg">
                  {form.price ? `${form.price} ${form.currency}` : "مجاناً"}
                </div>
                <p className="text-soft whitespace-pre-wrap">
                  {form.description}
                </p>
                <div className="flex flex-wrap gap-2 pt-2">
                  {images.slice(0, 4).map((img, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={i}
                      src={img.url}
                      alt=""
                      className="size-16 rounded-lg object-cover"
                    />
                  ))}
                </div>
              </div>
              <div className="rounded-xl bg-[#F4B400]/10 p-3 text-xs text-soft">
                <strong className="text-app">ملاحظة:</strong> سيتم مراجعة إعلانك
                من قبل فريق الإدارة قبل نشره. عادةً يستغرق ذلك أقل من ساعة.
              </div>
              <div className="flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(2)}
                >
                  السابق
                </Button>
                <Button type="submit" loading={loading} size="lg">
                  <Save className="size-4" /> نشر الإعلان
                </Button>
              </div>
            </>
          )}
        </form>
      </div>
    </PageShell>
  );
}

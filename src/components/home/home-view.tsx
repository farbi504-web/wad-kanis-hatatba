"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Sparkles,
  Tag,
  Shield,
  TrendingUp,
  Search,
  MapPin,
  Car,
  Home as HomeIcon,
  Smartphone,
  Tv,
  Shirt,
  Wrench,
  Briefcase,
  BookOpen,
  Gamepad2,
  Dumbbell,
  Package,
  Plus,
  ArrowRight,
} from "lucide-react";
import { ListingCard } from "@/components/listings/listing-card";
import { formatPrice, timeAgo } from "@/lib/utils";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Car,
  Home: HomeIcon,
  Smartphone,
  Tv,
  Refrigerator: Package,
  Shirt,
  Wrench,
  Briefcase,
  BookOpen,
  Gamepad2,
  Dumbbell,
  Cat: Package,
};

interface Listing {
  id: string;
  title: string;
  slug: string;
  price: number;
  currency: string;
  condition: string;
  publishedAt: Date | string | null;
  category: string | null;
  city: string | null;
  sellerId: string | null;
  sellerName: string | null;
  sellerAvatar: string | null;
  images: { url: string; isPrimary: boolean }[];
}

interface HomeData {
  categories: { id: string; name: string; slug: string; icon: string | null; count: number }[];
  cities: { id: string; name: string; slug: string; count: number }[];
  featured: Listing[];
  recent: Listing[];
}

export function HomeView({ data }: { data: HomeData }) {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(80% 60% at 50% 0%, rgba(0,168,107,0.18) 0%, transparent 60%), radial-gradient(50% 40% at 90% 30%, rgba(244,180,0,0.12) 0%, transparent 60%), linear-gradient(180deg, var(--bg) 0%, var(--bg-soft) 100%)",
          }}
        />
        <div className="container-app pt-12 pb-16 md:pt-20 md:pb-24">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#00A86B]/10 text-[#00A86B] text-xs font-bold mb-6 animate-fade-in">
              <Sparkles className="size-3.5" />
              المنصة الأولى في حطاطبة وتيبازة
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-black text-app leading-tight mb-4 animate-fade-in">
              بيع واشتري{" "}
              <span className="bg-gradient-to-l from-[#00A86B] to-[#0D1F3C] bg-clip-text text-transparent">
                بكل سهولة
              </span>
            </h1>
            <p
              className="text-base md:text-lg text-soft mb-8 animate-fade-in"
              style={{ animationDelay: "0.1s" }}
            >
              آلاف الإعلانات الموثوقة في حطاطبة والمناطق المجاورة. سيارات،
              عقارات، إلكترونيات والمزيد بين يديك.
            </p>
            <form
              action="/listings"
              method="GET"
              className="relative max-w-2xl mx-auto animate-fade-in"
              style={{ animationDelay: "0.2s" }}
            >
              <Search className="absolute right-5 top-1/2 -translate-y-1/2 size-5 text-soft pointer-events-none" />
              <input
                name="q"
                placeholder="ابحث عن إعلانات..."
                className="w-full h-14 md:h-16 !pr-14 !pl-32 !rounded-full bg-card border border-app shadow-app-lg text-base md:text-lg focus:!border-[#00A86B] focus:ring-4 focus:ring-[#00A86B]/15"
                style={{ paddingRight: "3.5rem" }}
              />
              <button
                type="submit"
                className="absolute left-2 top-1/2 -translate-y-1/2 h-10 md:h-12 px-5 md:px-6 rounded-full bg-gradient-to-l from-[#00A86B] to-[#00905c] text-white font-bold shadow-lg shadow-[#00A86B]/30 hover:shadow-[#00A86B]/40 hover:scale-[1.02] transition-all flex items-center gap-1.5"
              >
                <span className="hidden sm:inline">ابحث</span>
                <ArrowLeft className="size-4" />
              </button>
            </form>
            <div
              className="flex flex-wrap justify-center gap-2 mt-5 text-xs text-soft animate-fade-in"
              style={{ animationDelay: "0.3s" }}
            >
              <span>الأكثر بحثاً:</span>
              {["سيارات", "شقق", "آيفون", "أثاث", "دراجات"].map((q) => (
                <Link
                  key={q}
                  href={`/listings?q=${encodeURIComponent(q)}`}
                  className="px-2.5 py-1 rounded-full bg-soft hover:bg-[#00A86B]/10 hover:text-[#00A86B] transition-colors"
                >
                  {q}
                </Link>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="mt-12 md:mt-16 grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 max-w-4xl mx-auto">
            <Stat
              icon={Tag}
              value={`${data.featured.length + data.recent.length}+`}
              label="إعلان نشط"
            />
            <Stat
              icon={MapPin}
              value={`${data.cities.length}`}
              label="مدينة"
            />
            <Stat
              icon={Sparkles}
              value={`${data.categories.length}`}
              label="فئة"
            />
            <Stat
              icon={Shield}
              value="100%"
              label="موثوق"
            />
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="container-app py-10 md:py-14">
        <SectionHeader
          title="تصفح حسب الفئة"
          subtitle="اختر الفئة المناسبة لإعلانك"
          link="/categories"
        />
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 md:gap-4">
          {data.categories.map((c) => {
            const Icon = ICON_MAP[c.icon || ""] || Package;
            return (
              <Link
                key={c.id}
                href={`/listings?category=${c.id}`}
                className="group flex flex-col items-center gap-2 p-3 md:p-4 rounded-2xl bg-card border border-app hover:border-[#00A86B] hover:shadow-app-lg transition-all"
              >
                <div className="size-12 md:size-14 rounded-2xl bg-gradient-to-br from-[#00A86B]/15 to-[#00A86B]/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Icon className="size-6 md:size-7 text-[#00A86B]" />
                </div>
                <div className="text-xs md:text-sm font-semibold text-app text-center clamp-1">
                  {c.name}
                </div>
                <div className="text-[10px] text-soft">{c.count} إعلان</div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Featured */}
      {data.featured.length > 0 && (
        <section className="container-app py-10 md:py-14">
          <SectionHeader
            title="إعلانات مميزة"
            subtitle="إعلانات مختارة بعناية"
            link="/listings?featured=true"
            accent
          />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">
            {data.featured.map((l) => (
              <ListingCard key={l.id} listing={l as unknown as never} />
            ))}
          </div>
        </section>
      )}

      {/* Recent */}
      <section className="container-app py-10 md:py-14">
        <SectionHeader
          title="أحدث الإعلانات"
          subtitle="آخر ما أُضيف على المنصة"
          link="/listings"
        />
        {data.recent.length === 0 ? (
          <div className="card p-10 text-center">
            <div className="size-16 mx-auto rounded-2xl bg-[#00A86B]/10 flex items-center justify-center mb-4">
              <Tag className="size-8 text-[#00A86B]" />
            </div>
            <h3 className="text-lg font-bold mb-1">لا توجد إعلانات بعد</h3>
            <p className="text-sm text-soft mb-5">
              كن أول من ينشر إعلاناً على المنصة
            </p>
            <Link href="/listings/new" className="inline-block">
              <button className="btn btn-primary">
                <Plus className="size-4" /> أضف أول إعلان
              </button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">
            {data.recent.map((l) => (
              <ListingCard key={l.id} listing={l as unknown as never} />
            ))}
          </div>
        )}
      </section>

      {/* Cities */}
      <section className="container-app py-10 md:py-14">
        <SectionHeader
          title="تصفح حسب المدينة"
          subtitle="اختر مدينتك"
          link="/cities"
        />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {data.cities.map((c) => (
            <Link
              key={c.id}
              href={`/listings?city=${c.id}`}
              className="group p-4 rounded-2xl bg-card border border-app hover:border-[#00A86B] hover:shadow-app transition-all"
            >
              <div className="flex items-center gap-2.5 mb-2">
                <div className="size-9 rounded-lg bg-[#00A86B]/10 flex items-center justify-center group-hover:bg-[#00A86B] group-hover:text-white transition-colors text-[#00A86B]">
                  <MapPin className="size-4" />
                </div>
                <div className="font-bold text-sm text-app clamp-1">
                  {c.name}
                </div>
              </div>
              <div className="text-xs text-soft">{c.count} إعلان</div>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container-app py-12 md:py-20">
        <div className="rounded-3xl overflow-hidden bg-gradient-to-l from-[#0D1F3C] via-[#0D1F3C] to-[#00A86B] p-8 md:p-14 text-white relative">
          <div
            aria-hidden
            className="absolute -top-20 -left-20 size-72 rounded-full bg-[#00A86B]/30 blur-3xl"
          />
          <div
            aria-hidden
            className="absolute -bottom-20 -right-20 size-72 rounded-full bg-[#F4B400]/20 blur-3xl"
          />
          <div className="relative max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur text-xs font-semibold mb-4">
              <TrendingUp className="size-3.5" />
              ابدأ مجاناً اليوم
            </div>
            <h2 className="text-2xl md:text-4xl font-black leading-tight mb-3">
              هل لديك شيء للبيع؟
            </h2>
            <p className="text-white/80 mb-6 text-sm md:text-base">
              انشر إعلانك مجاناً في أقل من دقيقة واحدة، وتمتع بوصول لآلاف
              المهتمين في حطاطبة والمناطق المجاورة.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/listings/new"
                className="inline-flex items-center gap-2 h-12 px-6 rounded-full bg-[#F4B400] text-[#0D1F3C] font-extrabold shadow-lg shadow-black/20 hover:scale-105 transition-transform"
              >
                <Plus className="size-4" /> أضف إعلانك الآن
              </Link>
              <Link
                href="/auth/register"
                className="inline-flex items-center gap-2 h-12 px-6 rounded-full bg-white/10 backdrop-blur border border-white/20 font-bold hover:bg-white/20 transition-colors"
              >
                إنشاء حساب
                <ArrowRight className="size-4 flip-x" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function Stat({
  icon: Icon,
  value,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>;
  value: string;
  label: string;
}) {
  return (
    <div className="card p-4 text-center">
      <div className="inline-flex size-10 rounded-xl bg-[#00A86B]/10 text-[#00A86B] items-center justify-center mb-2">
        <Icon className="size-5" />
      </div>
      <div className="text-xl md:text-2xl font-black text-app">{value}</div>
      <div className="text-xs text-soft">{label}</div>
    </div>
  );
}

function SectionHeader({
  title,
  subtitle,
  link,
  accent,
}: {
  title: string;
  subtitle?: string;
  link?: string;
  accent?: boolean;
}) {
  return (
    <div className="flex items-end justify-between mb-5 md:mb-7">
      <div>
        <h2
          className={`text-xl md:text-2xl font-black ${accent ? "text-[#00A86B]" : "text-app"}`}
        >
          {title}
        </h2>
        {subtitle && (
          <p className="text-sm text-soft mt-1">{subtitle}</p>
        )}
      </div>
      {link && (
        <Link
          href={link}
          className="text-sm font-semibold text-[#00A86B] hover:underline flex items-center gap-1"
        >
          عرض الكل
          <ArrowLeft className="size-4" />
        </Link>
      )}
    </div>
  );
}

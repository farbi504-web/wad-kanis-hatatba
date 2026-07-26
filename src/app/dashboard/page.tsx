"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
  Eye,
  Edit2,
  Trash2,
  Heart,
  MessageCircle,
  Bell,
  CheckCircle2,
  Clock,
  XCircle,
  Star,
  LayoutDashboard,
  List,
  RefreshCw,
} from "lucide-react";
import { PageShell } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast-helper";
import { ListingCardSkeleton } from "@/components/ui/skeleton";
import { SafeImage } from "@/components/ui/safe-image";
import { cn, formatPrice, timeAgo } from "@/lib/utils";

interface Listing {
  id: string;
  title: string;
  slug: string;
  price: number;
  currency: string;
  status: string;
  isFeatured: boolean;
  viewsCount: number;
  createdAt: string;
  publishedAt: string | null;
}

const STATUS_STYLES: Record<
  string,
  { label: string; color: string; icon: React.ComponentType<{ className?: string }> }
> = {
  active: { label: "نشط", color: "text-[#00A86B]", icon: CheckCircle2 },
  pending: { label: "قيد المراجعة", color: "text-[#F4B400]", icon: Clock },
  rejected: { label: "مرفوض", color: "text-red-500", icon: XCircle },
  closed: { label: "مغلق", color: "text-soft", icon: XCircle },
  sold: { label: "مباع", color: "text-blue-500", icon: CheckCircle2 },
  draft: { label: "مسودة", color: "text-soft", icon: Clock },
};

export default function DashboardPage() {
  const router = useRouter();
  const toast = useToast();
  const [tab, setTab] = useState<"listings" | "favorites" | "messages" | "notifications">("listings");
  const [me, setMe] = useState<{ id: string; fullName: string; email: string } | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [favs, setFavs] = useState<{ id: string; title: string; price: number; currency: string; images: { url: string }[] }[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const load = async () => {
    setLoading(true);
    const meR = await fetch("/api/auth/me");
    const meJ = await meR.json();
    if (!meJ?.data) {
      router.push("/auth/login?next=/dashboard");
      return;
    }
    setMe(meJ.data);
    const lr = await fetch(`/api/listings?seller=${meJ.data.id}&status=pending,active,rejected,closed,sold,draft&limit=50`);
    const lj = await lr.json();
    setListings(lj.data?.items ?? []);
    const fr = await fetch("/api/favorites");
    const fj = await fr.json();
    setFavs(fj.data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const setStatus = async (id: string, status: string) => {
    setActionLoading(id);
    try {
      const r = await fetch(`/api/listings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (r.ok) {
        toast.success("تم التحديث");
        await load();
      } else {
        const j = await r.json();
        toast.error(j.error?.message || "فشل التحديث");
      }
    } finally {
      setActionLoading(null);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("هل أنت متأكد من الحذف؟")) return;
    setActionLoading(id);
    try {
      const r = await fetch(`/api/listings/${id}`, { method: "DELETE" });
      if (r.ok) {
        toast.success("تم الحذف");
        await load();
      }
    } finally {
      setActionLoading(null);
    }
  };

  const tabs = [
    { id: "listings", label: "إعلاناتي", icon: List, count: listings.length },
    { id: "favorites", label: "المفضلة", icon: Heart, count: favs.length },
  ];

  const stats = {
    total: listings.length,
    active: listings.filter((l) => l.status === "active").length,
    pending: listings.filter((l) => l.status === "pending").length,
    views: listings.reduce((s, l) => s + l.viewsCount, 0),
  };

  return (
    <PageShell>
      <div className="container-app py-6 md:py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-black flex items-center gap-2">
              <LayoutDashboard className="size-7 text-[#00A86B]" /> لوحة
              التحكم
            </h1>
            <p className="text-sm text-soft mt-1">
              مرحباً {me?.fullName}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => load()}
              disabled={loading}
            >
              <RefreshCw className={cn("size-4", loading && "animate-spin")} />
              تحديث
            </Button>
            <Link href="/listings/new">
              <Button>
                <Plus className="size-4" /> إعلان جديد
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <StatCard
            label="إجمالي الإعلانات"
            value={stats.total}
            color="from-[#00A86B] to-[#00905c]"
            icon={List}
          />
          <StatCard
            label="نشطة"
            value={stats.active}
            color="from-emerald-500 to-emerald-700"
            icon={CheckCircle2}
          />
          <StatCard
            label="قيد المراجعة"
            value={stats.pending}
            color="from-[#F4B400] to-[#d89c00]"
            icon={Clock}
          />
          <StatCard
            label="إجمالي المشاهدات"
            value={stats.views}
            color="from-[#0D1F3C] to-[#1d4070]"
            icon={Eye}
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-4 bg-soft p-1 rounded-xl overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as never)}
              className={cn(
                "flex-1 min-w-[100px] py-2 px-3 rounded-lg text-sm font-semibold flex items-center justify-center gap-1.5 transition-all",
                tab === t.id
                  ? "bg-card text-app shadow"
                  : "text-soft hover:text-app",
              )}
            >
              <t.icon className="size-4" /> {t.label}
              <span className="text-xs bg-[#00A86B]/15 text-[#00A86B] px-1.5 py-0.5 rounded-full">
                {t.count}
              </span>
            </button>
          ))}
        </div>

        {tab === "listings" && (
          <div>
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <ListingCardSkeleton key={i} />
                ))}
              </div>
            ) : listings.length === 0 ? (
              <div className="card p-10 text-center">
                <div className="size-16 mx-auto rounded-2xl bg-[#00A86B]/10 flex items-center justify-center mb-3">
                  <List className="size-7 text-[#00A86B]" />
                </div>
                <h3 className="text-lg font-bold mb-1">لا توجد إعلانات بعد</h3>
                <p className="text-sm text-soft mb-4">
                  ابدأ بإضافة أول إعلان لك
                </p>
                <Link href="/listings/new">
                  <Button>
                    <Plus className="size-4" /> أضف إعلانك الأول
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {listings.map((l) => {
                  const s = STATUS_STYLES[l.status];
                  return (
                    <div key={l.id} className="card p-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <Link
                          href={`/listings/${l.slug || l.id}`}
                          className="font-bold text-app hover:text-[#00A86B] clamp-2 flex-1"
                        >
                          {l.title}
                        </Link>
                        <span
                          className={cn(
                            "badge",
                            l.status === "active" && "badge-primary",
                            l.status === "pending" && "badge-accent",
                            l.status === "rejected" && "badge-danger",
                            (l.status === "closed" || l.status === "draft") &&
                              "badge-secondary",
                          )}
                        >
                          <s.icon className="size-3" /> {s?.label || l.status}
                        </span>
                      </div>
                      <div className="text-[#00A86B] font-extrabold text-lg mb-2">
                        {formatPrice(l.price, l.currency)}
                      </div>
                      <div className="text-xs text-soft flex items-center gap-2 mb-3">
                        <Eye className="size-3" /> {l.viewsCount} مشاهدة
                        <span>·</span>
                        <span>
                          {l.publishedAt
                            ? timeAgo(l.publishedAt)
                            : timeAgo(l.createdAt)}
                        </span>
                      </div>
                      {l.status === "rejected" && (
                        <div className="text-xs text-red-600 bg-red-50 dark:bg-red-950/20 rounded-lg p-2 mb-2">
                          تم رفض الإعلان
                        </div>
                      )}
                      <div className="flex flex-wrap gap-1.5">
                        {l.status === "active" && (
                          <button
                            onClick={() => setStatus(l.id, "closed")}
                            className="text-xs px-2.5 py-1.5 rounded-lg bg-soft hover:bg-app/10"
                            disabled={actionLoading === l.id}
                          >
                            إغلاق
                          </button>
                        )}
                        {l.status === "closed" && (
                          <button
                            onClick={() => setStatus(l.id, "active")}
                            className="text-xs px-2.5 py-1.5 rounded-lg bg-[#00A86B]/10 text-[#00A86B]"
                            disabled={actionLoading === l.id}
                          >
                            إعادة نشر
                          </button>
                        )}
                        {l.status === "pending" && (
                          <span className="text-xs text-soft">
                            بانتظار المراجعة
                          </span>
                        )}
                        <Link
                          href={`/listings/${l.slug || l.id}`}
                          className="text-xs px-2.5 py-1.5 rounded-lg bg-soft hover:bg-app/10 inline-flex items-center gap-1"
                        >
                          <Eye className="size-3" /> عرض
                        </Link>
                        <button
                          onClick={() => remove(l.id)}
                          className="text-xs px-2.5 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-950/30"
                          disabled={actionLoading === l.id}
                        >
                          <Trash2 className="size-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {tab === "favorites" && (
          <div>
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <ListingCardSkeleton key={i} />
                ))}
              </div>
            ) : favs.length === 0 ? (
              <div className="card p-10 text-center">
                <div className="size-16 mx-auto rounded-2xl bg-red-100 dark:bg-red-950/30 flex items-center justify-center mb-3">
                  <Heart className="size-7 text-red-500" />
                </div>
                <h3 className="text-lg font-bold mb-1">
                  لا توجد مفضلات بعد
                </h3>
                <p className="text-sm text-soft mb-4">
                  احفظ الإعلانات التي تعجبك للرجوع إليها لاحقاً
                </p>
                <Link href="/listings">
                  <Button>تصفح الإعلانات</Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {favs.map((f) => (
                  <Link
                    key={f.id}
                    href={`/listings/${f.id}`}
                    className="card card-hover p-0 overflow-hidden"
                  >
                    <div className="aspect-video bg-soft">
                      {f.images?.[0]?.url ? (
                        <SafeImage
                          src={f.images[0].url}
                          alt=""
                          className="w-full h-full"
                          aspectRatio="16/9"
                        />
                      ) : null}
                    </div>
                    <div className="p-3">
                      <h4 className="font-bold text-app clamp-1">{f.title}</h4>
                      <p className="text-[#00A86B] font-extrabold mt-1">
                        {formatPrice(f.price, f.currency)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </PageShell>
  );
}

function StatCard({
  label,
  value,
  color,
  icon: Icon,
}: {
  label: string;
  value: number;
  color: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="card p-4">
      <div
        className={cn(
          "inline-flex size-10 rounded-xl items-center justify-center text-white bg-gradient-to-l",
          color,
        )}
      >
        <Icon className="size-5" />
      </div>
      <div className="text-2xl font-black text-app mt-2">{value}</div>
      <div className="text-xs text-soft">{label}</div>
    </div>
  );
}

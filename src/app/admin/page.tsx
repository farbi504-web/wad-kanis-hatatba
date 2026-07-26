"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Users,
  List,
  Flag,
  Bell,
  Tag,
  MapPin,
  Image as ImageIcon,
  Activity,
  Download,
  Database,
  CheckCircle2,
  XCircle,
  Shield,
  ShieldOff,
  Star,
  Trash2,
  Search,
  Send,
  TrendingUp,
  MessageCircle,
  Eye,
  Clock,
  BarChart3,
  Globe,
} from "lucide-react";
import { PageShell } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea, Select, FieldError } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { useToast } from "@/components/ui/use-toast-helper";
import { ListingCardSkeleton } from "@/components/ui/skeleton";
import { cn, formatPrice, timeAgo } from "@/lib/utils";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

interface Stats {
  users: number;
  sellers: number;
  listings: number;
  pendingListings: number;
  activeListings: number;
  reports: number;
  pendingReports: number;
  messages: number;
  conversations: number;
  views: number;
  listingsByDay: { date: string; count: number }[];
  usersByDay: { date: string; count: number }[];
  topCategories: { id: string; count: number }[];
}

const TABS = [
  { id: "overview", label: "نظرة عامة", icon: BarChart3 },
  { id: "users", label: "المستخدمون", icon: Users },
  { id: "listings", label: "الإعلانات", icon: List },
  { id: "reports", label: "البلاغات", icon: Flag },
  { id: "categories", label: "الفئات", icon: Tag },
  { id: "cities", label: "المدن", icon: MapPin },
  { id: "banners", label: "البانرات", icon: ImageIcon },
  { id: "notifications", label: "الإشعارات", icon: Bell },
  { id: "activity", label: "سجل النشاط", icon: Activity },
  { id: "backup", label: "النسخ والتصدير", icon: Database },
] as const;

type Tab = (typeof TABS)[number]["id"];

export default function AdminPage() {
  const router = useRouter();
  const toast = useToast();
  const [tab, setTab] = useState<Tab>("overview");
  const [me, setMe] = useState<{ id: string; fullName: string; role: string } | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [listings, setListings] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [cats, setCats] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [banners, setBanners] = useState<any>({ banners: [], sponsors: [] });
  const [activity, setActivity] = useState<any[]>([]);
  const [notifs, setNotifs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  useEffect(() => {
    (async () => {
      const meR = await fetch("/api/auth/me");
      const meJ = await meR.json();
      if (!meJ?.data || meJ.data.role !== "admin") {
        toast.error("غير مصرح بالوصول");
        router.push("/");
        return;
      }
      setMe(meJ.data);
      await loadStats();
      setLoading(false);
    })();
  }, []);

  const loadStats = async () => {
    const r = await fetch("/api/admin/stats");
    if (r.ok) {
      const j = await r.json();
      setStats(j.data);
    }
  };
  const loadUsers = async () => {
    const r = await fetch("/api/admin/users");
    if (r.ok) setUsers((await r.json()).data?.items ?? []);
  };
  const loadListings = async () => {
    const r = await fetch("/api/admin/listings");
    if (r.ok) setListings((await r.json()).data?.items ?? []);
  };
  const loadReports = async () => {
    const r = await fetch("/api/admin/reports");
    if (r.ok) setReports((await r.json()).data ?? []);
  };
  const loadCategories = async () => {
    const r = await fetch("/api/admin/categories");
    if (r.ok) setCats((await r.json()).data ?? []);
  };
  const loadCities = async () => {
    const r = await fetch("/api/admin/cities");
    if (r.ok) setCities((await r.json()).data ?? []);
  };
  const loadBanners = async () => {
    const r = await fetch("/api/admin/banners");
    if (r.ok) setBanners((await r.json()).data ?? { banners: [], sponsors: [] });
  };
  const loadActivity = async () => {
    const r = await fetch("/api/admin/activity");
    if (r.ok) setActivity((await r.json()).data ?? []);
  };
  const loadNotifs = async () => {
    const r = await fetch("/api/admin/notifications");
    if (r.ok) setNotifs((await r.json()).data ?? []);
  };

  useEffect(() => {
    if (me) {
      if (tab === "users") loadUsers();
      if (tab === "listings") loadListings();
      if (tab === "reports") loadReports();
      if (tab === "categories") loadCategories();
      if (tab === "cities") loadCities();
      if (tab === "banners") loadBanners();
      if (tab === "activity") loadActivity();
      if (tab === "notifications") loadNotifs();
    }
  }, [tab, me]);

  if (!me) {
    return (
      <PageShell>
        <div className="container-app py-10 text-center text-soft">
          جاري التحقق...
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="container-app py-6 md:py-8">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-black flex items-center gap-2">
            <Shield className="size-7 text-[#F4B400]" /> لوحة المدير
          </h1>
          <p className="text-sm text-soft mt-1">إدارة شاملة للمنصة</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-5">
          <aside className="md:sticky md:top-20 md:self-start">
            <div className="card p-2 overflow-x-auto md:overflow-visible">
              <nav className="flex md:flex-col gap-1">
                {TABS.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    className={cn(
                      "shrink-0 md:shrink md:w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-colors text-right",
                      tab === t.id
                        ? "bg-[#00A86B] text-white"
                        : "text-soft hover:bg-soft hover:text-app",
                    )}
                  >
                    <t.icon className="size-4" />
                    <span>{t.label}</span>
                  </button>
                ))}
              </nav>
            </div>
          </aside>

          <div>
            {tab === "overview" && stats && (
              <OverviewTab stats={stats} cats={cats} />
            )}
            {tab === "users" && (
              <UsersTab
                users={users}
                q={q}
                setQ={setQ}
                reload={loadUsers}
              />
            )}
            {tab === "listings" && (
              <ListingsTab
                listings={listings}
                reload={loadListings}
              />
            )}
            {tab === "reports" && (
              <ReportsTab reports={reports} reload={loadReports} />
            )}
            {tab === "categories" && (
              <CategoriesTab
                cats={cats}
                reload={loadCategories}
              />
            )}
            {tab === "cities" && (
              <CitiesTab cities={cities} reload={loadCities} />
            )}
            {tab === "banners" && (
              <BannersTab banners={banners} reload={loadBanners} />
            )}
            {tab === "notifications" && (
              <NotificationsTab
                notifs={notifs}
                users={users}
                reload={loadNotifs}
              />
            )}
            {tab === "activity" && <ActivityTab activity={activity} />}
            {tab === "backup" && <BackupTab />}
          </div>
        </div>
      </div>
    </PageShell>
  );
}

const COLORS = ["#00A86B", "#0D1F3C", "#F4B400", "#ef4444", "#8b5cf6"];

function OverviewTab({
  stats,
  cats,
}: {
  stats: Stats;
  cats: { id: string; name: string; count: number }[];
}) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <StatCard
          icon={Users}
          label="المستخدمون"
          value={stats.users}
          color="from-blue-500 to-blue-700"
        />
        <StatCard
          icon={List}
          label="الإعلانات"
          value={stats.listings}
          color="from-[#00A86B] to-[#00905c]"
        />
        <StatCard
          icon={Clock}
          label="قيد المراجعة"
          value={stats.pendingListings}
          color="from-[#F4B400] to-[#d89c00]"
        />
        <StatCard
          icon={Flag}
          label="البلاغات"
          value={stats.reports}
          color="from-red-500 to-red-700"
        />
        <StatCard
          icon={MessageCircle}
          label="الرسائل"
          value={stats.messages}
          color="from-purple-500 to-purple-700"
        />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          icon={CheckCircle2}
          label="إعلانات نشطة"
          value={stats.activeListings}
          color="from-emerald-500 to-emerald-700"
        />
        <StatCard
          icon={Eye}
          label="إجمالي المشاهدات"
          value={stats.views}
          color="from-pink-500 to-pink-700"
        />
        <StatCard
          icon={MessageCircle}
          label="المحادثات"
          value={stats.conversations}
          color="from-cyan-500 to-cyan-700"
        />
        <StatCard
          icon={Users}
          label="البائعون"
          value={stats.sellers}
          color="from-indigo-500 to-indigo-700"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="card p-5">
          <h3 className="font-bold text-app mb-3 flex items-center gap-2">
            <TrendingUp className="size-4 text-[#00A86B]" /> إعلانات آخر 7 أيام
          </h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.listingsByDay}>
                <defs>
                  <linearGradient id="cL" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00A86B" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#00A86B" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: "var(--text-soft)" }}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "var(--text-soft)" }}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--bg-card)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#00A86B"
                  fill="url(#cL)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-5">
          <h3 className="font-bold text-app mb-3 flex items-center gap-2">
            <Users className="size-4 text-[#00A86B]" /> مستخدمون آخر 7 أيام
          </h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.usersByDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: "var(--text-soft)" }}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "var(--text-soft)" }}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--bg-card)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                  }}
                />
                <Bar dataKey="count" fill="#0D1F3C" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="card p-5">
        <h3 className="font-bold text-app mb-3">إحصائيات سريعة</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <QuickStat
            label="معدل النمو"
            value={`+${stats.usersByDay.reduce((s, d) => s + d.count, 0)}`}
            sub="مستخدم جديد هذا الأسبوع"
            color="text-[#00A86B]"
          />
          <QuickStat
            label="إعلانات جديدة"
            value={`+${stats.listingsByDay.reduce((s, d) => s + d.count, 0)}`}
            sub="هذا الأسبوع"
            color="text-[#0D1F3C]"
          />
          <QuickStat
            label="قيد المراجعة"
            value={stats.pendingListings}
            sub="يحتاج موافقة"
            color="text-[#F4B400]"
          />
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  color: string;
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

function QuickStat({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string | number;
  sub: string;
  color: string;
}) {
  return (
    <div className="rounded-xl bg-soft p-4">
      <div className="text-xs text-soft">{label}</div>
      <div className={cn("text-2xl font-black mt-1", color)}>{value}</div>
      <div className="text-[10px] text-soft mt-0.5">{sub}</div>
    </div>
  );
}

function UsersTab({
  users,
  q,
  setQ,
  reload,
}: {
  users: any[];
  q: string;
  setQ: (s: string) => void;
  reload: () => void;
}) {
  const toast = useToast();
  const [filter, setFilter] = useState("");
  const filtered = users.filter(
    (u) =>
      !q ||
      u.fullName?.toLowerCase().includes(q.toLowerCase()) ||
      u.email?.toLowerCase().includes(q.toLowerCase()),
  );
  const updateUser = async (id: string, patch: any) => {
    const r = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: id, ...patch }),
    });
    if (r.ok) {
      toast.success("تم التحديث");
      reload();
    } else {
      const j = await r.json();
      toast.error(j.error?.message || "فشل التحديث");
    }
  };
  return (
    <div className="space-y-4">
      <div className="card p-4 flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-soft" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="بحث بالاسم أو البريد..."
            className="input !pr-10"
          />
        </div>
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-soft text-soft text-xs">
            <tr>
              <th className="text-right p-3">المستخدم</th>
              <th className="text-right p-3">البريد</th>
              <th className="text-right p-3">الدور</th>
              <th className="text-right p-3">الحالة</th>
              <th className="text-right p-3">التقييم</th>
              <th className="text-right p-3">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
              <tr
                key={u.id}
                className="border-t border-app hover:bg-soft transition-colors"
              >
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <Avatar src={u.avatarUrl} name={u.fullName} size={32} />
                    <div>
                      <div className="font-semibold text-app">{u.fullName}</div>
                      <div className="text-[10px] text-soft">
                        {timeAgo(u.createdAt)}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="p-3 text-xs">{u.email}</td>
                <td className="p-3">
                  <Select
                    value={u.role}
                    onChange={(e) =>
                      updateUser(u.id, { role: e.target.value })
                    }
                    className="!py-1 !text-xs !w-auto"
                  >
                    <option value="user">مستخدم</option>
                    <option value="seller">بائع</option>
                    <option value="admin">مدير</option>
                  </Select>
                </td>
                <td className="p-3">
                  <span
                    className={cn(
                      "badge",
                      u.status === "active" && "badge-primary",
                      u.status === "banned" && "badge-danger",
                      u.status === "suspended" && "badge-accent",
                    )}
                  >
                    {u.status === "active"
                      ? "نشط"
                      : u.status === "banned"
                        ? "محظور"
                        : "موقوف"}
                  </span>
                </td>
                <td className="p-3 text-xs">
                  <span className="flex items-center gap-1">
                    <Star className="size-3 fill-[#F4B400] text-[#F4B400]" />
                    {Number(u.ratingAvg).toFixed(1)} ({u.ratingCount})
                  </span>
                </td>
                <td className="p-3">
                  <div className="flex gap-1">
                    {u.status === "banned" ? (
                      <button
                        onClick={() => updateUser(u.id, { status: "active" })}
                        className="size-7 rounded-md hover:bg-emerald-50 text-emerald-600 flex items-center justify-center"
                        title="إلغاء الحظر"
                      >
                        <ShieldOff className="size-3.5" />
                      </button>
                    ) : (
                      <button
                        onClick={() => updateUser(u.id, { status: "banned" })}
                        className="size-7 rounded-md hover:bg-red-50 text-red-600 flex items-center justify-center"
                        title="حظر"
                      >
                        <Shield className="size-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() =>
                        updateUser(u.id, { isVerified: !u.isVerified })
                      }
                      className={cn(
                        "size-7 rounded-md flex items-center justify-center",
                        u.isVerified
                          ? "text-emerald-600 hover:bg-emerald-50"
                          : "text-soft hover:bg-soft",
                      )}
                      title="توثيق"
                    >
                      <CheckCircle2 className="size-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="p-8 text-center text-soft text-sm">لا توجد نتائج</div>
        )}
      </div>
    </div>
  );
}

function ListingsTab({
  listings,
  reload,
}: {
  listings: any[];
  reload: () => void;
}) {
  const toast = useToast();
  const [status, setStatus] = useState("pending");
  const filtered = listings.filter((l) =>
    status === "all" ? true : l.status === status,
  );
  const bulk = async (ids: string[], action: string, reason?: string) => {
    const r = await fetch("/api/admin/listings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids, action, rejectedReason: reason }),
    });
    if (r.ok) {
      toast.success("تم");
      reload();
    } else {
      const j = await r.json();
      toast.error(j.error?.message || "فشل");
    }
  };
  return (
    <div className="space-y-4">
      <div className="card p-3 flex flex-wrap gap-2">
        {["pending", "active", "rejected", "closed", "all"].map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-semibold",
              status === s
                ? "bg-[#00A86B] text-white"
                : "bg-soft text-soft hover:text-app",
            )}
          >
            {s === "pending"
              ? "قيد المراجعة"
              : s === "active"
                ? "نشطة"
                : s === "rejected"
                  ? "مرفوضة"
                  : s === "closed"
                    ? "مغلقة"
                    : "الكل"}
          </button>
        ))}
      </div>
      <div className="space-y-2">
        {filtered.map((l) => (
          <div key={l.id} className="card p-3 flex flex-col sm:flex-row gap-3">
            <div className="flex-1 min-w-0">
              <Link
                href={`/listings/${l.id}`}
                className="font-bold text-app hover:text-[#00A86B] clamp-1"
              >
                {l.title}
              </Link>
              <div className="text-xs text-soft flex flex-wrap items-center gap-2 mt-1">
                <span>{l.userName} ({l.userEmail})</span>
                <span>·</span>
                <span>{l.category}</span>
                <span>·</span>
                <span>{l.city}</span>
                <span>·</span>
                <span>{formatPrice(l.price, l.currency)}</span>
                <span>·</span>
                <span className="flex items-center gap-0.5">
                  <Eye className="size-3" /> {l.viewsCount}
                </span>
                <span>·</span>
                <span>{timeAgo(l.createdAt)}</span>
              </div>
            </div>
            <span
              className={cn(
                "badge self-start",
                l.status === "active" && "badge-primary",
                l.status === "pending" && "badge-accent",
                l.status === "rejected" && "badge-danger",
              )}
            >
              {l.status}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {l.status !== "active" && (
                <button
                  onClick={() => bulk([l.id], "approve")}
                  className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-semibold"
                >
                  قبول
                </button>
              )}
              {l.status !== "rejected" && (
                <button
                  onClick={() => {
                    const reason = prompt("سبب الرفض:") || "غير مطابق";
                    bulk([l.id], "reject", reason);
                  }}
                  className="px-2.5 py-1 rounded-md bg-red-50 text-red-700 hover:bg-red-100 text-xs font-semibold"
                >
                  رفض
                </button>
              )}
              {l.isFeatured ? (
                <button
                  onClick={() => bulk([l.id], "unfeature")}
                  className="px-2.5 py-1 rounded-md bg-soft text-soft hover:bg-app/10 text-xs font-semibold"
                >
                  إلغاء تمييز
                </button>
              ) : (
                <button
                  onClick={() => bulk([l.id], "feature")}
                  className="px-2.5 py-1 rounded-md bg-[#F4B400]/15 text-[#F4B400] text-xs font-semibold"
                >
                  تمييز
                </button>
              )}
              <button
                onClick={() => {
                  if (confirm("حذف نهائي؟")) bulk([l.id], "delete");
                }}
                className="px-2.5 py-1 rounded-md bg-red-50 text-red-700 hover:bg-red-100 text-xs font-semibold flex items-center gap-1"
              >
                <Trash2 className="size-3" /> حذف
              </button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="card p-8 text-center text-soft text-sm">
            لا توجد إعلانات
          </div>
        )}
      </div>
    </div>
  );
}

function ReportsTab({
  reports,
  reload,
}: {
  reports: any[];
  reload: () => void;
}) {
  const toast = useToast();
  const update = async (id: string, status: string) => {
    const r = await fetch("/api/admin/reports", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: [id], status }),
    });
    if (r.ok) {
      toast.success("تم");
      reload();
    }
  };
  return (
    <div className="space-y-2">
      {reports.map((r) => (
        <div key={r.id} className="card p-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <div className="text-xs text-soft">
                {r.reporterName} ({r.reporterEmail}) - {timeAgo(r.createdAt)}
              </div>
              <h4 className="font-bold text-app mt-0.5">
                {r.targetType === "listing" ? "إعلان" : "مستخدم"} - {r.targetId.slice(0, 8)}
              </h4>
            </div>
            <span
              className={cn(
                "badge",
                r.status === "pending" && "badge-accent",
                r.status === "resolved" && "badge-primary",
                r.status === "dismissed" && "badge-secondary",
              )}
            >
              {r.status === "pending"
                ? "قيد المراجعة"
                : r.status === "resolved"
                  ? "تم الحل"
                  : "تم التجاهل"}
            </span>
          </div>
          <p className="text-sm text-soft bg-soft p-2.5 rounded-lg mb-2">
            {r.reason}
          </p>
          {r.status === "pending" && (
            <div className="flex flex-wrap gap-1.5">
              {r.targetType === "listing" && (
                <Link
                  href={`/listings/${r.targetId}`}
                  className="text-xs px-2.5 py-1 rounded-md bg-soft hover:bg-app/10"
                >
                  عرض الإعلان
                </Link>
              )}
              <button
                onClick={() => update(r.id, "resolved")}
                className="text-xs px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
              >
                تم الحل
              </button>
              <button
                onClick={() => update(r.id, "dismissed")}
                className="text-xs px-2.5 py-1 rounded-md bg-soft text-soft hover:bg-app/10"
              >
                تجاهل
              </button>
            </div>
          )}
        </div>
      ))}
      {reports.length === 0 && (
        <div className="card p-8 text-center text-soft text-sm">
          لا توجد بلاغات
        </div>
      )}
    </div>
  );
}

function CategoriesTab({
  cats,
  reload,
}: {
  cats: any[];
  reload: () => void;
}) {
  const toast = useToast();
  const [form, setForm] = useState({
    name: "",
    slug: "",
    icon: "",
    sortOrder: 0,
  });
  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    const r = await fetch("/api/admin/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (r.ok) {
      toast.success("تم");
      setForm({ name: "", slug: "", icon: "", sortOrder: 0 });
      reload();
    } else {
      const j = await r.json();
      toast.error(j.error?.message || "فشل");
    }
  };
  const toggle = async (c: any) => {
    const r = await fetch("/api/admin/categories", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: c.id, isActive: !c.isActive }),
    });
    if (r.ok) reload();
  };
  const remove = async (id: string) => {
    if (!confirm("حذف؟")) return;
    await fetch(`/api/admin/categories?id=${id}`, { method: "DELETE" });
    reload();
  };
  return (
    <div className="space-y-4">
      <form
        onSubmit={create}
        className="card p-4 grid grid-cols-1 sm:grid-cols-5 gap-2"
      >
        <Input
          required
          placeholder="اسم الفئة"
          value={form.name}
          onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
        />
        <Input
          required
          placeholder="slug"
          value={form.slug}
          onChange={(e) => setForm((s) => ({ ...s, slug: e.target.value }))}
        />
        <Input
          placeholder="أيقونة (Car, Home...)"
          value={form.icon}
          onChange={(e) => setForm((s) => ({ ...s, icon: e.target.value }))}
        />
        <Input
          type="number"
          placeholder="ترتيب"
          value={form.sortOrder}
          onChange={(e) =>
            setForm((s) => ({ ...s, sortOrder: Number(e.target.value) }))
          }
        />
        <Button type="submit">
          <Plus className="size-4" /> إضافة
        </Button>
      </form>
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-soft text-soft text-xs">
            <tr>
              <th className="text-right p-3">الاسم</th>
              <th className="text-right p-3">Slug</th>
              <th className="text-right p-3">الإعلانات</th>
              <th className="text-right p-3">الحالة</th>
              <th className="text-right p-3">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {cats.map((c) => (
              <tr key={c.id} className="border-t border-app">
                <td className="p-3 font-semibold">{c.name}</td>
                <td className="p-3 text-xs text-soft">{c.slug}</td>
                <td className="p-3">{c.count}</td>
                <td className="p-3">
                  <span
                    className={cn(
                      "badge",
                      c.isActive ? "badge-primary" : "badge-secondary",
                    )}
                  >
                    {c.isActive ? "نشط" : "غير نشط"}
                  </span>
                </td>
                <td className="p-3 flex gap-1">
                  <button
                    onClick={() => toggle(c)}
                    className="text-xs px-2 py-1 rounded bg-soft hover:bg-app/10"
                  >
                    {c.isActive ? "إيقاف" : "تفعيل"}
                  </button>
                  <button
                    onClick={() => remove(c.id)}
                    className="text-xs px-2 py-1 rounded bg-red-50 text-red-600"
                  >
                    حذف
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CitiesTab({
  cities,
  reload,
}: {
  cities: any[];
  reload: () => void;
}) {
  const toast = useToast();
  const [form, setForm] = useState({ name: "", slug: "" });
  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    const r = await fetch("/api/admin/cities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (r.ok) {
      toast.success("تم");
      setForm({ name: "", slug: "" });
      reload();
    } else {
      const j = await r.json();
      toast.error(j.error?.message || "فشل");
    }
  };
  const remove = async (id: string) => {
    if (!confirm("حذف؟")) return;
    await fetch(`/api/admin/cities?id=${id}`, { method: "DELETE" });
    reload();
  };
  return (
    <div className="space-y-4">
      <form
        onSubmit={create}
        className="card p-4 grid grid-cols-1 sm:grid-cols-3 gap-2"
      >
        <Input
          required
          placeholder="اسم المدينة"
          value={form.name}
          onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
        />
        <Input
          required
          placeholder="slug"
          value={form.slug}
          onChange={(e) => setForm((s) => ({ ...s, slug: e.target.value }))}
        />
        <Button type="submit">
          <Plus className="size-4" /> إضافة
        </Button>
      </form>
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-soft text-soft text-xs">
            <tr>
              <th className="text-right p-3">الاسم</th>
              <th className="text-right p-3">Slug</th>
              <th className="text-right p-3">الإعلانات</th>
              <th className="text-right p-3">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {cities.map((c) => (
              <tr key={c.id} className="border-t border-app">
                <td className="p-3 font-semibold">{c.name}</td>
                <td className="p-3 text-xs text-soft">{c.slug}</td>
                <td className="p-3">{c.count}</td>
                <td className="p-3">
                  <button
                    onClick={() => remove(c.id)}
                    className="text-xs px-2 py-1 rounded bg-red-50 text-red-600"
                  >
                    حذف
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function BannersTab({
  banners,
  reload,
}: {
  banners: { banners: any[]; sponsors: any[] };
  reload: () => void;
}) {
  const toast = useToast();
  const [banner, setBanner] = useState({ title: "", imageUrl: "", link: "" });
  const [sponsor, setSponsor] = useState({ name: "", logoUrl: "", website: "" });
  const addBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    const r = await fetch("/api/admin/banners", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(banner),
    });
    if (r.ok) {
      toast.success("تم");
      setBanner({ title: "", imageUrl: "", link: "" });
      reload();
    }
  };
  const addSponsor = async (e: React.FormEvent) => {
    e.preventDefault();
    const r = await fetch("/api/admin/banners", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sponsor),
    });
    if (r.ok) {
      toast.success("تم");
      setSponsor({ name: "", logoUrl: "", website: "" });
      reload();
    }
  };
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <div>
        <h3 className="font-bold text-app mb-3">البانرات</h3>
        <form
          onSubmit={addBanner}
          className="card p-4 space-y-3 mb-3"
        >
          <Input
            required
            placeholder="عنوان البانر"
            value={banner.title}
            onChange={(e) =>
              setBanner((s) => ({ ...s, title: e.target.value }))
            }
          />
          <Input
            required
            placeholder="رابط الصورة"
            value={banner.imageUrl}
            onChange={(e) =>
              setBanner((s) => ({ ...s, imageUrl: e.target.value }))
            }
          />
          <Input
            placeholder="رابط (اختياري)"
            value={banner.link}
            onChange={(e) =>
              setBanner((s) => ({ ...s, link: e.target.value }))
            }
          />
          <Button type="submit" className="w-full">
            <Plus className="size-4" /> إضافة
          </Button>
        </form>
        <div className="space-y-2">
          {banners.banners?.map((b: any) => (
            <div key={b.id} className="card p-3 text-sm">
              <div className="font-semibold">{b.title}</div>
              <a
                href={b.imageUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-[#00A86B] hover:underline clamp-1"
              >
                {b.imageUrl}
              </a>
            </div>
          ))}
        </div>
      </div>
      <div>
        <h3 className="font-bold text-app mb-3">الرعاة</h3>
        <form onSubmit={addSponsor} className="card p-4 space-y-3 mb-3">
          <Input
            required
            placeholder="اسم الراعي"
            value={sponsor.name}
            onChange={(e) =>
              setSponsor((s) => ({ ...s, name: e.target.value }))
            }
          />
          <Input
            placeholder="رابط الشعار"
            value={sponsor.logoUrl}
            onChange={(e) =>
              setSponsor((s) => ({ ...s, logoUrl: e.target.value }))
            }
          />
          <Input
            placeholder="الموقع الإلكتروني"
            value={sponsor.website}
            onChange={(e) =>
              setSponsor((s) => ({ ...s, website: e.target.value }))
            }
          />
          <Button type="submit" className="w-full">
            <Plus className="size-4" /> إضافة
          </Button>
        </form>
        <div className="space-y-2">
          {banners.sponsors?.map((s: any) => (
            <div key={s.id} className="card p-3 text-sm">
              <div className="font-semibold">{s.name}</div>
              {s.website && (
                <a
                  href={s.website}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-[#00A86B] hover:underline"
                >
                  {s.website}
                </a>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function NotificationsTab({
  notifs,
  users,
  reload,
}: {
  notifs: any[];
  users: any[];
  reload: () => void;
}) {
  const toast = useToast();
  const [form, setForm] = useState({
    userIds: [] as string[],
    title: "",
    body: "",
    link: "",
    type: "system",
    sendAll: false,
  });
  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const r = await fetch("/api/admin/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        userIds: form.sendAll ? undefined : form.userIds,
      }),
    });
    if (r.ok) {
      toast.success("تم الإرسال");
      setForm({
        userIds: [],
        title: "",
        body: "",
        link: "",
        type: "system",
        sendAll: false,
      });
      reload();
    }
  };
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <form onSubmit={send} className="card p-4 space-y-3">
        <h3 className="font-bold text-app">إرسال إشعار</h3>
        <label className="flex items-center gap-2 cursor-pointer text-sm">
          <input
            type="checkbox"
            checked={form.sendAll}
            onChange={(e) =>
              setForm((s) => ({ ...s, sendAll: e.target.checked }))
            }
            className="size-4 accent-[#00A86B]"
          />
          إرسال للجميع
        </label>
        {!form.sendAll && (
          <div>
            <Label>المستلمون</Label>
            <Select
              multiple
              className="!h-32"
              onChange={(e) => {
                const opts = Array.from(
                  (e.target as HTMLSelectElement).selectedOptions,
                ).map((o) => o.value);
                setForm((s) => ({ ...s, userIds: opts }));
              }}
            >
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.fullName} ({u.email})
                </option>
              ))}
            </Select>
          </div>
        )}
        <Input
          required
          placeholder="العنوان"
          value={form.title}
          onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))}
        />
        <Textarea
          rows={3}
          placeholder="المحتوى"
          value={form.body}
          onChange={(e) => setForm((s) => ({ ...s, body: e.target.value }))}
        />
        <Input
          placeholder="رابط (اختياري)"
          value={form.link}
          onChange={(e) => setForm((s) => ({ ...s, link: e.target.value }))}
        />
        <Button type="submit" className="w-full">
          <Send className="size-4" /> إرسال
        </Button>
      </form>
      <div className="space-y-2">
        <h3 className="font-bold text-app mb-2">آخر الإشعارات</h3>
        {notifs.slice(0, 20).map((n) => (
          <div key={n.id} className="card p-3 text-sm">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <div className="font-semibold">{n.title}</div>
                <div className="text-xs text-soft mt-0.5">{n.body}</div>
                <div className="text-[10px] text-soft mt-1">
                  إلى: {n.userName} · {timeAgo(n.createdAt)}
                </div>
              </div>
              <span
                className={cn(
                  "badge",
                  n.isRead ? "badge-secondary" : "badge-primary",
                )}
              >
                {n.isRead ? "مقروء" : "جديد"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ActivityTab({ activity }: { activity: any[] }) {
  return (
    <div className="card overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-soft text-soft text-xs">
          <tr>
            <th className="text-right p-3">التاريخ</th>
            <th className="text-right p-3">المستخدم</th>
            <th className="text-right p-3">الإجراء</th>
            <th className="text-right p-3">الكيان</th>
          </tr>
        </thead>
        <tbody>
          {activity.map((a) => (
            <tr key={a.id} className="border-t border-app">
              <td className="p-3 text-xs">{timeAgo(a.createdAt)}</td>
              <td className="p-3 text-xs">
                {a.actorName || "نظام"} ({a.actorEmail || "-"})
              </td>
              <td className="p-3">
                <span className="badge badge-secondary">{a.action}</span>
              </td>
              <td className="p-3 text-xs">
                {a.entity} {a.entityId ? `#${a.entityId.slice(0, 8)}` : ""}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function BackupTab() {
  const toast = useToast();
  const exportCsv = (type: string) => {
    window.location.href = `/api/admin/export?type=${type}&format=csv`;
  };
  const backup = async () => {
    const r = await fetch("/api/admin/backup");
    const j = await r.json();
    if (r.ok) {
      toast.success("تم إنشاء النسخة الاحتياطية");
    } else {
      toast.error(j.error?.message || "فشل");
    }
  };
  return (
    <div className="space-y-4">
      <div className="card p-5">
        <h3 className="font-bold text-app mb-3 flex items-center gap-2">
          <Download className="size-4 text-[#00A86B]" /> تصدير البيانات
        </h3>
        <p className="text-sm text-soft mb-4">
          تصدير البيانات بصيغة CSV لتحليلها أو حفظها
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <Button variant="outline" onClick={() => exportCsv("users")}>
            <Users className="size-4" /> المستخدمون
          </Button>
          <Button variant="outline" onClick={() => exportCsv("listings")}>
            <List className="size-4" /> الإعلانات
          </Button>
          <Button variant="outline" onClick={() => exportCsv("reports")}>
            <Flag className="size-4" /> البلاغات
          </Button>
          <Button variant="outline" onClick={() => exportCsv("activity")}>
            <Activity className="size-4" /> سجل النشاط
          </Button>
        </div>
      </div>
      <div className="card p-5">
        <h3 className="font-bold text-app mb-3 flex items-center gap-2">
          <Database className="size-4 text-[#F4B400]" /> نسخة احتياطية
        </h3>
        <p className="text-sm text-soft mb-4">
          إنشاء نسخة احتياطية كاملة من قاعدة البيانات
        </p>
        <Button onClick={backup} variant="accent">
          <Database className="size-4" /> إنشاء نسخة احتياطية الآن
        </Button>
      </div>
    </div>
  );
}

// Pulling Plus from somewhere
function Plus({ className }: { className?: string }) {
  // simple inline SVG to avoid extra import
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Shield, Users, FileText, BarChart3 } from "lucide-react";
import { toast } from "sonner";

interface Stats {
  totalUsers: number;
  totalAds: number;
  activeAds: number;
  pendingAds: number;
}

export default function AdminPage() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalAds: 0,
    activeAds: 0,
    pendingAds: 0,
  });

  useEffect(() => {
    async function init() {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (!data.user || data.user.role !== "admin") {
          router.push("/");
          return;
        }
        setSession(data.user);

        // In a real app, these would be separate API endpoints
        setStats({
          totalUsers: 125,
          totalAds: 340,
          activeAds: 290,
          pendingAds: 12,
        });
      } catch {
        //
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-40">
        <Loader2 className="w-8 h-8 text-wdk-600 animate-spin" />
      </div>
    );
  }

  if (!session || session.role !== "admin") {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <Shield className="w-16 h-16 mx-auto text-red-400 mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">غير مصرح</h1>
        <p className="text-gray-500">لا تملك صلاحية الوصول للوحة الإدارة</p>
      </div>
    );
  }

  const statCards = [
    {
      label: "إجمالي المستخدمين",
      value: stats.totalUsers,
      icon: Users,
      color: "bg-blue-50 text-blue-600",
    },
    {
      label: "إجمالي الإعلانات",
      value: stats.totalAds,
      icon: FileText,
      color: "bg-green-50 text-green-600",
    },
    {
      label: "إعلانات نشطة",
      value: stats.activeAds,
      icon: BarChart3,
      color: "bg-wdk-50 text-wdk-600",
    },
    {
      label: "قيد المراجعة",
      value: stats.pendingAds,
      icon: Shield,
      color: "bg-yellow-50 text-yellow-600",
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <Shield className="w-7 h-7 text-wdk-600" />
          لوحة الإدارة
        </h1>
        <p className="text-gray-500 mt-1">مرحباً، {session.fullName}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.label}
              className="bg-white rounded-2xl border p-5 hover:shadow-md transition"
            >
              <div className={`w-12 h-12 rounded-xl ${s.color} flex items-center justify-center mb-3`}>
                <Icon className="w-6 h-6" />
              </div>
              <div className="text-3xl font-bold text-gray-900">
                {s.value.toLocaleString("ar-DZ")}
              </div>
              <div className="text-sm text-gray-500 mt-1">{s.label}</div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">إجراءات سريعة</h2>
          <div className="space-y-2">
            {[
              "مراجعة الإعلانات المعلقة",
              "إدارة المستخدمين",
              "إدارة الفئات",
              "سجل التدقيق",
            ].map((action) => (
              <button
                key={action}
                onClick={() => toast.info("قيد التطوير")}
                className="w-full text-right px-4 py-3 rounded-xl text-sm text-gray-700 hover:bg-gray-50 transition border border-gray-100"
              >
                {action}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">آخر النشاطات</h2>
          <div className="space-y-3 text-sm text-gray-600">
            {[
              { action: "تسجيل مستخدم جديد", time: "منذ 5 دقائق" },
              { action: "نشر إعلان جديد", time: "منذ 12 دقيقة" },
              { action: "تحديث إعلان", time: "منذ 30 دقيقة" },
              { action: "إعلان قيد المراجعة", time: "منذ ساعة" },
            ].map((a, i) => (
              <div
                key={i}
                className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
              >
                <span>{a.action}</span>
                <span className="text-xs text-gray-400">{a.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

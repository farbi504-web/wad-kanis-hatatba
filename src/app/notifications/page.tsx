"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Bell,
  CheckCheck,
  MessageCircle,
  Sparkles,
  Star,
  Shield,
  Info,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { PageShell } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast-helper";
import { cn, timeAgo } from "@/lib/utils";

interface N {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

const ICONS: Record<string, { icon: React.ComponentType<{ className?: string }>; color: string }> = {
  message: { icon: MessageCircle, color: "bg-blue-100 text-blue-600" },
  new_message: { icon: MessageCircle, color: "bg-blue-100 text-blue-600" },
  listing_approved: { icon: CheckCircle2, color: "bg-emerald-100 text-emerald-600" },
  listing_rejected: { icon: XCircle, color: "bg-red-100 text-red-600" },
  review: { icon: Star, color: "bg-amber-100 text-amber-600" },
  report_update: { icon: Shield, color: "bg-orange-100 text-orange-600" },
  system: { icon: Info, color: "bg-slate-100 text-slate-600" },
};

export default function NotificationsPage() {
  const toast = useToast();
  const [items, setItems] = useState<N[]>([]);
  const [loading, setLoading] = useState(true);
  const load = async () => {
    const r = await fetch("/api/notifications");
    const j = await r.json();
    setItems(j.data ?? []);
    setLoading(false);
  };
  useEffect(() => {
    load();
  }, []);
  const markAll = async () => {
    await fetch("/api/notifications", { method: "PATCH" });
    toast.success("تم تحديد الكل كمقروء");
    load();
  };
  return (
    <PageShell>
      <div className="container-app py-6 md:py-8 max-w-3xl">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-2xl md:text-3xl font-black flex items-center gap-2">
              <Bell className="size-7 text-[#00A86B]" /> الإشعارات
            </h1>
            <p className="text-sm text-soft mt-1">
              آخر التحديثات والتنبيهات
            </p>
          </div>
          {items.some((i) => !i.isRead) && (
            <Button variant="outline" size="sm" onClick={markAll}>
              <CheckCheck className="size-4" /> تحديد الكل كمقروء
            </Button>
          )}
        </div>
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="card p-4">
                <div className="skeleton h-4 w-1/2 mb-2" />
                <div className="skeleton h-3 w-3/4" />
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="card p-10 text-center">
            <div className="size-16 mx-auto rounded-2xl bg-soft flex items-center justify-center mb-3">
              <Bell className="size-7 text-soft" />
            </div>
            <h3 className="text-lg font-bold mb-1">لا توجد إشعارات</h3>
            <p className="text-sm text-soft">ستظهر هنا عند وصول أي إشعار</p>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((n) => {
              const meta = ICONS[n.type] || ICONS.system;
              const Icon = meta.icon;
              const content = (
                <div
                  className={cn(
                    "card p-4 flex items-start gap-3 transition-colors",
                    !n.isRead && "border-[#00A86B]/30 bg-[#00A86B]/5",
                  )}
                >
                  <div
                    className={cn(
                      "size-10 rounded-xl flex items-center justify-center shrink-0",
                      meta.color,
                    )}
                  >
                    <Icon className="size-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="font-bold text-app text-sm clamp-1">
                        {n.title}
                      </h3>
                      {!n.isRead && (
                        <span className="size-2 rounded-full bg-[#00A86B] shrink-0" />
                      )}
                    </div>
                    {n.body && (
                      <p className="text-sm text-soft clamp-2">{n.body}</p>
                    )}
                    <div className="text-[10px] text-soft mt-1">
                      {timeAgo(n.createdAt)}
                    </div>
                  </div>
                </div>
              );
              return n.link ? (
                <Link key={n.id} href={n.link}>
                  {content}
                </Link>
              ) : (
                <div key={n.id}>{content}</div>
              );
            })}
          </div>
        )}
      </div>
    </PageShell>
  );
}

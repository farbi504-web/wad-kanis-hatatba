"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import {
  Search,
  Moon,
  Sun,
  Menu,
  X,
  Plus,
  Bell,
  MessageCircle,
  Heart,
  Home,
  List,
  User as UserIcon,
  LogOut,
  Shield,
  LayoutDashboard,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/theme-provider";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Me {
  id: string;
  fullName: string;
  email: string;
  avatarUrl?: string | null;
  role: "user" | "seller" | "admin";
}

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggle } = useTheme();
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [, startTransition] = useTransition();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    let mounted = true;
    setMe(null);
    setLoading(true);
    fetch("/api/auth/me", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (!mounted) return;
        if (j?.data) {
          setMe(j.data);
        }
        setLoading(false);
      })
      .catch(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [pathname]);

  useEffect(() => {
    if (!me) {
      setUnread(0);
      return;
    }
    let mounted = true;
    fetch("/api/notifications/unread-count", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (mounted && j?.data) setUnread(j.data.count);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, [me, pathname]);

  // close mobile menu on route change
  useEffect(() => {
    setOpen(false);
    setMenuOpen(false);
  }, [pathname]);

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    startTransition(() => {
      router.push(`/listings?q=${encodeURIComponent(query.trim())}`);
    });
  };

  const onLogout = async () => {
    try {
      const r = await fetch("/api/auth/logout", { method: "POST" });
      if (r.ok) {
        toast.success("تم تسجيل الخروج بنجاح");
        setMe(null);
        router.push("/");
        router.refresh();
      }
    } catch {
      toast.error("تعذر تسجيل الخروج");
    }
  };

  const navItems = [
    { href: "/", label: "الرئيسية", icon: Home },
    { href: "/listings", label: "الإعلانات", icon: List },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-app bg-card/85 backdrop-blur-xl supports-[backdrop-filter]:bg-card/70">
      <div className="container-app">
        <div className="flex h-16 items-center gap-3">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group shrink-0">
            <div className="relative size-10 transition-transform group-hover:scale-105">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo.png"
                alt="واد كنيس حطاطبة"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="hidden sm:block leading-tight">
              <div className="text-base font-extrabold text-app">
                واد كنيس حطاطبة
              </div>
              <div className="text-[10px] text-soft">منصة مجتمعنا</div>
            </div>
          </Link>

          {/* Search */}
          <form
            onSubmit={onSearch}
            className="hidden md:flex flex-1 max-w-xl mx-auto"
          >
            <div className="relative w-full">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-soft pointer-events-none" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="ابحث عن إعلانات..."
                className="input !pr-10 !pl-4 !py-2 !rounded-full bg-soft border-transparent focus:!bg-card"
              />
            </div>
          </form>

          {/* Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((it) => {
              const active =
                it.href === "/"
                  ? pathname === "/"
                  : pathname?.startsWith(it.href);
              return (
                <Link
                  key={it.href}
                  href={it.href}
                  className={cn(
                    "px-3 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5",
                    active
                      ? "text-[#00A86B] bg-[#00A86B]/10"
                      : "text-soft hover:text-app hover:bg-soft",
                  )}
                >
                  <it.icon className="size-4" />
                  {it.label}
                </Link>
              );
            })}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={toggle}
              aria-label="تبديل المظهر"
              className="size-10 rounded-lg hover:bg-soft flex items-center justify-center text-soft hover:text-app transition-colors"
            >
              {theme === "dark" ? (
                <Sun className="size-5" />
              ) : (
                <Moon className="size-5" />
              )}
            </button>

            {me ? (
              <>
                <Link
                  href="/favorites"
                  className="hidden sm:flex size-10 rounded-lg hover:bg-soft items-center justify-center text-soft hover:text-app transition-colors"
                  aria-label="المفضلة"
                >
                  <Heart className="size-5" />
                </Link>
                <Link
                  href="/messages"
                  className="hidden sm:flex size-10 rounded-lg hover:bg-soft items-center justify-center text-soft hover:text-app transition-colors"
                  aria-label="الرسائل"
                >
                  <MessageCircle className="size-5" />
                </Link>
                <Link
                  href="/notifications"
                  className="relative size-10 rounded-lg hover:bg-soft flex items-center justify-center text-soft hover:text-app transition-colors"
                  aria-label="الإشعارات"
                >
                  <Bell className="size-5" />
                  {unread > 0 && (
                    <span className="absolute top-1.5 left-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                      {unread > 9 ? "9+" : unread}
                    </span>
                  )}
                </Link>
                <Link href="/listings/new" className="hidden sm:inline-flex">
                  <Button size="sm" className="!rounded-full">
                    <Plus className="size-4" />
                    <span>أضف إعلان</span>
                  </Button>
                </Link>
                <div className="relative">
                  <button
                    onClick={() => setMenuOpen((s) => !s)}
                    className="rounded-full focus:outline-none focus:ring-2 focus:ring-[#00A86B]/40"
                    aria-label="القائمة"
                  >
                    <Avatar src={me.avatarUrl} name={me.fullName} size={36} />
                  </button>
                  {menuOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setMenuOpen(false)}
                      />
                      <div className="absolute end-0 mt-2 w-64 rounded-2xl border border-app bg-card shadow-app-lg z-50 overflow-hidden animate-scale-in">
                        <div className="px-4 py-3 border-b border-app bg-soft">
                          <div className="font-bold text-app truncate">
                            {me.fullName}
                          </div>
                          <div className="text-xs text-soft truncate">
                            {me.email}
                          </div>
                          {me.role === "admin" && (
                            <span className="badge badge-accent mt-1.5">
                              <Shield className="size-3" /> مدير
                            </span>
                          )}
                        </div>
                        <div className="py-1.5">
                          <MenuLink
                        href="/profile"
                        icon={UserIcon}
                        label="الملف الشخصي"
                      />
                          <MenuLink
                            href="/dashboard"
                            icon={LayoutDashboard}
                            label="لوحة التحكم"
                          />
                          <MenuLink
                            href="/favorites"
                            icon={Heart}
                            label="المفضلة"
                          />
                          <MenuLink
                            href="/messages"
                            icon={MessageCircle}
                            label="الرسائل"
                          />
                          {me.role === "admin" && (
                            <MenuLink
                              href="/admin"
                              icon={Shield}
                              label="لوحة المدير"
                            />
                          )}
                          <button
                            onClick={onLogout}
                            className="w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center gap-2 transition-colors"
                          >
                            <LogOut className="size-4" />
                            تسجيل الخروج
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : loading ? null : (
              <>
                <Link href="/auth/login" className="hidden sm:inline-flex">
                  <Button variant="outline" size="sm" className="!rounded-full">
                    تسجيل الدخول
                  </Button>
                </Link>
                <Link href="/auth/register" className="hidden sm:inline-flex">
                  <Button size="sm" className="!rounded-full">
                    إنشاء حساب
                  </Button>
                </Link>
                <Link href="/auth/login" className="sm:hidden">
                  <Button size="sm" className="!rounded-full !px-3">
                    دخول
                  </Button>
                </Link>
              </>
            )}

            <button
              onClick={() => setOpen((s) => !s)}
              className="md:hidden size-10 rounded-lg hover:bg-soft flex items-center justify-center text-soft hover:text-app transition-colors"
              aria-label="القائمة"
            >
              {open ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {open && (
          <div className="md:hidden pb-4 animate-fade-in space-y-3">
            <form onSubmit={onSearch} className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-soft pointer-events-none" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="ابحث عن إعلانات..."
                className="input !pr-10 !rounded-full"
              />
            </form>
            <div className="grid grid-cols-2 gap-2">
              {navItems.map((it) => (
                <Link
                  key={it.href}
                  href={it.href}
                  className="px-3 py-2.5 rounded-lg bg-soft flex items-center gap-2 text-sm font-semibold"
                >
                  <it.icon className="size-4" /> {it.label}
                </Link>
              ))}
              {me && (
                <>
                  <Link
                    href="/favorites"
                    className="px-3 py-2.5 rounded-lg bg-soft flex items-center gap-2 text-sm font-semibold"
                  >
                    <Heart className="size-4" /> المفضلة
                  </Link>
                  <Link
                    href="/messages"
                    className="px-3 py-2.5 rounded-lg bg-soft flex items-center gap-2 text-sm font-semibold"
                  >
                    <MessageCircle className="size-4" /> الرسائل
                  </Link>
                </>
              )}
            </div>
            {me ? (
              <Link href="/listings/new" className="block">
                <Button className="w-full !rounded-full">
                  <Plus className="size-4" /> أضف إعلان
                </Button>
              </Link>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link href="/auth/login">
                  <Button variant="outline" className="w-full !rounded-full">
                    دخول
                  </Button>
                </Link>
                <Link href="/auth/register">
                  <Button className="w-full !rounded-full">حساب جديد</Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}

function MenuLink({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="px-4 py-2 text-sm text-app hover:bg-soft flex items-center gap-2 transition-colors"
    >
      <Icon className="size-4 text-soft" />
      {label}
    </Link>
  );
}

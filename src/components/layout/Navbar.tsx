"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  Menu,
  X,
  User,
  PlusCircle,
  LogOut,
  Heart,
  LayoutDashboard,
} from "lucide-react";
import type { SessionUser } from "@/lib/auth";

export default function Navbar({ session }: { session: SessionUser | null }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="w-9 h-9 bg-wdk-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">و</span>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold text-gray-900 leading-tight">
                واد كنيس
              </h1>
              <p className="text-xs text-gray-500 leading-tight">حطاطبة</p>
            </div>
          </Link>

          {/* Search Bar — Desktop */}
          <form
            onSubmit={handleSearch}
            className="hidden md:flex flex-1 max-w-xl"
          >
            <div className="relative w-full">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="ابحث عن أي شيء..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-10 pl-4 py-2.5 border border-gray-300 rounded-xl bg-gray-50 focus:bg-white focus:border-wdk-500 focus:ring-2 focus:ring-wdk-200 outline-none transition text-sm"
              />
            </div>
          </form>

          {/* Actions — Desktop */}
          <nav className="hidden md:flex items-center gap-2">
            {session ? (
              <>
                <Link
                  href="/post-ad"
                  className="flex items-center gap-1.5 bg-wdk-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-wdk-700 transition"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>نشر إعلان</span>
                </Link>
                <Link
                  href="/dashboard"
                  className="flex items-center gap-1.5 text-gray-700 px-3 py-2 rounded-xl text-sm hover:bg-gray-100 transition"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>لوحة التحكم</span>
                </Link>
                <Link
                  href="/dashboard?tab=favorites"
                  className="flex items-center gap-1.5 text-gray-700 px-3 py-2 rounded-xl text-sm hover:bg-gray-100 transition"
                >
                  <Heart className="w-4 h-4" />
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 text-gray-500 px-3 py-2 rounded-xl text-sm hover:bg-red-50 hover:text-red-600 transition"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-gray-700 px-4 py-2 rounded-xl text-sm hover:bg-gray-100 transition font-medium"
                >
                  تسجيل الدخول
                </Link>
                <Link
                  href="/register"
                  className="bg-wdk-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-wdk-700 transition"
                >
                  إنشاء حساب
                </Link>
              </>
            )}
          </nav>

          {/* Mobile Toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100"
          >
            {mobileOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-gray-100 py-4 space-y-3 animate-[slideDown_0.2s_ease-out]">
            <form onSubmit={handleSearch} className="mb-3">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="ابحث..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pr-10 pl-4 py-2.5 border border-gray-300 rounded-xl bg-gray-50 focus:bg-white focus:border-wdk-500 outline-none text-sm"
                />
              </div>
            </form>

            {session ? (
              <>
                <Link
                  href="/post-ad"
                  className="flex items-center gap-2 px-3 py-2.5 text-wdk-700 font-medium hover:bg-wdk-50 rounded-xl"
                  onClick={() => setMobileOpen(false)}
                >
                  <PlusCircle className="w-5 h-5" /> نشر إعلان
                </Link>
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2 px-3 py-2.5 text-gray-700 hover:bg-gray-100 rounded-xl"
                  onClick={() => setMobileOpen(false)}
                >
                  <LayoutDashboard className="w-5 h-5" /> لوحة التحكم
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileOpen(false);
                  }}
                  className="flex items-center gap-2 px-3 py-2.5 text-red-600 hover:bg-red-50 rounded-xl w-full"
                >
                  <LogOut className="w-5 h-5" /> تسجيل الخروج
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="block px-3 py-2.5 text-gray-700 hover:bg-gray-100 rounded-xl"
                  onClick={() => setMobileOpen(false)}
                >
                  تسجيل الدخول
                </Link>
                <Link
                  href="/register"
                  className="block px-3 py-2.5 bg-wdk-600 text-white text-center rounded-xl font-medium"
                  onClick={() => setMobileOpen(false)}
                >
                  إنشاء حساب
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  User,
  Mail,
  Phone,
  Lock,
  MapPin,
  Loader2,
  AlertCircle,
  UserPlus,
} from "lucide-react";
import { ALGERIA_WILAYAS, COMMUNES_TIPAZA } from "@/lib/utils";
import { toast } from "sonner";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    wilaya: "Tipaza",
    commune: "Hatatba",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("كلمتا المرور غير متطابقتين");
      setLoading(false);
      return;
    }

    if (form.password.length < 8) {
      setError("كلمة المرور يجب أن تكون 8 أحرف على الأقل");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: form.fullName,
          email: form.email,
          phone: form.phone,
          password: form.password,
          wilaya: form.wilaya,
          commune: form.commune,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "فشل إنشاء الحساب");
      }

      toast.success("تم إنشاء الحساب بنجاح!");
      router.push("/");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-lg">
        <div className="bg-white rounded-3xl border shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-wdk-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <UserPlus className="w-8 h-8 text-wdk-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">إنشاء حساب جديد</h1>
            <p className="text-gray-500 mt-1">انضم إلى مجتمع واد كنيس حطاطبة</p>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 mb-5 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                الاسم الكامل
              </label>
              <div className="relative">
                <User className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={form.fullName}
                  onChange={(e) => handleChange("fullName", e.target.value)}
                  required
                  placeholder="الاسم واللقب"
                  className="w-full pr-10 pl-4 py-3 border border-gray-300 rounded-xl bg-gray-50 focus:bg-white focus:border-wdk-500 focus:ring-2 focus:ring-wdk-100 outline-none transition text-sm"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                البريد الإلكتروني
              </label>
              <div className="relative">
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  required
                  dir="ltr"
                  placeholder="exemple@email.com"
                  className="w-full pr-10 pl-4 py-3 border border-gray-300 rounded-xl bg-gray-50 focus:bg-white focus:border-wdk-500 focus:ring-2 focus:ring-wdk-100 outline-none transition text-sm"
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                رقم الهاتف
              </label>
              <div className="relative">
                <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  required
                  dir="ltr"
                  placeholder="05XXXXXXXX"
                  className="w-full pr-10 pl-4 py-3 border border-gray-300 rounded-xl bg-gray-50 focus:bg-white focus:border-wdk-500 focus:ring-2 focus:ring-wdk-100 outline-none transition text-sm"
                />
              </div>
            </div>

            {/* Location */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  الولاية
                </label>
                <select
                  value={form.wilaya}
                  onChange={(e) => handleChange("wilaya", e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-3 py-3 text-sm bg-white focus:border-wdk-500 focus:ring-2 focus:ring-wdk-100 outline-none"
                >
                  {ALGERIA_WILAYAS.map((w) => (
                    <option key={w.code} value={w.nameFr}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  البلدية
                </label>
                <select
                  value={form.commune}
                  onChange={(e) => handleChange("commune", e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-3 py-3 text-sm bg-white focus:border-wdk-500 focus:ring-2 focus:ring-wdk-100 outline-none"
                >
                  {COMMUNES_TIPAZA.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Passwords */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                كلمة المرور
              </label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => handleChange("password", e.target.value)}
                  required
                  placeholder="8 أحرف على الأقل"
                  className="w-full pr-10 pl-4 py-3 border border-gray-300 rounded-xl bg-gray-50 focus:bg-white focus:border-wdk-500 focus:ring-2 focus:ring-wdk-100 outline-none transition text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                تأكيد كلمة المرور
              </label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={form.confirmPassword}
                  onChange={(e) =>
                    handleChange("confirmPassword", e.target.value)
                  }
                  required
                  placeholder="أعد كتابة كلمة المرور"
                  className="w-full pr-10 pl-4 py-3 border border-gray-300 rounded-xl bg-gray-50 focus:bg-white focus:border-wdk-500 focus:ring-2 focus:ring-wdk-100 outline-none transition text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-wdk-600 text-white py-3 rounded-xl font-bold hover:bg-wdk-700 transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <UserPlus className="w-5 h-5" />
              )}
              <span>{loading ? "جاري الإنشاء..." : "إنشاء الحساب"}</span>
            </button>
          </form>

          {/* Footer */}
          <p className="text-center text-sm text-gray-500 mt-6">
            لديك حساب بالفعل؟{" "}
            <Link
              href="/login"
              className="text-wdk-600 font-semibold hover:underline"
            >
              تسجيل الدخول
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

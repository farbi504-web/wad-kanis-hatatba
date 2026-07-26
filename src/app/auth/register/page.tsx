"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, Lock, User as UserIcon, Phone, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldError } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast-helper";
import { PageShell } from "@/components/page-shell";

export default function RegisterPage() {
  const toast = useToast();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirm: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (form.password !== form.confirm) {
      setError("كلمتا المرور غير متطابقتين");
      return;
    }
    if (form.password.length < 8) {
      setError("كلمة المرور يجب أن تكون 8 أحرف على الأقل");
      return;
    }
    setLoading(true);
    try {
      const r = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: form.fullName,
          email: form.email,
          phone: form.phone,
          password: form.password,
        }),
      });
      const j = await r.json();
      if (!r.ok) {
        setError(j.error?.message || "فشل إنشاء الحساب");
        return;
      }
      toast.success("تم إنشاء حسابك بنجاح");
      setTimeout(() => {
        window.location.href = "/";
      }, 300);
    } catch {
      setError("حدث خطأ في الاتصال");
    } finally {
      setLoading(false);
    }
  };

  const update = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((s) => ({ ...s, [k]: e.target.value }));

  return (
    <PageShell>
      <div className="container-app py-10 md:py-16">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-7">
            <div className="inline-block size-20 mb-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo.png"
                alt="واد كنيس حطاطبة"
                className="w-full h-full object-contain"
              />
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-app mb-1">
              إنشاء حساب جديد
            </h1>
            <p className="text-sm text-soft">انضم لمجتمع واد كنيس حطاطبة</p>
          </div>

          <form onSubmit={submit} className="card p-6 md:p-8 space-y-4">
            <FieldError>{error}</FieldError>
            <div>
              <Label>الاسم الكامل</Label>
              <div className="relative">
                <UserIcon className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-soft pointer-events-none" />
                <Input
                  required
                  value={form.fullName}
                  onChange={update("fullName")}
                  placeholder="محمد بن علي"
                  className="!pr-10"
                />
              </div>
            </div>
            <div>
              <Label>البريد الإلكتروني</Label>
              <div className="relative">
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-soft pointer-events-none" />
                <Input
                  type="email"
                  required
                  value={form.email}
                  onChange={update("email")}
                  placeholder="example@mail.com"
                  className="!pr-10"
                />
              </div>
            </div>
            <div>
              <Label>رقم الهاتف (اختياري)</Label>
              <div className="relative">
                <Phone className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-soft pointer-events-none" />
                <Input
                  type="tel"
                  value={form.phone}
                  onChange={update("phone")}
                  placeholder="0555 000 000"
                  className="!pr-10"
                />
              </div>
            </div>
            <div>
              <Label>كلمة المرور</Label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-soft pointer-events-none" />
                <Input
                  type="password"
                  required
                  value={form.password}
                  onChange={update("password")}
                  placeholder="8 أحرف على الأقل"
                  className="!pr-10"
                />
              </div>
            </div>
            <div>
              <Label>تأكيد كلمة المرور</Label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-soft pointer-events-none" />
                <Input
                  type="password"
                  required
                  value={form.confirm}
                  onChange={update("confirm")}
                  placeholder="أعد إدخال كلمة المرور"
                  className="!pr-10"
                />
              </div>
            </div>

            <label className="flex items-start gap-2 text-xs text-soft">
              <input
                type="checkbox"
                required
                className="size-4 accent-[#00A86B] mt-0.5"
              />
              <span>
                أوافق على{" "}
                <Link
                  href="/terms"
                  className="text-[#00A86B] hover:underline"
                >
                  الشروط والأحكام
                </Link>{" "}
                و{" "}
                <Link
                  href="/privacy"
                  className="text-[#00A86B] hover:underline"
                >
                  سياسة الخصوصية
                </Link>
              </span>
            </label>

            <Button
              type="submit"
              className="w-full"
              loading={loading}
              size="lg"
            >
              <UserPlus className="size-4" /> إنشاء الحساب
            </Button>

            <p className="text-center text-sm text-soft">
              لديك حساب بالفعل؟{" "}
              <Link
                href="/auth/login"
                className="text-[#00A86B] font-semibold hover:underline"
              >
                تسجيل الدخول
              </Link>
            </p>
          </form>
        </div>
      </div>
    </PageShell>
  );
}

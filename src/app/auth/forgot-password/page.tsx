"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, Lock, KeyRound, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldError } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast-helper";
import { PageShell } from "@/components/page-shell";

export default function ForgotPasswordPage() {
  const toast = useToast();
  const [step, setStep] = useState<"email" | "reset" | "done">("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError("كلمتا المرور غير متطابقتين");
      return;
    }
    if (password.length < 8) {
      setError("كلمة المرور يجب أن تكون 8 أحرف على الأقل");
      return;
    }
    setLoading(true);
    try {
      const r = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, newPassword: password }),
      });
      const j = await r.json();
      if (!r.ok) {
        setError(j.error?.message || "فشلت العملية");
        return;
      }
      toast.success("تم تحديث كلمة المرور");
      setStep("done");
      setTimeout(() => {
        window.location.href = "/";
      }, 1200);
    } catch {
      setError("حدث خطأ في الاتصال");
    } finally {
      setLoading(false);
    }
  };

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
              استعادة كلمة المرور
            </h1>
            <p className="text-sm text-soft">
              أدخل بريدك وكلمة مرور جديدة
            </p>
          </div>

          <form onSubmit={submit} className="card p-6 md:p-8 space-y-4">
            <FieldError>{error}</FieldError>
            <div>
              <Label>البريد الإلكتروني</Label>
              <div className="relative">
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-soft pointer-events-none" />
                <Input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@mail.com"
                  className="!pr-10"
                />
              </div>
            </div>
            <div>
              <Label>كلمة المرور الجديدة</Label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-soft pointer-events-none" />
                <Input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="أعد إدخال كلمة المرور"
                  className="!pr-10"
                />
              </div>
            </div>
            <Button type="submit" className="w-full" loading={loading} size="lg">
              تحديث كلمة المرور
            </Button>
            <Link
              href="/auth/login"
              className="flex items-center justify-center gap-1 text-sm text-[#00A86B] hover:underline font-semibold"
            >
              <ArrowLeft className="size-4" /> العودة لتسجيل الدخول
            </Link>
          </form>
        </div>
      </div>
    </PageShell>
  );
}

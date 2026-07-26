"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, Eye, EyeOff, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldError } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast-helper";
import { PageShell } from "@/components/page-shell";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginInner />
    </Suspense>
  );
}

function LoginInner() {
  const params = useSearchParams();
  const next = params.get("next") || "/";
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const r = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const j = await r.json();
      if (!r.ok) {
        setError(j.error?.message || "فشل تسجيل الدخول");
        return;
      }
      toast.success("مرحباً بعودتك");
      // Use full reload to ensure session is picked up by all server components
      setTimeout(() => {
        window.location.href = next;
      }, 300);
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
              تسجيل الدخول
            </h1>
            <p className="text-sm text-soft">
              مرحباً بعودتك! سجّل دخولك للمتابعة
            </p>
          </div>

          <form
            onSubmit={submit}
            className="card p-6 md:p-8 space-y-4"
          >
            <FieldError>{error}</FieldError>
            <div>
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <div className="relative">
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-soft pointer-events-none" />
                <Input
                  id="email"
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
              <Label htmlFor="password">كلمة المرور</Label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-soft pointer-events-none" />
                <Input
                  id="password"
                  type={showPwd ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="!pr-10 !pl-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-soft"
                >
                  {showPwd ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-soft">
                <input
                  type="checkbox"
                  className="size-4 accent-[#00A86B]"
                  defaultChecked
                />
                تذكرني
              </label>
              <Link
                href="/auth/forgot-password"
                className="text-[#00A86B] hover:underline font-semibold"
              >
                نسيت كلمة المرور؟
              </Link>
            </div>

            <Button
              type="submit"
              className="w-full"
              loading={loading}
              size="lg"
            >
              <LogIn className="size-4" /> دخول
            </Button>

            <p className="text-center text-sm text-soft">
              ليس لديك حساب؟{" "}
              <Link
                href="/auth/register"
                className="text-[#00A86B] font-semibold hover:underline"
              >
                أنشئ حساباً
              </Link>
            </p>
          </form>
        </div>
      </div>
    </PageShell>
  );
}

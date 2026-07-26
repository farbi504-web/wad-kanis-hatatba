"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Shield,
  Copy,
  Check,
  Download,
  ArrowRight,
  ArrowLeft,
  KeyRound,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { PageShell } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast-helper";

export default function TwoFactorPage() {
  const router = useRouter();
  const toast = useToast();
  const [step, setStep] = useState<"intro" | "scan" | "verify" | "backup" | "enabled">("intro");
  const [status, setStatus] = useState<{ enabled: boolean; backupCodesCount: number } | null>(null);
  const [setup, setSetup] = useState<{ secret: string; qrCodeUrl: string } | null>(null);
  const [code, setCode] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/auth/2fa")
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (j?.data) setStatus(j.data);
      });
  }, []);

  const startSetup = async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/auth/2fa?action=setup");
      const j = await r.json();
      if (r.ok) {
        setSetup(j.data);
        setStep("scan");
      }
    } finally {
      setLoading(false);
    }
  };

  const verify = async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/auth/2fa?action=enable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const j = await r.json();
      if (r.ok) {
        // جلب الـ backup codes
        const rc = await fetch("/api/auth/2fa?action=regenerate-backup-codes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password: prompt("أدخل كلمة المرور لتوليد أكواد احتياطية:") || "" }),
        });
        const rcj = await rc.json();
        if (rc.ok) {
          setBackupCodes(rcj.data?.backupCodes || []);
          setStep("backup");
        } else {
          setStep("enabled");
        }
      } else {
        toast.error(j.error?.message || "كود غير صحيح");
      }
    } finally {
      setLoading(false);
    }
  };

  const disable = async () => {
    if (!password) {
      toast.error("أدخل كلمة المرور");
      return;
    }
    setLoading(true);
    try {
      const r = await fetch("/api/auth/2fa?action=disable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (r.ok) {
        toast.success("تم تعطيل المصادقة الثنائية");
        setStatus({ enabled: false, backupCodesCount: 0 });
        setStep("intro");
        setPassword("");
      } else {
        const j = await r.json();
        toast.error(j.error?.message || "فشل");
      }
    } finally {
      setLoading(false);
    }
  };

  const copySecret = () => {
    if (setup?.secret) {
      navigator.clipboard.writeText(setup.secret);
      toast.success("تم نسخ المفتاح");
    }
  };

  const downloadCodes = () => {
    if (!backupCodes.length) return;
    const text = "أكواد الاسترداد - واد كنيس حطاطبة\n\n" +
      backupCodes.map((c, i) => `${i + 1}. ${c}`).join("\n") +
      "\n\n⚠️ احفظ هذه الأكواد في مكان آمن. كل كود يُستخدم مرة واحدة.";
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "wdk-backup-codes.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <PageShell>
      <div className="container-app py-6 md:py-8 max-w-2xl">
        <div className="text-center mb-6">
          <div className="inline-flex size-16 rounded-2xl bg-gradient-to-br from-[#F4B400] to-[#d89c00] items-center justify-center text-white mb-3">
            <Shield className="size-8" />
          </div>
          <h1 className="text-2xl md:text-3xl font-black">المصادقة الثنائية (2FA)</h1>
          <p className="text-sm text-soft mt-1">
            حماية إضافية لحسابك عبر تطبيق المصادقة
          </p>
        </div>

        {/* Enabled State */}
        {status?.enabled && step === "intro" && (
          <div className="card p-6">
            <div className="flex items-start gap-3 mb-4">
              <CheckCircle2 className="size-6 text-[#00A86B] shrink-0 mt-0.5" />
              <div>
                <h2 className="font-bold text-app text-lg">المصادقة الثنائية مفعّلة</h2>
                <p className="text-sm text-soft mt-1">
                  حسابك محمي بطبقة أمان إضافية. ستحتاج لإدخال كود من تطبيق المصادقة عند كل تسجيل دخول.
                </p>
              </div>
            </div>
            <div className="rounded-xl bg-soft p-4 mb-4 text-sm">
              <p className="font-semibold text-app mb-1">أكواد الاسترداد المتبقية: {status.backupCodesCount}</p>
              <p className="text-soft text-xs">إذا فقدت الوصول لتطبيقك، استخدم هذه الأكواد للدخول</p>
            </div>
            <div className="space-y-3">
              <details className="rounded-xl bg-soft p-4">
                <summary className="cursor-pointer text-sm font-semibold text-app">
                  إعادة توليد أكواد الاسترداد
                </summary>
                <div className="mt-3 space-y-2">
                  <Input
                    type="password"
                    placeholder="كلمة المرور"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <Button
                    onClick={async () => {
                      const r = await fetch("/api/auth/2fa?action=regenerate-backup-codes", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ password }),
                      });
                      if (r.ok) {
                        const j = await r.json();
                        setBackupCodes(j.data?.backupCodes || []);
                        setStep("backup");
                        toast.success("تم توليد أكواد جديدة");
                      }
                    }}
                    disabled={!password}
                    size="sm"
                  >
                    توليد
                  </Button>
                </div>
              </details>
              <details className="rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 p-4">
                <summary className="cursor-pointer text-sm font-semibold text-red-600">
                  تعطيل المصادقة الثنائية
                </summary>
                <div className="mt-3 space-y-2">
                  <div className="flex items-start gap-2 text-xs text-red-700 mb-2">
                    <AlertTriangle className="size-3.5 shrink-0 mt-0.5" />
                    <span>تحذير: تعطيل 2FA يقلل من أمان حسابك</span>
                  </div>
                  <Input
                    type="password"
                    placeholder="كلمة المرور للتأكيد"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <Button variant="danger" onClick={disable} loading={loading}>
                    تعطيل نهائياً
                  </Button>
                </div>
              </details>
            </div>
          </div>
        )}

        {/* Disabled - Setup flow */}
        {!status?.enabled && step === "intro" && (
          <div className="card p-6">
            <h2 className="font-bold text-app text-lg mb-2">
              فعّل المصادقة الثنائية
            </h2>
            <p className="text-sm text-soft mb-4">
              ستحتاج إلى تطبيق مثل Google Authenticator أو Microsoft Authenticator لمسح QR Code.
            </p>
            <div className="rounded-xl bg-soft p-4 mb-4 space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <Shield className="size-4 text-[#00A86B] shrink-0 mt-0.5" />
                <span>حماية قوية ضد الاختراق حتى لو سُرقت كلمة مرورك</span>
              </div>
              <div className="flex items-start gap-2">
                <Shield className="size-4 text-[#00A86B] shrink-0 mt-0.5" />
                <span>كل 30 ثانية كود جديد</span>
              </div>
              <div className="flex items-start gap-2">
                <Shield className="size-4 text-[#00A86B] shrink-0 mt-0.5" />
                <span>أكواد استرداد في حالة فقدان الجهاز</span>
              </div>
            </div>
            <Button onClick={startSetup} loading={loading} className="w-full" size="lg">
              <KeyRound className="size-4" /> ابدأ الإعداد
            </Button>
          </div>
        )}

        {/* Step: Scan QR */}
        {step === "scan" && setup && (
          <div className="card p-6">
            <h2 className="font-bold text-app text-lg mb-2">1. امسح QR Code</h2>
            <p className="text-sm text-soft mb-4">
              افتح تطبيق المصادقة على هاتفك وامسح الكود التالي
            </p>
            <div className="flex flex-col items-center">
              <div className="bg-white p-4 rounded-2xl shadow-lg">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={setup.qrCodeUrl}
                  alt="QR Code"
                  className="size-64"
                />
              </div>
              <div className="mt-4 w-full">
                <Label>أو أدخل المفتاح يدوياً</Label>
                <div className="flex gap-2">
                  <Input
                    readOnly
                    value={setup.secret}
                    className="font-mono text-sm"
                  />
                  <Button variant="outline" onClick={copySecret}>
                    <Copy className="size-4" />
                  </Button>
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <Button variant="outline" onClick={() => setStep("intro")}>
                <ArrowRight className="size-4 flip-x" /> رجوع
              </Button>
              <Button onClick={() => setStep("verify")} className="flex-1">
                التالي: تأكيد <ArrowLeft className="size-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step: Verify */}
        {step === "verify" && (
          <div className="card p-6">
            <h2 className="font-bold text-app text-lg mb-2">2. أدخل الكود</h2>
            <p className="text-sm text-soft mb-4">
              أدخل الكود المكون من 6 أرقام المعروض في تطبيقك
            </p>
            <div>
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                className="!text-center !text-2xl !tracking-widest font-mono"
                maxLength={6}
              />
            </div>
            <div className="flex gap-2 mt-5">
              <Button variant="outline" onClick={() => setStep("scan")}>
                <ArrowRight className="size-4 flip-x" /> رجوع
              </Button>
              <Button
                onClick={verify}
                loading={loading}
                disabled={code.length !== 6}
                className="flex-1"
              >
                تأكيد وتفعيل
              </Button>
            </div>
          </div>
        )}

        {/* Step: Backup codes */}
        {step === "backup" && backupCodes.length > 0 && (
          <div className="card p-6">
            <h2 className="font-bold text-app text-lg mb-2">3. أكواد الاسترداد</h2>
            <p className="text-sm text-soft mb-4">
              احفظ هذه الأكواد في مكان آمن. ستحتاجها إذا فقدت الوصول لتطبيقك.
            </p>
            <div className="bg-soft rounded-xl p-4 grid grid-cols-2 gap-2 mb-4">
              {backupCodes.map((c, i) => (
                <div
                  key={i}
                  className="font-mono text-sm bg-card border border-app rounded-lg px-3 py-2 text-center"
                >
                  {c}
                </div>
              ))}
            </div>
            <div className="flex items-start gap-2 text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 rounded-xl p-3 mb-4">
              <AlertTriangle className="size-4 shrink-0 mt-0.5" />
              <span>
                لن نعرض هذه الأكواد مرة أخرى! احفظها الآن في مكان آمن (مثل تطبيق مدير كلمات المرور).
              </span>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={downloadCodes}>
                <Download className="size-4" /> تحميل كملف
              </Button>
              <Button
                onClick={() => {
                  setStatus({ enabled: true, backupCodesCount: backupCodes.length });
                  setStep("intro");
                  toast.success("تم تفعيل المصادقة الثنائية بنجاح");
                }}
                className="flex-1"
              >
                <Check className="size-4" /> تم، انتهيت
              </Button>
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
}

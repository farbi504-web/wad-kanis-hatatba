"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Camera, Save, Lock, Trash2, User as UserIcon, Mail, Phone, MapPin, FileText, ShieldCheck } from "lucide-react";
import { PageShell } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea, FieldError } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { useToast } from "@/components/ui/use-toast-helper";

interface Me {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  bio: string | null;
  avatarUrl: string | null;
  role: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const toast = useToast();
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ fullName: "", phone: "", bio: "" });
  const [pwd, setPwd] = useState({ current: "", next: "", confirm: "" });
  const [pwdSaving, setPwdSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [, startTransition] = useTransition();

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (!j?.data) {
          router.push("/auth/login");
          return;
        }
        setMe(j.data);
        setForm({
          fullName: j.data.fullName || "",
          phone: j.data.phone || "",
          bio: j.data.bio || "",
        });
        setLoading(false);
      });
  }, [router]);

  const onAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", f);
      fd.append("bucket", "avatars");
      const r = await fetch("/api/upload", { method: "POST", body: fd });
      const j = await r.json();
      if (r.ok) {
        toast.success("تم تحديث صورتك");
        startTransition(() => {
          fetch("/api/auth/me")
            .then((r) => r.json())
            .then((j) => setMe(j.data));
          router.refresh();
        });
      } else {
        toast.error(j.error?.message || "فشل الرفع");
      }
    } catch {
      toast.error("فشل الرفع");
    } finally {
      setUploading(false);
    }
  };

  const removeAvatar = async () => {
    if (!confirm("حذف الصورة الشخصية؟")) return;
    try {
      await fetch("/api/upload?url=/uploads/avatars/x", { method: "DELETE" });
      toast.success("تم الحذف");
      startTransition(() => {
        fetch("/api/auth/me")
          .then((r) => r.json())
          .then((j) => setMe(j.data));
        router.refresh();
      });
    } catch {
      toast.error("فشل الحذف");
    }
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const r = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const j = await r.json();
      if (r.ok) {
        toast.success("تم تحديث ملفك الشخصي");
        router.refresh();
      } else {
        toast.error(j.error?.message || "فشل الحفظ");
      }
    } catch {
      toast.error("فشل الحفظ");
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdSaving(true);
    try {
      const r = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: pwd.current,
          newPassword: pwd.next,
          confirmPassword: pwd.confirm,
        }),
      });
      const j = await r.json();
      if (r.ok) {
        toast.success("تم تغيير كلمة المرور");
        setPwd({ current: "", next: "", confirm: "" });
      } else {
        toast.error(j.error?.message || "فشل التغيير");
      }
    } catch {
      toast.error("فشل التغيير");
    } finally {
      setPwdSaving(false);
    }
  };

  if (loading || !me) {
    return (
      <PageShell>
        <div className="container-app py-10 text-center text-soft">
          جاري التحميل...
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="container-app py-6 md:py-8 max-w-4xl">
        <h1 className="text-2xl md:text-3xl font-black mb-1">الملف الشخصي</h1>
        <p className="text-sm text-soft mb-6">إدارة معلوماتك الشخصية</p>

        <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-6">
          {/* Avatar Card */}
          <div className="card p-6 text-center h-fit">
            <div className="relative inline-block mb-3">
              <Avatar src={me.avatarUrl} name={me.fullName} size={120} />
              <label
                htmlFor="avatar"
                className="absolute bottom-0 left-0 size-9 rounded-full bg-[#00A86B] text-white flex items-center justify-center shadow-lg cursor-pointer hover:scale-110 transition-transform"
              >
                {uploading ? (
                  <span className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Camera className="size-4" />
                )}
              </label>
              <input
                id="avatar"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={onAvatar}
                className="hidden"
                disabled={uploading}
              />
            </div>
            <h2 className="font-bold text-app">{me.fullName}</h2>
            <p className="text-xs text-soft mt-1">{me.email}</p>
            {me.role === "admin" && (
              <span className="badge badge-accent mt-3 inline-flex">
                <ShieldCheck className="size-3" /> مدير
              </span>
            )}
            {me.avatarUrl && (
              <button
                onClick={removeAvatar}
                className="text-xs text-red-500 hover:underline mt-3 inline-flex items-center gap-1"
              >
                <Trash2 className="size-3" /> حذف الصورة
              </button>
            )}
          </div>

          <div className="space-y-5">
            {/* Profile form */}
            <form onSubmit={save} className="card p-6 space-y-4">
              <h3 className="font-bold text-app flex items-center gap-2">
                <UserIcon className="size-4 text-[#00A86B]" /> المعلومات
                الأساسية
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label>الاسم الكامل</Label>
                  <Input
                    value={form.fullName}
                    onChange={(e) =>
                      setForm((s) => ({ ...s, fullName: e.target.value }))
                    }
                    required
                  />
                </div>
                <div>
                  <Label>رقم الهاتف</Label>
                  <Input
                    value={form.phone}
                    onChange={(e) =>
                      setForm((s) => ({ ...s, phone: e.target.value }))
                    }
                    placeholder="0555 000 000"
                  />
                </div>
              </div>
              <div>
                <Label>نبذة عنك</Label>
                <Textarea
                  rows={3}
                  value={form.bio}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, bio: e.target.value }))
                  }
                  placeholder="اكتب نبذة قصيرة عنك..."
                />
              </div>
              <div className="flex justify-end">
                <Button type="submit" loading={saving}>
                  <Save className="size-4" /> حفظ التغييرات
                </Button>
              </div>
            </form>

            {/* Password */}
            <form onSubmit={changePassword} className="card p-6 space-y-4">
              <h3 className="font-bold text-app flex items-center gap-2">
                <Lock className="size-4 text-[#00A86B]" /> تغيير كلمة المرور
              </h3>
              <div>
                <Label>كلمة المرور الحالية</Label>
                <Input
                  type="password"
                  value={pwd.current}
                  onChange={(e) =>
                    setPwd((s) => ({ ...s, current: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label>كلمة المرور الجديدة</Label>
                  <Input
                    type="password"
                    value={pwd.next}
                    onChange={(e) =>
                      setPwd((s) => ({ ...s, next: e.target.value }))
                    }
                    required
                  />
                </div>
                <div>
                  <Label>تأكيد كلمة المرور</Label>
                  <Input
                    type="password"
                    value={pwd.confirm}
                    onChange={(e) =>
                      setPwd((s) => ({ ...s, confirm: e.target.value }))
                    }
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button type="submit" loading={pwdSaving}>
                  <Lock className="size-4" /> تغيير
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

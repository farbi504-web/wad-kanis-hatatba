"use client";

import { useState } from "react";
import { Mail, Phone, MapPin, Send, MessageCircle } from "lucide-react";
import { PageShell } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast-helper";

export default function ContactPage() {
  const toast = useToast();
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [sending, setSending] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    await new Promise((r) => setTimeout(r, 800));
    toast.success("تم استلام رسالتك، سنرد عليك قريباً");
    setForm({ name: "", email: "", subject: "", message: "" });
    setSending(false);
  };
  return (
    <PageShell>
      <div className="container-app py-8 md:py-12 max-w-5xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-black mb-2">اتصل بنا</h1>
          <p className="text-sm text-soft">
            نسعد بتواصلك معنا في أي وقت
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <form onSubmit={submit} className="card p-6 space-y-4">
            <div>
              <Label>الاسم</Label>
              <Input
                required
                value={form.name}
                onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
              />
            </div>
            <div>
              <Label>البريد الإلكتروني</Label>
              <Input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))}
              />
            </div>
            <div>
              <Label>الموضوع</Label>
              <Input
                required
                value={form.subject}
                onChange={(e) => setForm((s) => ({ ...s, subject: e.target.value }))}
              />
            </div>
            <div>
              <Label>الرسالة</Label>
              <Textarea
                required
                rows={5}
                value={form.message}
                onChange={(e) => setForm((s) => ({ ...s, message: e.target.value }))}
              />
            </div>
            <Button type="submit" loading={sending} className="w-full">
              <Send className="size-4" /> إرسال
            </Button>
          </form>
          <div className="space-y-4">
            <div className="card p-5">
              <h3 className="font-bold text-app mb-3">معلومات التواصل</h3>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-[#00A86B]/10 flex items-center justify-center text-[#00A86B]">
                    <MapPin className="size-5" />
                  </div>
                  <div>
                    <div className="font-semibold">العنوان</div>
                    <div className="text-soft">حطاطبة، تيبازة، الجزائر</div>
                  </div>
                </li>
                <li className="flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-[#00A86B]/10 flex items-center justify-center text-[#00A86B]">
                    <Phone className="size-5" />
                  </div>
                  <div>
                    <div className="font-semibold">الهاتف</div>
                    <div className="text-soft" dir="ltr">+213 555 000 000</div>
                  </div>
                </li>
                <li className="flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-[#00A86B]/10 flex items-center justify-center text-[#00A86B]">
                    <Mail className="size-5" />
                  </div>
                  <div>
                    <div className="font-semibold">البريد</div>
                    <div className="text-soft">contact@wad-kanis.dz</div>
                  </div>
                </li>
              </ul>
            </div>
            <div className="card p-5 bg-gradient-to-br from-[#00A86B]/10 to-transparent">
              <h3 className="font-bold text-app mb-2 flex items-center gap-2">
                <MessageCircle className="size-5 text-[#00A86B]" /> ساعات العمل
              </h3>
              <p className="text-sm text-soft">
                من السبت إلى الخميس: 9 صباحاً - 6 مساءً
                <br />
                الجمعة: مغلق
              </p>
              <p className="text-xs text-soft mt-3">
                نرد على الاستفسارات خلال 24 ساعة
              </p>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

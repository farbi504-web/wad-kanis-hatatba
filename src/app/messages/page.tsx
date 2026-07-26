"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  MessageCircle,
  Send,
  ArrowRight,
  Image as ImageIcon,
  Trash2,
  CheckCheck,
  Plus,
  X,
} from "lucide-react";
import { PageShell } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { useToast } from "@/components/ui/use-toast-helper";
import { cn, timeAgo } from "@/lib/utils";

interface Conv {
  id: string;
  listingId: string | null;
  buyerId: string;
  sellerId: string;
  lastMessageAt: string;
  buyerName: string;
  sellerName: string;
  buyerAvatar: string | null;
  sellerAvatar: string | null;
  listingTitle: string | null;
  listingSlug: string | null;
  lastMessage: { content: string; senderId: string; isRead: boolean } | null;
  unreadCount: number;
}

export default function MessagesPage() {
  const router = useRouter();
  const toast = useToast();
  const [me, setMe] = useState<{ id: string } | null>(null);
  const [convs, setConvs] = useState<Conv[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<any[]>([]);
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pollInterval, setPollInterval] = useState(5000);
  const [convDetails, setConvDetails] = useState<{
    buyer: { id: string; fullName: string; avatarUrl: string | null };
    seller: { id: string; fullName: string; avatarUrl: string | null };
    listing: { id: string; title: string; slug: string; price: number; currency: string } | null;
  } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((j) => setMe(j.data));
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!me) return;
      const r = await fetch("/api/conversations");
      const j = await r.json();
      if (cancelled) return;
      setConvs(j.data ?? []);
      setLoading(false);
    };
    load();
    const t = setInterval(load, 6000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [me]);

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    const load = async () => {
      const r = await fetch(`/api/conversations/${active}`);
      const j = await r.json();
      if (cancelled) return;
      if (j.data) {
        setMessages(j.data.messages || []);
        setConvDetails({
          buyer: j.data.buyer,
          seller: j.data.seller,
          listing: j.data.listing,
        });
      }
    };
    load();
    const t = setInterval(load, 3000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [active]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const send = async () => {
    if (!active || !content.trim()) return;
    setSending(true);
    try {
      const r = await fetch(`/api/conversations/${active}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const j = await r.json();
      if (r.ok) {
        setMessages((m) => [...m, j.data]);
        setContent("");
      } else {
        toast.error(j.error?.message || "فشل الإرسال");
      }
    } finally {
      setSending(false);
    }
  };

  const uploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f || !active) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(f.type)) {
      toast.error("نوع غير مدعوم");
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      toast.error("حجم يتجاوز 5 ميغابايت");
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", f);
      fd.append("bucket", "listing-images");
      const r = await fetch("/api/upload", { method: "POST", body: fd });
      const j = await r.json();
      if (r.ok) {
        const sr = await fetch(`/api/conversations/${active}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: "📷 صورة",
            type: "image",
            imageUrl: j.data.url,
          }),
        });
        const sj = await sr.json();
        if (sr.ok) {
          setMessages((m) => [...m, sj.data]);
        }
      }
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const deleteConv = async (id: string) => {
    if (!confirm("حذف هذه المحادثة؟")) return;
    const r = await fetch(`/api/conversations/${id}`, { method: "DELETE" });
    if (r.ok) {
      toast.success("تم الحذف");
      setConvs((arr) => arr.filter((c) => c.id !== id));
      if (active === id) setActive(null);
    }
  };

  const other = convDetails
    ? me?.id === convDetails.buyer.id
      ? convDetails.seller
      : convDetails.buyer
    : null;

  if (!me) {
    return (
      <PageShell>
        <div className="container-app py-10 text-center">
          <h2 className="text-xl font-bold mb-3">الرسائل</h2>
          <p className="text-soft mb-4">يجب تسجيل الدخول</p>
          <Link href="/auth/login?next=/messages">
            <Button>تسجيل الدخول</Button>
          </Link>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="container-app py-4 md:py-6">
        <h1 className="text-xl md:text-2xl font-black mb-4 flex items-center gap-2">
          <MessageCircle className="size-6 text-[#00A86B]" /> الرسائل
        </h1>
        <div className="card overflow-hidden grid grid-cols-1 md:grid-cols-[320px_1fr] h-[calc(100vh-180px)] min-h-[500px]">
          {/* List */}
          <div className="border-b md:border-b-0 md:border-l border-app overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-soft text-sm">
                جاري التحميل...
              </div>
            ) : convs.length === 0 ? (
              <div className="p-6 text-center text-soft text-sm">
                لا توجد محادثات
              </div>
            ) : (
              convs.map((c) => {
                const otherName =
                  me.id === c.buyerId ? c.sellerName : c.buyerName;
                const otherAvatar =
                  me.id === c.buyerId ? c.sellerAvatar : c.buyerAvatar;
                const isActive = active === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => setActive(c.id)}
                    className={cn(
                      "w-full text-right p-3 border-b border-app flex items-start gap-2.5 hover:bg-soft transition-colors",
                      isActive && "bg-[#00A86B]/5",
                    )}
                  >
                    <Avatar
                      src={otherAvatar}
                      name={otherName || "؟"}
                      size={44}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-bold text-app clamp-1 text-sm">
                          {otherName}
                        </span>
                        <span className="text-[10px] text-soft shrink-0">
                          {timeAgo(c.lastMessageAt)}
                        </span>
                      </div>
                      {c.listingTitle && (
                        <div className="text-[10px] text-[#00A86B] clamp-1">
                          {c.listingTitle}
                        </div>
                      )}
                      <div className="flex items-center justify-between gap-1 mt-0.5">
                        <span className="text-xs text-soft clamp-1">
                          {c.lastMessage?.content || "ابدأ المحادثة..."}
                        </span>
                        {c.unreadCount > 0 && (
                          <span className="size-5 rounded-full bg-[#00A86B] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                            {c.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Chat */}
          <div className="flex flex-col bg-soft">
            {!active ? (
              <div className="flex-1 flex items-center justify-center p-6 text-center text-soft">
                <div>
                  <MessageCircle className="size-12 mx-auto mb-3 text-soft" />
                  <h3 className="font-bold text-app mb-1">
                    اختر محادثة لعرض الرسائل
                  </h3>
                  <p className="text-sm">أو ابدأ محادثة جديدة من أي إعلان</p>
                </div>
              </div>
            ) : (
              <>
                <div className="bg-card border-b border-app p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    {other && (
                      <Avatar
                        src={other.avatarUrl}
                        name={other.fullName}
                        size={40}
                      />
                    )}
                    <div>
                      <div className="font-bold text-app text-sm">
                        {other?.fullName}
                      </div>
                      {convDetails?.listing && (
                        <Link
                          href={`/listings/${convDetails.listing.slug || convDetails.listing.id}`}
                          className="text-[10px] text-[#00A86B] hover:underline clamp-1"
                        >
                          بخصوص: {convDetails.listing.title}
                        </Link>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => deleteConv(active)}
                    className="size-8 rounded-lg hover:bg-soft flex items-center justify-center text-soft hover:text-red-500"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
                <div
                  ref={scrollRef}
                  className="flex-1 overflow-y-auto p-3 space-y-2"
                >
                  {messages.map((m) => {
                    const mine = m.senderId === me.id;
                    return (
                      <div
                        key={m.id}
                        className={cn(
                          "flex",
                          mine ? "justify-start" : "justify-end",
                        )}
                      >
                        <div
                          className={cn(
                            "max-w-[75%] rounded-2xl px-3 py-2 text-sm shadow",
                            mine
                              ? "bg-[#00A86B] text-white rounded-bl-sm"
                              : "bg-card text-app border border-app rounded-br-sm",
                          )}
                        >
                          {m.type === "image" && m.imageUrl && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={m.imageUrl}
                              alt=""
                              className="rounded-lg mb-1 max-w-full"
                            />
                          )}
                          <div className="whitespace-pre-wrap break-words">
                            {m.content}
                          </div>
                          <div
                            className={cn(
                              "text-[10px] mt-0.5 flex items-center gap-1",
                              mine ? "text-white/80" : "text-soft",
                            )}
                          >
                            {timeAgo(m.createdAt)}
                            {mine && (
                              <CheckCheck
                                className={cn(
                                  "size-3",
                                  m.isRead ? "text-white" : "text-white/60",
                                )}
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="bg-card border-t border-app p-3 flex items-end gap-2">
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={uploadImage}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                    className="size-10 rounded-lg bg-soft hover:bg-app/10 flex items-center justify-center shrink-0"
                  >
                    {uploading ? (
                      <span className="size-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <ImageIcon className="size-4" />
                    )}
                  </button>
                  <Textarea
                    rows={1}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        send();
                      }
                    }}
                    placeholder="اكتب رسالة..."
                    className="!min-h-[40px] !py-2"
                  />
                  <Button
                    onClick={send}
                    loading={sending}
                    disabled={!content.trim()}
                    className="shrink-0"
                    size="icon"
                  >
                    <Send className="size-4" />
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </PageShell>
  );
}

"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  Heart,
  Share2,
  MapPin,
  Eye,
  Calendar,
  Phone,
  MessageCircle,
  Star,
  Flag,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  CheckCircle2,
  ShieldCheck,
  Tag,
  ArrowRight,
  Send,
  User as UserIcon,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input, Textarea } from "@/components/ui/input";
import { SafeImage } from "@/components/ui/safe-image";
import { useToast } from "@/components/ui/use-toast-helper";
import { cn, formatPrice, timeAgo } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface Listing {
  id: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  currency: string;
  condition: "new" | "like_new" | "good" | "fair" | "used";
  status: string;
  isFeatured: boolean;
  viewsCount: number;
  contactPhone: string | null;
  location: string | null;
  rejectedReason: string | null;
  publishedAt: string | null;
  createdAt: string;
  userId: string;
}

interface Me {
  id: string;
  fullName: string;
  email: string;
  avatarUrl: string | null;
  role: string;
}

interface Props {
  listing: Listing;
  seller: {
    id: string;
    fullName: string;
    avatarUrl: string | null;
    ratingAvg: number;
    ratingCount: number;
    isVerified: boolean;
    createdAt: Date;
  } | undefined;
  category: { id: string; name: string; slug: string } | undefined;
  city: { id: string; name: string; slug: string } | undefined;
  images: { id: string; url: string; isPrimary: boolean; sortOrder: number }[];
  reviews: {
    id: string;
    rating: number;
    comment: string | null;
    createdAt: string;
    reviewerId: string;
    reviewerName: string | null;
    reviewerAvatar: string | null;
  }[];
  isFavorite: boolean;
  isOwner: boolean;
  me: Me | null;
}

const CONDITION_LABEL: Record<string, string> = {
  new: "جديد",
  like_new: "شبه جديد",
  good: "حالة جيدة",
  fair: "مقبول",
  used: "مستعمل",
};

const STATUS_LABEL: Record<string, { label: string; variant: "primary" | "secondary" | "accent" | "danger" | "outline" }> = {
  pending: { label: "قيد المراجعة", variant: "outline" },
  active: { label: "نشط", variant: "primary" },
  closed: { label: "مغلق", variant: "secondary" },
  sold: { label: "مباع", variant: "secondary" },
  rejected: { label: "مرفوض", variant: "danger" },
  draft: { label: "مسودة", variant: "outline" },
};

export function ListingDetailsView(props: Props) {
  const { listing, seller, category, city, images, reviews, isFavorite: initFav, isOwner, me } = props;
  const router = useRouter();
  const toast = useToast();
  const [fav, setFav] = useState(initFav);
  const [favLoading, setFavLoading] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [showPhone, setShowPhone] = useState(false);
  const [msgOpen, setMsgOpen] = useState(false);
  const [msgContent, setMsgContent] = useState("");
  const [sending, setSending] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reporting, setReporting] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [, startTransition] = useTransition();

  const primary = images.find((i) => i.isPrimary)?.url || images[0]?.url || "";

  const toggleFav = async () => {
    if (!me) {
      toast.info("سجّل دخولك لإضافة المفضلة");
      router.push("/auth/login");
      return;
    }
    setFavLoading(true);
    try {
      const r = await fetch(`/api/listings/${listing.id}/favorite`, {
        method: fav ? "DELETE" : "POST",
      });
      if (r.ok) setFav((v) => !v);
    } catch {
      toast.error("فشل التحديث");
    } finally {
      setFavLoading(false);
    }
  };

  const share = async () => {
    const url =
      typeof window !== "undefined" ? window.location.href : "";
    try {
      if (navigator.share) {
        await navigator.share({ title: listing.title, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("تم نسخ الرابط");
      }
    } catch {}
  };

  const sendMessage = async () => {
    if (!me) {
      toast.info("سجّل دخولك لإرسال رسالة");
      router.push("/auth/login");
      return;
    }
    if (!msgContent.trim()) return;
    setSending(true);
    try {
      const r = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId: listing.id,
          content: msgContent,
        }),
      });
      const j = await r.json();
      if (r.ok) {
        toast.success("تم إرسال رسالتك");
        const convId = j.data?.conversationId;
        if (convId) {
          startTransition(() => router.push(`/messages/${convId}`));
        }
        setMsgOpen(false);
        setMsgContent("");
      } else {
        toast.error(j.error?.message || "فشل الإرسال");
      }
    } catch {
      toast.error("فشل الإرسال");
    } finally {
      setSending(false);
    }
  };

  const submitReport = async () => {
    if (!me) {
      toast.info("سجّل دخولك للإبلاغ");
      return;
    }
    if (reportReason.trim().length < 4) {
      toast.error("اذكر سبب البلاغ");
      return;
    }
    setReporting(true);
    try {
      const r = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetType: "listing",
          targetId: listing.id,
          reason: reportReason,
        }),
      });
      if (r.ok) {
        toast.success("تم استلام البلاغ، شكراً لك");
        setReportOpen(false);
        setReportReason("");
      } else {
        const j = await r.json();
        toast.error(j.error?.message || "فشل الإبلاغ");
      }
    } catch {
      toast.error("فشل الإبلاغ");
    } finally {
      setReporting(false);
    }
  };

  const submitReview = async () => {
    if (!me) {
      toast.info("سجّل دخولك لتقييم البائع");
      return;
    }
    setSubmittingReview(true);
    try {
      const r = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sellerId: listing.userId,
          listingId: listing.id,
          rating: reviewRating,
          comment: reviewComment,
        }),
      });
      if (r.ok) {
        toast.success("شكراً لتقييمك");
        setShowReview(false);
        setReviewComment("");
        setReviewRating(5);
        router.refresh();
      } else {
        const j = await r.json();
        toast.error(j.error?.message || "فشل التقييم");
      }
    } catch {
      toast.error("فشل التقييم");
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="container-app py-6 md:py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-soft mb-4">
        <Link href="/" className="hover:text-app">
          الرئيسية
        </Link>
        <ChevronLeft className="size-3" />
        <Link href="/listings" className="hover:text-app">
          الإعلانات
        </Link>
        {category && (
          <>
            <ChevronLeft className="size-3" />
            <Link
              href={`/listings?category=${category.id}`}
              className="hover:text-app"
            >
              {category.name}
            </Link>
          </>
        )}
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
        <div className="space-y-6">
          {/* Gallery */}
          <div className="card overflow-hidden">
            <div className="relative aspect-[4/3] sm:aspect-[16/10] bg-soft">
              {images[activeImage]?.url ? (
                <SafeImage
                  src={images[activeImage].url}
                  alt={listing.title}
                  className="w-full h-full"
                  aspectRatio="16/10"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-soft">
                  لا توجد صور
                </div>
              )}
              <div className="absolute top-3 right-3 flex flex-col gap-1.5">
                {listing.isFeatured && (
                  <Badge variant="accent">
                    <Sparkles className="size-3" /> مميز
                  </Badge>
                )}
                <Badge variant={STATUS_LABEL[listing.status]?.variant || "outline"}>
                  {STATUS_LABEL[listing.status]?.label || listing.status}
                </Badge>
              </div>
              {images.length > 1 && (
                <>
                  <button
                    onClick={() =>
                      setActiveImage((i) =>
                        i === 0 ? images.length - 1 : i - 1,
                      )
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 size-10 rounded-full bg-white/90 dark:bg-black/70 backdrop-blur flex items-center justify-center"
                  >
                    <ChevronRight className="size-5" />
                  </button>
                  <button
                    onClick={() =>
                      setActiveImage((i) =>
                        i === images.length - 1 ? 0 : i + 1,
                      )
                    }
                    className="absolute left-3 top-1/2 -translate-y-1/2 size-10 rounded-full bg-white/90 dark:bg-black/70 backdrop-blur flex items-center justify-center"
                  >
                    <ChevronLeft className="size-5" />
                  </button>
                </>
              )}
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 p-3 overflow-x-auto">
                {images.map((img, i) => (
                  <button
                    key={img.id}
                    onClick={() => setActiveImage(i)}
                    className={cn(
                      "shrink-0 size-16 sm:size-20 rounded-lg overflow-hidden border-2 transition-all",
                      activeImage === i
                        ? "border-[#00A86B]"
                        : "border-transparent opacity-70",
                    )}
                  >
                    <SafeImage
                      src={img.url}
                      alt=""
                      className="w-full h-full"
                      aspectRatio="1/1"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Title + meta */}
          <div className="card p-5">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <h1 className="text-xl md:text-2xl font-black text-app mb-1.5 leading-tight">
                  {listing.title}
                </h1>
                <div className="flex flex-wrap items-center gap-2 text-xs text-soft">
                  {city && (
                    <span className="flex items-center gap-1">
                      <MapPin className="size-3.5" /> {city.name}
                    </span>
                  )}
                  {listing.location && (
                    <>
                      <span>·</span>
                      <span>{listing.location}</span>
                    </>
                  )}
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <Eye className="size-3.5" /> {listing.viewsCount} مشاهدة
                  </span>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="size-3.5" />
                    {listing.publishedAt
                      ? timeAgo(listing.publishedAt)
                      : timeAgo(listing.createdAt)}
                  </span>
                </div>
              </div>
              <div className="flex gap-1.5 shrink-0">
                <button
                  onClick={toggleFav}
                  disabled={favLoading}
                  className={cn(
                    "size-10 rounded-lg flex items-center justify-center border",
                    fav
                      ? "bg-red-50 border-red-200 text-red-500 dark:bg-red-950/30"
                      : "border-app text-soft hover:text-red-500",
                  )}
                >
                  <Heart className={cn("size-4", fav && "fill-current")} />
                </button>
                <button
                  onClick={share}
                  className="size-10 rounded-lg flex items-center justify-center border border-app text-soft hover:text-app"
                >
                  <Share2 className="size-4" />
                </button>
                {!isOwner && (
                  <button
                    onClick={() => setReportOpen(true)}
                    className="size-10 rounded-lg flex items-center justify-center border border-app text-soft hover:text-red-500"
                  >
                    <Flag className="size-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
              <Stat
                icon={Tag}
                label="السعر"
                value={formatPrice(listing.price, listing.currency)}
              />
              <Stat
                icon={CheckCircle2}
                label="الحالة"
                value={CONDITION_LABEL[listing.condition] || listing.condition}
              />
              <Stat
                icon={Tag}
                label="الفئة"
                value={category?.name || "-"}
              />
              <Stat
                icon={MapPin}
                label="المدينة"
                value={city?.name || "-"}
              />
            </div>
          </div>

          {/* Description */}
          <div className="card p-5">
            <h2 className="font-bold text-app mb-3">الوصف</h2>
            <p className="text-sm text-soft whitespace-pre-wrap leading-relaxed">
              {listing.description}
            </p>
          </div>

          {/* Seller */}
          {seller && (
            <div className="card p-5">
              <div className="flex items-center gap-3 mb-4">
                <Avatar src={seller.avatarUrl} name={seller.fullName} size={56} />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/seller/${seller.id}`}
                      className="font-bold text-app hover:text-[#00A86B]"
                    >
                      {seller.fullName}
                    </Link>
                    {seller.isVerified && (
                      <CheckCircle2 className="size-4 text-[#00A86B]" />
                    )}
                  </div>
                  <div className="text-xs text-soft flex items-center gap-2 mt-0.5">
                    <span className="flex items-center gap-1">
                      <Star className="size-3.5 fill-[#F4B400] text-[#F4B400]" />
                      {Number(seller.ratingAvg).toFixed(1)} ({seller.ratingCount})
                    </span>
                    <span>·</span>
                    <span>عضو منذ {timeAgo(seller.createdAt)}</span>
                  </div>
                </div>
                <Link
                  href={`/seller/${seller.id}`}
                  className="text-xs text-[#00A86B] hover:underline"
                >
                  عرض الملف
                </Link>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {me && me.id !== seller.id && (
                  <Button
                    onClick={() => setShowReview(true)}
                    variant="outline"
                    size="sm"
                    className="!text-xs"
                  >
                    <Star className="size-3.5" /> تقييم البائع
                  </Button>
                )}
                <Link href={`/seller/${seller.id}`}>
                  <Button variant="outline" size="sm" className="w-full !text-xs">
                    <UserIcon className="size-3.5" /> إعلانات البائع
                  </Button>
                </Link>
              </div>

              {reviews.length > 0 && (
                <div className="mt-5 pt-5 border-t border-app">
                  <h3 className="font-bold text-app text-sm mb-3">
                    آراء المشترين ({seller.ratingCount})
                  </h3>
                  <div className="space-y-3">
                    {reviews.slice(0, 5).map((r) => (
                      <div key={r.id} className="flex gap-2.5">
                        <Avatar
                          src={r.reviewerAvatar}
                          name={r.reviewerName || "؟"}
                          size={36}
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 text-xs">
                            <span className="font-semibold text-app">
                              {r.reviewerName}
                            </span>
                            <div className="flex">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                  key={i}
                                  className={cn(
                                    "size-3",
                                    i < r.rating
                                      ? "fill-[#F4B400] text-[#F4B400]"
                                      : "text-soft",
                                  )}
                                />
                              ))}
                            </div>
                            <span className="text-soft">
                              {timeAgo(r.createdAt)}
                            </span>
                          </div>
                          {r.comment && (
                            <p className="text-sm text-soft mt-1">
                              {r.comment}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="card p-5 sticky top-20">
            <div className="text-3xl font-black text-[#00A86B] mb-1">
              {formatPrice(listing.price, listing.currency)}
            </div>
            <div className="text-xs text-soft mb-4">
              {CONDITION_LABEL[listing.condition]}
            </div>
            {!isOwner && me ? (
              <div className="space-y-2">
                <Button
                  className="w-full"
                  onClick={() => setMsgOpen(!msgOpen)}
                >
                  <MessageCircle className="size-4" /> مراسلة البائع
                </Button>
                {listing.contactPhone && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setShowPhone((v) => !v)}
                  >
                    <Phone className="size-4" />
                    {showPhone ? listing.contactPhone : "إظهار رقم الهاتف"}
                  </Button>
                )}
              </div>
            ) : !me ? (
              <div className="space-y-2">
                <Link href="/auth/login">
                  <Button className="w-full">
                    <MessageCircle className="size-4" /> سجل دخولك للمراسلة
                  </Button>
                </Link>
                {listing.contactPhone && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setShowPhone((v) => !v)}
                  >
                    <Phone className="size-4" />
                    {showPhone ? listing.contactPhone : "إظهار الرقم"}
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <Link href={`/dashboard/listings/${listing.id}/edit`}>
                  <Button className="w-full">
                    <Tag className="size-4" /> تعديل الإعلان
                  </Button>
                </Link>
                <Badge variant={STATUS_LABEL[listing.status]?.variant || "outline"} className="w-full justify-center py-1.5">
                  {STATUS_LABEL[listing.status]?.label}
                </Badge>
              </div>
            )}

            {msgOpen && (
              <div className="mt-3 space-y-2 border-t border-app pt-3">
                <Textarea
                  rows={3}
                  value={msgContent}
                  onChange={(e) => setMsgContent(e.target.value)}
                  placeholder="اكتب رسالتك للبائع..."
                />
                <Button
                  className="w-full"
                  onClick={sendMessage}
                  loading={sending}
                  disabled={!msgContent.trim()}
                >
                  <Send className="size-4" /> إرسال
                </Button>
              </div>
            )}

            <div className="mt-4 pt-4 border-t border-app space-y-2 text-xs text-soft">
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-3.5 text-[#00A86B]" />
                <span>تعاملات آمنة وموثوقة</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="size-3.5 text-[#00A86B]" />
                <span>تواصل مباشر مع البائع</span>
              </div>
            </div>
          </div>

          {/* Safety tips */}
          <div className="card p-5 bg-gradient-to-br from-[#F4B400]/10 to-transparent">
            <h3 className="font-bold text-app text-sm mb-2">نصائح للسلامة</h3>
            <ul className="text-xs text-soft space-y-1.5">
              <li>• قابل البائع في مكان عام</li>
              <li>• افحص المنتج قبل الشراء</li>
              <li>• لا تدفع مقدماً دون استلام</li>
              <li>• أبلغ عن أي سلوك مشبوه</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Report Modal */}
      {reportOpen && (
        <Modal title="الإبلاغ عن هذا الإعلان" onClose={() => setReportOpen(false)}>
          <Textarea
            rows={4}
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
            placeholder="اذكر سبب البلاغ..."
          />
          <div className="flex gap-2 mt-3 justify-end">
            <Button variant="outline" onClick={() => setReportOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={submitReport} loading={reporting} variant="danger">
              إرسال البلاغ
            </Button>
          </div>
        </Modal>
      )}

      {/* Review Modal */}
      {showReview && (
        <Modal title="تقييم البائع" onClose={() => setShowReview(false)}>
          <div className="flex items-center justify-center gap-2 my-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <button
                key={i}
                onClick={() => setReviewRating(i + 1)}
                className="size-10"
              >
                <Star
                  className={cn(
                    "size-8 mx-auto",
                    i < reviewRating
                      ? "fill-[#F4B400] text-[#F4B400]"
                      : "text-soft",
                  )}
                />
              </button>
            ))}
          </div>
          <Textarea
            rows={3}
            value={reviewComment}
            onChange={(e) => setReviewComment(e.target.value)}
            placeholder="تعليقك (اختياري)..."
          />
          <div className="flex gap-2 mt-3 justify-end">
            <Button variant="outline" onClick={() => setShowReview(false)}>
              إلغاء
            </Button>
            <Button onClick={submitReview} loading={submittingReview}>
              إرسال التقييم
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-soft p-3">
      <div className="flex items-center gap-1.5 text-[10px] text-soft mb-1">
        <Icon className="size-3" /> {label}
      </div>
      <div className="text-sm font-bold text-app clamp-1">{value}</div>
    </div>
  );
}

function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-card rounded-2xl border border-app w-full max-w-md p-5 animate-scale-in shadow-app-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-bold mb-3">{title}</h3>
        {children}
      </div>
    </div>
  );
}

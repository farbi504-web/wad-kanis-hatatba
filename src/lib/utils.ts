import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^\p{Letter}\p{Number}\s-]/gu, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 200);
}

export function formatPrice(value: number, currency = "DZD"): string {
  if (value === 0) return "مجاناً";
  try {
    return new Intl.NumberFormat("ar-DZ", {
      maximumFractionDigits: 0,
    }).format(value) + " " + currency;
  } catch {
    return `${value} ${currency}`;
  }
}

export function timeAgo(date: Date | string | null | undefined): string {
  if (!date) return "غير معروف";
  const d = typeof date === "string" ? new Date(date) : date;
  if (!(d instanceof Date) || isNaN(d.getTime())) return "غير معروف";

  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 0) return "الآن";
  if (diff < 60) return "الآن";
  if (diff < 3600) return `قبل ${Math.floor(diff / 60)} دقيقة`;
  if (diff < 86400) return `قبل ${Math.floor(diff / 3600)} ساعة`;
  if (diff < 86400 * 7) return `قبل ${Math.floor(diff / 86400)} يوم`;
  if (diff < 86400 * 30) return `قبل ${Math.floor(diff / 604800)} أسبوع`;
  if (diff < 86400 * 365)
    return `قبل ${Math.floor(diff / 2592000)} شهر`;
  return `قبل ${Math.floor(diff / 31536000)} سنة`;
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "غير معروف";
  const d = typeof date === "string" ? new Date(date) : date;
  if (!(d instanceof Date) || isNaN(d.getTime())) return "غير معروف";
  try {
    return new Intl.DateTimeFormat("ar-DZ", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(d);
  } catch {
    return d.toISOString().slice(0, 10);
  }
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

const RATE_LIMIT = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(
  key: string,
  limit = 30,
  windowMs = 60_000,
): boolean {
  const now = Date.now();
  const entry = RATE_LIMIT.get(key);
  if (!entry || entry.resetAt < now) {
    RATE_LIMIT.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= limit) return false;
  entry.count += 1;
  return true;
}

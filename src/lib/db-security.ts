/**
 * Database Security Layer
 * يوفر طبقة موحدة للتفاعل الآمن مع قاعدة البيانات
 */
import { sql, eq, and, or, inArray, like, ilike, desc, asc } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { z } from "zod";
import { rateLimit } from "@/lib/rate-limit";

/**
 * التحقق من صحة UUID قبل استخدامه في الاستعلامات
 */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function validateUUID(id: unknown, fieldName = "id"): string {
  if (typeof id !== "string" || !UUID_REGEX.test(id)) {
    throw new Error(`Invalid ${fieldName}: must be a valid UUID`);
  }
  return id.toLowerCase();
}

/**
 * Sanitize نص للبحث
 * يحمي من LIKE injection عبر إزالة الـ wildcards الخطيرة
 */
export function sanitizeSearch(input: string, maxLength = 100): string {
  if (typeof input !== "string") return "";
  return input
    .trim()
    .slice(0, maxLength)
    // إزالة الأحرف الخاصة بـ LIKE/ILIKE
    .replace(/[%_\\]/g, (c) => "\\" + c)
    // إزالة أي NULL bytes
    .replace(/\0/g, "");
}

/**
 * التحقق من Pagination values
 */
export function validatePagination(page: unknown, limit: unknown, maxLimit = 100) {
  const parsedPage = Number(page);
  const parsedLimit = Number(limit);
  
  if (!Number.isInteger(parsedPage) || parsedPage < 1) {
    return { page: 1, limit: 24 };
  }
  if (!Number.isInteger(parsedLimit) || parsedLimit < 1 || parsedLimit > maxLimit) {
    return { page: parsedPage, limit: 24 };
  }
  return { page: parsedPage, limit: parsedLimit };
}

/**
 * إعدادات Drizzle آمنة - منع أي template literal في SQL
 */
export function safeEq(column: any, value: unknown) {
  if (value == null) return sql`${column} IS NULL`;
  return eq(column, value);
}

/**
 * ILIKE آمن للبحث النصي
 */
export function safeILike(column: any, value: string) {
  const sanitized = sanitizeSearch(value);
  return ilike(column, `%${sanitized}%`);
}

/**
 * Rate Limiting للاستعلامات
 */
export function queryRateLimit(identifier: string, queryType: string) {
  return rateLimit(`query:${queryType}:${identifier}`, 100, 60_000);
}

/**
 * Helper لـ safe user lookup
 */
export async function safeGetUserById(id: unknown) {
  const validId = validateUUID(id);
  return db.select().from(users).where(eq(users.id, validId)).limit(1);
}

/**
 * Helper لـ safe user lookup by email
 * يستخدم indexed search بدون LIKE
 */
export async function safeGetUserByEmail(email: string) {
  const sanitized = email.toLowerCase().trim().slice(0, 255);
  return db.select().from(users).where(eq(users.email, sanitized)).limit(1);
}

/**
 * Query Logger - لتسجيل الاستعلامات المشبوهة
 */
const QUERY_LOG: { timestamp: number; query: string; duration: number; suspicious: boolean }[] = [];

export function logQuery(query: string, duration: number, suspicious = false) {
  QUERY_LOG.push({ timestamp: Date.now(), query, duration, suspicious });
  // الاحتفاظ بآخر 1000 استعلام فقط
  if (QUERY_LOG.length > 1000) QUERY_LOG.shift();
  
  if (suspicious) {
    console.warn("[db] suspicious query detected:", query.slice(0, 200));
  }
  
  // كشف الأنماط المشبوهة
  const suspiciousPatterns = [
    /(\bUNION\b.*\bSELECT\b)/i,
    /(;\s*DROP\b)/i,
    /(;\s*DELETE\b)/i,
    /(\bOR\b\s+\d+\s*=\s*\d+)/i,
    /(';\s*--)/i,
    /(\bSLEEP\s*\()/i,
    /(\bBENCHMARK\s*\()/i,
  ];
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(query)) {
      logQuery(query, duration, true);
      break;
    }
  }
}

export function getQueryStats() {
  return {
    total: QUERY_LOG.length,
    suspicious: QUERY_LOG.filter((q) => q.suspicious).length,
    recent: QUERY_LOG.slice(-50),
  };
}

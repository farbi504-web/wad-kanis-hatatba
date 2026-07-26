/**
 * Security Event Logger
 * - تسجيل كل الأحداث الأمنية في security_events
 * - مستويات الخطورة: low, medium, high, critical
 */
import { db } from "@/db";
import { securityEvents } from "@/db/schema";
import { getClientIp } from "@/lib/rate-limit";
import type { NextRequest } from "next/server";

export type SecurityEventType =
  | "login_success"
  | "login_failure"
  | "login_locked"
  | "logout"
  | "register_success"
  | "register_failure"
  | "password_change"
  | "password_reset_request"
  | "password_reset_success"
  | "password_reset_failure"
  | "email_verification"
  | "phone_verification"
  | "2fa_enable"
  | "2fa_disable"
  | "2fa_success"
  | "2fa_failure"
  | "session_created"
  | "session_revoked"
  | "session_hijack_attempt"
  | "suspicious_activity"
  | "captcha_failure"
  | "account_banned"
  | "role_changed"
  | "ip_blocked"
  | "rate_limit_exceeded"
  | "data_export";

export type SeverityLevel = "low" | "medium" | "high" | "critical";

export interface SecurityEventParams {
  userId?: string | null;
  eventType: SecurityEventType;
  severity?: SeverityLevel;
  description?: string;
  meta?: Record<string, unknown>;
  req?: NextRequest;
}

export async function logSecurityEvent(params: SecurityEventParams): Promise<void> {
  try {
    await db.insert(securityEvents).values({
      userId: params.userId ?? null,
      eventType: params.eventType,
      severity: params.severity ?? "low",
      description: params.description ?? null,
      meta: params.meta
        ? {
            ...params.meta,
            userAgent: params.req?.headers.get("user-agent")?.slice(0, 200),
          }
        : null,
      ip: params.req ? getClientIp(params.req) : null,
      userAgent: params.req?.headers.get("user-agent")?.slice(0, 200) ?? null,
    });
  } catch (e) {
    // لا نريد أن يفشل الطلب بسبب فشل التسجيل
    console.error("[security] failed to log event:", e);
  }
}

/**
 * جلب الأحداث الأمنية لمستخدم
 */
export async function getUserSecurityEvents(userId: string, limit = 50) {
  const { db } = await import("@/db");
  const { securityEvents } = await import("@/db/schema");
  const { desc, eq } = await import("drizzle-orm");

  return db
    .select()
    .from(securityEvents)
    .where(eq(securityEvents.userId, userId))
    .orderBy(desc(securityEvents.createdAt))
    .limit(limit);
}

/**
 * كشف النشاط المريب
 * مثال: محاولات متعددة فاشلة من نفس IP
 */
export async function detectSuspiciousActivity(
  userId: string | null,
  ip: string,
): Promise<{
  suspicious: boolean;
  reason?: string;
  failedAttemptsLast15Min?: number;
}> {
  const { and, eq, gte } = await import("drizzle-orm");
  const fifteenMinAgo = new Date(Date.now() - 15 * 60_000);

  const events = await db
    .select()
    .from(securityEvents)
    .where(
      and(
        ip ? eq(securityEvents.ip, ip) : undefined,
        userId ? eq(securityEvents.userId, userId) : undefined,
        gte(securityEvents.createdAt, fifteenMinAgo),
      ),
    );

  const failures = events.filter(
    (e) =>
      e.eventType === "login_failure" || e.eventType === "2fa_failure",
  );

  if (failures.length >= 10) {
    return {
      suspicious: true,
      reason: "عدد كبير من المحاولات الفاشلة",
      failedAttemptsLast15Min: failures.length,
    };
  }

  // كشف IPs مختلفة على نفس الحساب
  const uniqueIPs = new Set(events.map((e) => e.ip).filter(Boolean));
  if (userId && uniqueIPs.size > 5) {
    return {
      suspicious: true,
      reason: "تسجيل دخول من عدة مواقع جغرافية",
    };
  }

  return { suspicious: false };
}

/**
 * Authentication Service
 * - يجمع كل طبقات الأمان في API واحد
 * - يستخدم في routes Login/Register/Password Reset
 */
import { db } from "@/db";
import {
  users,
  loginAttempts,
  passwordResets,
  emailVerifications,
  phoneVerifications,
} from "@/db/schema";
import { and, desc, eq, gt, gte, isNull, sql } from "drizzle-orm";
import { hashPassword, verifyPassword } from "@/lib/auth";
import { hashToken, generateToken, generateOTP, hashOTP, isExpired } from "@/lib/tokens";
import { verifyCaptcha } from "@/lib/captcha";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { logSecurityEvent } from "@/lib/security-events";
import { createSession } from "@/lib/session-manager";
import { searchHash } from "@/lib/crypto";
import type { NextRequest } from "next/server";

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60_000;
const PROGRESSIVE_DELAY_MS = [0, 1000, 2000, 5000, 10000]; // تأخير متزايد
const DUMMY_HASH =
  "$2a$10$abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ12";

export interface LoginContext {
  req: NextRequest;
  email: string;
  password: string;
  captchaId?: string;
  captchaAnswer?: string;
}

export interface LoginResult {
  success: boolean;
  user?: typeof users.$inferSelect;
  requires2FA?: boolean;
  requiresCaptcha?: boolean;
  error?: string;
  errorCode?:
    | "rate_limited"
    | "captcha_required"
    | "captcha_invalid"
    | "invalid_credentials"
    | "account_locked"
    | "account_banned";
  retryAfter?: number;
}

/**
 * تسجيل Login Attempt
 */
async function recordLoginAttempt(
  email: string,
  userId: string | null,
  ip: string,
  userAgent: string,
  success: boolean,
  reason: string | null,
) {
  try {
    await db.insert(loginAttempts).values({
      email,
      userId,
      ip,
      userAgent,
      success,
      failureReason: reason,
    });
  } catch (e) {
    console.error("[auth] failed to record login attempt:", e);
  }
}

/**
 * عد المحاولات الفاشلة الأخيرة
 */
async function getRecentFailedAttempts(email: string, windowMs: number) {
  const since = new Date(Date.now() - windowMs);
  const result = await db
    .select({ count: sql<number>`cast(count(*) as integer)` })
    .from(loginAttempts)
    .where(
      and(
        eq(loginAttempts.email, email),
        eq(loginAttempts.success, false),
        gte(loginAttempts.createdAt, since),
      ),
    );
  return Number(result[0]?.count ?? 0);
}

/**
 * Progressive Delay
 * يضيف تأخير متزايد بعد كل محاولة فاشلة
 */
async function progressiveDelay(failedCount: number) {
  const delay = PROGRESSIVE_DELAY_MS[Math.min(failedCount, PROGRESSIVE_DELAY_MS.length - 1)];
  if (delay > 0) {
    await new Promise((r) => setTimeout(r, delay));
  }
}

/**
 * Login Service
 */
export async function login(ctx: LoginContext): Promise<LoginResult> {
  const ip = getClientIp(ctx.req);
  const userAgent = ctx.req.headers.get("user-agent") || "";
  const email = ctx.email.toLowerCase().trim();

  // 1) Rate Limiting على مستوى IP
  const ipRateLimit = rateLimit(`login:ip:${ip}`, 15, 15 * 60_000);
  if (!ipRateLimit.allowed) {
    await logSecurityEvent({
      eventType: "rate_limit_exceeded",
      severity: "high",
      description: "تجاوز حد محاولات تسجيل الدخول من IP",
      meta: { ip, email },
      req: ctx.req,
    });
    return {
      success: false,
      error: "تم تجاوز عدد المحاولات من هذا الجهاز. حاول بعد 15 دقيقة.",
      errorCode: "rate_limited",
      retryAfter: Math.ceil((ipRateLimit.resetAt - Date.now()) / 1000),
    };
  }

  // 2) Rate Limiting على مستوى Email
  const emailRateLimit = rateLimit(`login:email:${email}`, 10, 15 * 60_000);
  if (!emailRateLimit.allowed) {
    return {
      success: false,
      error: "تم تجاوز عدد المحاولات على هذا البريد. حاول بعد 15 دقيقة.",
      errorCode: "rate_limited",
      retryAfter: Math.ceil((emailRateLimit.resetAt - Date.now()) / 1000),
    };
  }

  // 3) CAPTCHA بعد عدة محاولات فاشلة
  const failedCount = await getRecentFailedAttempts(email, 15 * 60_000);
  if (failedCount >= 3) {
    if (!ctx.captchaId || !ctx.captchaAnswer) {
      return {
        success: false,
        error: "يجب إكمال التحقق CAPTCHA",
        errorCode: "captcha_required",
        requiresCaptcha: true,
      };
    }
    const captchaValid = await verifyCaptcha(ctx.captchaId, ctx.captchaAnswer, ip);
    if (!captchaValid) {
      await logSecurityEvent({
        eventType: "captcha_failure",
        severity: "medium",
        req: ctx.req,
        meta: { email },
      });
      return {
        success: false,
        error: "إجابة CAPTCHA غير صحيحة",
        errorCode: "captcha_invalid",
        requiresCaptcha: true,
      };
    }
  }

  // 4) البحث عن المستخدم
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  // 5) Constant-time حتى لو المستخدم غير موجود
  if (!user) {
    await verifyPassword(ctx.password, DUMMY_HASH);
    await recordLoginAttempt(email, null, ip, userAgent, false, "user_not_found");
    await progressiveDelay(failedCount);
    await logSecurityEvent({
      eventType: "login_failure",
      severity: "low",
      description: "محاولة دخول ببريد غير موجود",
      meta: { email },
      req: ctx.req,
    });
    return { success: false, error: "بيانات الدخول غير صحيحة", errorCode: "invalid_credentials" };
  }

  // 6) فحص حالة الحساب
  if (user.status === "banned") {
    await recordLoginAttempt(email, user.id, ip, userAgent, false, "banned");
    return {
      success: false,
      error: "هذا الحساب محظور. تواصل مع الدعم.",
      errorCode: "account_banned",
    };
  }

  // 7) فحص القفل المؤقت
  if (user.lockoutUntil && new Date(user.lockoutUntil) > new Date()) {
    const remaining = Math.ceil(
      (new Date(user.lockoutUntil).getTime() - Date.now()) / 60_000,
    );
    await recordLoginAttempt(email, user.id, ip, userAgent, false, "locked");
    await logSecurityEvent({
      userId: user.id,
      eventType: "login_locked",
      severity: "high",
      description: "محاولة دخول لحساب مقفل",
      req: ctx.req,
    });
    return {
      success: false,
      error: `تم قفل الحساب مؤقتاً. حاول بعد ${remaining} دقيقة`,
      errorCode: "account_locked",
      retryAfter: remaining * 60,
    };
  }

  // 8) التحقق من كلمة المرور
  const passwordValid = await verifyPassword(ctx.password, user.passwordHash);
  if (!passwordValid) {
    const newAttempts = (user.failedLoginAttempts || 0) + 1;
    const shouldLock = newAttempts >= MAX_FAILED_ATTEMPTS;
    await db
      .update(users)
      .set({
        failedLoginAttempts: newAttempts,
        lockoutUntil: shouldLock ? new Date(Date.now() + LOCKOUT_DURATION_MS) : null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    await recordLoginAttempt(email, user.id, ip, userAgent, false, "wrong_password");
    await progressiveDelay(newAttempts);

    await logSecurityEvent({
      userId: user.id,
      eventType: shouldLock ? "login_locked" : "login_failure",
      severity: shouldLock ? "high" : "low",
      description: shouldLock
        ? `تم قفل الحساب بعد ${MAX_FAILED_ATTEMPTS} محاولات فاشلة`
        : "فشل تسجيل الدخول",
      meta: { failedCount: newAttempts },
      req: ctx.req,
    });

    if (shouldLock) {
      return {
        success: false,
        error: `تم قفل الحساب لمدة 15 دقيقة بعد ${MAX_FAILED_ATTEMPTS} محاولات فاشلة`,
        errorCode: "account_locked",
        retryAfter: 15 * 60,
      };
    }
    return { success: false, error: "بيانات الدخول غير صحيحة", errorCode: "invalid_credentials" };
  }

  // 9) إعادة تعيين المحاولات الفاشلة
  if (user.failedLoginAttempts > 0 || user.lockoutUntil) {
    await db
      .update(users)
      .set({
        failedLoginAttempts: 0,
        lockoutUntil: null,
        lastSeenAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));
  } else {
    await db
      .update(users)
      .set({ lastSeenAt: new Date() })
      .where(eq(users.id, user.id));
  }

  // 10) تحقق من 2FA
  const { get2FAStatus } = await import("@/lib/two-factor");
  const twoFA = await get2FAStatus(user.id);
  if (twoFA.enabled) {
    // إنشاء "pre-auth session" قصير للتحقق من 2FA
    const preAuthToken = generateToken(32);
    const preAuthHash = hashToken(preAuthToken);
    await db.insert(emailVerifications).values({
      userId: user.id,
      tokenHash: preAuthHash,
      expiresAt: new Date(Date.now() + 5 * 60_000),
    });

    return {
      success: false,
      requires2FA: true,
      // في الإنتاج: نرسل preAuthToken في response (المستخدم يرسله مع 2FA code)
      error: "مطلوب التحقق بخطوتين",
    };
  }

  // 11) نجاح!
  await recordLoginAttempt(email, user.id, ip, userAgent, true, null);
  await logSecurityEvent({
    userId: user.id,
    eventType: "login_success",
    severity: "low",
    req: ctx.req,
  });

  return { success: true, user };
}

/**
 * Password Reset - توليد token
 */
export async function requestPasswordReset(
  email: string,
  req: NextRequest,
): Promise<{ token?: string; expiresAt?: Date }> {
  const ip = getClientIp(req);
  const lowerEmail = email.toLowerCase().trim();

  // Rate Limiting
  const rl = rateLimit(`reset:${ip}`, 3, 60 * 60_000);
  if (!rl.allowed) {
    throw new Error("تم تجاوز عدد طلبات إعادة التعيين. حاول بعد ساعة");
  }

  // عدم الكشف عن وجود البريد - نبحث فقط
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, lowerEmail))
    .limit(1);

  // حذف tokens قديمة
  await db
    .delete(passwordResets)
    .where(eq(passwordResets.userId, user?.id ?? lowerEmail));

  if (!user) {
    // نحاكي العملية بدون إفصاح
    return {};
  }

  const { token, hash } = generateSecureToken(32);
  const expiresAt = new Date(Date.now() + 30 * 60_000); // 30 دقيقة

  await db.insert(passwordResets).values({
    userId: user.id,
    tokenHash: hash,
    expiresAt,
    ipAddress: ip,
  });

  await logSecurityEvent({
    userId: user.id,
    eventType: "password_reset_request",
    severity: "medium",
    req,
  });

  return { token, expiresAt };
}

/**
 * Password Reset - تأكيد وتغيير
 */
export async function confirmPasswordReset(
  token: string,
  newPassword: string,
  req: NextRequest,
): Promise<boolean> {
  const tokenHash = hashToken(token);
  const ip = getClientIp(req);

  const [reset] = await db
    .select()
    .from(passwordResets)
    .where(
      and(
        eq(passwordResets.tokenHash, tokenHash),
        isNull(passwordResets.usedAt),
        gt(passwordResets.expiresAt, new Date()),
      ),
    )
    .limit(1);

  if (!reset) {
    await logSecurityEvent({
      eventType: "password_reset_failure",
      severity: "high",
      description: "محاولة استخدام token إعادة تعيين غير صالح",
      req,
    });
    return false;
  }

  // تغيير كلمة المرور
  const passwordHash = await hashPassword(newPassword);
  await db
    .update(users)
    .set({ passwordHash, failedLoginAttempts: 0, lockoutUntil: null, updatedAt: new Date() })
    .where(eq(users.id, reset.userId));

  // وضع علامة "مستخدم" على الـ token
  await db
    .update(passwordResets)
    .set({ usedAt: new Date() })
    .where(eq(passwordResets.id, reset.id));

  // حذف tokens أخرى لنفس المستخدم
  await db
    .delete(passwordResets)
    .where(eq(passwordResets.userId, reset.userId));

  // إلغاء كل sessions للمستخدم
  const { revokeAllUserSessions } = await import("@/lib/session-manager");
  await revokeAllUserSessions(reset.userId);

  await logSecurityEvent({
    userId: reset.userId,
    eventType: "password_reset_success",
    severity: "high",
    req,
  });

  return true;
}

function generateSecureToken(byteLength: number): { token: string; hash: string } {
  const token = generateToken(byteLength);
  const hash = hashToken(token);
  return { token, hash };
}

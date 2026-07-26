/**
 * Session Manager
 * - Server-side sessions مخزنة في DB
 * - Device fingerprinting
 * - Session rotation
 * - Concurrent session control
 * - IP change detection (Hijacking prevention)
 */
import { db } from "@/db";
import { userSessions, users } from "@/db/schema";
import { and, desc, eq, gt, isNull, ne, sql } from "drizzle-orm";
import { generateToken, hashToken, generateFingerprint, parseDeviceName } from "@/lib/tokens";
import { getClientIp } from "@/lib/rate-limit";
import type { NextRequest } from "next/server";
import { cookies, headers } from "next/headers";

const SESSION_COOKIE_NAME = "wdk_sid";
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const SESSION_RENEW_THRESHOLD = 24 * 60 * 60 * 1000;
const MAX_CONCURRENT_SESSIONS = 5;

export interface SessionInfo {
  id: string;
  userId: string;
  ip: string | null;
  userAgent: string | null;
  deviceName: string | null;
  createdAt: Date;
  lastUsedAt: Date;
  expiresAt: Date;
}

function generateSecureToken(byteLength: number): { token: string; hash: string } {
  const token = generateToken(byteLength);
  const hash = hashToken(token);
  return { token, hash };
}

/**
 * إنشاء session جديدة
 */
export async function createSession(
  userId: string,
  req: NextRequest,
): Promise<{ sessionId: string; sessionToken: string }> {
  const { token, hash } = generateSecureToken(48);
  const ip = getClientIp(req);
  const userAgent = req.headers.get("user-agent") || "";
  const acceptLanguage = req.headers.get("accept-language") || undefined;
  const fingerprint = generateFingerprint(userAgent, ip, acceptLanguage);
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await enforceMaxSessions(userId, MAX_CONCURRENT_SESSIONS - 1);

  const [session] = await db
    .insert(userSessions)
    .values({
      userId,
      sessionToken: hash,
      ip,
      userAgent: userAgent.slice(0, 500),
      deviceName: parseDeviceName(userAgent),
      fingerprint,
      expiresAt,
    })
    .returning();

  const jar = await cookies();
  jar.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.FORCE_SECURE_COOKIE === "1",
    path: "/",
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
  });

  return { sessionId: session.id, sessionToken: token };
}

/**
 * جلب الـ session الحالية من الـ cookie
 */
export async function getCurrentSession(): Promise<{
  session: SessionInfo;
  user: typeof users.$inferSelect;
} | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const tokenHash = hashToken(token);
  const now = new Date();

  const [session] = await db
    .select()
    .from(userSessions)
    .where(
      and(
        eq(userSessions.sessionToken, tokenHash),
        isNull(userSessions.revokedAt),
        gt(userSessions.expiresAt, now),
      ),
    )
    .limit(1);

  if (!session) return null;

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1);
  if (!user) return null;

  if (user.status === "banned") {
    await revokeSession(session.id);
    return null;
  }

  // تجديد الـ session إذا اقترب الانتهاء
  const remaining = session.expiresAt.getTime() - now.getTime();
  if (remaining < SESSION_RENEW_THRESHOLD) {
    await db
      .update(userSessions)
      .set({ expiresAt: new Date(Date.now() + SESSION_TTL_MS) })
      .where(eq(userSessions.id, session.id));
  }

  await db
    .update(userSessions)
    .set({ lastUsedAt: now })
    .where(eq(userSessions.id, session.id));

  return { session, user };
}

/**
 * إلغاء session محددة
 */
export async function revokeSession(sessionId: string): Promise<void> {
  await db
    .update(userSessions)
    .set({ revokedAt: new Date() })
    .where(eq(userSessions.id, sessionId));
}

/**
 * إلغاء كل sessions لمستخدم (مع إمكانية استثناء واحدة)
 */
export async function revokeAllUserSessions(
  userId: string,
  exceptSessionId?: string,
): Promise<number> {
  const whereCondition = exceptSessionId
    ? and(eq(userSessions.userId, userId), ne(userSessions.id, exceptSessionId))
    : eq(userSessions.userId, userId);

  const result = await db
    .update(userSessions)
    .set({ revokedAt: new Date() })
    .where(whereCondition)
    .returning({ id: userSessions.id });

  return result.length;
}

/**
 * جلب كل sessions نشطة
 */
export async function getUserActiveSessions(userId: string): Promise<SessionInfo[]> {
  const now = new Date();
  const sessions = await db
    .select()
    .from(userSessions)
    .where(
      and(
        eq(userSessions.userId, userId),
        isNull(userSessions.revokedAt),
        gt(userSessions.expiresAt, now),
      ),
    )
    .orderBy(desc(userSessions.lastUsedAt));

  return sessions;
}

/**
 * تنظيف sessions منتهية
 */
export async function cleanupExpiredSessions(): Promise<number> {
  const result = await db
    .delete(userSessions)
    .where(sql`${userSessions.expiresAt} < NOW()`)
    .returning({ id: userSessions.id });
  return result.length;
}

async function enforceMaxSessions(userId: string, keepLast: number) {
  const sessions = await db
    .select()
    .from(userSessions)
    .where(
      and(eq(userSessions.userId, userId), isNull(userSessions.revokedAt)),
    )
    .orderBy(desc(userSessions.lastUsedAt));

  if (sessions.length >= keepLast) {
    const toRevoke = sessions.slice(keepLast);
    for (const s of toRevoke) {
      await revokeSession(s.id);
    }
  }
}

/**
 * كشف Session Hijacking
 * يتحقق من تغير IP بين الـ session الحالية والـ requests السابقة
 */
export async function detectSessionHijack(
  sessionId: string,
  currentIp: string,
): Promise<boolean> {
  const [session] = await db
    .select()
    .from(userSessions)
    .where(eq(userSessions.id, sessionId))
    .limit(1);

  if (!session || !session.ip) return false;
  return session.ip !== currentIp;
}

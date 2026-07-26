import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { db } from "./db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

// ============ Config ============
const AUTH_SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || "fallback-dev-secret-change-in-production-please!!",
);
const COOKIE_NAME = "wdk_session";
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60; // 7 days

// ============ JWT Helpers ============
export async function signToken(payload: {
  userId: number;
  email: string;
  role: string;
}) {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(AUTH_SECRET);
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, AUTH_SECRET);
    return payload as { userId: number; email: string; role: string };
  } catch {
    return null;
  }
}

// ============ Cookie Helpers ============
export async function setSessionCookie(token: string) {
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });
}

export async function removeSessionCookie() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function getSessionCookie(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(COOKIE_NAME)?.value;
}

// ============ Session Helpers ============
export interface SessionUser {
  userId: number;
  email: string;
  role: string;
  fullName?: string;
  phone?: string;
  wilaya?: string | null;
  commune?: string | null;
}

export async function getSession(): Promise<SessionUser | null> {
  const token = await getSessionCookie();
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload) return null;

  // Enrich with user data from DB
  try {
    const [user] = await db
      .select({
        fullName: users.fullName,
        phone: users.phone,
        wilaya: users.wilaya,
        commune: users.commune,
      })
      .from(users)
      .where(eq(users.id, payload.userId))
      .limit(1);

    return {
      ...payload,
      ...(user || {}),
    };
  } catch {
    return { ...payload };
  }
}

export async function requireAuth(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  return session;
}

export async function requireAdmin(): Promise<SessionUser> {
  const session = await requireAuth();
  if (session.role !== "admin") {
    redirect("/");
  }
  return session;
}

// ============ Password Helpers ============
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ============ Rate Limiting (simple in-memory) ============
const rateMap = new Map<string, { count: number; reset: number }>();

export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number = 60000,
): boolean {
  const now = Date.now();
  const entry = rateMap.get(key);

  if (!entry || now > entry.reset) {
    rateMap.set(key, { count: 1, reset: now + windowMs });
    return true;
  }

  if (entry.count >= maxRequests) {
    return false;
  }

  entry.count++;
  return true;
}

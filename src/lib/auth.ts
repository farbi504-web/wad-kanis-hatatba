import { cookies } from "next/headers";
import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import bcrypt from "bcryptjs";
import { db } from "@/db";
import { users, type User } from "@/db/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";

const SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET ||
    "wdk-hatatba-secret-key-please-change-in-production-2026",
);
const COOKIE_NAME = "wdk_session";
const TOKEN_TTL = 60 * 60 * 24 * 7; // 7 days

export interface SessionPayload extends JWTPayload {
  uid: string;
  email: string;
  role: "user" | "seller" | "admin";
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(
  plain: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export async function signSession(
  payload: Omit<SessionPayload, "iat" | "exp">,
): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${TOKEN_TTL}s`)
    .sign(SECRET);
}

export async function verifySession(
  token: string,
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as SessionPayload;
  } catch {
    return null;
  }
}

export async function setSessionCookie(token: string) {
  const jar = await cookies();
  // Detect if the request is over HTTPS (via env or forwarded headers)
  // In production behind HTTPS proxy, set FORCE_SECURE_COOKIE=1 to use Secure flag
  const forceSecure = process.env.FORCE_SECURE_COOKIE === "1";
  // Default to non-secure so cookies work on http://localhost
  // (Next.js sets Secure automatically when behind HTTPS proxy if configured)
  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: forceSecure,
    path: "/",
    maxAge: TOKEN_TTL,
  });
}

export async function clearSessionCookie() {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
}

export async function getSession(): Promise<SessionPayload | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySession(token);
}

export async function getCurrentUser(): Promise<User | null> {
  const session = await getSession();
  if (!session) return null;
  const rows = await db.select().from(users).where(eq(users.id, session.uid));
  return rows[0] ?? null;
}

export async function requireUser(_req?: unknown): Promise<User> {
  const user = await getCurrentUser();
  if (!user) throw new HttpError(401, "Authentication required");
  if (user.status === "banned") throw new HttpError(403, "Account banned");
  return user;
}

export async function requireAdmin(): Promise<User> {
  const user = await requireUser();
  if (user.role !== "admin") throw new HttpError(403, "Admin only");
  return user;
}

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export function generateId(): string {
  return randomUUID();
}

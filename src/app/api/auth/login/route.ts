import { NextRequest } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { signSession, setSessionCookie } from "@/lib/auth";
import { loginSchema } from "@/lib/validation";
import { handleError, ok, parseJson, fail } from "@/lib/api";
import { logActivity } from "@/lib/activity";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { UserRepository } from "@/lib/repositories";
import { verifyPassword, hashPassword } from "@/lib/auth";

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60_000;

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);

    // Rate Limiting - 10 محاولات كل 15 دقيقة لكل IP
    const rl = rateLimit(`login:${ip}`, 10, 15 * 60_000);
    if (!rl.allowed) {
      return fail(
        `تم تجاوز عدد المحاولات. حاول بعد ${Math.ceil(
          (rl.resetAt - Date.now()) / 60_000,
        )} دقيقة`,
        429,
      );
    }

    // Parse & validate body (Zod schema يحمي من malformed input)
    const body = await parseJson(req, loginSchema);

    // Use repository for safe DB access
    const user = await UserRepository.authenticate(body.email, body.password);

    if (!user) {
      return fail("بيانات الدخول غير صحيحة", 401);
    }

    // Check account status
    if (user.status === "banned") {
      return fail("هذا الحساب محظور. تواصل مع الدعم.", 403);
    }

    // Check lockout
    if (user.lockoutUntil && new Date(user.lockoutUntil) > new Date()) {
      const remaining = Math.ceil(
        (new Date(user.lockoutUntil).getTime() - Date.now()) / 60_000,
      );
      return fail(`تم قفل الحساب مؤقتاً. حاول بعد ${remaining} دقيقة`, 423);
    }

    const passwordValid = await verifyPassword(body.password, user.passwordHash);
    if (!passwordValid) {
      // Use parameterized SQL via Drizzle
      const newAttempts = (user.failedLoginAttempts || 0) + 1;
      const lockoutUntil =
        newAttempts >= MAX_FAILED_ATTEMPTS
          ? sql`NOW() + INTERVAL '15 minutes'`
          : null;

      await db
        .update(users)
        .set({
          failedLoginAttempts: newAttempts,
          lockoutUntil: lockoutUntil,
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id));

      await logActivity({
        actorId: user.id,
        action: "login",
        entity: "user",
        entityId: user.id,
        meta: { success: false, ip },
      });

      return fail("بيانات الدخول غير صحيحة", 401);
    }

    // Reset failed attempts on success
    if (user.failedLoginAttempts > 0 || user.lockoutUntil) {
      await db
        .update(users)
        .set({
          failedLoginAttempts: 0,
          lockoutUntil: null,
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id));
    }

    // Update last seen
    await db
      .update(users)
      .set({ lastSeenAt: new Date() })
      .where(eq(users.id, user.id));

    // Issue session
    const token = await signSession({
      uid: user.id,
      email: user.email,
      role: user.role,
    });
    await setSessionCookie(token);

    await logActivity({
      actorId: user.id,
      action: "login",
      entity: "user",
      entityId: user.id,
      meta: { success: true, ip },
    });

    // Sanitize output - never return passwordHash
    const safe = UserRepository.sanitize(user);
    return ok(safe);
  } catch (e) {
    return handleError(e);
  }
}

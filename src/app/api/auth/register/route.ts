import { NextRequest } from "next/server";
import { db } from "@/db";
import { users, cities } from "@/db/schema";
import { eq } from "drizzle-orm";
import { signSession, setSessionCookie } from "@/lib/auth";
import { registerSchema } from "@/lib/validation";
import { handleError, ok, parseJson, fail } from "@/lib/api";
import { logActivity } from "@/lib/activity";
import { UserRepository } from "@/lib/repositories";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    
    // Rate Limiting - 5 registrations per hour per IP
    const rl = rateLimit(`register:${ip}`, 5, 3600_000);
    if (!rl.allowed) {
      return fail("تجاوزت عدد التسجيلات المسموحة. حاول بعد ساعة", 429);
    }

    const body = await parseJson(req, registerSchema);

    // Check if email exists using parameterized query
    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, body.email.toLowerCase().trim()))
      .limit(1);

    if (existing) {
      return fail("البريد الإلكتروني مستخدم من قبل", 409);
    }

    // Create user via secure repository (handles encryption)
    const user = await UserRepository.create({
      email: body.email,
      password: body.password,
      fullName: body.fullName,
      phone: body.phone || null,
    });

    // Ensure default city exists (one-time setup)
    await db
      .insert(cities)
      .values({ name: "حطاطبة", slug: "hatatba", isActive: true })
      .onConflictDoNothing();

    // Issue session
    const token = await signSession({
      uid: user.id,
      email: user.email,
      role: user.role,
    });
    await setSessionCookie(token);

    await logActivity({
      actorId: user.id,
      action: "create",
      entity: "user",
      entityId: user.id,
      meta: { ip },
    });

    return ok(user, { status: 201 });
  } catch (e) {
    if (e instanceof Error && e.message === "Too many registration attempts") {
      return fail("تم تجاوز عدد المحاولات", 429);
    }
    return handleError(e);
  }
}

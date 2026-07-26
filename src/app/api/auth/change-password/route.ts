import { NextRequest } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { handleError, ok, parseJson, fail } from "@/lib/api";
import {
  hashPassword,
  requireUser,
  verifyPassword,
} from "@/lib/auth";
import { passwordChangeSchema } from "@/lib/validation";

export async function POST(req: NextRequest) {
  try {
    const me = await requireUser();
    const body = await parseJson(req, passwordChangeSchema);
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, me.id))
      .limit(1);
    if (!user) return fail("المستخدم غير موجود", 404);
    const ok_ = await verifyPassword(body.currentPassword, user.passwordHash);
    if (!ok_) return fail("كلمة المرور الحالية غير صحيحة", 401);
    const passwordHash = await hashPassword(body.newPassword);
    await db
      .update(users)
      .set({ passwordHash, updatedAt: new Date() })
      .where(eq(users.id, user.id));
    return ok({ ok: true });
  } catch (e) {
    return handleError(e);
  }
}

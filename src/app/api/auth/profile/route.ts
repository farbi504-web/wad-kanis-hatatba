import { NextRequest } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { handleError, ok, parseJson, fail } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { profileUpdateSchema } from "@/lib/validation";

export async function GET() {
  try {
    const me = await requireUser();
    const [u] = await db.select().from(users).where(eq(users.id, me.id));
    if (!u) return fail("المستخدم غير موجود", 404);
    const { passwordHash: _, ...safe } = u;
    return ok(safe);
  } catch (e) {
    return handleError(e);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const me = await requireUser();
    const body = await parseJson(req, profileUpdateSchema);
    const updates: Record<string, unknown> = {
      fullName: body.fullName,
      phone: body.phone || null,
      bio: body.bio || null,
      updatedAt: new Date(),
    };
    if (body.cityId) updates.cityId = body.cityId;
    const [u] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, me.id))
      .returning();
    const { passwordHash: _, ...safe } = u;
    return ok(safe);
  } catch (e) {
    return handleError(e);
  }
}

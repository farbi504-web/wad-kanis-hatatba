import { NextRequest } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { z } from "zod";
import { handleError, ok, parseJson, fail } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { logActivity } from "@/lib/activity";

const querySchema = z.object({
  q: z.string().optional(),
  role: z.string().optional(),
  status: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(req.url);
    const q = querySchema.parse(Object.fromEntries(searchParams.entries()));
    const conds = [];
    if (q.q) {
      conds.push(
        or(
          ilike(users.fullName, `%${q.q}%`),
          ilike(users.email, `%${q.q}%`),
        ),
      );
    }
    if (q.role) conds.push(eq(users.role, q.role as "user"));
    if (q.status) conds.push(eq(users.status, q.status as "active"));
    const where = conds.length ? and(...conds) : undefined;
    const rows = await db
      .select({
        id: users.id,
        email: users.email,
        fullName: users.fullName,
        phone: users.phone,
        avatarUrl: users.avatarUrl,
        role: users.role,
        status: users.status,
        isVerified: users.isVerified,
        ratingAvg: users.ratingAvg,
        ratingCount: users.ratingCount,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(where ?? sql`true`)
      .orderBy(desc(users.createdAt))
      .limit(q.limit)
      .offset((q.page - 1) * q.limit);
    const [totalRow] = await db
      .select({ count: sql<number>`cast(count(*) as integer)` })
      .from(users)
      .where(where ?? sql`true`);
    return ok({
      items: rows,
      total: Number(totalRow?.count ?? 0),
      page: q.page,
      limit: q.limit,
    });
  } catch (e) {
    return handleError(e);
  }
}

const patchSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(["user", "seller", "admin"]).optional(),
  status: z.enum(["active", "banned", "suspended"]).optional(),
  isVerified: z.boolean().optional(),
});

export async function PATCH(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await parseJson(req, patchSchema);
    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (body.role) {
      updates.role = body.role;
      await logActivity({
        actorId: admin.id,
        action: "role_change",
        entity: "user",
        entityId: body.userId,
        meta: { newRole: body.role },
      });
    }
    if (body.status) {
      updates.status = body.status;
      await logActivity({
        actorId: admin.id,
        action: body.status === "banned" ? "ban" : "unban",
        entity: "user",
        entityId: body.userId,
      });
    }
    if (typeof body.isVerified === "boolean") {
      updates.isVerified = body.isVerified;
    }
    const [row] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, body.userId))
      .returning();
    if (!row) return fail("المستخدم غير موجود", 404);
    const { passwordHash: _, ...safe } = row;
    return ok(safe);
  } catch (e) {
    return handleError(e);
  }
}

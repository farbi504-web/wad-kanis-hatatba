import { NextRequest } from "next/server";
import { z } from "zod";
import { handleError, ok, parseJson, fail } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import {
  setup2FA,
  enable2FA,
  disable2FA,
  get2FAStatus,
  regenerateBackupCodes,
} from "@/lib/two-factor";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { logSecurityEvent } from "@/lib/security-events";

export const dynamic = "force-dynamic";

const enableSchema = z.object({
  code: z.string().regex(/^\d{6}$/, "كود غير صالح"),
});

const disableSchema = z.object({
  password: z.string().min(1),
});

const regenerateSchema = z.object({
  password: z.string().min(1),
});

/**
 * GET - جلب حالة 2FA أو setup
 */
export async function GET(req: NextRequest) {
  try {
    const me = await requireUser(req);
    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action");

    if (action === "setup") {
      const [user] = await db.select().from(users).where(eq(users.id, me.id)).limit(1);
      if (!user) return fail("المستخدم غير موجود", 404);
      const setup = await setup2FA(me.id, user.email);
      return ok(setup);
    }

    const status = await get2FAStatus(me.id);
    return ok(status);
  } catch (e) {
    return handleError(e);
  }
}

/**
 * POST - تفعيل 2FA
 */
export async function POST(req: NextRequest) {
  try {
    const me = await requireUser(req);
    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action") || "enable";

    if (action === "enable") {
      const body = await parseJson(req, enableSchema);
      const success = await enable2FA(me.id, body.code);
      if (!success) return fail("كود التحقق غير صحيح", 400);

      await logSecurityEvent({
        userId: me.id,
        eventType: "2fa_enable",
        severity: "high",
        req,
      });
      return ok({ enabled: true, message: "تم تفعيل المصادقة الثنائية" });
    }

    if (action === "disable") {
      const body = await parseJson(req, disableSchema);
      const success = await disable2FA(me.id, body.password);
      if (!success) return fail("كلمة المرور غير صحيحة", 401);

      await logSecurityEvent({
        userId: me.id,
        eventType: "2fa_disable",
        severity: "critical",
        req,
      });
      return ok({ enabled: false, message: "تم تعطيل المصادقة الثنائية" });
    }

    if (action === "regenerate-backup-codes") {
      const body = await parseJson(req, regenerateSchema);
      const codes = await regenerateBackupCodes(me.id, body.password);
      if (!codes) return fail("كلمة المرور غير صحيحة", 401);
      return ok({ backupCodes: codes, message: "تم توليد أكواد جديدة" });
    }

    return fail("إجراء غير معروف", 400);
  } catch (e) {
    return handleError(e);
  }
}

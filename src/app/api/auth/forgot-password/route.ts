import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { handleError, ok, parseJson, fail } from "@/lib/api";
import { requestPasswordReset } from "@/lib/auth-service";

export const dynamic = "force-dynamic";

const schema = z.object({
  email: z.string().email().max(255),
});

export async function POST(req: NextRequest) {
  try {
    const body = await parseJson(req, schema);
    const result = await requestPasswordReset(body.email, req);

    // في الإنتاج: نرسل إيميل يحتوي على token
    // هنا في بيئة التطوير نرجع الـ token في الـ response
    if (process.env.NODE_ENV !== "production" && result.token) {
      return ok({
        message: "تم إرسال رابط إعادة التعيين إلى بريدك",
        // في التطوير فقط:
        devToken: result.token,
        expiresAt: result.expiresAt,
      });
    }

    // في الإنتاج: لا تكشف إذا كان البريد موجود
    return ok({
      message: "إذا كان البريد مسجلاً، فسيصلك رابط إعادة التعيين",
    });
  } catch (e) {
    if (e instanceof Error && e.message.includes("تجاوزت")) {
      return fail(e.message, 429);
    }
    return handleError(e);
  }
}

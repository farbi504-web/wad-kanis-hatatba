import { NextRequest } from "next/server";
import { z } from "zod";
import { handleError, ok, parseJson, fail } from "@/lib/api";
import { confirmPasswordReset } from "@/lib/auth-service";
import { passwordSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

const schema = z.object({
  token: z.string().min(20).max(200),
  newPassword: passwordSchema,
});

export async function POST(req: NextRequest) {
  try {
    const body = await parseJson(req, schema);
    const success = await confirmPasswordReset(
      body.token,
      body.newPassword,
      req,
    );
    if (!success) {
      return fail("الرمز غير صالح أو منتهي الصلاحية", 400);
    }
    return ok({ message: "تم تغيير كلمة المرور بنجاح" });
  } catch (e) {
    return handleError(e);
  }
}

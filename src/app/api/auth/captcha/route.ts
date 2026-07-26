import { NextRequest, NextResponse } from "next/server";
import { createCaptcha } from "@/lib/captcha";
import { getClientIp } from "@/lib/rate-limit";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const ip = getClientIp(req);

  // Rate limit: 10 captcha per IP per 5 minutes
  const rl = rateLimit(`captcha-create:${ip}`, 10, 5 * 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: { message: "تجاوزت الحد المسموح. حاول بعد بضع دقائق." } },
      { status: 429 },
    );
  }

  const challenge = await createCaptcha(ip);
  return NextResponse.json({ data: challenge });
}

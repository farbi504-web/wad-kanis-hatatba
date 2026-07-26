import { NextResponse } from "next/server";
import { clearSessionCookie, getSession } from "@/lib/auth";
import { logActivity } from "@/lib/activity";

export async function POST() {
  const session = await getSession();
  await clearSessionCookie();
  if (session) {
    await logActivity({
      actorId: session.uid,
      action: "logout",
      entity: "user",
      entityId: session.uid,
    });
  }
  return NextResponse.json({ data: { ok: true } });
}

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { runAllSeeds } from "@/lib/seed";

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get("secret");

    if (secret !== process.env.SEED_SECRET) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    await runAllSeeds();
    return NextResponse.json({ success: true, message: "تمت التهيئة بنجاح" });
  } catch (err) {
    console.error("[seed-api] Error:", err);
    return NextResponse.json(
      { error: "فشل في التهيئة" },
      { status: 500 },
    );
  }
}

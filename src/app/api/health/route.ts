import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    // Quick health check — just verify DB connectivity
    await db.execute("SELECT 1");
    return NextResponse.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  } catch {
    return NextResponse.json(
      { status: "degraded", error: "Database connection failed" },
      { status: 503 },
    );
  }
}

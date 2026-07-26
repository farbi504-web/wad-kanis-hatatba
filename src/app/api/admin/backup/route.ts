import { NextResponse } from "next/server";
import { exec } from "node:child_process";
import { promisify } from "node:util";
import { requireAdmin } from "@/lib/auth";
import path from "node:path";

const execAsync = promisify(exec);

export async function GET() {
  try {
    await requireAdmin();
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      return NextResponse.json(
        { error: { message: "DATABASE_URL غير مضبوط" } },
        { status: 500 },
      );
    }
    const file = path.join(
      process.cwd(),
      "backups",
      `backup-${Date.now()}.sql`,
    );
    const dir = path.dirname(file);
    await execAsync(`mkdir -p ${dir}`);
    const env = { ...process.env, PGPASSWORD: extractPwd(dbUrl) };
    await execAsync(
      `pg_dump --no-owner --no-privileges "${dbUrl}" -f "${file}"`,
      { env, maxBuffer: 50 * 1024 * 1024 },
    );
    return NextResponse.json({
      data: { path: file, size: 0, note: "تم إنشاء نسخة احتياطية" },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "فشل إنشاء النسخة";
    return NextResponse.json({ error: { message } }, { status: 500 });
  }
}

function extractPwd(url: string): string {
  try {
    const u = new URL(url);
    return u.password || "";
  } catch {
    return "";
  }
}

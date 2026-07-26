import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { rateLimit, getClientIp, isValidUUID } from "@/lib/rate-limit";
import { handleError } from "@/lib/api";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED_BUCKETS = new Set(["avatars", "listing-images", "banners"]);

const MAGIC_NUMBERS: { mime: string; magic: number[] }[] = [
  { mime: "image/jpeg", magic: [0xff, 0xd8, 0xff] },
  { mime: "image/png", magic: [0x89, 0x50, 0x4e, 0x47] },
  { mime: "image/webp", magic: [0x52, 0x49, 0x46, 0x46] },
];

const SAFE_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export const dynamic = "force-dynamic";

function detectMime(buf: Buffer): string | null {
  for (const { mime, magic } of MAGIC_NUMBERS) {
    if (buf.length < magic.length) continue;
    if (magic.every((byte, i) => buf[i] === byte)) {
      // WebP needs extra check
      if (mime === "image/webp") {
        if (buf.length < 12) return null;
        if (
          buf[8] === 0x57 &&
          buf[9] === 0x45 &&
          buf[10] === 0x42 &&
          buf[11] === 0x50
        ) {
          return mime;
        }
        continue;
      }
      return mime;
    }
  }
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const me = await requireUser();

    // Rate limiting per user
    const rl = rateLimit(`upload:${me.id}`, 20, 60_000);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: { message: "تجاوزت الحد المسموح من الرفع" } },
        { status: 429 },
      );
    }

    const form = await req.formData();
    const file = form.get("file");
    const bucket = ((form.get("bucket") as string) || "listing-images").trim();

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: { message: "لم يتم إرسال ملف" } },
        { status: 400 },
      );
    }

    if (!ALLOWED_BUCKETS.has(bucket)) {
      return NextResponse.json(
        { error: { message: "مسار تخزين غير صالح" } },
        { status: 400 },
      );
    }

    const buf = Buffer.from(await file.arrayBuffer());
    if (buf.length < 4) {
      return NextResponse.json(
        { error: { message: "ملف غير صالح" } },
        { status: 400 },
      );
    }

    if (buf.length > MAX_SIZE) {
      return NextResponse.json(
        { error: { message: "حجم الملف يتجاوز 5 ميغابايت" } },
        { status: 413 },
      );
    }

    // Verify real MIME via magic numbers
    const realMime = detectMime(buf);
    if (!realMime || !ALLOWED_TYPES.has(realMime)) {
      return NextResponse.json(
        {
          error: {
            message:
              "نوع الملف غير مدعوم أو تم التلاعب به. يجب أن يكون JPG/PNG/WEBP",
          },
        },
        { status: 415 },
      );
    }

    // Process image: strip metadata, resize, recompress
    let processedBuf: Buffer;
    try {
      const pipeline = sharp(buf, { failOn: "error" })
        .rotate()
        .resize({
          width: 1920,
          height: 1920,
          fit: "inside",
          withoutEnlargement: true,
        });

      if (realMime === "image/jpeg") {
        processedBuf = await pipeline
          .jpeg({ quality: 85, mozjpeg: true })
          .toBuffer();
      } else if (realMime === "image/png") {
        processedBuf = await pipeline
          .png({ quality: 85, compressionLevel: 9 })
          .toBuffer();
      } else {
        processedBuf = await pipeline.webp({ quality: 85 }).toBuffer();
      }
    } catch (e) {
      return NextResponse.json(
        { error: { message: "ملف صورة غير صالح أو تالف" } },
        { status: 400 },
      );
    }

    const ext = SAFE_EXTENSIONS[realMime];
    const fileName = `${randomUUID()}.${ext}`;

    // Path safety check
    const dir = path.join(process.cwd(), "public", "uploads", bucket);
    const filepath = path.join(dir, fileName);
    const resolvedFile = path.resolve(filepath);
    const resolvedDir = path.resolve(dir);

    if (!resolvedFile.startsWith(resolvedDir + path.sep)) {
      throw new Error("Path traversal attempt blocked");
    }

    if (!existsSync(dir)) await mkdir(dir, { recursive: true });
    await writeFile(filepath, processedBuf);

    const url = `/uploads/${bucket}/${fileName}`;

    if (bucket === "avatars") {
      await db
        .update(users)
        .set({ avatarUrl: url, updatedAt: new Date() })
        .where(eq(users.id, me.id));
    }

    return NextResponse.json({
      data: { url, size: processedBuf.length, type: realMime },
    });
  } catch (e) {
    return handleError(e);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const me = await requireUser();
    const { searchParams } = new URL(req.url);
    const url = searchParams.get("url");
    if (!url) {
      return NextResponse.json(
        { error: { message: "url مطلوب" } },
        { status: 400 },
      );
    }
    if (!url.startsWith("/uploads/avatars/")) {
      return NextResponse.json(
        { error: { message: "لا يمكن حذف هذا الملف" } },
        { status: 403 },
      );
    }
    // Path safety: reject if contains traversal
    if (url.includes("..") || url.includes("//")) {
      return NextResponse.json(
        { error: { message: "مسار غير صالح" } },
        { status: 400 },
      );
    }
    await db
      .update(users)
      .set({ avatarUrl: null, updatedAt: new Date() })
      .where(eq(users.id, me.id));
    return NextResponse.json({ data: { ok: true } });
  } catch (e) {
    return handleError(e);
  }
}

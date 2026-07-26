import { NextRequest } from "next/server";
import { db } from "@/db";
import { listings, listingImages } from "@/db/schema";
import { and, asc, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { handleError, ok, parseJson, fail } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX = 5 * 1024 * 1024;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const imgs = await db
      .select()
      .from(listingImages)
      .where(eq(listingImages.listingId, id))
      .orderBy(asc(listingImages.sortOrder));
    return ok(imgs);
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const me = await requireUser();
    const [row] = await db
      .select()
      .from(listings)
      .where(eq(listings.id, id))
      .limit(1);
    if (!row) return fail("الإعلان غير موجود", 404);
    if (row.userId !== me.id && me.role !== "admin") {
      return fail("غير مصرح", 403);
    }
    const form = await req.formData();
    const files = form.getAll("files");
    if (!files.length) return fail("لم يتم إرسال صور", 400);
    const dir = path.join(process.cwd(), "public", "uploads", "listing-images");
    if (!existsSync(dir)) await mkdir(dir, { recursive: true });

    // base sort order
    const existing = await db
      .select()
      .from(listingImages)
      .where(eq(listingImages.listingId, id));
    let order = existing.length;

    const inserted: { id: string; url: string }[] = [];
    for (const f of files) {
      if (!(f instanceof File)) continue;
      if (!ALLOWED.has(f.type)) continue;
      if (f.size > MAX) continue;
      const ext = (f.name.split(".").pop() || "jpg")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");
      const fname = `${randomUUID()}.${ext || "jpg"}`;
      const buf = Buffer.from(await f.arrayBuffer());
      await writeFile(path.join(dir, fname), buf);
      const url = `/uploads/listing-images/${fname}`;
      const [rec] = await db
        .insert(listingImages)
        .values({
          listingId: id,
          url,
          sortOrder: order,
          isPrimary: existing.length === 0 && inserted.length === 0,
        })
        .returning();
      inserted.push({ id: rec.id, url: rec.url });
      order += 1;
    }
    return ok(inserted, { status: 201 });
  } catch (e) {
    return handleError(e);
  }
}

const reorderSchema = z.object({
  imageIds: z.array(z.string().uuid()),
  primaryId: z.string().uuid().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const me = await requireUser();
    const [row] = await db
      .select()
      .from(listings)
      .where(eq(listings.id, id))
      .limit(1);
    if (!row) return fail("الإعلان غير موجود", 404);
    if (row.userId !== me.id && me.role !== "admin") {
      return fail("غير مصرح", 403);
    }
    const body = await parseJson(req, reorderSchema);
    for (let i = 0; i < body.imageIds.length; i++) {
      await db
        .update(listingImages)
        .set({ sortOrder: i, isPrimary: false })
        .where(
          and(
            eq(listingImages.id, body.imageIds[i]),
            eq(listingImages.listingId, id),
          ),
        );
    }
    if (body.primaryId) {
      await db
        .update(listingImages)
        .set({ isPrimary: true })
        .where(
          and(
            eq(listingImages.id, body.primaryId),
            eq(listingImages.listingId, id),
          ),
        );
    }
    return ok({ ok: true });
  } catch (e) {
    return handleError(e);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const me = await requireUser();
    const { searchParams } = new URL(req.url);
    const imageId = searchParams.get("imageId");
    if (!imageId) return fail("imageId مطلوب", 400);
    const [row] = await db
      .select()
      .from(listings)
      .where(eq(listings.id, id))
      .limit(1);
    if (!row) return fail("الإعلان غير موجود", 404);
    if (row.userId !== me.id && me.role !== "admin") {
      return fail("غير مصرح", 403);
    }
    await db
      .delete(listingImages)
      .where(
        and(eq(listingImages.id, imageId), eq(listingImages.listingId, id)),
      );
    return ok({ ok: true });
  } catch (e) {
    return handleError(e);
  }
}

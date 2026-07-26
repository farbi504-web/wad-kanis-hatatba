import { NextRequest } from "next/server";
import { db } from "@/db";
import { banners, sponsors } from "@/db/schema";
import { asc, desc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { handleError, ok, parseJson, fail } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { logActivity } from "@/lib/activity";

export async function GET() {
  try {
    await requireAdmin();
    const [b, s] = await Promise.all([
      db
        .select()
        .from(banners)
        .orderBy(asc(banners.sortOrder), desc(banners.createdAt)),
      db
        .select()
        .from(sponsors)
        .orderBy(desc(sponsors.createdAt)),
    ]);
    return ok({ banners: b, sponsors: s });
  } catch (e) {
    return handleError(e);
  }
}

const bannerSchema = z.object({
  title: z.string().min(2).max(200),
  imageUrl: z.string().min(4).max(500),
  link: z.string().max(500).optional().or(z.literal("")),
  isActive: z.coerce.boolean().default(true),
  sortOrder: z.coerce.number().int().default(0),
});

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await parseJson(req, bannerSchema);
    const [row] = await db.insert(banners).values(body).returning();
    await logActivity({
      actorId: admin.id,
      action: "create",
      entity: "banner",
      entityId: row.id,
    });
    return ok(row, { status: 201 });
  } catch (e) {
    return handleError(e);
  }
}

const sponsorSchema = z.object({
  name: z.string().min(2).max(120),
  logoUrl: z.string().max(500).optional().or(z.literal("")),
  website: z.string().max(500).optional().or(z.literal("")),
  isActive: z.coerce.boolean().default(true),
});

export async function PUT(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await parseJson(req, sponsorSchema);
    const [row] = await db.insert(sponsors).values(body).returning();
    await logActivity({
      actorId: admin.id,
      action: "create",
      entity: "sponsor",
      entityId: row.id,
    });
    return ok(row, { status: 201 });
  } catch (e) {
    return handleError(e);
  }
}

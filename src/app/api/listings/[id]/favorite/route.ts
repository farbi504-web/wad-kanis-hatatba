import { NextRequest } from "next/server";
import { db } from "@/db";
import { listings, favorites } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { handleError, ok, fail } from "@/lib/api";
import { requireUser } from "@/lib/auth";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const me = await requireUser();
    const [row] = await db
      .select({ id: listings.id })
      .from(listings)
      .where(eq(listings.id, id))
      .limit(1);
    if (!row) return fail("الإعلان غير موجود", 404);
    await db
      .insert(favorites)
      .values({ userId: me.id, listingId: id })
      .onConflictDoNothing();
    return ok({ favorited: true });
  } catch (e) {
    return handleError(e);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const me = await requireUser();
    await db
      .delete(favorites)
      .where(
        and(eq(favorites.userId, me.id), eq(favorites.listingId, id)),
      );
    return ok({ favorited: false });
  } catch (e) {
    return handleError(e);
  }
}

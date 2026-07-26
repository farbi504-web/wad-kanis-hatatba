import { NextRequest } from "next/server";
import { db } from "@/db";
import {
  conversations,
  messages,
  listings,
  users,
} from "@/db/schema";
import {
  and,
  desc,
  eq,
  inArray,
  or,
  sql,
} from "drizzle-orm";
import { z } from "zod";
import { handleError, ok, parseJson, fail } from "@/lib/api";
import { requireUser } from "@/lib/auth";

export async function GET() {
  try {
    const me = await requireUser();
    const rows = await db
      .select({
        id: conversations.id,
        listingId: conversations.listingId,
        buyerId: conversations.buyerId,
        sellerId: conversations.sellerId,
        lastMessageAt: conversations.lastMessageAt,
        buyerName: sql<string>`(SELECT full_name FROM users WHERE id = ${conversations.buyerId})`,
        sellerName: sql<string>`(SELECT full_name FROM users WHERE id = ${conversations.sellerId})`,
        buyerAvatar: sql<string | null>`(SELECT avatar_url FROM users WHERE id = ${conversations.buyerId})`,
        sellerAvatar: sql<string | null>`(SELECT avatar_url FROM users WHERE id = ${conversations.sellerId})`,
        listingTitle: sql<string | null>`(SELECT title FROM listings WHERE id = ${conversations.listingId})`,
        listingSlug: sql<string | null>`(SELECT slug FROM listings WHERE id = ${conversations.listingId})`,
      })
      .from(conversations)
      .where(
        or(
          eq(conversations.buyerId, me.id),
          eq(conversations.sellerId, me.id),
        ),
      )
      .orderBy(desc(conversations.lastMessageAt));

    // fetch last message for each
    const ids = rows.map((r) => r.id);
    let lastMap = new Map<
      string,
      { content: string; createdAt: Date; senderId: string; isRead: boolean }
    >();
    if (ids.length) {
      const last = await db
        .select({
          conversationId: messages.conversationId,
          content: messages.content,
          createdAt: messages.createdAt,
          senderId: messages.senderId,
          isRead: messages.isRead,
        })
        .from(messages)
        .where(inArray(messages.conversationId, ids))
        .orderBy(desc(messages.createdAt));
      for (const m of last) {
        if (!lastMap.has(m.conversationId)) {
          lastMap.set(m.conversationId, {
            content: m.content,
            createdAt: m.createdAt,
            senderId: m.senderId,
            isRead: m.isRead,
          });
        }
      }
    }

    // unread per conv
    let unreadMap = new Map<string, number>();
    if (ids.length) {
      const unread = await db
        .select({
          conversationId: messages.conversationId,
          count: sql<number>`cast(count(*) as integer)`,
        })
        .from(messages)
        .where(
          and(
            inArray(messages.conversationId, ids),
            eq(messages.isRead, false),
            sql`${messages.senderId} <> ${me.id}`,
          ),
        )
        .groupBy(messages.conversationId);
      for (const u of unread) unreadMap.set(u.conversationId, Number(u.count));
    }

    return ok(
      rows.map((r) => ({
        ...r,
        lastMessage: lastMap.get(r.id) ?? null,
        unreadCount: unreadMap.get(r.id) ?? 0,
      })),
    );
  } catch (e) {
    return handleError(e);
  }
}

const startSchema = z.object({
  listingId: z.string().uuid(),
  content: z.string().min(1).max(2000),
});

export async function POST(req: NextRequest) {
  try {
    const me = await requireUser();
    const body = await parseJson(req, startSchema);
    const [listing] = await db
      .select()
      .from(listings)
      .where(eq(listings.id, body.listingId))
      .limit(1);
    if (!listing) return fail("الإعلان غير موجود", 404);
    if (listing.userId === me.id) {
      return fail("لا يمكنك مراسلة إعلانك", 400);
    }

    // find or create conversation
    const [existing] = await db
      .select()
      .from(conversations)
      .where(
        and(
          eq(conversations.listingId, listing.id),
          eq(conversations.buyerId, me.id),
          eq(conversations.sellerId, listing.userId),
        ),
      )
      .limit(1);
    let conv = existing;
    if (!conv) {
      const [c] = await db
        .insert(conversations)
        .values({
          listingId: listing.id,
          buyerId: me.id,
          sellerId: listing.userId,
        })
        .returning();
      conv = c;
    }
    const [msg] = await db
      .insert(messages)
      .values({
        conversationId: conv.id,
        senderId: me.id,
        content: body.content,
        type: "text",
      })
      .returning();
    await db
      .update(conversations)
      .set({ lastMessageAt: new Date() })
      .where(eq(conversations.id, conv.id));
    return ok({ conversationId: conv.id, message: msg });
  } catch (e) {
    return handleError(e);
  }
}

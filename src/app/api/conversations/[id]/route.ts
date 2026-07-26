import { NextRequest } from "next/server";
import { db } from "@/db";
import { conversations, messages, users, listings } from "@/db/schema";
import { and, asc, desc, eq, ne } from "drizzle-orm";
import { z } from "zod";
import { handleError, ok, parseJson, fail } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { pushNotification } from "@/lib/notifications";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const me = await requireUser();
    const [conv] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, id))
      .limit(1);
    if (!conv) return fail("المحادثة غير موجودة", 404);
    if (conv.buyerId !== me.id && conv.sellerId !== me.id) {
      return fail("غير مصرح", 403);
    }
    const [buyer] = await db
      .select({
        id: users.id,
        fullName: users.fullName,
        avatarUrl: users.avatarUrl,
      })
      .from(users)
      .where(eq(users.id, conv.buyerId));
    const [seller] = await db
      .select({
        id: users.id,
        fullName: users.fullName,
        avatarUrl: users.avatarUrl,
      })
      .from(users)
      .where(eq(users.id, conv.sellerId));
    const [listing] = conv.listingId
      ? await db
          .select({
            id: listings.id,
            title: listings.title,
            slug: listings.slug,
            price: listings.price,
            currency: listings.currency,
          })
          .from(listings)
          .where(eq(listings.id, conv.listingId))
      : [];
    const msgs = await db
      .select({
        id: messages.id,
        content: messages.content,
        type: messages.type,
        imageUrl: messages.imageUrl,
        isRead: messages.isRead,
        createdAt: messages.createdAt,
        senderId: messages.senderId,
      })
      .from(messages)
      .where(eq(messages.conversationId, id))
      .orderBy(asc(messages.createdAt));

    // mark messages from other side as read
    await db
      .update(messages)
      .set({ isRead: true })
      .where(
        and(
          eq(messages.conversationId, id),
          ne(messages.senderId, me.id),
          eq(messages.isRead, false),
        ),
      );

    return ok({
      conversation: conv,
      buyer,
      seller,
      listing: listing ?? null,
      messages: msgs,
    });
  } catch (e) {
    return handleError(e);
  }
}

const sendSchema = z.object({
  content: z.string().min(1).max(2000),
  type: z.enum(["text", "image"]).default("text"),
  imageUrl: z.string().optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const me = await requireUser();
    const [conv] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, id))
      .limit(1);
    if (!conv) return fail("المحادثة غير موجودة", 404);
    if (conv.buyerId !== me.id && conv.sellerId !== me.id) {
      return fail("غير مصرح", 403);
    }
    const body = await parseJson(req, sendSchema);
    const [msg] = await db
      .insert(messages)
      .values({
        conversationId: id,
        senderId: me.id,
        content: body.content,
        type: body.type,
        imageUrl: body.imageUrl ?? null,
      })
      .returning();
    await db
      .update(conversations)
      .set({ lastMessageAt: new Date() })
      .where(eq(conversations.id, id));
    const recipientId =
      me.id === conv.buyerId ? conv.sellerId : conv.buyerId;
    await pushNotification({
      userId: recipientId,
      type: "new_message",
      title: "رسالة جديدة",
      body: body.content.slice(0, 120),
      link: `/messages/${id}`,
    });
    return ok(msg, { status: 201 });
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
    const [conv] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, id))
      .limit(1);
    if (!conv) return fail("المحادثة غير موجودة", 404);
    if (conv.buyerId !== me.id && conv.sellerId !== me.id) {
      return fail("غير مصرح", 403);
    }
    await db.delete(conversations).where(eq(conversations.id, id));
    return ok({ ok: true });
  } catch (e) {
    return handleError(e);
  }
}

import { NextRequest } from "next/server";
import { db } from "@/db";
import { notifications, users } from "@/db/schema";
import { desc, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import { handleError, ok, parseJson } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { pushNotification } from "@/lib/notifications";
import { logActivity } from "@/lib/activity";

export async function GET() {
  try {
    await requireAdmin();
    const rows = await db
      .select({
        id: notifications.id,
        userId: notifications.userId,
        type: notifications.type,
        title: notifications.title,
        body: notifications.body,
        link: notifications.link,
        isRead: notifications.isRead,
        createdAt: notifications.createdAt,
        userName: sql<string | null>`(SELECT full_name FROM users WHERE id = ${notifications.userId})`,
      })
      .from(notifications)
      .orderBy(desc(notifications.createdAt))
      .limit(200);
    return ok(rows);
  } catch (e) {
    return handleError(e);
  }
}

const sendSchema = z.object({
  userIds: z.array(z.string().uuid()).optional(),
  sendAll: z.boolean().optional(),
  title: z.string().min(2).max(200),
  body: z.string().max(1000).optional(),
  link: z.string().max(500).optional(),
  type: z
    .enum([
      "system",
      "message",
      "listing_approved",
      "listing_rejected",
      "new_message",
      "review",
      "report_update",
    ])
    .default("system"),
});

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await parseJson(req, sendSchema);
    if (body.sendAll) {
      const allUsers = await db.select({ id: users.id }).from(users);
      for (const u of allUsers) {
        await pushNotification({
          userId: u.id,
          type: body.type,
          title: body.title,
          body: body.body,
          link: body.link,
        });
      }
    } else {
      for (const uid of body.userIds ?? []) {
        await pushNotification({
          userId: uid,
          type: body.type,
          title: body.title,
          body: body.body,
          link: body.link,
        });
      }
    }
    await logActivity({
      actorId: admin.id,
      action: "create",
      entity: "broadcast",
      meta: { count: body.sendAll ? "all" : body.userIds?.length },
    });
    return ok({ ok: true });
  } catch (e) {
    return handleError(e);
  }
}

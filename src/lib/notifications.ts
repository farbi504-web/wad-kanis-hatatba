import { db } from "@/db";
import { notifications } from "@/db/schema";

export async function pushNotification(params: {
  userId: string;
  type:
    | "message"
    | "listing_approved"
    | "listing_rejected"
    | "new_message"
    | "system"
    | "review"
    | "report_update";
  title: string;
  body?: string;
  link?: string;
}) {
  try {
    await db.insert(notifications).values({
      userId: params.userId,
      type: params.type,
      title: params.title,
      body: params.body ?? null,
      link: params.link ?? null,
    });
  } catch (e) {
    console.error("[notify] failed:", e);
  }
}

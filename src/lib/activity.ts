import { db } from "@/db";
import { activityLogs } from "@/db/schema";

export async function logActivity(params: {
  actorId: string | null;
  action:
    | "create"
    | "update"
    | "delete"
    | "login"
    | "logout"
    | "ban"
    | "unban"
    | "approve"
    | "reject"
    | "role_change"
    | "feature"
    | "unfeature";
  entity: string;
  entityId?: string | null;
  meta?: Record<string, unknown> | null;
  ip?: string | null;
}) {
  try {
    await db.insert(activityLogs).values({
      actorId: params.actorId,
      action: params.action,
      entity: params.entity,
      entityId: params.entityId ?? null,
      meta: params.meta ?? null,
      ip: params.ip ?? null,
    });
  } catch (e) {
    console.error("[activity] log failed:", e);
  }
}

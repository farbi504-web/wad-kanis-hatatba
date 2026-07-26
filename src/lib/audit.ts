import { db } from "@/db";
import { activityLogs } from "@/db/schema";
import { NextRequest } from "next/server";
import { getClientIp } from "@/lib/rate-limit";

export async function audit(
  actor: { id: string; role: string },
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
    | "unfeature",
  entity: string,
  entityId: string | null,
  meta?: Record<string, unknown>,
  req?: NextRequest,
) {
  try {
    await db.insert(activityLogs).values({
      actorId: actor.id,
      action,
      entity,
      entityId,
      meta: {
        ...meta,
        actorRole: actor.role,
        ip: req ? getClientIp(req) : null,
        userAgent: req?.headers.get("user-agent")?.slice(0, 200) ?? null,
      },
    });
  } catch (e) {
    console.error("[audit] failed:", e);
  }
}

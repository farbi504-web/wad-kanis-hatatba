import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, listings, reports, activityLogs } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";

function toCSV<T extends Record<string, unknown>>(
  rows: T[],
  columns: (keyof T)[],
): string {
  const header = columns.join(",");
  const escape = (v: unknown) => {
    if (v == null) return "";
    const s = typeof v === "string" ? v : String(v);
    if (s.includes(",") || s.includes("\"") || s.includes("\n")) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };
  const body = rows
    .map((r) => columns.map((c) => escape(r[c])).join(","))
    .join("\n");
  return header + "\n" + body;
}

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "users";
    const format = searchParams.get("format") || "csv";

    let rows: Record<string, unknown>[] = [];
    let columns: string[] = [];
    if (type === "users") {
      const data = await db.select().from(users);
      rows = data.map((r) => ({
        id: r.id,
        email: r.email,
        fullName: r.fullName,
        phone: r.phone ?? "",
        role: r.role,
        status: r.status,
        isVerified: r.isVerified,
        ratingAvg: r.ratingAvg,
        ratingCount: r.ratingCount,
        createdAt: r.createdAt.toISOString(),
      }));
      columns = [
        "id",
        "email",
        "fullName",
        "phone",
        "role",
        "status",
        "isVerified",
        "ratingAvg",
        "ratingCount",
        "createdAt",
      ];
    } else if (type === "listings") {
      const data = await db.select().from(listings);
      rows = data.map((r) => ({
        id: r.id,
        title: r.title,
        price: r.price,
        currency: r.currency,
        status: r.status,
        isFeatured: r.isFeatured,
        viewsCount: r.viewsCount,
        userId: r.userId,
        createdAt: r.createdAt.toISOString(),
      }));
      columns = [
        "id",
        "title",
        "price",
        "currency",
        "status",
        "isFeatured",
        "viewsCount",
        "userId",
        "createdAt",
      ];
    } else if (type === "reports") {
      const data = await db.select().from(reports);
      rows = data.map((r) => ({
        id: r.id,
        type: r.targetType,
        targetId: r.targetId,
        reason: r.reason,
        status: r.status,
        createdAt: r.createdAt.toISOString(),
      }));
      columns = ["id", "type", "targetId", "reason", "status", "createdAt"];
    } else if (type === "activity") {
      const data = await db.select().from(activityLogs);
      rows = data.map((r) => ({
        id: r.id,
        actorId: r.actorId ?? "",
        action: r.action,
        entity: r.entity,
        entityId: r.entityId ?? "",
        ip: r.ip ?? "",
        createdAt: r.createdAt.toISOString(),
      }));
      columns = [
        "id",
        "actorId",
        "action",
        "entity",
        "entityId",
        "ip",
        "createdAt",
      ];
    } else {
      return NextResponse.json(
        { error: { message: "نوع غير صالح" } },
        { status: 400 },
      );
    }

    if (format === "json") {
      return NextResponse.json({ data: rows });
    }
    const csv = toCSV(rows as Record<string, unknown>[], columns as (keyof Record<string, unknown>)[]);
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${type}-${Date.now()}.csv"`,
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "خطأ";
    return NextResponse.json({ error: { message } }, { status: 500 });
  }
}

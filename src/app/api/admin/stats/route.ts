import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import {
  users,
  listings,
  reports,
  messages,
  conversations,
  activityLogs,
} from "@/db/schema";
import { eq, sql, and, gte, desc } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  try {
    await requireAdmin();
    const [userTotal] = await db
      .select({ count: sql<number>`cast(count(*) as integer)` })
      .from(users);
    const [sellerTotal] = await db
      .select({ count: sql<number>`cast(count(*) as integer)` })
      .from(users)
      .where(sql`${users.role} in ('seller','admin')`);
    const [listingTotal] = await db
      .select({ count: sql<number>`cast(count(*) as integer)` })
      .from(listings);
    const [pendingListings] = await db
      .select({ count: sql<number>`cast(count(*) as integer)` })
      .from(listings)
      .where(eq(listings.status, "pending"));
    const [activeListings] = await db
      .select({ count: sql<number>`cast(count(*) as integer)` })
      .from(listings)
      .where(eq(listings.status, "active"));
    const [reportTotal] = await db
      .select({ count: sql<number>`cast(count(*) as integer)` })
      .from(reports);
    const [pendingReports] = await db
      .select({ count: sql<number>`cast(count(*) as integer)` })
      .from(reports)
      .where(eq(reports.status, "pending"));
    const [msgTotal] = await db
      .select({ count: sql<number>`cast(count(*) as integer)` })
      .from(messages);
    const [convTotal] = await db
      .select({ count: sql<number>`cast(count(*) as integer)` })
      .from(conversations);
    const [viewsTotal] = await db
      .select({ count: sql<number>`cast(coalesce(sum(${listings.viewsCount}), 0) as integer)` })
      .from(listings);

    // last 7 days listings per day
    const days: { date: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const start = new Date();
      start.setDate(start.getDate() - i);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      const [row] = await db
        .select({ count: sql<number>`cast(count(*) as integer)` })
        .from(listings)
        .where(
          and(
            gte(listings.createdAt, start),
            sql`${listings.createdAt} < ${end}`,
          ),
        );
      days.push({
        date: start.toISOString().slice(5, 10),
        count: Number(row?.count ?? 0),
      });
    }

    // last 7 days users
    const userDays: { date: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const start = new Date();
      start.setDate(start.getDate() - i);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      const [row] = await db
        .select({ count: sql<number>`cast(count(*) as integer)` })
        .from(users)
        .where(
          and(
            gte(users.createdAt, start),
            sql`${users.createdAt} < ${end}`,
          ),
        );
      userDays.push({
        date: start.toISOString().slice(5, 10),
        count: Number(row?.count ?? 0),
      });
    }

    // top categories
    const topCats = await db
      .select({
        id: listings.categoryId,
        count: sql<number>`cast(count(*) as integer)`,
      })
      .from(listings)
      .groupBy(listings.categoryId)
      .orderBy(desc(sql`count(*)`))
      .limit(5);

    return NextResponse.json({
      data: {
        users: Number(userTotal?.count ?? 0),
        sellers: Number(sellerTotal?.count ?? 0),
        listings: Number(listingTotal?.count ?? 0),
        pendingListings: Number(pendingListings?.count ?? 0),
        activeListings: Number(activeListings?.count ?? 0),
        reports: Number(reportTotal?.count ?? 0),
        pendingReports: Number(pendingReports?.count ?? 0),
        messages: Number(msgTotal?.count ?? 0),
        conversations: Number(convTotal?.count ?? 0),
        views: Number(viewsTotal?.count ?? 0),
        listingsByDay: days,
        usersByDay: userDays,
        topCategories: topCats,
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "خطأ";
    return NextResponse.json(
      { error: { message } },
      { status: message.includes("Authentication") ? 401 : message.includes("Admin") ? 403 : 500 },
    );
  }
}

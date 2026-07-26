import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { cities, categories, users, settings } from "@/db/schema";
import { hashPassword } from "@/lib/auth";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

const CITIES = [
  { name: "حطاطبة", slug: "hatatba" },
  { name: "تيبازة", slug: "tipaza" },
  { name: "القليعة", slug: "koléa" },
  { name: "حجوط", slug: "hadjout" },
  { name: "شرشال", slug: "cherchell" },
  { name: "بوهارون", slug: "bouharoun" },
  { name: "فوكة", slug: "fouka" },
  { name: "سيدي أعمر", slug: "sidi-amar" },
];

const CATEGORIES = [
  { name: "سيارات", slug: "cars", icon: "Car", sortOrder: 1 },
  { name: "عقارات", slug: "real-estate", icon: "Home", sortOrder: 2 },
  { name: "هواتف", slug: "phones", icon: "Smartphone", sortOrder: 3 },
  { name: "إلكترونيات", slug: "electronics", icon: "Tv", sortOrder: 4 },
  { name: "أجهزة منزلية", slug: "home-appliances", icon: "Refrigerator", sortOrder: 5 },
  { name: "أزياء", slug: "fashion", icon: "Shirt", sortOrder: 6 },
  { name: "خدمات", slug: "services", icon: "Wrench", sortOrder: 7 },
  { name: "وظائف", slug: "jobs", icon: "Briefcase", sortOrder: 8 },
  { name: "حيوانات", slug: "pets", icon: "Cat", sortOrder: 9 },
  { name: "كتب", slug: "books", icon: "BookOpen", sortOrder: 10 },
  { name: "ألعاب", slug: "toys", icon: "Gamepad2", sortOrder: 11 },
  { name: "رياضة", slug: "sports", icon: "Dumbbell", sortOrder: 12 },
];

const SETTINGS = [
  { key: "site_name", value: "واد كنيس حطاطبة" },
  { key: "site_description", value: "منصة الإعلانات المبوبة الأولى في حطاطبة" },
  { key: "contact_email", value: "contact@wad-kanis.dz" },
  { key: "contact_phone", value: "+213555000000" },
  { key: "auto_approve_listings", value: false },
  { key: "currency", value: "DZD" },
];

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export async function POST(req: NextRequest) {
  try {
    // Disable endpoint if no secret configured
    const expectedSecret = process.env.SEED_SECRET;
    if (!expectedSecret) {
      return NextResponse.json(
        { error: { message: "Seed endpoint is disabled" } },
        { status: 503 },
      );
    }

    const provided = req.headers.get("x-seed-secret") || "";
    if (!timingSafeEqual(provided, expectedSecret)) {
      return NextResponse.json(
        { error: { message: "Unauthorized" } },
        { status: 401 },
      );
    }

    // التهيئة تعمل بأمان أكثر من مرة: كل الإدراجات تستخدم
    // onConflictDoNothing، وحساب المدير يُنشأ فقط إن لم يكن موجوداً.
    // (سابقاً كان يخرج هنا عند وجود الفئات، فإذا فشلت التهيئة جزئياً
    //  قبل إنشاء المدير يبقى الموقع بلا حساب مدير ولا سبيل لإنشائه.)
    for (const c of CITIES) {
      await db
        .insert(cities)
        .values({ ...c, isActive: true })
        .onConflictDoNothing();
    }
    for (const c of CATEGORIES) {
      await db
        .insert(categories)
        .values({ ...c, isActive: true })
        .onConflictDoNothing();
    }
    for (const s of SETTINGS) {
      await db
        .insert(settings)
        .values(s)
        .onConflictDoUpdate({
          target: settings.key,
          set: { value: s.value, updatedAt: new Date() },
        });
    }
    const adminEmail = process.env.ADMIN_EMAIL || "admin@wad-kanis.dz";
    const [existingAdmin] = await db
      .select()
      .from(users)
      .where(sql`${users.email} = ${adminEmail}`)
      .limit(1);
    let adminPasswordNotice: string | undefined;
    if (!existingAdmin) {
      // كلمة مرور المدير تُقرأ من متغيرات البيئة.
      // المستودع عام، لذا لا يجوز الاعتماد على قيمة مكتوبة في الكود.
      const adminPassword = process.env.ADMIN_PASSWORD;
      if (!adminPassword) {
        return NextResponse.json(
          {
            error: {
              message:
                "ADMIN_PASSWORD غير مضبوط. أضفه في متغيرات البيئة ثم أعد تشغيل التهيئة.",
            },
          },
          { status: 400 },
        );
      }
      if (adminPassword.length < 12) {
        return NextResponse.json(
          {
            error: {
              message: "ADMIN_PASSWORD يجب أن يكون 12 حرفاً على الأقل.",
            },
          },
          { status: 400 },
        );
      }
      const passwordHash = await hashPassword(adminPassword);
      await db.insert(users).values({
        email: adminEmail,
        passwordHash,
        fullName: "مدير المنصة",
        phone: process.env.ADMIN_PHONE || "0555000000",
        role: "admin",
        isVerified: true,
      });
      adminPasswordNotice = `تم إنشاء حساب المدير: ${adminEmail}`;
    }
    return NextResponse.json({
      data: {
        ok: true,
        message: "تم تهيئة البيانات الأساسية",
        ...(adminPasswordNotice ? { admin: adminPasswordNotice } : {}),
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "خطأ";
    return NextResponse.json({ error: { message } }, { status: 500 });
  }
}

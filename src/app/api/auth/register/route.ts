import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { users } from "@/db/schema";
import { hashPassword, signToken, setSessionCookie } from "@/lib/auth";

const registerSchema = z.object({
  fullName: z.string().min(3, "الاسم الكامل يجب أن يكون 3 أحرف على الأقل"),
  email: z.string().email("بريد إلكتروني غير صالح"),
  phone: z.string().min(10, "رقم الهاتف غير صالح"),
  password: z.string().min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل"),
  wilaya: z.string().optional(),
  commune: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "بيانات غير صالحة" },
        { status: 400 },
      );
    }

    const { fullName, email, phone, password, wilaya, commune } = parsed.data;

    // Check if user exists
    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existing) {
      return NextResponse.json(
        { error: "البريد الإلكتروني مستخدم مسبقاً" },
        { status: 409 },
      );
    }

    // Create user
    const [user] = await db
      .insert(users)
      .values({
        fullName,
        email,
        phone,
        passwordHash: await hashPassword(password),
        wilaya: wilaya || "Tipaza",
        commune: commune || "Hatatba",
        role: "user",
      })
      .returning();

    // Sign token
    const token = await signToken({
      userId: user.id,
      email: user.email,
      role: user.role || "user",
    });

    await setSessionCookie(token);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("[register] Error:", err);
    return NextResponse.json(
      { error: "حدث خطأ أثناء التسجيل" },
      { status: 500 },
    );
  }
}

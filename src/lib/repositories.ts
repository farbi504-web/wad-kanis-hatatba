/**
 * Secure User Repository
 * طبقة آمنة للتعامل مع جدول المستخدمين
 * - Parameterized queries فقط
 * - تشفير الحقول الحساسة
 * - التحقق من المدخلات
 * - Rate Limiting
 */
import { db } from "@/db";
import { users, listings, conversations, messages } from "@/db/schema";
import { eq, and, or, sql, inArray, desc } from "drizzle-orm";
import { hashPassword, verifyPassword } from "@/lib/auth";
import { encrypt, decrypt, searchHash, maskPhone, maskEmail } from "@/lib/crypto";
import { validateUUID, sanitizeSearch, validatePagination, safeGetUserByEmail } from "@/lib/db-security";
import { rateLimit } from "@/lib/rate-limit";
import bcrypt from "bcryptjs";

export interface SafeUser {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  avatarUrl: string | null;
  role: "user" | "seller" | "admin";
  status: "active" | "banned" | "suspended";
  isVerified: boolean;
  createdAt: Date;
  // phoneMasked: string; // معروض بشكل آمن
}

export class UserRepository {
  /**
   * إنشاء مستخدم جديد مع تشفير آمن
   */
  static async create(data: {
    email: string;
    password: string;
    fullName: string;
    phone?: string | null;
  }) {
    // Rate Limiting
    if (!rateLimit(`register:${data.email}`, 5, 3600_000)) {
      throw new Error("Too many registration attempts");
    }

    // تشفير كلمة المرور (bcrypt)
    const passwordHash = await hashPassword(data.password);

    // تشفير الهاتف (AES-256-GCM)
    const phoneEncrypted = data.phone ? encrypt(data.phone) : null;
    // تجزئة للبحث على الهاتف (HMAC)
    const phoneHash = data.phone ? searchHash(data.phone) : null;

    // تنظيف الإيميل
    const emailLower = data.email.toLowerCase().trim();

    const [user] = await db
      .insert(users)
      .values({
        email: emailLower,
        passwordHash,
        fullName: data.fullName,
        phone: phoneEncrypted,
        phoneHash,
        role: "user",
        status: "active",
      })
      .returning();

    if (!user) throw new Error("Failed to create user");

    return this.sanitize(user);
  }

  /**
   * البحث عن مستخدم بواسطة الإيميل (مع decryption)
   */
  static async findByEmail(email: string) {
    const safeEmail = email.toLowerCase().trim().slice(0, 255);
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, safeEmail))
      .limit(1);

    if (!user) return null;
    return user; // يحتوي على passwordHash و phoneEncrypted
  }

  /**
   * البحث عن مستخدم بواسطة ID
   */
  static async findById(id: unknown) {
    const validId = validateUUID(id);
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, validId))
      .limit(1);

    if (!user) return null;
    return user;
  }

  /**
   * مصادقة المستخدم (login)
   */
  static async authenticate(email: string, password: string) {
    const user = await this.findByEmail(email);
    if (!user) {
      // Constant-time check
      await bcrypt.compare(password, "$2a$10$dummy.hash.for.timing.attack.prevention");
      return null;
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) return null;

    return user;
  }

  /**
   * تحديث الملف الشخصي
   */
  static async updateProfile(
    id: string,
    data: {
      fullName?: string;
      phone?: string | null;
      bio?: string | null;
    }
  ) {
    const validId = validateUUID(id);
    const updates: Record<string, unknown> = { updatedAt: new Date() };
    
    if (data.fullName !== undefined) {
      updates.fullName = data.fullName.slice(0, 120);
    }
    if (data.phone !== undefined) {
      updates.phone = data.phone ? encrypt(data.phone) : null;
      updates.phoneHash = data.phone ? searchHash(data.phone) : null;
    }
    if (data.bio !== undefined) {
      updates.bio = data.bio?.slice(0, 1000) || null;
    }

    const [user] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, validId))
      .returning();

    return user ? this.sanitize(user) : null;
  }

  /**
   * تغيير كلمة المرور
   */
  static async changePassword(id: string, newPassword: string) {
    const validId = validateUUID(id);
    const passwordHash = await hashPassword(newPassword);
    await db
      .update(users)
      .set({ passwordHash, updatedAt: new Date() })
      .where(eq(users.id, validId));
  }

  /**
   * مسح البيانات الحساسة من الكائن قبل الإرجاع
   */
  static sanitize(user: any): SafeUser {
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      // فك تشفير الهاتف عند العرض
      phone: user.phone ? decrypt(user.phone) : null,
      avatarUrl: user.avatarUrl,
      role: user.role,
      status: user.status,
      isVerified: user.isVerified,
      createdAt: user.createdAt,
    };
  }

  /**
   * قائمة المستخدمين مع pagination آمن (admin only)
   */
  static async list(opts: {
    page?: number;
    limit?: number;
    q?: string;
    role?: string;
    status?: string;
  }) {
    const { page, limit } = validatePagination(opts.page, opts.limit, 100);
    
    const conditions = [];
    if (opts.q) {
      const safeQ = sanitizeSearch(opts.q);
      if (safeQ) {
        conditions.push(
          or(
            sql`${users.fullName} ILIKE ${"%" + safeQ + "%"}`,
            sql`${users.email} ILIKE ${"%" + safeQ + "%"}`
          )
        );
      }
    }
    if (opts.role && ["user", "seller", "admin"].includes(opts.role)) {
      conditions.push(eq(users.role, opts.role as any));
    }
    if (opts.status && ["active", "banned", "suspended"].includes(opts.status)) {
      conditions.push(eq(users.status, opts.status as any));
    }

    const where = conditions.length ? and(...conditions) : undefined;
    const offset = (page - 1) * limit;

    const [items, totalResult] = await Promise.all([
      db
        .select({
          id: users.id,
          email: users.email,
          fullName: users.fullName,
          phone: users.phone, // encrypted
          avatarUrl: users.avatarUrl,
          role: users.role,
          status: users.status,
          isVerified: users.isVerified,
          createdAt: users.createdAt,
        })
        .from(users)
        .where(where)
        .orderBy(desc(users.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`cast(count(*) as integer)` })
        .from(users)
        .where(where),
    ]);

    // Sanitize & mask sensitive data
    const sanitizedItems = items.map((u) => ({
      ...u,
      // phone: maskPhone(decrypt(u.phone)),
      emailMasked: maskEmail(u.email),
    }));

    return {
      items: sanitizedItems,
      total: Number(totalResult[0]?.count ?? 0),
      page,
      limit,
    };
  }
}

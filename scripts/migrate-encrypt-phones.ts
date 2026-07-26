/**
 * Migration Script: تشفير أرقام الهواتف الموجودة في قاعدة البيانات
 * يجب تشغيله مرة واحدة فقط بعد إضافة حقل phoneHash
 */
import { db } from "@/db";
import { sql, eq } from "drizzle-orm";
import { users } from "@/db/schema";
import { encrypt, searchHash } from "@/lib/crypto";

async function migratePhoneEncryption() {
  console.log("[migration] Starting phone encryption migration...");

  // جلب المستخدمين الذين لديهم هاتف غير مشفر
  // نعتبر الهاتف مشفراً إذا طوله > 100 (base64)
  const result = await db.execute(sql`
    SELECT id, phone
    FROM users
    WHERE phone IS NOT NULL
    AND LENGTH(phone) < 100
  `);

  const rows = result.rows as Array<{ id: string; phone: string }>;
  console.log(`[migration] Found ${rows.length} users with unencrypted phone`);

  for (const row of rows) {
    try {
      const phoneTrimmed = row.phone.trim();
      if (!phoneTrimmed) continue;

      const phoneEncrypted = encrypt(phoneTrimmed);
      const phoneHash = searchHash(phoneTrimmed);

      await db
        .update(users)
        .set({
          phone: phoneEncrypted,
          phoneHash: phoneHash,
        })
        .where(eq(users.id, row.id));

      console.log(`[migration] Encrypted phone for user ${row.id}`);
    } catch (e) {
      console.error(`[migration] Failed for user ${row.id}:`, e);
    }
  }

  console.log("[migration] Done!");
  process.exit(0);
}

migratePhoneEncryption().catch((e) => {
  console.error("[migration] Failed:", e);
  process.exit(1);
});

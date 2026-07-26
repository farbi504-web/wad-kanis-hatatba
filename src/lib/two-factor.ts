/**
 * Two-Factor Authentication (TOTP) System
 * - تطبيق TOTP/RFC 6238 بدون اعتماد على مكتبات
 * - متوافق مع Google Authenticator / Authy / Microsoft Authenticator
 * - Backup codes للاسترداد
 */
import { createHmac, randomBytes } from "node:crypto";
import QRCode from "qrcode";
import { db } from "@/db";
import { userTwoFactor, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { hashToken } from "@/lib/tokens";

const APP_NAME = "واد كنيس حطاطبة";
const BACKUP_CODES_COUNT = 10;
const TOTP_DIGITS = 6;
const TOTP_PERIOD = 30;
const TOTP_WINDOW = 1; // ±30 ثانية

// Base32 alphabet (RFC 4648)
const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function base32Decode(input: string): Buffer {
  const cleanInput = input.replace(/=+$/, "").toUpperCase();
  const bits: number[] = [];
  for (const char of cleanInput) {
    const idx = BASE32_ALPHABET.indexOf(char);
    if (idx === -1) throw new Error("Invalid base32 character");
    for (let i = 4; i >= 0; i--) {
      bits.push((idx >> i) & 1);
    }
  }
  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    const byte = bits.slice(i, i + 8).reduce((acc, b) => (acc << 1) | b, 0);
    bytes.push(byte);
  }
  return Buffer.from(bytes);
}

/**
 * توليد secret base32 (32 حرف = 160 bits)
 */
function generateBase32Secret(): string {
  const bytes = randomBytes(20);
  let bits = "";
  for (const b of bytes) {
    bits += b.toString(2).padStart(8, "0");
  }
  let base32 = "";
  for (let i = 0; i < bits.length; i += 5) {
    const chunk = bits.slice(i, i + 5).padEnd(5, "0");
    base32 += BASE32_ALPHABET[parseInt(chunk, 2)];
  }
  return base32.slice(0, 32);
}

/**
 * بناء otpauth URL لـ QR Code
 */
function buildOtpauthUrl(email: string, secret: string): string {
  const issuer = encodeURIComponent(APP_NAME);
  const label = encodeURIComponent(`${APP_NAME}:${email}`);
  return `otpauth://totp/${label}?secret=${secret}&issuer=${issuer}&digits=${TOTP_DIGITS}&period=${TOTP_PERIOD}&algorithm=SHA1`;
}

/**
 * توليد TOTP Code من secret و timestamp
 */
function generateTOTP(secret: string, timestamp: number = Date.now()): string {
  const counter = Math.floor(timestamp / 1000 / TOTP_PERIOD);
  const counterBuffer = Buffer.alloc(8);
  // كتابة counter كـ big-endian 64-bit
  for (let i = 7; i >= 0; i--) {
    counterBuffer[i] = counter & 0xff;
    counterCounter = counter; // dummy
  }
  // إعادة كتابة counter بشكل صحيح
  const view = new DataView(counterBuffer.buffer);
  // @ts-ignore - DataView works
  view.setUint32(4, counter & 0xffffffff, false);
  // @ts-ignore
  view.setUint32(0, Math.floor(counter / 0x100000000), false);

  const key = base32Decode(secret);
  const hmac = createHmac("sha1", key);
  hmac.update(counterBuffer);
  const hash = hmac.digest();

  const offset = hash[hash.length - 1] & 0xf;
  const code =
    ((hash[offset] & 0x7f) << 24) |
    ((hash[offset + 1] & 0xff) << 16) |
    ((hash[offset + 2] & 0xff) << 8) |
    (hash[offset + 3] & 0xff);

  const otp = (code % Math.pow(10, TOTP_DIGITS))
    .toString()
    .padStart(TOTP_DIGITS, "0");
  return otp;
}

let counterCounter: number; // dummy for linter

/**
 * التحقق من TOTP Code
 */
function verifyTOTP(secret: string, code: string): boolean {
  if (!/^\d{6}$/.test(code)) return false;

  const now = Date.now();
  for (let i = -TOTP_WINDOW; i <= TOTP_WINDOW; i++) {
    const timestamp = now + i * TOTP_PERIOD * 1000;
    const expected = generateTOTP(secret, timestamp);
    if (timingSafeEqual(expected, code)) {
      return true;
    }
  }
  return false;
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export interface TwoFactorSetup {
  secret: string;
  qrCodeUrl: string;
  manualEntryKey: string;
}

/**
 * توليد secret جديد + QR Code للإعداد
 */
export async function setup2FA(userId: string, userEmail: string): Promise<TwoFactorSetup> {
  const secret = generateBase32Secret();
  const otpauthUrl = buildOtpauthUrl(userEmail, secret);

  const qrCodeUrl = await QRCode.toDataURL(otpauthUrl, {
    errorCorrectionLevel: "M",
    margin: 2,
    width: 300,
    color: { dark: "#0D1F3C", light: "#FFFFFF" },
  });

  const backupCodes = generateBackupCodes();
  await db
    .insert(userTwoFactor)
    .values({
      userId,
      secret,
      isEnabled: false,
      backupCodes,
    })
    .onConflictDoUpdate({
      target: userTwoFactor.userId,
      set: { secret, isEnabled: false, backupCodes },
    });

  return {
    secret,
    qrCodeUrl,
    manualEntryKey: secret,
  };
}

/**
 * تفعيل 2FA بعد تأكيد المستخدم
 */
export async function enable2FA(userId: string, code: string): Promise<boolean> {
  const [record] = await db
    .select()
    .from(userTwoFactor)
    .where(eq(userTwoFactor.userId, userId))
    .limit(1);

  if (!record) return false;

  if (!verifyTOTP(record.secret, code)) return false;

  await db
    .update(userTwoFactor)
    .set({ isEnabled: true, lastUsedAt: new Date() })
    .where(eq(userTwoFactor.userId, userId));

  return true;
}

/**
 * التحقق من 2FA Token
 * يدعم: TOTP code أو Backup code
 */
export async function verify2FA(userId: string, code: string): Promise<{
  valid: boolean;
  isBackupCode?: boolean;
  remainingBackupCodes?: number;
}> {
  const [record] = await db
    .select()
    .from(userTwoFactor)
    .where(eq(userTwoFactor.userId, userId))
    .limit(1);

  if (!record || !record.isEnabled) {
    return { valid: false };
  }

  // 1) التحقق كـ TOTP
  if (verifyTOTP(record.secret, code)) {
    await db
      .update(userTwoFactor)
      .set({ lastUsedAt: new Date() })
      .where(eq(userTwoFactor.userId, userId));
    return { valid: true, isBackupCode: false };
  }

  // 2) التحقق كـ Backup Code
  const normalized = code.toUpperCase().replace(/[-\s]/g, "");
  const codeHash = hashToken(normalized);
  if (record.backupCodes.includes(codeHash)) {
    const remainingCodes = record.backupCodes.filter((c) => c !== codeHash);
    await db
      .update(userTwoFactor)
      .set({
        backupCodes: remainingCodes,
        lastUsedAt: new Date(),
      })
      .where(eq(userTwoFactor.userId, userId));
    return {
      valid: true,
      isBackupCode: true,
      remainingBackupCodes: remainingCodes.length,
    };
  }

  return { valid: false };
}

/**
 * تعطيل 2FA (يتطلب كلمة المرور)
 */
export async function disable2FA(userId: string, password: string): Promise<boolean> {
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) return false;

  const bcrypt = await import("bcryptjs");
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return false;

  await db.delete(userTwoFactor).where(eq(userTwoFactor.userId, userId));
  return true;
}

/**
 * إعادة توليد Backup Codes
 */
export async function regenerateBackupCodes(
  userId: string,
  password: string,
): Promise<string[] | null> {
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) return null;

  const bcrypt = await import("bcryptjs");
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return null;

  const newCodes = generateBackupCodes();
  await db
    .update(userTwoFactor)
    .set({ backupCodes: newCodes })
    .where(eq(userTwoFactor.userId, userId));

  return newCodes.map(formatBackupCode);
}

function formatBackupCode(c: string): string {
  return `${c.slice(0, 4)}-${c.slice(4, 8)}`;
}

/**
 * توليد Backup Codes
 */
function generateBackupCodes(): string[] {
  return Array.from({ length: BACKUP_CODES_COUNT }, () =>
    randomBytes(4).toString("hex").toUpperCase(),
  );
}

/**
 * الحصول على حالة 2FA للمستخدم
 */
export async function get2FAStatus(userId: string) {
  const [record] = await db
    .select()
    .from(userTwoFactor)
    .where(eq(userTwoFactor.userId, userId))
    .limit(1);

  if (!record) {
    return { enabled: false, backupCodesCount: 0 };
  }

  return {
    enabled: record.isEnabled,
    lastUsedAt: record.lastUsedAt,
    backupCodesCount: record.backupCodes.length,
  };
}

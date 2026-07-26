/**
 * Secure Token Management
 * - توليد tokens آمنة بـ crypto.randomBytes
 * - تخزين hashed فقط في DB
 * - TTL صارم
 * - One-time use
 */
import { randomBytes, createHash } from "node:crypto";

/**
 * توليد token عشوائي آمن (URL-safe base64)
 */
export function generateToken(byteLength: number = 32): string {
  return randomBytes(byteLength)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

/**
 * تجزئة token للبحث في DB
 */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * توليد Token + حفظ الـ hash
 * Returns: { token, hash }
 */
export function generateSecureToken(
  byteLength: number = 32,
): { token: string; hash: string } {
  const token = generateToken(byteLength);
  const hash = hashToken(token);
  return { token, hash };
}

/**
 * توليد كود قصير (6 أرقام) للـ SMS OTP
 */
export function generateOTP(): string {
  const buffer = randomBytes(4);
  const num = buffer.readUInt32BE(0) % 1_000_000;
  return num.toString().padStart(6, "0");
}

export function hashOTP(code: string): string {
  return createHash("sha256").update(code).digest("hex");
}

/**
 * التحقق من انتهاء صلاحية Token
 */
export function isExpired(expiresAt: Date | string | null | undefined): boolean {
  if (!expiresAt) return true;
  const exp = typeof expiresAt === "string" ? new Date(expiresAt) : expiresAt;
  return exp.getTime() < Date.now();
}

/**
 * توليد Device Fingerprint
 */
export function generateFingerprint(
  userAgent: string,
  ip: string,
  acceptLanguage?: string,
): string {
  return createHash("sha256")
    .update(`${userAgent}|${ip}|${acceptLanguage || ""}`)
    .digest("hex")
    .slice(0, 32);
}

/**
 * استخراج اسم الجهاز من User Agent
 */
export function parseDeviceName(userAgent: string): string {
  if (!userAgent) return "جهاز غير معروف";
  let browser = "متصفح";
  if (userAgent.includes("Firefox")) browser = "Firefox";
  else if (userAgent.includes("Edg/")) browser = "Edge";
  else if (userAgent.includes("Chrome")) browser = "Chrome";
  else if (userAgent.includes("Safari")) browser = "Safari";

  let os = "نظام";
  if (userAgent.includes("Windows")) os = "Windows";
  else if (userAgent.includes("Mac")) os = "macOS";
  else if (userAgent.includes("Linux")) os = "Linux";
  else if (userAgent.includes("Android")) os = "Android";
  else if (userAgent.includes("iOS") || userAgent.includes("iPhone")) os = "iOS";

  return `${browser} - ${os}`;
}

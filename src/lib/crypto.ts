/**
 * تشفير الحقول الحساسة باستخدام AES-256-GCM
 * يُستخدم لتشفير أرقام الهواتف والإيميلات وقواعد أخرى
 */
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
const SALT = process.env.ENCRYPTION_SALT || "wdk-hatatba-fixed-salt-2026";

function deriveKey(): Buffer {
  // في الإنتاج يجب استخدام key management service (KMS) أو HSM
  const password = process.env.ENCRYPTION_KEY || "default-dev-key-change-in-production";
  return scryptSync(password, SALT, 32);
}

const KEY = deriveKey();

/**
 * تشفير نص عادي إلى نص مشفر (base64)
 */
export function encrypt(plaintext: string | null | undefined): string | null {
  if (plaintext == null) return null;
  if (plaintext === "") return "";
  
  try {
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, KEY, iv);
    
    const encrypted = Buffer.concat([
      cipher.update(plaintext, "utf8"),
      cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();
    
    // البنية: [iv (12)][authTag (16)][encrypted]
    const combined = Buffer.concat([iv, authTag, encrypted]);
    return combined.toString("base64");
  } catch (e) {
    console.error("[crypto] encryption failed:", e);
    throw new Error("Encryption failed");
  }
}

/**
 * فك تشفير نص مشفر
 */
export function decrypt(ciphertext: string | null | undefined): string | null {
  if (ciphertext == null) return null;
  if (ciphertext === "") return "";
  
  try {
    const combined = Buffer.from(ciphertext, "base64");
    if (combined.length < IV_LENGTH + AUTH_TAG_LENGTH) {
      throw new Error("Invalid ciphertext length");
    }
    
    const iv = combined.subarray(0, IV_LENGTH);
    const authTag = combined.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
    const encrypted = combined.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
    
    const decipher = createDecipheriv(ALGORITHM, KEY, iv);
    decipher.setAuthTag(authTag);
    
    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]);
    return decrypted.toString("utf8");
  } catch (e) {
    console.error("[crypto] decryption failed:", e);
    return null;
  }
}

/**
 * Hash للبحث على الحقول المشفرة (deterministic)
 * يستخدم HMAC-SHA256 لإنشاء hash ثابت للبحث
 */
import { createHmac } from "node:crypto";

export function searchHash(value: string): string {
  return createHmac("sha256", KEY)
    .update(value.toLowerCase().trim())
    .digest("hex");
}

/**
 * تمويه البيانات الحساسة للعرض (مثل رقم الهاتف: 0555***123)
 */
export function maskPhone(phone: string | null | undefined): string {
  if (!phone) return "";
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length < 4) return "***";
  return cleaned.slice(0, 4) + "***" + cleaned.slice(-2);
}

export function maskEmail(email: string | null | undefined): string {
  if (!email) return "";
  const [local, domain] = email.split("@");
  if (!domain) return "***";
  const maskedLocal = local.length <= 2 
    ? "*".repeat(local.length) 
    : local[0] + "***" + local.slice(-1);
  return `${maskedLocal}@${domain}`;
}

/**
 * Server-side CAPTCHA System
 * نظام CAPTCHA بسيط وآمن بدون اعتماد على خدمات خارجية
 */
import { db } from "@/db";
import { captchaChallenges } from "@/db/schema";
import { eq, and, isNull, gt } from "drizzle-orm";
import { generateSecureToken, hashToken } from "@/lib/tokens";
import { randomInt } from "node:crypto";

type ChallengeFn = (a: number, b: number) => { question: string; answer: string };

const CHALLENGE_TYPES: ChallengeFn[] = [
  (a, b) => ({
    question: `كم حاصل جمع ${toArabic(a)} و ${toArabic(b)}؟`,
    answer: String(a + b),
  }),
  (a, b) => ({
    question: `كم حاصل طرح ${toArabic(Math.max(a, b))} من ${toArabic(Math.max(a, b) + b)}؟`,
    answer: String(b),
  }),
  (a, b) => ({
    question: `كم حاصل ضرب ${toArabic(a)} في ${toArabic(b)}؟`,
    answer: String(a * b),
  }),
];

function toArabic(num: number): string {
  const digits = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
  return String(num)
    .split("")
    .map((d) => digits[parseInt(d)] || d)
    .join("");
}

function normalizeAnswer(answer: string): string {
  return answer
    .trim()
    .toLowerCase()
    .replace(/[إأآا]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/\s+/g, " ");
}

/**
 * توليد تحدي CAPTCHA جديد
 */
export async function createCaptcha(ip: string): Promise<{
  id: string;
  question: string;
  expiresAt: Date;
}> {
  const challengeFn = CHALLENGE_TYPES[randomInt(0, CHALLENGE_TYPES.length)];
  const a = randomInt(1, 20);
  const b = randomInt(1, 20);
  const { question, answer } = challengeFn(a, b);

  const { token, hash } = generateSecureToken(16);
  const expiresAt = new Date(Date.now() + 5 * 60_000); // 5 دقائق

  const [row] = await db
    .insert(captchaChallenges)
    .values({
      challenge: token,
      answerHash: hashToken(normalizeAnswer(answer)),
      expiresAt,
      ipAddress: ip,
    })
    .returning();

  return {
    id: row.id,
    question,
    expiresAt,
  };
}

/**
 * التحقق من إجابة CAPTCHA
 * - Single use
 * - Time-limited
 * - IP-bound
 */
export async function verifyCaptcha(
  id: string,
  answer: string,
  ip: string,
): Promise<boolean> {
  const [challenge] = await db
    .select()
    .from(captchaChallenges)
    .where(
      and(
        eq(captchaChallenges.id, id),
        isNull(captchaChallenges.usedAt),
        gt(captchaChallenges.expiresAt, new Date()),
      ),
    )
    .limit(1);

  if (!challenge) return false;

  if (challenge.ipAddress && challenge.ipAddress !== ip) {
    return false;
  }

  const isValid = hashToken(normalizeAnswer(answer)) === challenge.answerHash;

  if (isValid) {
    await db
      .update(captchaChallenges)
      .set({ usedAt: new Date() })
      .where(eq(captchaChallenges.id, id));
  }

  return isValid;
}

/**
 * تنظيف التحديات المنتهية
 */
export async function cleanupCaptchas() {
  await db
    .delete(captchaChallenges)
    .where(gt(captchaChallenges.expiresAt, new Date()));
}

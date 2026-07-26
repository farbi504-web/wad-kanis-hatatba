import "dotenv/config";
import type { Config } from "drizzle-kit";

// يقرأ رابط قاعدة البيانات من البيئة بدل قيمة مثبّتة،
// حتى يعمل نفس الأمر محلياً ومع Neon/Supabase في الإنتاج.
const url =
  process.env.DATABASE_URL ||
  "postgresql://postgres:postgres@127.0.0.1:5432/app_db";

export default {
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  dbCredentials: {
    url,
    // القواعد السحابية تتطلب SSL. مع PostgreSQL محلي اتركه معطّلاً.
    ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : undefined,
  },
} satisfies Config;

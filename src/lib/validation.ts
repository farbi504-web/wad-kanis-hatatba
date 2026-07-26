import { z } from "zod";

export const emailSchema = z.string().email("بريد إلكتروني غير صالح").max(255);
export const passwordSchema = z
  .string()
  .min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل")
  .max(128);
export const nameSchema = z
  .string()
  .min(2, "الاسم قصير جداً")
  .max(120, "الاسم طويل جداً");
export const phoneSchema = z
  .string()
  .min(6)
  .max(30)
  .regex(/^[0-9+\-\s()]+$/, "رقم هاتف غير صالح")
  .optional()
  .or(z.literal(""));

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  fullName: nameSchema,
  phone: phoneSchema,
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1),
});

export const profileUpdateSchema = z.object({
  fullName: nameSchema,
  phone: phoneSchema,
  bio: z.string().max(1000).optional().or(z.literal("")),
  cityId: z.string().uuid().optional().or(z.literal("")),
});

export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "كلمة المرور الجديدة غير متطابقة",
    path: ["confirmPassword"],
  });

export const listingSchema = z.object({
  title: z.string().min(4, "العنوان قصير جداً").max(200),
  description: z.string().min(10, "الوصف قصير جداً").max(5000),
  price: z.coerce.number().int().min(0, "السعر غير صالح"),
  currency: z.string().max(8).default("DZD"),
  condition: z.enum(["new", "like_new", "good", "fair", "used"]),
  categoryId: z.string().uuid("الفئة مطلوبة"),
  cityId: z.string().uuid("المدينة مطلوبة"),
  contactPhone: phoneSchema,
  location: z.string().max(160).optional().or(z.literal("")),
});

export const reviewSchema = z.object({
  sellerId: z.string().uuid(),
  listingId: z.string().uuid().optional().or(z.literal("")),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().max(2000).optional().or(z.literal("")),
});

export const reportSchema = z.object({
  targetType: z.enum(["listing", "user"]),
  targetId: z.string().uuid(),
  reason: z.string().min(4).max(1000),
});

export const messageSchema = z.object({
  conversationId: z.string().uuid().optional(),
  recipientId: z.string().uuid().optional(),
  listingId: z.string().uuid().optional(),
  content: z.string().min(1).max(2000),
  type: z.enum(["text", "image"]).default("text"),
  imageUrl: z.string().max(500).optional(),
});

export const categorySchema = z.object({
  name: z.string().min(2).max(100),
  slug: z
    .string()
    .min(2)
    .max(100)
    .regex(/^[a-z0-9-]+$/, "slug غير صالح"),
  icon: z.string().max(60).optional().or(z.literal("")),
  description: z.string().max(500).optional().or(z.literal("")),
  sortOrder: z.coerce.number().int().default(0),
  isActive: z.coerce.boolean().default(true),
});

export const citySchema = z.object({
  name: z.string().min(2).max(80),
  slug: z
    .string()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9-]+$/, "slug غير صالح"),
  isActive: z.coerce.boolean().default(true),
});

export const bannerSchema = z.object({
  title: z.string().min(2).max(200),
  imageUrl: z.string().min(4).max(500),
  link: z.string().max(500).optional().or(z.literal("")),
  isActive: z.coerce.boolean().default(true),
  sortOrder: z.coerce.number().int().default(0),
});

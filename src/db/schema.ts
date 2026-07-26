import {
  pgTable,
  varchar,
  text,
  timestamp,
  boolean,
  integer,
  serial,
  decimal,
  jsonb,
  uniqueIndex,
  index,
  pgEnum,
} from "drizzle-orm/pg-core";

// ============ Enums ============
export const roleEnum = pgEnum("role", ["user", "admin"]);
export const adStatusEnum = pgEnum("ad_status", [
  "active",
  "pending",
  "sold",
  "expired",
  "rejected",
]);
export const adTypeEnum = pgEnum("ad_type", ["sale", "rent", "service", "job"]);

// ============ Users ============
export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    passwordHash: varchar("password_hash", { length: 255 }).notNull(),
    fullName: varchar("full_name", { length: 255 }).notNull(),
    phone: varchar("phone", { length: 20 }).notNull(),
    wilaya: varchar("wilaya", { length: 100 }).default("Tipaza"),
    commune: varchar("commune", { length: 100 }).default("Hatatba"),
    role: roleEnum("role").default("user").notNull(),
    twoFactorSecret: varchar("two_factor_secret", { length: 64 }),
    twoFactorEnabled: boolean("two_factor_enabled").default(false),
    avatar: varchar("avatar", { length: 500 }),
    isVerified: boolean("is_verified").default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("users_email_idx").on(table.email),
    index("users_role_idx").on(table.role),
  ],
);

// ============ Categories ============
export const categories = pgTable(
  "categories",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 100 }).notNull(),
    nameAr: varchar("name_ar", { length: 100 }).notNull(),
    slug: varchar("slug", { length: 100 }).notNull().unique(),
    icon: varchar("icon", { length: 50 }).notNull(),
    parentId: integer("parent_id"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("categories_slug_idx").on(table.slug),
    index("categories_parent_idx").on(table.parentId),
  ],
);

// ============ Ads ============
export const ads = pgTable(
  "ads",
  {
    id: serial("id").primaryKey(),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description").notNull(),
    price: decimal("price", { precision: 12, scale: 2 }),
    currency: varchar("currency", { length: 3 }).default("DZD"),
    adType: adTypeEnum("ad_type").default("sale").notNull(),
    categoryId: integer("category_id")
      .references(() => categories.id)
      .notNull(),
    userId: integer("user_id")
      .references(() => users.id)
      .notNull(),
    wilaya: varchar("wilaya", { length: 100 }).default("Tipaza"),
    commune: varchar("commune", { length: 100 }).default("Hatatba"),
    images: jsonb("images").$type<string[]>().default([]),
    status: adStatusEnum("status").default("active").notNull(),
    views: integer("views").default(0),
    isFeatured: boolean("is_featured").default(false),
    isPremium: boolean("is_premium").default(false),
    expiresAt: timestamp("expires_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("ads_category_idx").on(table.categoryId),
    index("ads_user_idx").on(table.userId),
    index("ads_status_idx").on(table.status),
    index("ads_wilaya_idx").on(table.wilaya),
    index("ads_created_at_idx").on(table.createdAt),
    index("ads_search_idx").on(table.title, table.description),
  ],
);

// ============ Favorites ============
export const favorites = pgTable(
  "favorites",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .references(() => users.id)
      .notNull(),
    adId: integer("ad_id")
      .references(() => ads.id)
      .notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("favorites_unique_idx").on(table.userId, table.adId),
    index("favorites_user_idx").on(table.userId),
  ],
);

// ============ Messages ============
export const messages = pgTable(
  "messages",
  {
    id: serial("id").primaryKey(),
    fromUserId: integer("from_user_id")
      .references(() => users.id)
      .notNull(),
    toUserId: integer("to_user_id")
      .references(() => users.id)
      .notNull(),
    adId: integer("ad_id").references(() => ads.id),
    content: text("content").notNull(),
    isRead: boolean("is_read").default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("messages_from_idx").on(table.fromUserId),
    index("messages_to_idx").on(table.toUserId),
    index("messages_ad_idx").on(table.adId),
  ],
);

// ============ Audit Logs ============
export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  action: varchar("action", { length: 100 }).notNull(),
  resource: varchar("resource", { length: 100 }).notNull(),
  resourceId: integer("resource_id"),
  details: jsonb("details"),
  ip: varchar("ip", { length: 45 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ============ Type Exports ============
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Ad = typeof ads.$inferSelect;
export type NewAd = typeof ads.$inferInsert;
export type Category = typeof categories.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type Favorite = typeof favorites.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;

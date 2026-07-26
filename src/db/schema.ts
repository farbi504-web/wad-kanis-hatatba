import {
  pgTable,
  text,
  varchar,
  integer,
  bigint,
  boolean,
  timestamp,
  uuid,
  primaryKey,
  uniqueIndex,
  index,
  pgEnum,
  jsonb,
  doublePrecision,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

/* =========================
   ENUMS
   ========================= */
export const userRoleEnum = pgEnum("user_role", ["user", "seller", "admin"]);
export const userStatusEnum = pgEnum("user_status", [
  "active",
  "banned",
  "suspended",
]);
export const listingStatusEnum = pgEnum("listing_status", [
  "draft",
  "pending",
  "active",
  "rejected",
  "closed",
  "sold",
]);
export const listingConditionEnum = pgEnum("listing_condition", [
  "new",
  "like_new",
  "good",
  "fair",
  "used",
]);
export const reportTargetEnum = pgEnum("report_target", [
  "listing",
  "user",
]);
export const reportStatusEnum = pgEnum("report_status", [
  "pending",
  "reviewed",
  "resolved",
  "dismissed",
]);
export const notificationTypeEnum = pgEnum("notification_type", [
  "message",
  "listing_approved",
  "listing_rejected",
  "new_message",
  "system",
  "review",
  "report_update",
]);
export const messageTypeEnum = pgEnum("message_type", [
  "text",
  "image",
  "system",
]);
export const activityActionEnum = pgEnum("activity_action", [
  "create",
  "update",
  "delete",
  "login",
  "logout",
  "ban",
  "unban",
  "approve",
  "reject",
  "role_change",
  "feature",
  "unfeature",
]);

/* =========================
   USERS / PROFILES
   ========================= */
export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: varchar("email", { length: 255 }).notNull(),
    passwordHash: text("password_hash").notNull(),
    fullName: varchar("full_name", { length: 120 }).notNull(),
    // phone مخزن مشفر (AES-256-GCM base64)
    phone: text("phone"),
    // phoneHash للبحث الآمن عبر HMAC
    phoneHash: varchar("phone_hash", { length: 64 }),
    avatarUrl: text("avatar_url"),
    bio: text("bio"),
    cityId: uuid("city_id"),
    role: userRoleEnum("role").notNull().default("user"),
    status: userStatusEnum("status").notNull().default("active"),
    isVerified: boolean("is_verified").notNull().default(false),
    ratingAvg: doublePrecision("rating_avg").notNull().default(0),
    ratingCount: integer("rating_count").notNull().default(0),
    failedLoginAttempts: integer("failed_login_attempts").notNull().default(0),
    lockoutUntil: timestamp("lockout_until", { withTimezone: true }),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    emailIdx: uniqueIndex("users_email_unique").on(t.email),
    phoneHashIdx: index("users_phone_hash_idx").on(t.phoneHash),
  }),
);

/* =========================
   CITIES
   ========================= */
export const cities = pgTable("cities", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 80 }).notNull(),
  slug: varchar("slug", { length: 80 }).notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/* =========================
   CATEGORIES
   ========================= */
export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull(),
  icon: varchar("icon", { length: 60 }),
  description: text("description"),
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/* =========================
   LISTINGS
   ========================= */
export const listings = pgTable(
  "listings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "restrict" }),
    cityId: uuid("city_id")
      .notNull()
      .references(() => cities.id, { onDelete: "restrict" }),
    title: varchar("title", { length: 200 }).notNull(),
    slug: varchar("slug", { length: 220 }).notNull(),
    description: text("description").notNull(),
    price: bigint("price", { mode: "number" }).notNull().default(0),
    currency: varchar("currency", { length: 8 }).notNull().default("DZD"),
    condition: listingConditionEnum("condition").notNull().default("used"),
    status: listingStatusEnum("status").notNull().default("pending"),
    isFeatured: boolean("is_featured").notNull().default(false),
    viewsCount: integer("views_count").notNull().default(0),
    contactPhone: varchar("contact_phone", { length: 30 }),
    location: varchar("location", { length: 160 }),
    rejectedReason: text("rejected_reason"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    slugIdx: uniqueIndex("listings_slug_unique").on(t.slug),
    statusIdx: index("listings_status_idx").on(t.status),
    userIdx: index("listings_user_idx").on(t.userId),
    categoryIdx: index("listings_category_idx").on(t.categoryId),
    cityIdx: index("listings_city_idx").on(t.cityId),
    featuredIdx: index("listings_featured_idx").on(t.isFeatured),
  }),
);

/* =========================
   LISTING IMAGES
   ========================= */
export const listingImages = pgTable(
  "listing_images",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    listingId: uuid("listing_id")
      .notNull()
      .references(() => listings.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    isPrimary: boolean("is_primary").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    listingIdx: index("listing_images_listing_idx").on(t.listingId),
  }),
);

/* =========================
   FAVORITES
   ========================= */
export const favorites = pgTable(
  "favorites",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    listingId: uuid("listing_id")
      .notNull()
      .references(() => listings.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.userId, t.listingId] }),
    listingIdx: index("favorites_listing_idx").on(t.listingId),
  }),
);

/* =========================
   REVIEWS
   ========================= */
export const reviews = pgTable(
  "reviews",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sellerId: uuid("seller_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    reviewerId: uuid("reviewer_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    listingId: uuid("listing_id").references(() => listings.id, {
      onDelete: "set null",
    }),
    rating: integer("rating").notNull(),
    comment: text("comment"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    sellerIdx: index("reviews_seller_idx").on(t.sellerId),
    reviewerIdx: index("reviews_reviewer_idx").on(t.reviewerId),
  }),
);

/* =========================
   CONVERSATIONS
   ========================= */
export const conversations = pgTable(
  "conversations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    listingId: uuid("listing_id").references(() => listings.id, {
      onDelete: "set null",
    }),
    buyerId: uuid("buyer_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    sellerId: uuid("seller_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    lastMessageAt: timestamp("last_message_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    buyerIdx: index("conversations_buyer_idx").on(t.buyerId),
    sellerIdx: index("conversations_seller_idx").on(t.sellerId),
  }),
);

/* =========================
   MESSAGES
   ========================= */
export const messages = pgTable(
  "messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    senderId: uuid("sender_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    type: messageTypeEnum("type").notNull().default("text"),
    imageUrl: text("image_url"),
    isRead: boolean("is_read").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    convIdx: index("messages_conv_idx").on(t.conversationId),
  }),
);

/* =========================
   NOTIFICATIONS
   ========================= */
export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: notificationTypeEnum("type").notNull(),
    title: varchar("title", { length: 200 }).notNull(),
    body: text("body"),
    link: text("link"),
    isRead: boolean("is_read").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    userIdx: index("notifications_user_idx").on(t.userId),
  }),
);

/* =========================
   REPORTS
   ========================= */
export const reports = pgTable(
  "reports",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    reporterId: uuid("reporter_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    targetType: reportTargetEnum("target_type").notNull(),
    targetId: uuid("target_id").notNull(),
    reason: text("reason").notNull(),
    status: reportStatusEnum("status").notNull().default("pending"),
    adminNote: text("admin_note"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  },
  (t) => ({
    targetIdx: index("reports_target_idx").on(t.targetType, t.targetId),
    statusIdx: index("reports_status_idx").on(t.status),
  }),
);

/* =========================
   FEATURED ADS
   ========================= */
export const featuredAds = pgTable(
  "featured_ads",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    listingId: uuid("listing_id")
      .notNull()
      .references(() => listings.id, { onDelete: "cascade" }),
    startsAt: timestamp("starts_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    listingIdx: index("featured_ads_listing_idx").on(t.listingId),
  }),
);

/* =========================
   BANNERS
   ========================= */
export const banners = pgTable("banners", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title", { length: 200 }).notNull(),
  imageUrl: text("image_url").notNull(),
  link: text("link"),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/* =========================
   SPONSORS
   ========================= */
export const sponsors = pgTable("sponsors", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 120 }).notNull(),
  logoUrl: text("logo_url"),
  website: text("website"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/* =========================
   SETTINGS
   ========================= */
export const settings = pgTable("settings", {
  key: varchar("key", { length: 100 }).primaryKey(),
  value: jsonb("value"),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/* =========================
   ACTIVITY LOGS
   ========================= */
export const activityLogs = pgTable(
  "activity_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    actorId: uuid("actor_id").references(() => users.id, {
      onDelete: "set null",
    }),
    action: activityActionEnum("action").notNull(),
    entity: varchar("entity", { length: 80 }).notNull(),
    entityId: uuid("entity_id"),
    meta: jsonb("meta"),
    ip: varchar("ip", { length: 64 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    actorIdx: index("activity_actor_idx").on(t.actorId),
    entityIdx: index("activity_entity_idx").on(t.entity, t.entityId),
  }),
);

/* =========================
   EMAIL VERIFICATION
   ========================= */
export const emailVerifications = pgTable("email_verifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/* =========================
   PHONE VERIFICATION
   ========================= */
export const phoneVerifications = pgTable("phone_verifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  phoneHash: varchar("phone_hash", { length: 64 }).notNull(),
  codeHash: text("code_hash").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  attempts: integer("attempts").notNull().default(0),
  usedAt: timestamp("used_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/* =========================
   PASSWORD RESET
   ========================= */
export const passwordResets = pgTable("password_resets", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
  ipAddress: varchar("ip_address", { length: 64 }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/* =========================
   2FA - TOTP
   ========================= */
export const userTwoFactor = pgTable("user_two_factor", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  secret: text("secret").notNull(),
  isEnabled: boolean("is_enabled").notNull().default(false),
  backupCodes: text("backup_codes").array().notNull().default(sql`ARRAY[]::text[]`),
  lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/* =========================
   ACTIVE SESSIONS
   ========================= */
export const userSessions = pgTable(
  "user_sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    sessionToken: text("session_token").notNull(),
    refreshToken: text("refresh_token"),
    ip: varchar("ip", { length: 64 }),
    userAgent: text("user_agent"),
    deviceName: varchar("device_name", { length: 200 }),
    fingerprint: varchar("fingerprint", { length: 64 }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    tokenIdx: uniqueIndex("sessions_token_idx").on(t.sessionToken),
    userIdx: index("sessions_user_idx").on(t.userId),
    expiresIdx: index("sessions_expires_idx").on(t.expiresAt),
  }),
);

/* =========================
   LOGIN ATTEMPTS
   ========================= */
export const loginAttempts = pgTable(
  "login_attempts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: varchar("email", { length: 255 }),
    userId: uuid("user_id").references(() => users.id, {
      onDelete: "cascade",
    }),
    ip: varchar("ip", { length: 64 }),
    userAgent: text("user_agent"),
    success: boolean("success").notNull(),
    failureReason: varchar("failure_reason", { length: 80 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    emailIdx: index("login_attempts_email_idx").on(t.email),
    userIdx: index("login_attempts_user_idx").on(t.userId),
    ipIdx: index("login_attempts_ip_idx").on(t.ip),
    createdIdx: index("login_attempts_created_idx").on(t.createdAt),
  }),
);

/* =========================
   SECURITY EVENTS (Audit Log)
   ========================= */
export const securityEvents = pgTable(
  "security_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    eventType: varchar("event_type", { length: 60 }).notNull(),
    severity: varchar("severity", { length: 20 }).notNull(),
    description: text("description"),
    meta: jsonb("meta"),
    ip: varchar("ip", { length: 64 }),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    userIdx: index("security_events_user_idx").on(t.userId),
    typeIdx: index("security_events_type_idx").on(t.eventType),
    severityIdx: index("security_events_severity_idx").on(t.severity),
    createdIdx: index("security_events_created_idx").on(t.createdAt),
  }),
);

/* =========================
   CAPTCHA CHALLENGES
   ========================= */
export const captchaChallenges = pgTable("captcha_challenges", {
  id: uuid("id").primaryKey().defaultRandom(),
  challenge: varchar("challenge", { length: 100 }).notNull(),
  answerHash: text("answer_hash").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
  ipAddress: varchar("ip_address", { length: 64 }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/* =========================
   RELATIONS
   ========================= */
export const usersRelations = relations(users, ({ many }) => ({
  listings: many(listings),
  sentMessages: many(messages),
  buyerConvs: many(conversations, { relationName: "buyerConvs" }),
  sellerConvs: many(conversations, { relationName: "sellerConvs" }),
  notifications: many(notifications),
  favorites: many(favorites),
  reviewsReceived: many(reviews, { relationName: "reviewsReceived" }),
  reviewsGiven: many(reviews, { relationName: "reviewsGiven" }),
  reports: many(reports),
}));

export const listingsRelations = relations(listings, ({ one, many }) => ({
  user: one(users, { fields: [listings.userId], references: [users.id] }),
  category: one(categories, {
    fields: [listings.categoryId],
    references: [categories.id],
  }),
  city: one(cities, { fields: [listings.cityId], references: [cities.id] }),
  images: many(listingImages),
  favorites: many(favorites),
  reviews: many(reviews),
}));

export const listingImagesRelations = relations(listingImages, ({ one }) => ({
  listing: one(listings, {
    fields: [listingImages.listingId],
    references: [listings.id],
  }),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  listings: many(listings),
}));

export const citiesRelations = relations(cities, ({ many }) => ({
  listings: many(listings),
}));

export const conversationsRelations = relations(
  conversations,
  ({ one, many }) => ({
    buyer: one(users, {
      fields: [conversations.buyerId],
      references: [users.id],
      relationName: "buyerConvs",
    }),
    seller: one(users, {
      fields: [conversations.sellerId],
      references: [users.id],
      relationName: "sellerConvs",
    }),
    listing: one(listings, {
      fields: [conversations.listingId],
      references: [listings.id],
    }),
    messages: many(messages),
  }),
);

export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
  }),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  seller: one(users, {
    fields: [reviews.sellerId],
    references: [users.id],
    relationName: "reviewsReceived",
  }),
  reviewer: one(users, {
    fields: [reviews.reviewerId],
    references: [users.id],
    relationName: "reviewsGiven",
  }),
  listing: one(listings, {
    fields: [reviews.listingId],
    references: [listings.id],
  }),
}));

export const favoritesRelations = relations(favorites, ({ one }) => ({
  user: one(users, { fields: [favorites.userId], references: [users.id] }),
  listing: one(listings, {
    fields: [favorites.listingId],
    references: [listings.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

/* =========================
   TYPES
   ========================= */
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Listing = typeof listings.$inferSelect;
export type NewListing = typeof listings.$inferInsert;
export type Category = typeof categories.$inferSelect;
export type City = typeof cities.$inferSelect;
export type ListingImage = typeof listingImages.$inferSelect;
export type Conversation = typeof conversations.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type Review = typeof reviews.$inferSelect;
export type Report = typeof reports.$inferSelect;
export type Banner = typeof banners.$inferSelect;
export type Sponsor = typeof sponsors.$inferSelect;
export type Setting = typeof settings.$inferSelect;
export type ActivityLog = typeof activityLogs.$inferSelect;
export type FeaturedAd = typeof featuredAds.$inferSelect;

// Helper used by storage to query things
export const _sql = sql;

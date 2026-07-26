/**
 * Secure Listing Repository
 * طبقة آمنة للتعامل مع الإعلانات
 */
import { db } from "@/db";
import {
  listings,
  listingImages,
  categories,
  cities,
  users,
  favorites,
} from "@/db/schema";
import { and, or, eq, sql, desc, asc, inArray, gte, lte } from "drizzle-orm";
import { validateUUID, sanitizeSearch, validatePagination } from "@/lib/db-security";
import { rateLimit } from "@/lib/rate-limit";
import { slugify } from "@/lib/utils";

export class ListingRepository {
  /**
   * إنشاء إعلان جديد
   */
  static async create(userId: string, data: {
    title: string;
    description: string;
    price: number;
    currency: string;
    condition: "new" | "like_new" | "good" | "fair" | "used";
    categoryId: string;
    cityId: string;
    contactPhone?: string;
    location?: string;
  }) {
    const validUserId = validateUUID(userId);
    const validCategoryId = validateUUID(data.categoryId, "categoryId");
    const validCityId = validateUUID(data.cityId, "cityId");

    // Validate inputs
    if (data.title.length < 4 || data.title.length > 200) {
      throw new Error("Invalid title length");
    }
    if (data.description.length < 10 || data.description.length > 5000) {
      throw new Error("Invalid description length");
    }
    if (data.price < 0 || data.price > 1_000_000_000) {
      throw new Error("Invalid price");
    }

    // Generate unique slug
    const baseSlug = slugify(data.title) || `listing-${Date.now()}`;
    let slug = baseSlug;
    let attempts = 0;
    
    while (attempts < 10) {
      const [existing] = await db
        .select({ id: listings.id })
        .from(listings)
        .where(eq(listings.slug, slug))
        .limit(1);
      
      if (!existing) break;
      attempts++;
      slug = `${baseSlug}-${attempts}`;
    }

    const [listing] = await db
      .insert(listings)
      .values({
        userId: validUserId,
        categoryId: validCategoryId,
        cityId: validCityId,
        title: data.title,
        slug,
        description: data.description,
        price: data.price,
        currency: data.currency || "DZD",
        condition: data.condition,
        contactPhone: data.contactPhone?.slice(0, 30) || null,
        location: data.location?.slice(0, 160) || null,
        status: "pending",
        publishedAt: null,
      })
      .returning();

    return listing;
  }

  /**
   * البحث الآمن في الإعلانات
   */
  static async search(opts: {
    q?: string;
    categoryId?: string;
    cityId?: string;
    condition?: string;
    minPrice?: number;
    maxPrice?: number;
    featured?: boolean;
    sellerId?: string;
    status?: string[];
    page?: number;
    limit?: number;
    sort?: "newest" | "oldest" | "price_asc" | "price_desc" | "popular";
  }) {
    const { page, limit } = validatePagination(opts.page, opts.limit, 48);
    
    // Build WHERE conditions safely
    const conditions = [];
    
    // Default: only active listings for public
    if (!opts.status) {
      conditions.push(eq(listings.status, "active"));
    } else if (opts.status.length > 0) {
      // Whitelist of allowed statuses
      const allowed = ["pending", "active", "rejected", "closed", "sold", "draft"];
      const safe = opts.status.filter((s) => allowed.includes(s));
      if (safe.length > 0) {
        conditions.push(inArray(listings.status, safe as any));
      }
    }
    
    if (opts.q) {
      const safeQ = sanitizeSearch(opts.q, 100);
      if (safeQ) {
        // Parameterized search using OR + ILIKE
        conditions.push(
          or(
            sql`${listings.title} ILIKE ${"%" + safeQ + "%"}`,
            sql`${listings.description} ILIKE ${"%" + safeQ + "%"}`
          )
        );
      }
    }
    
    if (opts.categoryId) {
      conditions.push(eq(listings.categoryId, validateUUID(opts.categoryId, "categoryId")));
    }
    if (opts.cityId) {
      conditions.push(eq(listings.cityId, validateUUID(opts.cityId, "cityId")));
    }
    if (opts.condition) {
      const allowed = ["new", "like_new", "good", "fair", "used"];
      if (allowed.includes(opts.condition)) {
        conditions.push(eq(listings.condition, opts.condition as any));
      }
    }
    if (opts.sellerId) {
      conditions.push(eq(listings.userId, validateUUID(opts.sellerId, "sellerId")));
    }
    if (typeof opts.featured === "boolean") {
      conditions.push(eq(listings.isFeatured, opts.featured));
    }
    if (opts.minPrice != null && Number.isFinite(opts.minPrice) && opts.minPrice >= 0) {
      conditions.push(gte(listings.price, opts.minPrice));
    }
    if (opts.maxPrice != null && Number.isFinite(opts.maxPrice) && opts.maxPrice >= 0) {
      conditions.push(lte(listings.price, opts.maxPrice));
    }

    const where = conditions.length ? and(...conditions) : undefined;

    // Order By
    let orderBy;
    switch (opts.sort) {
      case "oldest":
        orderBy = asc(listings.createdAt);
        break;
      case "price_asc":
        orderBy = asc(listings.price);
        break;
      case "price_desc":
        orderBy = desc(listings.price);
        break;
      case "popular":
        orderBy = desc(listings.viewsCount);
        break;
      default:
        orderBy = desc(listings.publishedAt);
    }

    const offset = (page - 1) * limit;

    // Execute with parallel total count
    const [rows, totalResult] = await Promise.all([
      db
        .select({
          id: listings.id,
          title: listings.title,
          slug: listings.slug,
          price: listings.price,
          currency: listings.currency,
          condition: listings.condition,
          status: listings.status,
          isFeatured: listings.isFeatured,
          viewsCount: listings.viewsCount,
          publishedAt: listings.publishedAt,
          createdAt: listings.createdAt,
          userId: listings.userId,
          categoryId: listings.categoryId,
          cityId: listings.cityId,
          category: categories.name,
          city: cities.name,
          sellerName: users.fullName,
          sellerAvatar: users.avatarUrl,
        })
        .from(listings)
        .leftJoin(users, eq(users.id, listings.userId))
        .leftJoin(categories, eq(categories.id, listings.categoryId))
        .leftJoin(cities, eq(cities.id, listings.cityId))
        .where(where ?? sql`true`)
        .orderBy(orderBy)
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`cast(count(*) as integer)` })
        .from(listings)
        .where(where ?? sql`true`),
    ]);

    // Fetch images in batch
    const ids = rows.map((r) => r.id);
    let imgMap = new Map<string, { url: string; isPrimary: boolean }[]>();
    if (ids.length > 0) {
      const imgs = await db
        .select()
        .from(listingImages)
        .where(inArray(listingImages.listingId, ids));
      for (const i of imgs) {
        const arr = imgMap.get(i.listingId) ?? [];
        arr.push({ url: i.url, isPrimary: i.isPrimary });
        imgMap.set(i.listingId, arr);
      }
    }

    return {
      items: rows.map((r) => ({
        ...r,
        images: imgMap.get(r.id) ?? [],
      })),
      total: Number(totalResult[0]?.count ?? 0),
      page,
      limit,
    };
  }

  /**
   * الحصول على إعلان بواسطة ID
   */
  static async findById(id: string, includeUnpublished = false) {
    const validId = validateUUID(id, "listingId");
    const [row] = await db
      .select()
      .from(listings)
      .where(eq(listings.id, validId))
      .limit(1);

    if (!row) return null;
    if (!includeUnpublished && row.status !== "active") {
      return null; // Caller should check ownership separately
    }
    return row;
  }

  /**
   * زيادة المشاهدات بشكل ذري
   */
  static async incrementViews(id: string) {
    const validId = validateUUID(id, "listingId");
    await db
      .update(listings)
      .set({ viewsCount: sql`${listings.viewsCount} + 1` })
      .where(eq(listings.id, validId));
  }

  /**
   * تحديث إعلان (مع التحقق من الصلاحيات)
   */
  static async update(
    id: string,
    userId: string,
    isAdmin: boolean,
    updates: Record<string, unknown>,
  ) {
    const validId = validateUUID(id, "listingId");
    const validUserId = validateUUID(userId);

    // Whitelist of allowed update fields
    const allowedFields: Record<string, any> = {
      title: (v: any) => typeof v === "string" && v.length >= 4 && v.length <= 200,
      description: (v: any) => typeof v === "string" && v.length >= 10 && v.length <= 5000,
      price: (v: any) => typeof v === "number" && v >= 0 && v <= 1_000_000_000,
      currency: (v: any) => typeof v === "string" && v.length <= 8,
      condition: (v: any) => ["new", "like_new", "good", "fair", "used"].includes(v),
      categoryId: (v: any) => typeof v === "string",
      cityId: (v: any) => typeof v === "string",
      contactPhone: (v: any) => v == null || (typeof v === "string" && v.length <= 30),
      location: (v: any) => v == null || (typeof v === "string" && v.length <= 160),
      status: (v: any) => ["draft", "pending", "active", "rejected", "closed", "sold"].includes(v),
      isFeatured: (v: any) => typeof v === "boolean",
    };

    // Sellers cannot self-approve
    if (!isAdmin) {
      allowedFields.status = (v: any) => v === "closed" || v === "active";
      delete allowedFields.isFeatured;
    }

    const sanitizedUpdates: Record<string, unknown> = { updatedAt: new Date() };
    for (const [key, validator] of Object.entries(allowedFields)) {
      if (key in updates) {
        const value = updates[key];
        if (!validator(value)) {
          throw new Error(`Invalid value for field: ${key}`);
        }
        if (key === "categoryId" || key === "cityId") {
          sanitizedUpdates[key] = validateUUID(value, key);
        } else {
          sanitizedUpdates[key] = value;
        }
      }
    }

    // If activating, set publishedAt
    if (sanitizedUpdates.status === "active") {
      const [current] = await db
        .select({ status: listings.status })
        .from(listings)
        .where(eq(listings.id, validId))
        .limit(1);
      if (current && current.status !== "active") {
        sanitizedUpdates.publishedAt = new Date();
      }
    }

    // Build ownership check
    const ownershipCondition = isAdmin
      ? sql`true`
      : eq(listings.userId, validUserId);

    const [updated] = await db
      .update(listings)
      .set(sanitizedUpdates)
      .where(and(eq(listings.id, validId), ownershipCondition))
      .returning();

    return updated;
  }

  /**
   * حذف إعلان
   */
  static async delete(id: string, userId: string, isAdmin: boolean) {
    const validId = validateUUID(id, "listingId");
    const validUserId = validateUUID(userId);

    const ownershipCondition = isAdmin
      ? sql`true`
      : eq(listings.userId, validUserId);

    // Delete related records first (CASCADE should handle this but be explicit)
    await db.delete(favorites).where(eq(favorites.listingId, validId));
    await db.delete(listingImages).where(eq(listingImages.listingId, validId));
    
    const [deleted] = await db
      .delete(listings)
      .where(and(eq(listings.id, validId), ownershipCondition))
      .returning();

    return deleted;
  }

  /**
   * إضافة/إزالة من المفضلة
   */
  static async toggleFavorite(userId: string, listingId: string) {
    const validUserId = validateUUID(userId);
    const validListingId = validateUUID(listingId, "listingId");

    const [existing] = await db
      .select()
      .from(favorites)
      .where(
        and(
          eq(favorites.userId, validUserId),
          eq(favorites.listingId, validListingId),
        ),
      )
      .limit(1);

    if (existing) {
      await db
        .delete(favorites)
        .where(
          and(
            eq(favorites.userId, validUserId),
            eq(favorites.listingId, validListingId),
          ),
        );
      return false;
    } else {
      await db.insert(favorites).values({
        userId: validUserId,
        listingId: validListingId,
      });
      return true;
    }
  }
}

import { NextRequest } from "next/server";
import { handleError, ok, parseJson, fail } from "@/lib/api";
import { requireUser, getCurrentUser } from "@/lib/auth";
import { listingSchema } from "@/lib/validation";
import { logActivity } from "@/lib/activity";
import { ListingRepository } from "@/lib/listing-repository";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { getCurrentUser as getMe } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const me = await getMe();

    // Parse pagination
    const page = Number(searchParams.get("page") || "1");
    const limit = Number(searchParams.get("limit") || "24");

    // Use secure repository
    const result = await ListingRepository.search({
      q: searchParams.get("q") || undefined,
      categoryId: searchParams.get("category") || undefined,
      cityId: searchParams.get("city") || undefined,
      condition: searchParams.get("condition") || undefined,
      minPrice: searchParams.get("minPrice") ? Number(searchParams.get("minPrice")) : undefined,
      maxPrice: searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : undefined,
      featured: searchParams.get("featured") === "true",
      sellerId: searchParams.get("seller") || undefined,
      status: searchParams.get("status")?.split(",") || undefined,
      page,
      limit,
      sort: (searchParams.get("sort") as any) || "newest",
    });

    return ok(result);
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const me = await requireUser();
    const ip = getClientIp(req);
    
    // Rate Limiting - 10 ads per hour per user
    const rl = rateLimit(`create-listing:${me.id}`, 10, 3600_000);
    if (!rl.allowed) {
      return fail("تجاوزت الحد المسموح لإنشاء الإعلانات", 429);
    }

    const body = await parseJson(req, listingSchema);

    const listing = await ListingRepository.create(me.id, {
      title: body.title,
      description: body.description,
      price: body.price,
      currency: body.currency || "DZD",
      condition: body.condition,
      categoryId: body.categoryId,
      cityId: body.cityId,
      contactPhone: body.contactPhone,
      location: body.location,
    });

    await logActivity({
      actorId: me.id,
      action: "create",
      entity: "listing",
      entityId: listing.id,
      meta: { title: listing.title, ip },
    });

    return ok(listing, { status: 201 });
  } catch (e) {
    return handleError(e);
  }
}

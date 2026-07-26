import Link from "next/link";
import { db } from "@/db";
import { cities } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { PageShell } from "@/components/page-shell";
import { MapPin } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CitiesPage() {
  const rows = await db
    .select({
      id: cities.id,
      name: cities.name,
      slug: cities.slug,
      count: sql<number>`(SELECT cast(count(*) as integer) FROM listings WHERE listings.city_id = ${cities.id} AND listings.status = 'active')`,
    })
    .from(cities)
    .where(eq(cities.isActive, true))
    .orderBy(cities.name);
  return (
    <PageShell>
      <div className="container-app py-6 md:py-8">
        <h1 className="text-2xl md:text-3xl font-black mb-1">جميع المدن</h1>
        <p className="text-sm text-soft mb-6">اختر مدينتك لاستعراض الإعلانات فيها</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {rows.map((c) => (
            <Link
              key={c.id}
              href={`/listings?city=${c.id}`}
              className="card card-hover p-4 group"
            >
              <div className="size-12 rounded-xl bg-[#00A86B]/10 flex items-center justify-center group-hover:bg-[#00A86B] group-hover:text-white transition-colors text-[#00A86B] mb-2">
                <MapPin className="size-5" />
              </div>
              <h3 className="font-bold text-app">{c.name}</h3>
              <p className="text-xs text-soft">{c.count} إعلان</p>
            </Link>
          ))}
        </div>
      </div>
    </PageShell>
  );
}

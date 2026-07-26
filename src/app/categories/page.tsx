import Link from "next/link";
import { db } from "@/db";
import { categories } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { PageShell } from "@/components/page-shell";
import { Package, Car, Home, Smartphone, Tv, Shirt, Wrench, Briefcase, BookOpen, Gamepad2, Dumbbell, Tag as TagIcon } from "lucide-react";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Car, Home, Smartphone, Tv, Shirt, Wrench, Briefcase, BookOpen, Gamepad2, Dumbbell, Refrigerator: Package, Cat: Package,
};

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const rows = await db
    .select({
      id: categories.id,
      name: categories.name,
      slug: categories.slug,
      icon: categories.icon,
      description: categories.description,
      count: sql<number>`(SELECT cast(count(*) as integer) FROM listings WHERE listings.category_id = ${categories.id} AND listings.status = 'active')`,
    })
    .from(categories)
    .where(eq(categories.isActive, true))
    .orderBy(categories.sortOrder, categories.name);

  return (
    <PageShell>
      <div className="container-app py-6 md:py-8">
        <h1 className="text-2xl md:text-3xl font-black mb-1">جميع الفئات</h1>
        <p className="text-sm text-soft mb-6">اختر الفئة المناسبة لتصفح إعلاناتها</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
          {rows.map((c) => {
            const Icon = ICON_MAP[c.icon || ""] || TagIcon;
            return (
              <Link
                key={c.id}
                href={`/listings?category=${c.id}`}
                className="card card-hover p-5 group"
              >
                <div className="size-14 rounded-2xl bg-gradient-to-br from-[#00A86B]/15 to-[#00A86B]/5 flex items-center justify-center group-hover:scale-110 transition-transform mb-3">
                  <Icon className="size-7 text-[#00A86B]" />
                </div>
                <h3 className="font-bold text-app mb-1">{c.name}</h3>
                <p className="text-xs text-soft mb-2 line-clamp-2">
                  {c.description || "تصفح الإعلانات"}
                </p>
                <span className="text-xs text-[#00A86B] font-semibold">
                  {c.count} إعلان
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </PageShell>
  );
}

"use client";

import Link from "next/link";
import {
  Car,
  Home,
  Smartphone,
  Sofa,
  Briefcase,
  Shirt,
  Gamepad2,
  Dog,
  ChevronLeft,
} from "lucide-react";

const iconMap: Record<string, React.ReactNode> = {
  Car: <Car className="w-6 h-6" />,
  Home: <Home className="w-6 h-6" />,
  Smartphone: <Smartphone className="w-6 h-6" />,
  Sofa: <Sofa className="w-6 h-6" />,
  Briefcase: <Briefcase className="w-6 h-6" />,
  Shirt: <Shirt className="w-6 h-6" />,
  Gamepad2: <Gamepad2 className="w-6 h-6" />,
  Dog: <Dog className="w-6 h-6" />,
};

interface Category {
  id: number;
  name: string;
  nameAr: string;
  slug: string;
  icon: string;
  children?: Category[];
  parentId?: number | null;
}

export default function CategoryGrid({
  categories,
}: {
  categories: Category[];
}) {
  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">الفئات</h2>
        <Link
          href="/?all=true"
          className="text-wdk-600 text-sm hover:underline flex items-center gap-1"
        >
          عرض الكل <ChevronLeft className="w-4 h-4" />
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={`/?category=${cat.id}`}
            className="group flex flex-col items-center gap-2 p-4 bg-white rounded-2xl border border-gray-200 hover:border-wdk-300 hover:shadow-md hover:bg-wdk-50 transition-all duration-200"
          >
            <div className="text-wdk-600 group-hover:text-wdk-700 group-hover:scale-110 transition-transform">
              {iconMap[cat.icon] || <Briefcase className="w-6 h-6" />}
            </div>
            <span className="text-xs font-medium text-gray-700 text-center leading-tight">
              {cat.nameAr}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

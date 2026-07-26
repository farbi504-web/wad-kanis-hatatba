import Link from "next/link";
import { Home, Search, ArrowRight } from "lucide-react";
import { PageShell } from "@/components/page-shell";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <PageShell>
      <div className="container-app py-16 md:py-24 text-center">
        <div className="max-w-md mx-auto">
          <div className="text-[120px] md:text-[160px] font-black leading-none bg-gradient-to-l from-[#00A86B] to-[#0D1F3C] bg-clip-text text-transparent">
            404
          </div>
          <h1 className="text-2xl md:text-3xl font-black mb-2">
            الصفحة غير موجودة
          </h1>
          <p className="text-sm text-soft mb-6">
            عذراً، الصفحة التي تبحث عنها قد تكون محذوفة أو منقولة
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href="/">
              <Button>
                <Home className="size-4" /> العودة للرئيسية
              </Button>
            </Link>
            <Link href="/listings">
              <Button variant="outline">
                <Search className="size-4" /> تصفح الإعلانات
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

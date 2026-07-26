import { Suspense } from "react";
import HomeContent from "@/components/ads/HomeContent";
import { Loader2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-40">
          <Loader2 className="w-8 h-8 text-wdk-600 animate-spin" />
        </div>
      }
    >
      <HomeContent />
    </Suspense>
  );
}

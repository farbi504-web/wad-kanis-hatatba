"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to console for debugging
    console.error("[GlobalError] caught error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-soft">
      <div className="max-w-md w-full text-center">
        <div className="size-20 mx-auto rounded-2xl bg-red-100 dark:bg-red-950/30 flex items-center justify-center mb-4">
          <AlertTriangle className="size-10 text-red-500" />
        </div>
        <h1 className="text-2xl font-black text-app mb-2">حدث خطأ غير متوقع</h1>
        <p className="text-sm text-soft mb-6">
          نأسف للإزعاج. حدث خطأ أثناء تحميل الصفحة. يمكنك المحاولة مرة أخرى أو العودة للصفحة الرئيسية.
        </p>
        {error.message && (
          <details className="text-start mb-6 p-3 rounded-xl bg-card border border-app">
            <summary className="cursor-pointer text-xs font-semibold text-soft">
              تفاصيل الخطأ
            </summary>
            <pre className="text-[10px] text-soft mt-2 overflow-auto max-h-40">
              {error.message}
              {error.digest && `\nDigest: ${error.digest}`}
            </pre>
          </details>
        )}
        <div className="flex flex-wrap gap-2 justify-center">
          <Button onClick={reset}>
            <RefreshCw className="size-4" /> إعادة المحاولة
          </Button>
          <Link href="/">
            <Button variant="outline">
              <Home className="size-4" /> الرئيسية
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

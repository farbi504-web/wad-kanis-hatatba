"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        <div style={{ padding: "40px", textAlign: "center", fontFamily: "system-ui" }}>
          <h1>حدث خطأ في التطبيق</h1>
          <button onClick={() => reset()}>إعادة المحاولة</button>
        </div>
      </body>
    </html>
  );
}

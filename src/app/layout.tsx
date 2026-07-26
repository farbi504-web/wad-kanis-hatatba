import { getSession } from "@/lib/auth";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Toaster } from "sonner";
import "@/app/globals.css";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  return (
    <html lang="ar" dir="rtl">
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased flex flex-col">
        <Navbar session={session} />
        <main className="flex-1">{children}</main>
        <Footer />
        <Toaster
          position="top-center"
          richColors
          closeButton
          dir="rtl"
          toastOptions={{
            style: { fontFamily: "inherit" },
          }}
        />
      </body>
    </html>
  );
}

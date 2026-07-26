import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Cairo, Tajawal } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  display: "swap",
  variable: "--font-cairo",
});
const tajawal = Tajawal({
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "700", "900"],
  display: "swap",
  variable: "--font-tajawal",
});

export const metadata: Metadata = {
  title: "واد كنيس حطاطبة | منصة الإعلانات المبوبة",
  description:
    "منصة واد كنيس حطاطبة - أكبر سوق إلكتروني للإعلانات المبوبة في حطاطبة، تيبازة والمناطق المجاورة. بيع واشتري بسهولة وأمان.",
  keywords: [
    "واد كنيس",
    "حطاطبة",
    "تيبازة",
    "إعلانات",
    "إعلانات مبوبة",
    "بيع وشراء",
    "الجزائر",
  ],
  authors: [{ name: "Wadi Knis Hatatba" }],
  icons: {
    icon: [{ url: "/logo.png", type: "image/png" }],
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
  openGraph: {
    title: "واد كنيس حطاطبة",
    description: "منصة الإعلانات المبوبة الأولى في حطاطبة وتيبازة",
    type: "website",
    locale: "ar_DZ",
    images: [{ url: "/logo.png", width: 1200, height: 630, alt: "واد كنيس حطاطبة" }],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1220" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="ar"
      dir="rtl"
      suppressHydrationWarning
      className={`${cairo.variable} ${tajawal.variable}`}
    >
      <body className="font-arabic antialiased">
        <ThemeProvider>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}

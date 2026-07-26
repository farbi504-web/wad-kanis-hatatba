import Link from "next/link";
import {
  Globe,
  Camera,
  Mail,
  MapPin,
  Phone,
  Send,
} from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-app bg-soft">
      <div className="container-app py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="size-12">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/logo.png"
                  alt="واد كنيس حطاطبة"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <div className="font-extrabold text-app">واد كنيس حطاطبة</div>
                <div className="text-xs text-soft">منصة مجتمعنا</div>
              </div>
            </div>
            <p className="text-sm text-soft leading-relaxed">
              المنصة الأولى للإعلانات المبوبة في حطاطبة، تيبازة والمناطق
              المجاورة. نوفر بيئة آمنة وموثوقة للبيع والشراء.
            </p>
            <div className="flex gap-2 mt-4">
              <a
                href="#"
                aria-label="Facebook"
                className="size-9 rounded-lg bg-card border border-app flex items-center justify-center hover:text-[#00A86B] transition-colors"
              >
                <Globe className="size-4" />
              </a>
              <a
                href="#"
                aria-label="Instagram"
                className="size-9 rounded-lg bg-card border border-app flex items-center justify-center hover:text-[#00A86B] transition-colors"
              >
                <Camera className="size-4" />
              </a>
              <a
                href="#"
                aria-label="Telegram"
                className="size-9 rounded-lg bg-card border border-app flex items-center justify-center hover:text-[#00A86B] transition-colors"
              >
                <Send className="size-4" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="font-bold text-app mb-4">روابط سريعة</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/listings"
                  className="text-soft hover:text-[#00A86B] transition-colors"
                >
                  تصفح الإعلانات
                </Link>
              </li>
              <li>
                <Link
                  href="/listings/new"
                  className="text-soft hover:text-[#00A86B] transition-colors"
                >
                  أضف إعلانك
                </Link>
              </li>
              <li>
                <Link
                  href="/categories"
                  className="text-soft hover:text-[#00A86B] transition-colors"
                >
                  الفئات
                </Link>
              </li>
              <li>
                <Link
                  href="/cities"
                  className="text-soft hover:text-[#00A86B] transition-colors"
                >
                  المدن
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-app mb-4">الحساب</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/auth/login"
                  className="text-soft hover:text-[#00A86B] transition-colors"
                >
                  تسجيل الدخول
                </Link>
              </li>
              <li>
                <Link
                  href="/auth/register"
                  className="text-soft hover:text-[#00A86B] transition-colors"
                >
                  إنشاء حساب
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard"
                  className="text-soft hover:text-[#00A86B] transition-colors"
                >
                  لوحة التحكم
                </Link>
              </li>
              <li>
                <Link
                  href="/profile"
                  className="text-soft hover:text-[#00A86B] transition-colors"
                >
                  الملف الشخصي
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-app mb-4">تواصل معنا</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2 text-soft">
                <MapPin className="size-4 mt-0.5 shrink-0 text-[#00A86B]" />
                <span>حطاطبة، تيبازة، الجزائر</span>
              </li>
              <li className="flex items-center gap-2 text-soft">
                <Phone className="size-4 shrink-0 text-[#00A86B]" />
                <span>+213 555 000 000</span>
              </li>
              <li className="flex items-center gap-2 text-soft">
                <Mail className="size-4 shrink-0 text-[#00A86B]" />
                <span>contact@wad-kanis.dz</span>
              </li>
            </ul>
            <div className="mt-4 flex gap-2 flex-wrap">
              <Link
                href="/privacy"
                className="text-xs text-soft hover:text-app underline-offset-4 hover:underline"
              >
                سياسة الخصوصية
              </Link>
              <span className="text-soft">·</span>
              <Link
                href="/terms"
                className="text-xs text-soft hover:text-app underline-offset-4 hover:underline"
              >
                الشروط والأحكام
              </Link>
              <span className="text-soft">·</span>
              <Link
                href="/contact"
                className="text-xs text-soft hover:text-app underline-offset-4 hover:underline"
              >
                اتصل بنا
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-app flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-soft">
          <div>
            © {new Date().getFullYear()} واد كنيس حطاطبة. جميع الحقوق محفوظة.
          </div>
          <div className="flex items-center gap-2">
            صنع بكل{" "}
            <span className="text-red-500 animate-pulse">♥</span> في الجزائر
          </div>
        </div>
      </div>
    </footer>
  );
}

import Link from "next/link";
import { MapPin, Mail, Phone } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <Link href="/" className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-wdk-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">و</span>
              </div>
              <span className="text-white font-bold text-lg">واد كنيس حطاطبة</span>
            </Link>
            <p className="text-sm leading-relaxed">
              منصة الإعلانات المبوبة الأولى في حطاطبة والمناطق المجاورة. بيع، شراء،
              كراء، خدمات والمزيد.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-3">روابط سريعة</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="hover:text-white transition">
                  الرئيسية
                </Link>
              </li>
              <li>
                <Link href="/post-ad" className="hover:text-white transition">
                  نشر إعلان
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-white transition">
                  تسجيل الدخول
                </Link>
              </li>
              <li>
                <Link href="/register" className="hover:text-white transition">
                  إنشاء حساب
                </Link>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="text-white font-semibold mb-3">أقسام رئيسية</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/?category=vehicules" className="hover:text-white transition">
                  سيارات ومركبات
                </Link>
              </li>
              <li>
                <Link href="/?category=immobilier" className="hover:text-white transition">
                  عقارات
                </Link>
              </li>
              <li>
                <Link href="/?category=electronique" className="hover:text-white transition">
                  إلكترونيات
                </Link>
              </li>
              <li>
                <Link href="/?category=emploi-services" className="hover:text-white transition">
                  وظائف وخدمات
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold mb-3">اتصل بنا</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-wdk-400 shrink-0" />
                <span>حطاطبة، تيبازة، الجزائر</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-wdk-400 shrink-0" />
                <span dir="ltr">+213 55 00 00 00</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-wdk-400 shrink-0" />
                <span>admin@wad-kanis.dz</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-6 text-center text-sm">
          <p>© {new Date().getFullYear()} واد كنيس حطاطبة. جميع الحقوق محفوظة.</p>
        </div>
      </div>
    </footer>
  );
}

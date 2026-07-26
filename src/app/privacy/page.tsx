import { PageShell } from "@/components/page-shell";
import { Shield } from "lucide-react";

export const dynamic = "force-dynamic";

export default function PrivacyPage() {
  return (
    <PageShell>
      <div className="container-app py-8 md:py-12 max-w-3xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="size-12 rounded-2xl bg-[#00A86B]/10 flex items-center justify-center text-[#00A86B]">
            <Shield className="size-6" />
          </div>
          <h1 className="text-2xl md:text-3xl font-black">سياسة الخصوصية</h1>
        </div>
        <p className="text-sm text-soft mb-6">آخر تحديث: يناير 2026</p>
        <div className="card p-6 space-y-4 text-sm leading-relaxed text-app">
          <section>
            <h2 className="text-lg font-bold mb-2">1. مقدمة</h2>
            <p className="text-soft">
              نحن في واد كنيس حطاطبة نلتزم بحماية خصوصية مستخدمينا. توضح هذه
              السياسة كيف نجمع ونستخدم ونحمي معلوماتك الشخصية.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-bold mb-2">2. المعلومات التي نجمعها</h2>
            <ul className="text-soft list-disc pr-5 space-y-1">
              <li>الاسم الكامل وعنوان البريد الإلكتروني</li>
              <li>رقم الهاتف (اختياري)</li>
              <li>الصورة الشخصية (اختيارية)</li>
              <li>محتوى الإعلانات التي تنشرها</li>
              <li>الرسائل المتبادلة بين المستخدمين</li>
            </ul>
          </section>
          <section>
            <h2 className="text-lg font-bold mb-2">3. كيف نستخدم معلوماتك</h2>
            <ul className="text-soft list-disc pr-5 space-y-1">
              <li>تقديم خدمات المنصة وتحسينها</li>
              <li>التواصل معك بشأن حسابك وإعلاناتك</li>
              <li>ضمان أمان المنصة ومنع الاحتيال</li>
              <li>الرد على استفساراتك وطلبات الدعم</li>
            </ul>
          </section>
          <section>
            <h2 className="text-lg font-bold mb-2">4. حماية البيانات</h2>
            <p className="text-soft">
              نستخدم تشفير SSL، ونخزن كلمات المرور بتشفير bcrypt، ونطبق سياسات
              أمان صارمة لحماية بياناتك من الوصول غير المصرح به.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-bold mb-2">5. مشاركة المعلومات</h2>
            <p className="text-soft">
              لا نبيع أو نؤجر معلوماتك الشخصية لأطراف ثالثة. قد نشارك
              المعلومات فقط مع الجهات الحكومية عند الضرورة القانونية.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-bold mb-2">6. حقوقك</h2>
            <ul className="text-soft list-disc pr-5 space-y-1">
              <li>الوصول إلى معلوماتك الشخصية في أي وقت</li>
              <li>تصحيح أو تحديث معلوماتك</li>
              <li>حذف حسابك نهائياً</li>
              <li>إلغاء الاشتراك في الإشعارات</li>
            </ul>
          </section>
          <section>
            <h2 className="text-lg font-bold mb-2">7. ملفات تعريف الارتباط (Cookies)</h2>
            <p className="text-soft">
              نستخدم ملفات تعريف الارتباط الضرورية فقط لتشغيل المنصة وحفظ
              تفضيلاتك (مثل وضع الإضاءة).
            </p>
          </section>
          <section>
            <h2 className="text-lg font-bold mb-2">8. تواصل معنا</h2>
            <p className="text-soft">
              لأي استفسار حول الخصوصية، تواصل معنا عبر صفحة{" "}
              <a href="/contact" className="text-[#00A86B] hover:underline">
                اتصل بنا
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </PageShell>
  );
}

import { PageShell } from "@/components/page-shell";
import { FileText } from "lucide-react";

export const dynamic = "force-dynamic";

export default function TermsPage() {
  return (
    <PageShell>
      <div className="container-app py-8 md:py-12 max-w-3xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="size-12 rounded-2xl bg-[#F4B400]/15 flex items-center justify-center text-[#F4B400]">
            <FileText className="size-6" />
          </div>
          <h1 className="text-2xl md:text-3xl font-black">الشروط والأحكام</h1>
        </div>
        <p className="text-sm text-soft mb-6">آخر تحديث: يناير 2026</p>
        <div className="card p-6 space-y-4 text-sm leading-relaxed text-app">
          <section>
            <h2 className="text-lg font-bold mb-2">1. القبول بالشروط</h2>
            <p className="text-soft">
              باستخدامك لمنصة واد كنيس حطاطبة، فإنك توافق على هذه الشروط
              والأحكام. إذا كنت لا توافق، يرجى عدم استخدام المنصة.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-bold mb-2">2. استخدام المنصة</h2>
            <ul className="text-soft list-disc pr-5 space-y-1">
              <li>يجب أن يكون عمرك 18 سنة على الأقل</li>
              <li>تقديم معلومات صحيحة ودقيقة عند التسجيل</li>
              <li>عدم انتحال شخصية أي شخص أو كيان</li>
              <li>عدم استخدام المنصة لأي غرض غير قانوني</li>
            </ul>
          </section>
          <section>
            <h2 className="text-lg font-bold mb-2">3. الإعلانات</h2>
            <ul className="text-soft list-disc pr-5 space-y-1">
              <li>يجب أن تكون الإعلانات حقيقية وقانونية</li>
              <li>يحظر نشر منتجات مقلدة أو ممنوعة</li>
              <li>الإعلانات تخضع للمراجعة قبل النشر</li>
              <li>يحظر نشر إعلانات مكررة لنفس المنتج</li>
              <li>الإدارة تحتفظ بحق رفض أي إعلان</li>
            </ul>
          </section>
          <section>
            <h2 className="text-lg font-bold mb-2">4. التعاملات بين المستخدمين</h2>
            <p className="text-soft">
              المنصة وسيط فقط لتوفير التواصل. أي اتفاقيات أو معاملات بين
              المستخدمين هي مسؤوليتهم الخاصة، والمنصة غير مسؤولة عنها.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-bold mb-2">5. المحتوى المحظور</h2>
            <ul className="text-soft list-disc pr-5 space-y-1">
              <li>المنتجات المقلدة أو المقرصنة</li>
              <li>الأسلحة والمواد المحظورة</li>
              <li>المحتوى الإباحي أو المسيء</li>
              <li>أي محتوى يخدع أو يحتال على المستخدمين</li>
            </ul>
          </section>
          <section>
            <h2 className="text-lg font-bold mb-2">6. الإبلاغات</h2>
            <p className="text-soft">
              يمكنك الإبلاغ عن أي محتوى مخالف، وسيتم مراجعته خلال 24 ساعة.
              يحق للإدارة اتخاذ الإجراء المناسب بما في ذلك حذف المحتوى أو
              حظر الحساب.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-bold mb-2">7. إيقاف الحساب</h2>
            <p className="text-soft">
              للإدارة الحق في إيقاف أو حذف أي حساب يخالف هذه الشروط دون
              إشعار مسبق.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-bold mb-2">8. تعديل الشروط</h2>
            <p className="text-soft">
              نحتفظ بحق تعديل هذه الشروط في أي وقت، وسيتم إخطار المستخدمين
              بالتغييرات الجوهرية.
            </p>
          </section>
        </div>
      </div>
    </PageShell>
  );
}

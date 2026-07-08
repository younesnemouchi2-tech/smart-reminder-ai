import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'

export const metadata = { title: 'شروط الاستخدام - مُذكّري الذكي' }

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <header className="border-b border-border/50 glass">
        <div className="container mx-auto max-w-3xl px-4 py-4 flex items-center justify-between">
          <h1 className="font-bold text-lg">شروط الاستخدام</h1>
          <Link href="/"><Button variant="ghost" size="sm"><ArrowRight className="h-4 w-4 ml-1" /> العودة للرئيسية</Button></Link>
        </div>
      </header>
      <main className="container mx-auto max-w-3xl px-4 py-8">
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <p className="text-sm text-muted-foreground">آخر تحديث: يناير 2026</p>
          <h2 className="text-xl font-bold mt-6 mb-3">1. قبول الشروط</h2>
          <p>باستخدامك لتطبيق "مُذكّري الذكي"، فإنك توافق على هذه الشروط والأحكام. إذا كنت لا توافق على أي جزء منها، يرجى عدم استخدام التطبيق.</p>
          <h2 className="text-xl font-bold mt-6 mb-3">2. الوصف الخدمة</h2>
          <p>يقدم "مُذكّري الذكي" خدمة إدارة المهام والتذكيرات المدعومة بالذكاء الاصطناعي. يشمل ذلك إضافة وتنظيم المهام، اقتراح أوقات مناسبة لإنجازها، تتبع الإنتاجية، وتقديم رؤى تحليلية.</p>
          <h2 className="text-xl font-bold mt-6 mb-3">3. حساب المستخدم</h2>
          <p>للاستفادة الكاملة من الخدمة، يجب إنشاء حساب باستخدام بريد إلكتروني صحيح وكلمة مرور. أنت مسؤول عن الحفاظ على سرية كلمة المرور وجميع الأنشطة التي تتم تحت حسابك.</p>
          <h2 className="text-xl font-bold mt-6 mb-3">4. الملكية الفكرية</h2>
          <p>التطبيق وكل محتواه ملك حصري لصاحب التطبيق ومحمي بقوانين الملكية الفكرية. لا يجوز لك نسخ أو توزيع أو تعديل الكود المصدري أو استخدام التطبيق لأغراض تجارية دون إذن.</p>
          <h2 className="text-xl font-bold mt-6 mb-3">5. الاستخدام المقبول</h2>
          <p>توافق على عدم استخدام التطبيق لأي غرض غير قانوني أو مخالف، أو إساءة استخدام الخدمة، أو إدخال محتوى ضار أو مسيء.</p>
          <h2 className="text-xl font-bold mt-6 mb-3">6. الخصوصية</h2>
          <p>نحترم خصوصيتك ونحمي بياناتك. راجع <Link href="/legal/privacy" className="text-primary underline">سياسة الخصوصية</Link> لمعرفة كيف نجمع ونستخدم ونحمي معلوماتك.</p>
          <h2 className="text-xl font-bold mt-6 mb-3">7. إخلاء المسؤولية</h2>
          <p>الخدمة مقدمة "كما هي" دون ضمانات. لا نضمن أن الخدمة ستكون متاحة دائماً دون انقطاع أو أن اقتراحات الذكاء الاصطناعي ستكون دقيقة 100%.</p>
          <h2 className="text-xl font-bold mt-6 mb-3">8. إنهاء الحساب</h2>
          <p>يمكنك حذف حسابك في أي الوقت. يحق لنا تعليق أو إنهاء حسابك إذا خالفت هذه الشروط.</p>
          <h2 className="text-xl font-bold mt-6 mb-3">9. القانون الحاكم</h2>
          <p>تخضع هذه الشروط للقوانين المعمول بها في بلد مقدم الخدمة.</p>
          <h2 className="text-xl font-bold mt-6 mb-3">10. التواصل</h2>
          <p>لأي استفسار: support@smartreminder.ai</p>
          <div className="mt-8 p-4 bg-muted rounded-lg">
            <p className="text-sm">© 2026 مُذكّري الذكي. جميع الحقوق محفوظة.</p>
          </div>
        </div>
      </main>
    </div>
  )
}

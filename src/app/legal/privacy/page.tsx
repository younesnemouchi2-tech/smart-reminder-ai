import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'

export const metadata = { title: 'سياسة الخصوصية - مُذكّري الذكي' }

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <header className="border-b border-border/50 glass">
        <div className="container mx-auto max-w-3xl px-4 py-4 flex items-center justify-between">
          <h1 className="font-bold text-lg">سياسة الخصوصية</h1>
          <Link href="/"><Button variant="ghost" size="sm"><ArrowRight className="h-4 w-4 ml-1" /> العودة للرئيسية</Button></Link>
        </div>
      </header>
      <main className="container mx-auto max-w-3xl px-4 py-8">
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <p className="text-sm text-muted-foreground">آخر تحديث: يناير 2026</p>
          <h2 className="text-xl font-bold mt-6 mb-3">1. مقدمة</h2>
          <p>نحن في "مُذكّري الذكي" نولي أهمية قصوى لخصوصية مستخدمينا. توضح هذه السياسة كيف نجمع معلوماتك ونستخدمها ونحميها.</p>
          <h2 className="text-xl font-bold mt-6 mb-3">2. المعلومات التي نجمعها</h2>
          <p>نجمع المعلومات التالية: البريد الإلكتروني، الاسم (اختياري)، كلمة المرور (مشفّرة)، بيانات المهام التي تدخلها، وبيانات تقنية مثل نوع المتصفح والجهاز.</p>
          <h2 className="text-xl font-bold mt-6 mb-3">3. كيف نستخدم معلوماتك</h2>
          <p>نستخدم معلوماتك لتقديم خدمة إدارة المهام، توليد اقتراحات ذكية، تحليل نمط الإنتاجية، تحسين أداء التطبيق، وحماية حسابك.</p>
          <h2 className="text-xl font-bold mt-6 mb-3">4. حماية البيانات</h2>
          <p>نتخذ إجراءات أمنية صارمة: كلمات المرور مشفّرة بـ bcrypt، اتصالات HTTPS/TLS مشفّرة، قاعدة البيانات محمية، وصول محدود، ونسخ احتياطية دورية.</p>
          <h2 className="text-xl font-bold mt-6 mb-3">5. مشاركة البيانات</h2>
          <p>لا نبيع ولا نؤجر بياناتك الشخصية. قد نشاركها فقط مع مزودي خدمة الذكاء الاصطناعي (لحظياً، بدون تخزين) أو عند الإلزام القانوني.</p>
          <h2 className="text-xl font-bold mt-6 mb-3">6. حقوقك</h2>
          <p>لديك الحق في الوصول إلى بياناتك، تصحيحها، طلب حذفها، أو تصديرها. تواصل معنا عبر: privacy@smartreminder.ai</p>
          <h2 className="text-xl font-bold mt-6 mb-3">7. الاحتفاظ بالبيانات</h2>
          <p>نحتفظ ببياناتك طوال فترة استخدامك. عند حذف حسابك، تُحذف جميع بياناتك خلال 30 يوماً.</p>
          <h2 className="text-xl font-bold mt-6 mb-3">8. خصوصية الأطفال</h2>
          <p>التطبيق مخصص للأعمار 13 سنة فما فوق.</p>
          <h2 className="text-xl font-bold mt-6 mb-3">9. التغييرات على السياسة</h2>
          <p>قد نحدّث هذه السياسة من وقت لآخر. سنخطرك بالتغييرات الجوهرية.</p>
          <div className="mt-8 p-4 bg-muted rounded-lg">
            <p className="text-sm">© 2026 مُذكّري الذكي. ملتزمون بحماية خصوصيتك.</p>
          </div>
        </div>
      </main>
    </div>
  )
}

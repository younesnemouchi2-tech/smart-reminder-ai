'use client'

import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Sparkles, Brain, BarChart3, Clock, ArrowLeft, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { MainApp } from '@/components/main-app'
import { ThemeToggle } from '@/components/theme-toggle'

export default function Home() {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">جاري التحميل...</div>
      </div>
    )
  }

  if (session) return <MainApp />
  return <LandingPage />
}

function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-primary/5 via-background to-background">
      <header className="sticky top-0 z-40 glass border-b border-border/50">
        <div className="container mx-auto max-w-5xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20"><Sparkles className="h-5 w-5" /></div>
            <div>
              <h1 className="font-bold text-lg leading-tight">مُذكّري الذكي</h1>
              <p className="text-xs text-muted-foreground">إدارة المهام بالذكاء الاصطناعي</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/auth/signin"><Button variant="ghost">تسجيل الدخول</Button></Link>
            <Link href="/auth/signup"><Button>ابدأ مجاناً</Button></Link>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto max-w-5xl px-4 py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <Zap className="h-4 w-4" /> مدعوم بالذكاء الاصطناعي
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
            نظّم وقتك<br />
            <span className="gradient-text">بذكاء وفعالية</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            تطبيق إدارة المهام الذكي الذي يحلل عاداتك ويقترح أفضل الأوقات لإنجاز مهامك، مع رؤى تحليلية مخصصة لإنتاجيتك.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/auth/signup"><Button size="lg" className="rounded-full gap-2 shadow-lg shadow-primary/20"><Sparkles className="h-5 w-5" /> ابدأ مجاناً الآن</Button></Link>
            <Link href="/auth/signin"><Button variant="outline" size="lg" className="rounded-full gap-2"><ArrowLeft className="h-5 w-5" /> سجّل دخولك</Button></Link>
          </div>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-4 mb-12">
          <FeatureCard icon={<Brain className="h-6 w-6" />} title="اقتراحات ذكية بالـ AI" desc="يحلل الذكاء الاصطناعي مهامك ويقترح أفضل وقت لإنجازها مع نصائح عملية وتقدير المدة." color="text-violet-600 bg-violet-50 dark:bg-violet-950/30" />
          <FeatureCard icon={<BarChart3 className="h-6 w-6" />} title="إحصائيات تفصيلية" desc="رسوم بيانية للإنجاز اليومي وتوزيع الفئات والأولويات لمتابعة تقدمك." color="text-cyan-600 bg-cyan-50 dark:bg-cyan-950/30" />
          <FeatureCard icon={<Clock className="h-6 w-6" />} title="تذكيرات ذكية" desc="تتكيف مع نمط يومك وتقترح أوقاتاً مناسبة لكل مهمة حسب أولويتها." color="text-amber-600 bg-amber-50 dark:bg-amber-950/30" />
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">جاهز لزيادة إنتاجيتك؟</h2>
          <p className="text-muted-foreground mb-6">انضم اليوم وابدأ رحلتك نحو تنظيم أفضل لوقتك</p>
          <Link href="/auth/signup"><Button size="lg" className="rounded-full gap-2 shadow-lg shadow-primary/20"><Sparkles className="h-5 w-5" /> إنشاء حساب مجاني</Button></Link>
        </motion.div>
      </main>

      <footer className="border-t border-border/50 mt-auto">
        <div className="container mx-auto max-w-5xl px-4 py-6 text-center text-sm text-muted-foreground">
          <p className="mb-2">مُذكّري الذكي © 2026 — جميع الحقوق محفوظة</p>
          <div className="flex gap-4 justify-center">
            <Link href="/legal/terms" className="hover:text-foreground">شروط الاستخدام</Link>
            <Link href="/legal/privacy" className="hover:text-foreground">سياسة الخصوصية</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({ icon, title, desc, color }: { icon: React.ReactNode; title: string; desc: string; color: string }) {
  return (
    <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
      <Card className="p-6 h-full">
        <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${color} mb-4`}>{icon}</div>
        <h3 className="font-bold text-lg mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
      </Card>
    </motion.div>
  )
}

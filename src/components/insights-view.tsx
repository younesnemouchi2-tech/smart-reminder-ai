'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, Loader2, RefreshCw, Brain, Lightbulb } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import ReactMarkdown from 'react-markdown'

interface InsightsData {
  insights: string
  summary: string
  stats: {
    totalCompleted: number
    totalPending: number
    peakHour: string | null
    topCategory: string | null
  }
}

const CATEGORY_LABELS: Record<string, string> = {
  general: 'عام',
  work: 'عمل',
  study: 'دراسة',
  health: 'صحة',
  personal: 'شخصي',
  shopping: 'تسوق',
  other: 'أخرى',
}

export function InsightsView() {
  const [data, setData] = useState<InsightsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchInsights()
  }, [])

  const fetchInsights = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/insights')
      const d = await res.json()
      setData(d)
    } catch {
      console.error('Failed to fetch insights')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">جاري تحليل بياناتك بالذكاء الاصطناعي...</p>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="space-y-4">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <QuickStat
          icon="✓"
          label="مكتملة هذا الأسبوع"
          value={data.stats.totalCompleted}
          color="text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30"
        />
        <QuickStat
          icon="⏰"
          label="معلقة حالياً"
          value={data.stats.totalPending}
          color="text-amber-600 bg-amber-50 dark:bg-amber-950/30"
        />
        <QuickStat
          icon="📈"
          label="ساعة الذروة"
          value={data.stats.peakHour || '—'}
          color="text-violet-600 bg-violet-50 dark:bg-violet-950/30"
        />
        <QuickStat
          icon="🎯"
          label="الفئة الأكثر نشاطاً"
          value={data.stats.topCategory ? (CATEGORY_LABELS[data.stats.topCategory] || data.stats.topCategory) : '—'}
          color="text-cyan-600 bg-cyan-50 dark:bg-cyan-950/30"
        />
      </div>

      {/* AI Insights Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="p-6 bg-gradient-to-br from-primary/5 via-card to-card border-primary/20">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Brain className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-lg">رؤى الذكاء الاصطناعي</h3>
                <p className="text-xs text-muted-foreground">تحليل مخصص لإنتاجيتك</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={fetchInsights} className="h-8 w-8">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>

          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown
              components={{
                h1: ({ children }) => <h3 className="font-bold text-base mt-4 mb-2 text-primary">{children}</h3>,
                h2: ({ children }) => <h3 className="font-bold text-base mt-4 mb-2 text-primary">{children}</h3>,
                h3: ({ children }) => <h3 className="font-bold text-base mt-4 mb-2 text-primary">{children}</h3>,
                p: ({ children }) => <p className="text-foreground/80 leading-relaxed mb-3">{children}</p>,
                ul: ({ children }) => <ul className="space-y-1.5 mb-3 pr-4">{children}</ul>,
                ol: ({ children }) => <ol className="space-y-1.5 mb-3 pr-4 list-decimal">{children}</ol>,
                li: ({ children }) => <li className="text-foreground/80 text-sm">{children}</li>,
                strong: ({ children }) => <strong className="font-bold text-foreground">{children}</strong>,
              }}
            >
              {data.insights}
            </ReactMarkdown>
          </div>

          <div className="mt-4 pt-4 border-t border-border/50">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span>يتم تحليل البيانات محلياً وحفظ خصوصيتك</span>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Tip Card */}
      <Card className="p-5">
        <div className="flex items-start gap-3">
          <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-950/30 text-amber-600 shrink-0">
            <Lightbulb className="h-5 w-5" />
          </div>
          <div>
            <h4 className="font-semibold mb-1">نصيحة اليوم</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              ابدأ يومك بإنجاز المهمة الأصعب أولاً (Eat the Frog). هذا الأسلوب يقلل من التوتر ويزيد إنتاجيتك بقية اليوم، خاصة في ساعات ذروة طاقتك.
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}

function QuickStat({ icon, label, value, color }: { icon: string; label: string; value: number | string; color: string }) {
  return (
    <Card className="p-4">
      <div className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${color} mb-2 text-lg`}>
        {icon}
      </div>
      <div className="text-xl font-bold truncate">{value}</div>
      <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
    </Card>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Area, AreaChart,
} from 'recharts'
import { CheckCircle2, Clock, TrendingUp, Target, Loader2, Calendar, Zap } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface StatsData {
  summary: {
    totalCreated: number
    totalCompleted: number
    totalPending: number
    completionRate: number
  }
  dailyData: { day: string; count: number }[]
  categoryData: { category: string; count: number }[]
  priorityData: { priority: string; count: number }[]
  hourlyData: { hour: string; count: number }[]
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

const PIE_COLORS = ['#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#64748b']

export function StatsView() {
  const [data, setData] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/stats')
      const d = await res.json()
      setData(d)
    } catch {
      console.error('Failed to fetch stats')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!data) return null

  const priorityLabels: Record<string, string> = {
    urgent: 'عاجلة', high: 'عالية', medium: 'متوسطة', low: 'منخفضة',
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          icon={<Target className="h-5 w-5" />}
          label="المهام المنشأة"
          value={data.summary.totalCreated}
          color="text-violet-600 bg-violet-50 dark:bg-violet-950/30"
        />
        <StatCard
          icon={<CheckCircle2 className="h-5 w-5" />}
          label="المهام المكتملة"
          value={data.summary.totalCompleted}
          color="text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30"
        />
        <StatCard
          icon={<Clock className="h-5 w-5" />}
          label="المهام المعلقة"
          value={data.summary.totalPending}
          color="text-amber-600 bg-amber-50 dark:bg-amber-950/30"
        />
        <StatCard
          icon={<TrendingUp className="h-5 w-5" />}
          label="معدل الإنجاز"
          value={`${data.summary.completionRate}%`}
          color="text-cyan-600 bg-cyan-50 dark:bg-cyan-950/30"
        />
      </div>

      {/* Daily Completion Chart */}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="h-5 w-5 text-primary" />
          <h3 className="font-bold text-lg">الإنجاز اليومي (آخر 7 أيام)</h3>
        </div>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={data.dailyData}>
            <defs>
              <linearGradient id="colorTasks" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="day" stroke="var(--muted-foreground)" fontSize={12} />
            <YAxis stroke="var(--muted-foreground)" fontSize={12} allowDecimals={false} />
            <Tooltip
              contentStyle={{
                background: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                fontSize: '13px',
              }}
            />
            <Area
              type="monotone"
              dataKey="count"
              name="المهام المكتملة"
              stroke="var(--primary)"
              strokeWidth={2}
              fill="url(#colorTasks)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Category Distribution */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Target className="h-5 w-5 text-primary" />
            <h3 className="font-bold text-lg">توزيع الفئات</h3>
          </div>
          {data.categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={data.categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="count"
                  nameKey="category"
                >
                  {data.categoryData.map((_, index) => (
                    <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    fontSize: '13px',
                  }}
                  formatter={(value: number, name: string) => [value, CATEGORY_LABELS[name] || name]}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[220px] text-muted-foreground text-sm">
              لا توجد بيانات بعد
            </div>
          )}
          <div className="flex flex-wrap gap-2 mt-3 justify-center">
            {data.categoryData.map((item, i) => (
              <Badge key={i} variant="secondary" className="text-xs gap-1">
                <span className="h-2 w-2 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                {CATEGORY_LABELS[item.category] || item.category}: {item.count}
              </Badge>
            ))}
          </div>
        </Card>

        {/* Priority Distribution */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="h-5 w-5 text-primary" />
            <h3 className="font-bold text-lg">توزيع الأولويات (المعلقة)</h3>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.priorityData.map(p => ({ ...p, label: priorityLabels[p.priority] || p.priority }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="label" stroke="var(--muted-foreground)" fontSize={12} />
              <YAxis stroke="var(--muted-foreground)" fontSize={12} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  background: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  fontSize: '13px',
                }}
              />
              <Bar dataKey="count" name="العدد" radius={[8, 8, 0, 0]}>
                {data.priorityData.map((_, index) => (
                  <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number | string; color: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="p-4">
        <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${color} mb-2`}>
          {icon}
        </div>
        <div className="text-2xl font-bold">{value}</div>
        <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
      </Card>
    </motion.div>
  )
}

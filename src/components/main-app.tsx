'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, ListTodo, BarChart3, Brain, Search, Filter, Loader2, Sparkles, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { TaskCard } from '@/components/task-card'
import { AddTaskDialog } from '@/components/add-task-dialog'
import { StatsView } from '@/components/stats-view'
import { InsightsView } from '@/components/insights-view'
import { ThemeToggle } from '@/components/theme-toggle'
import { NotificationManager } from '@/components/notification-manager'
import { useToast } from '@/hooks/use-toast'
import { Task, PRIORITY_LABELS, CATEGORY_LABELS, TaskPriority } from '@/lib/types'
import { signOut, useSession } from 'next-auth/react'

type Tab = 'today' | 'all' | 'stats' | 'insights'
type FilterStatus = 'all' | 'pending' | 'completed'

export function MainApp() {
  const { data: session } = useSession()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('today')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')
  const [filterPriority, setFilterPriority] = useState('all')
  const [filterCategory, setFilterCategory] = useState('all')
  const { toast } = useToast()

  const fetchTasks = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/tasks')
      if (res.status === 401) return
      const data = await res.json()
      setTasks(data.tasks || [])
    } catch {} finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchTasks() }, [fetchTasks])

  const handleAddTask = async (taskData: Record<string, unknown>) => {
    const res = await fetch('/api/tasks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(taskData) })
    if (!res.ok) throw new Error()
    const { task } = await res.json()
    setTasks((prev) => [task, ...prev])
  }

  const handleUpdateTask = async (id: string, data: Record<string, unknown>) => {
    const res = await fetch(`/api/tasks/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
    if (!res.ok) throw new Error()
    const { task } = await res.json()
    setTasks((prev) => prev.map((t) => (t.id === id ? task : t)))
    // If task was completed and is recurring, refetch to get the next occurrence
    if (data.status === 'COMPLETED' && task.recurrence && task.recurrence !== 'NONE') {
      try {
        const refreshRes = await fetch('/api/tasks')
        if (refreshRes.ok) {
          const refreshData = await refreshRes.json()
          if (refreshData.tasks) setTasks(refreshData.tasks)
        }
      } catch {}
    }
  }

  const handleDeleteTask = async (id: string) => {
    const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' })
    if (!res.ok) throw new Error()
    setTasks((prev) => prev.filter((t) => t.id !== id))
  }

  const filteredTasks = tasks.filter((task) => {
    if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase()) && !task.description?.toLowerCase().includes(searchQuery.toLowerCase())) return false
    if (filterStatus === 'pending' && task.status === 'COMPLETED') return false
    if (filterStatus === 'completed' && task.status !== 'COMPLETED') return false
    if (filterPriority !== 'all' && task.priority !== filterPriority) return false
    if (filterCategory !== 'all' && task.category !== filterCategory) return false
    return true
  })

  const todayTasks = filteredTasks.filter((task) => {
    if (task.status === 'COMPLETED') return false
    // Show in Today tab ONLY if:
    // 1. Task has a dueDate and it's today (any time today)
    // 2. Task was created today without a dueDate
    // Overdue tasks (past dueDate) are NOT shown in Today — they stay in "All Tasks"
    if (!task.dueDate) {
      const taskCreated = new Date(task.createdAt)
      const today = new Date()
      return taskCreated.getDate() === today.getDate() &&
             taskCreated.getMonth() === today.getMonth() &&
             taskCreated.getFullYear() === today.getFullYear()
    }
    const due = new Date(task.dueDate)
    const today = new Date()
    // Only show tasks due today (between start and end of today)
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0)
    const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999)
    return due.getTime() >= startOfToday.getTime() && due.getTime() <= endOfToday.getTime()
  })

  const displayTasks = activeTab === 'today' ? todayTasks : filteredTasks
  const pendingCount = tasks.filter((t) => t.status !== 'COMPLETED').length

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-background/80">
      <header className="sticky top-0 z-40 glass border-b border-border/50">
        <div className="container mx-auto max-w-4xl px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20"><Sparkles className="h-5 w-5" /></div>
              <div>
                <h1 className="font-bold text-lg leading-tight">مُذكّري الذكي</h1>
                <p className="text-xs text-muted-foreground">إدارة المهام بالذكاء الاصطناعي</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button variant="ghost" size="icon" className="rounded-full" onClick={() => signOut({ callbackUrl: '/' })} title="تسجيل الخروج"><LogOut className="h-5 w-5" /></Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-4xl px-4 py-6 flex-1">
        {activeTab === 'today' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 space-y-3">
            <Card className="p-5 bg-gradient-to-l from-primary/10 via-primary/5 to-transparent border-primary/20">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h2 className="text-xl font-bold mb-1">{getGreeting()} {session?.user?.name ? `، ${session.user.name}` : ''} 👋</h2>
                  <p className="text-sm text-muted-foreground">لديك {pendingCount} مهمة معلقة. لنبدأ يومنا بإنتاجية!</p>
                </div>
                <AddTaskDialog onAdd={handleAddTask} />
              </div>
            </Card>
            <NotificationManager />
          </motion.div>
        )}

        <div className="flex gap-1 mb-5 p-1 bg-muted/50 rounded-xl overflow-x-auto">
          <TabButton active={activeTab === 'today'} onClick={() => setActiveTab('today')} icon={<Calendar className="h-4 w-4" />} label="اليوم" badge={todayTasks.length} />
          <TabButton active={activeTab === 'all'} onClick={() => setActiveTab('all')} icon={<ListTodo className="h-4 w-4" />} label="كل المهام" badge={tasks.length} />
          <TabButton active={activeTab === 'stats'} onClick={() => setActiveTab('stats')} icon={<BarChart3 className="h-4 w-4" />} label="الإحصائيات" />
          <TabButton active={activeTab === 'insights'} onClick={() => setActiveTab('insights')} icon={<Brain className="h-4 w-4" />} label="رؤى AI" />
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
            {(activeTab === 'today' || activeTab === 'all') && (
              <>
                <div className="flex flex-wrap gap-2 mb-4">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="ابحث في المهام..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pr-9" />
                  </div>
                  <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as FilterStatus)}>
                    <SelectTrigger className="w-[130px]"><Filter className="h-4 w-4 ml-1" /><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">الكل</SelectItem>
                      <SelectItem value="pending">المعلقة</SelectItem>
                      <SelectItem value="completed">المكتملة</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filterPriority} onValueChange={setFilterPriority}>
                    <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">كل الأولويات</SelectItem>
                      {Object.entries(PRIORITY_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Select value={filterCategory} onValueChange={setFilterCategory}>
                    <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">كل الفئات</SelectItem>
                      {Object.entries(CATEGORY_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                {loading ? (
                  <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                ) : displayTasks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="text-6xl mb-4">{activeTab === 'today' ? '☀️' : '📝'}</div>
                    <h3 className="font-semibold text-lg mb-1">{activeTab === 'today' ? 'لا توجد مهام لليوم' : 'لا توجد مهام'}</h3>
                    <p className="text-sm text-muted-foreground mb-4">{activeTab === 'today' ? 'استمتع بيومك! أو أضف مهمة جديدة' : 'جرّب تغيير الفلاتر'}</p>
                    <AddTaskDialog onAdd={handleAddTask} />
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    <AnimatePresence>
                      {displayTasks.map((task) => (
                        <TaskCard key={task.id} task={task} onUpdate={handleUpdateTask} onDelete={handleDeleteTask} />
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </>
            )}
            {activeTab === 'stats' && <StatsView />}
            {activeTab === 'insights' && <InsightsView />}
          </motion.div>
        </AnimatePresence>
      </main>

      <footer className="border-t border-border/50 mt-auto">
        <div className="container mx-auto max-w-4xl px-4 py-4 text-center text-xs text-muted-foreground">
          <p>مُذكّري الذكي © 2026 — جميع الحقوق محفوظة</p>
        </div>
      </footer>
    </div>
  )
}

function TabButton({ active, onClick, icon, label, badge }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string; badge?: number }) {
  return (
    <button onClick={onClick} className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all flex-1 justify-center whitespace-nowrap ${active ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
      {icon}{label}
      {badge !== undefined && badge > 0 && <Badge variant={active ? 'default' : 'secondary'} className="h-5 min-w-5 px-1 text-xs">{badge}</Badge>}
    </button>
  )
}

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'صباح الخير'
  if (hour < 17) return 'مساء الخير'
  if (hour < 21) return 'مساء الخير'
  return 'سهرة هانئة'
}

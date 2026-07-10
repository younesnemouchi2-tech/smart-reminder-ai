'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Clock, Trash2, ChevronDown, Sparkles, Calendar, Edit2, X, Repeat } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { Task, PRIORITY_LABELS, PRIORITY_COLORS, CATEGORY_LABELS, CATEGORY_ICONS, TaskPriority, RECURRENCE_LABELS } from '@/lib/types'

interface TaskCardProps {
  task: Task
  onUpdate: (id: string, data: Record<string, unknown>) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

export function TaskCard({ task, onUpdate, onDelete }: TaskCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(task.title)
  const [editDescription, setEditDescription] = useState(task.description || '')
  const [editPriority, setEditPriority] = useState<TaskPriority>(task.priority)
  const [editCategory, setEditCategory] = useState(task.category)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const isCompleted = task.status === 'COMPLETED'

  const handleToggleComplete = async () => {
    setLoading(true)
    try {
      await onUpdate(task.id, {
        status: isCompleted ? 'PENDING' : 'COMPLETED',
      })
      toast({
        title: isCompleted ? 'تم إعادة المهمة' : 'تم إنجاز المهمة! 🎉',
        description: isCompleted ? 'المهمة قيد الانتظار الآن' : 'أحسنت! استمر في التقدم',
      })
    } catch {
      toast({ title: 'حدث خطأ', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    setLoading(true)
    try {
      await onDelete(task.id)
      toast({ title: 'تم حذف المهمة' })
    } catch {
      toast({ title: 'حدث خطأ', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const handleSaveEdit = async () => {
    if (!editTitle.trim()) return
    setLoading(true)
    try {
      await onUpdate(task.id, {
        title: editTitle.trim(),
        description: editDescription.trim(),
        priority: editPriority,
        category: editCategory,
      })
      setEditing(false)
      toast({ title: 'تم تحديث المهمة' })
    } catch {
      toast({ title: 'حدث خطأ', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return null
    try {
      const d = new Date(dateStr)
      if (isNaN(d.getTime())) return null
      const day = d.getDate()
      const month = d.toLocaleDateString('ar', { month: 'short' })
      const hour = d.getHours().toString().padStart(2, '0')
      const minute = d.getMinutes().toString().padStart(2, '0')
      return `${day} ${month} ${hour}:${minute}`
    } catch {
      return null
    }
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className={`p-4 transition-all hover:shadow-md ${
          isCompleted ? 'opacity-60' : ''
        } ${task.priority === 'URGENT' && !isCompleted ? 'border-r-4 border-r-red-500' : ''}`}
      >
        {editing ? (
          <div className="space-y-3">
            <Input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder="عنوان المهمة"
            />
            <Textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              placeholder="الوصف (اختياري)"
              rows={2}
            />
            <div className="grid grid-cols-2 gap-2">
              <Select value={editPriority} onValueChange={(v) => setEditPriority(v as TaskPriority)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={editCategory} onValueChange={setEditCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" size="sm" onClick={() => setEditing(false)} disabled={loading}>
                <X className="h-4 w-4 ml-1" /> إلغاء
              </Button>
              <Button size="sm" onClick={handleSaveEdit} disabled={loading}>
                حفظ
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-3">
            <div className="pt-0.5">
              <Checkbox
                checked={isCompleted}
                onCheckedChange={handleToggleComplete}
                disabled={loading}
                className="h-5 w-5 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
              />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h3 className={`font-semibold text-base leading-tight ${isCompleted ? 'line-through text-muted-foreground' : ''}`}>
                    {task.title}
                  </h3>
                  {task.description && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{task.description}</p>
                  )}
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setEditing(true)}
                    disabled={loading || isCompleted}
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={handleDelete}
                    disabled={loading}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY_COLORS[task.priority]}`}>
                  {PRIORITY_LABELS[task.priority]}
                </span>
                <Badge variant="secondary" className="text-xs">
                  {CATEGORY_ICONS[task.category] || '📌'} {CATEGORY_LABELS[task.category] || task.category}
                </Badge>
                {task.suggestedTime && !isCompleted && (
                  <Badge variant="outline" className="text-xs text-primary border-primary/30">
                    <Clock className="h-3 w-3 ml-1" />
                    {task.suggestedTime}
                  </Badge>
                )}
                {task.dueDate && formatTime(task.dueDate) && (
                  <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-800">
                    <Calendar className="h-3 w-3 ml-1" />
                    {formatTime(task.dueDate)}
                  </Badge>
                )}
                {task.recurrence && task.recurrence !== 'NONE' && (
                  <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/30 dark:text-purple-300 dark:border-purple-800">
                    <Repeat className="h-3 w-3 ml-1" />
                    {RECURRENCE_LABELS[task.recurrence]}
                  </Badge>
                )}
              </div>

              {task.aiSuggestion && !isCompleted && (
                <div className="mt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs h-7 text-primary hover:text-primary"
                    onClick={() => setExpanded(!expanded)}
                  >
                    <Sparkles className="h-3.5 w-3.5 ml-1" />
                    اقتراح ذكي
                    <ChevronDown className={`h-3 w-3 mr-1 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                  </Button>
                  <AnimatePresence>
                    {expanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-2 p-3 bg-primary/5 rounded-lg text-sm text-foreground/80 whitespace-pre-line border border-primary/10">
                          {task.aiSuggestion}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </div>
        )}
      </Card>
    </motion.div>
  )
}

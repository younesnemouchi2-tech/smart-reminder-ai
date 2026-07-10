'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Sparkles, Loader2, X, Wand2, Repeat } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import {
  PRIORITY_LABELS,
  CATEGORY_LABELS,
  RECURRENCE_LABELS,
  TaskPriority,
  TaskRecurrence,
} from '@/lib/types'

interface AddTaskDialogProps {
  onAdd: (task: Record<string, unknown>) => Promise<void>
}

export function AddTaskDialog({ onAdd }: AddTaskDialogProps) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<TaskPriority>('MEDIUM')
  const [category, setCategory] = useState('general')
  const [dueDate, setDueDate] = useState('')
  const [recurrence, setRecurrence] = useState<TaskRecurrence>('NONE')
  const [recurrenceEnd, setRecurrenceEnd] = useState('')
  const [loading, setLoading] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiSuggestion, setAiSuggestion] = useState<{ suggestion: string; suggestedTime: string | null } | null>(null)
  const { toast } = useToast()

  const resetForm = () => {
    setTitle('')
    setDescription('')
    setPriority('MEDIUM')
    setCategory('general')
    setDueDate('')
    setRecurrence('NONE')
    setRecurrenceEnd('')
    setAiSuggestion(null)
  }

  const handleAiSuggest = async () => {
    if (!title.trim()) {
      toast({ title: 'أدخل عنوان المهمة أولاً', variant: 'destructive' })
      return
    }
    setAiLoading(true)
    try {
      const res = await fetch('/api/tasks/ai-suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, priority, category }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setAiSuggestion({
        suggestion: data.suggestion,
        suggestedTime: data.suggestedTime,
      })
      toast({ title: 'تم توليد الاقتراح الذكي! ✨' })
    } catch {
      toast({ title: 'تعذّر توليد الاقتراح', variant: 'destructive' })
    } finally {
      setAiLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast({ title: 'عنوان المهمة مطلوب', variant: 'destructive' })
      return
    }
    setLoading(true)
    try {
      await onAdd({
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        category,
        dueDate: dueDate || undefined,
        suggestedTime: aiSuggestion?.suggestedTime || undefined,
        aiSuggestion: aiSuggestion?.suggestion || undefined,
        recurrence,
        recurrenceEnd: recurrenceEnd || undefined,
      })
      resetForm()
      setOpen(false)
      toast({ title: 'تمت إضافة المهمة بنجاح! 🎯' })
    } catch {
      toast({ title: 'حدث خطأ', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
      <DialogTrigger asChild>
        <Button className="rounded-full shadow-lg shadow-primary/20 gap-2">
          <Plus className="h-5 w-5" />
          مهمة جديدة
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <span className="text-2xl">✨</span>
            إضافة مهمة جديدة
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="title">عنوان المهمة *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: إنهاء التقرير الشهري"
              onKeyDown={(e) => e.key === 'Enter' && !aiSuggestion && handleSubmit()}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">الوصف (اختياري)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="تفاصيل إضافية عن المهمة..."
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>الأولوية</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as TaskPriority)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>الفئة</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="dueDate">الموعد النهائي (اختياري)</Label>
            <Input
              id="dueDate"
              type="datetime-local"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          {/* Recurrence Section */}
          <div className="space-y-2 p-3 rounded-lg border border-primary/20 bg-primary/5">
            <div className="flex items-center gap-2 text-sm font-medium text-primary">
              <Repeat className="h-4 w-4" />
              <span>التكرار</span>
            </div>
            <Select
              value={recurrence}
              onValueChange={(v) => setRecurrence(v as TaskRecurrence)}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(RECURRENCE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {recurrence !== 'NONE' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-1.5"
              >
                <Label htmlFor="recurrenceEnd" className="text-xs">
                  تاريخ انتهاء التكرار (اختياري)
                </Label>
                <Input
                  id="recurrenceEnd"
                  type="date"
                  value={recurrenceEnd}
                  onChange={(e) => setRecurrenceEnd(e.target.value)}
                  className="h-9 text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  عند إكمال مهمة متكررة، سيتم إنشاء نسخة جديدة تلقائياً للتاريخ التالي.
                </p>
              </motion.div>
            )}
          </div>

          {/* AI Suggestion Section */}
          <div className="space-y-2">
            <Button
              variant="outline"
              onClick={handleAiSuggest}
              disabled={aiLoading || !title.trim()}
              className="w-full gap-2 border-primary/30 text-primary hover:bg-primary/5"
            >
              {aiLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Wand2 className="h-4 w-4" />
              )}
              {aiLoading ? 'جاري التحليل...' : 'اقتراح وقت مثالي بالذكاء الاصطناعي'}
            </Button>

            {aiSuggestion && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 text-sm font-medium text-primary">
                    <Sparkles className="h-4 w-4" />
                    اقتراح ذكي
                  </div>
                  {aiSuggestion.suggestedTime && (
                    <Badge className="bg-primary text-primary-foreground">
                      {aiSuggestion.suggestedTime}
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => setAiSuggestion(null)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
                <p className="text-sm text-foreground/80 whitespace-pre-line">
                  {aiSuggestion.suggestion}
                </p>
              </motion.div>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={() => setOpen(false)}>
            إلغاء
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'إضافة المهمة'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED'

export interface Task {
  id: string
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  category: string
  dueDate: string | null
  suggestedTime: string | null
  aiSuggestion: string | null
  completedAt: string | null
  createdAt: string
  updatedAt: string
}

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  LOW: 'منخفضة',
  MEDIUM: 'متوسطة',
  HIGH: 'عالية',
  URGENT: 'عاجلة',
}

export const PRIORITY_COLORS: Record<TaskPriority, string> = {
  LOW: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  MEDIUM: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  HIGH: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  URGENT: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
}

export const CATEGORY_LABELS: Record<string, string> = {
  general: 'عام',
  work: 'عمل',
  study: 'دراسة',
  health: 'صحة',
  personal: 'شخصي',
  shopping: 'تسوق',
  other: 'أخرى',
}

export const CATEGORY_ICONS: Record<string, string> = {
  general: '📋',
  work: '💼',
  study: '📚',
  health: '💪',
  personal: '🏠',
  shopping: '🛒',
  other: '📌',
}

export const STATUS_LABELS: Record<TaskStatus, string> = {
  PENDING: 'قيد الانتظار',
  IN_PROGRESS: 'قيد التنفيذ',
  COMPLETED: 'مكتملة',
}

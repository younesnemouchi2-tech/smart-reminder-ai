'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { Bell, BellOff, Loader2, CheckCircle2, AlertCircle, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'

type PermissionState = 'default' | 'granted' | 'denied' | 'unsupported'

interface DueTask {
  id: string
  title: string
  description: string | null
  dueDate: string | null
  priority: string
  recurrence: string
}

const REMINDER_CHECK_INTERVAL = 60_000 // Check every minute
const REMINDER_STORAGE_KEY = 'sent-reminders'

export function NotificationManager() {
  const { toast } = useToast()
  const [permission, setPermission] = useState<PermissionState>('default')
  const [pushEnabled, setPushEnabled] = useState(false)
  const [subscribing, setSubscribing] = useState(false)
  const [sendingTest, setSendingTest] = useState(false)
  const [hasVapid, setHasVapid] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const sentRemindersRef = useRef<Set<string>>(new Set())

  // Load sent reminders from localStorage to avoid duplicates across reloads
  useEffect(() => {
    try {
      const stored = localStorage.getItem(REMINDER_STORAGE_KEY)
      if (stored) {
        const arr = JSON.parse(stored) as string[]
        // Only keep reminders from the last hour
        const oneHourAgo = Date.now() - 60 * 60 * 1000
        const recent = arr.filter((entry) => {
          const [taskId, timestamp] = entry.split(':')
          return timestamp && Number(timestamp) > oneHourAgo && taskId
        })
        recent.forEach((entry) => {
          const [taskId] = entry.split(':')
          if (taskId) sentRemindersRef.current.add(taskId)
        })
      }
    } catch {}
  }, [])

  // Save sent reminders to localStorage
  const markReminderSent = useCallback((taskId: string) => {
    sentRemindersRef.current.add(taskId)
    try {
      const entries = Array.from(sentRemindersRef.current).map(
        (id) => `${id}:${Date.now()}`
      )
      localStorage.setItem(REMINDER_STORAGE_KEY, JSON.stringify(entries))
    } catch {}
  }, [])

  // Check initial permission state
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('Notification' in window)) {
      setPermission('unsupported')
      return
    }
    setPermission(Notification.permission as PermissionState)
  }, [])

  // Check if VAPID is configured (push notifications available)
  useEffect(() => {
    let cancelled = false
    async function checkVapid() {
      try {
        const res = await fetch('/api/notifications/vapid-public')
        const data = await res.json()
        if (!cancelled) setHasVapid(data.enabled === true)
      } catch {
        if (!cancelled) setHasVapid(false)
      }
    }
    checkVapid()
    return () => {
      cancelled = true
    }
  }, [])

  // Request permission and subscribe to push notifications
  const enableNotifications = useCallback(async () => {
    if (permission === 'unsupported') {
      toast({
        title: 'غير مدعوم',
        description: 'متصفحك لا يدعم الإشعارات',
        variant: 'destructive',
      })
      return
    }

    setSubscribing(true)
    try {
      // 1. Request notification permission
      const result = await Notification.requestPermission()
      setPermission(result as PermissionState)

      if (result !== 'granted') {
        toast({
          title: 'تم رفض الإذن',
          description: 'لن تتمكن من接收 الإشعارات. يمكنك تفعيلها لاحقاً من إعدادات المتصفح.',
          variant: 'destructive',
        })
        return
      }

      // 2. If VAPID is configured, subscribe to push notifications
      if (hasVapid && 'serviceWorker' in navigator && 'PushManager' in window) {
        const reg = await navigator.serviceWorker.ready
        let subscription = await reg.pushManager.getSubscription()

        if (!subscription) {
          const vapidRes = await fetch('/api/notifications/vapid-public')
          const vapidData = await vapidRes.json()
          const publicKey = vapidData.publicKey

          // Convert VAPID public key to Uint8Array
          const convertedKey = urlBase64ToUint8Array(publicKey)
          subscription = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: convertedKey,
          })
        }

        // Send subscription to server
        const subObj = subscription.toJSON() as {
          endpoint: string
          keys: { p256dh: string; auth: string }
        }
        await fetch('/api/notifications/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(subObj),
        })
      }

      setPushEnabled(true)
      toast({
        title: 'تم تفعيل الإشعارات! 🔔',
        description: 'ستصلك تذكيرات قبل موعد المهام بـ 5 دقائق',
      })
    } catch (err) {
      console.error('Subscribe error:', err)
      toast({
        title: 'خطأ',
        description: 'فشل تفعيل الإشعارات',
        variant: 'destructive',
      })
    } finally {
      setSubscribing(false)
    }
  }, [permission, hasVapid, toast])

  // Periodically check for due tasks (works even without push subscription)
  const checkReminders = useCallback(async () => {
    if (permission !== 'granted') return

    try {
      const res = await fetch('/api/notifications/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      if (!res.ok) return
      const data = await res.json()
      const dueTasks: DueTask[] = data.dueTasks || []

      for (const task of dueTasks) {
        if (sentRemindersRef.current.has(task.id)) continue
        // Show local notification via SW (works on desktop + mobile when app is open)
        if ('serviceWorker' in navigator) {
          const reg = await navigator.serviceWorker.ready
          const dueDate = task.dueDate ? new Date(task.dueDate) : new Date()
          const minutesUntil = Math.max(
            0,
            Math.round((dueDate.getTime() - Date.now()) / 60000)
          )
          const body =
            minutesUntil <= 0
              ? `الآن: ${task.title}`
              : `بعد ${minutesUntil} دقيقة: ${task.title}`
          reg.showNotification('🔔 تذكير', {
            body,
            icon: '/icon-192.png',
            badge: '/icon-192.png',
            tag: `task-${task.id}`,
            data: { url: '/' },
            dir: 'rtl',
            lang: 'ar',
            vibrate: [200, 100, 200],
          })
        }
        markReminderSent(task.id)
      }
    } catch (err) {
      console.warn('Reminder check failed:', err)
    }
  }, [permission, markReminderSent])

  // Set up periodic reminder checks
  useEffect(() => {
    if (permission !== 'granted') return

    // Initial check after 5 seconds
    const initialTimer = setTimeout(checkReminders, 5000)

    // Then check every minute
    intervalRef.current = setInterval(checkReminders, REMINDER_CHECK_INTERVAL)

    return () => {
      clearTimeout(initialTimer)
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [permission, checkReminders])

  // Send a test push notification
  const sendTest = useCallback(async () => {
    setSendingTest(true)
    try {
      // Show a local notification immediately
      if ('serviceWorker' in navigator && permission === 'granted') {
        const reg = await navigator.serviceWorker.ready
        reg.showNotification('🔔 تذكير ذكي', {
          body: 'هذه رسالة تجريبية — الإشعارات تعمل بنجاح!',
          icon: '/icon-192.png',
          badge: '/icon-192.png',
          tag: 'test-notification',
          data: { url: '/' },
          dir: 'rtl',
          lang: 'ar',
          vibrate: [200, 100, 200],
        })
      }
      // Also try sending via push server if available
      if (hasVapid && pushEnabled) {
        await fetch('/api/notifications/test', { method: 'POST' })
      }
      toast({ title: 'تم إرسال الإشعار التجريبي 🔔' })
    } catch {
      toast({
        title: 'خطأ',
        description: 'فشل إرسال الإشعار',
        variant: 'destructive',
      })
    } finally {
      setSendingTest(false)
    }
  }, [permission, hasVapid, pushEnabled, toast])

  if (permission === 'unsupported') {
    return (
      <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900/50">
        <CardContent className="p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
          <div className="text-sm">
            <p className="font-medium">الإشعارات غير مدعومة</p>
            <p className="text-muted-foreground text-xs mt-0.5">
              متصفحك لا يدعم الإشعارات. جرّب متصفحاً أحدث.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-primary/20">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            {permission === 'granted' ? (
              <Bell className="w-5 h-5 text-primary" />
            ) : (
              <BellOff className="w-5 h-5 text-muted-foreground" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-medium text-sm">إشعارات التذكير</p>
              {permission === 'granted' && (
                <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                  <CheckCircle2 className="w-3 h-3" />
                  مفعّلة
                </span>
              )}
              {hasVapid && pushEnabled && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                  إشعارات فورية
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {permission === 'granted'
                ? 'ستصلك تذكيرات قبل موعد المهام بـ 5 دقائق'
                : 'فعّل الإشعارات لتصلك تذكيرات قبل موعد المهام'}
            </p>

            <div className="flex flex-wrap gap-2 mt-3">
              {permission !== 'granted' ? (
                <Button
                  onClick={enableNotifications}
                  disabled={subscribing}
                  size="sm"
                >
                  {subscribing ? (
                    <Loader2 className="w-3.5 h-3.5 ml-1.5 animate-spin" />
                  ) : (
                    <Bell className="w-3.5 h-3.5 ml-1.5" />
                  )}
                  تفعيل الإشعارات
                </Button>
              ) : (
                <>
                  {!pushEnabled && hasVapid && (
                    <Button
                      onClick={enableNotifications}
                      disabled={subscribing}
                      size="sm"
                      variant="outline"
                    >
                      {subscribing ? (
                        <Loader2 className="w-3.5 h-3.5 ml-1.5 animate-spin" />
                      ) : (
                        <Bell className="w-3.5 h-3.5 ml-1.5" />
                      )}
                      تفعيل الإشعارات الفورية
                    </Button>
                  )}
                  <Button
                    onClick={sendTest}
                    disabled={sendingTest}
                    size="sm"
                    variant="outline"
                  >
                    {sendingTest ? (
                      <Loader2 className="w-3.5 h-3.5 ml-1.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5 ml-1.5" />
                    )}
                    إشعار تجريبي
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Helper: convert VAPID base64-url to Uint8Array for PushManager.subscribe
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = typeof window !== 'undefined' ? window.atob(base64) : Buffer.from(base64, 'base64').toString('binary')
  const output = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    output[i] = rawData.charCodeAt(i)
  }
  return output
}

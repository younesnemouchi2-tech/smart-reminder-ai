'use client'

import { useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Download, X } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  readonly prompt: () => Promise<void>
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const DISMISS_KEY = 'pwa-install-dismissed'
const DISMISS_DURATION = 7 * 24 * 60 * 60 * 1000 // 7 days

function detectIOS(): boolean {
  if (typeof window === 'undefined') return false
  const ua = window.navigator.userAgent
  return /iPad|iPhone|iPod/.test(ua) && !(window as unknown as { MSStream?: unknown }).MSStream
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  )
}

function wasDismissedRecently(): boolean {
  if (typeof window === 'undefined') return false
  const dismissed = localStorage.getItem(DISMISS_KEY)
  if (!dismissed) return false
  const dismissedAt = parseInt(dismissed, 10)
  return Date.now() - dismissedAt < DISMISS_DURATION
}

export function PwaInstallPrompt() {
  // Compute initial state from browser APIs without setState-in-effect
  const [isIOS] = useState<boolean>(detectIOS)
  const [visible, setVisible] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    if (isStandalone()) return false
    if (wasDismissedRecently()) return false
    // For non-iOS, wait for beforeinstallprompt before showing.
    // For iOS, show the hint after a delay (handled below).
    return false
  })
  const [showIOSHint, setShowIOSHint] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)

  const handleBeforeInstallPrompt = useCallback((e: Event) => {
    e.preventDefault()
    setDeferredPrompt(e as BeforeInstallPromptEvent)
    setVisible(true)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (isStandalone()) return
    if (wasDismissedRecently()) return

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
  }, [handleBeforeInstallPrompt])

  // For iOS, show hint after a 4s delay (no beforeinstallprompt event on iOS)
  useEffect(() => {
    if (!isIOS) return
    if (isStandalone()) return
    if (wasDismissedRecently()) return
    const t = setTimeout(() => {
      setShowIOSHint(true)
      setVisible(true)
    }, 4000)
    return () => clearTimeout(t)
  }, [isIOS])

  async function handleInstall() {
    if (deferredPrompt) {
      await deferredPrompt.prompt()
      const choice = await deferredPrompt.userChoice
      if (choice.outcome === 'accepted') {
        setVisible(false)
      }
      setDeferredPrompt(null)
    }
  }

  function handleDismiss() {
    setVisible(false)
    if (typeof window !== 'undefined') {
      localStorage.setItem(DISMISS_KEY, Date.now().toString())
    }
  }

  if (!visible) return null

  return (
    <div
      role="dialog"
      aria-label="تثبيت التطبيق"
      className="fixed bottom-4 inset-x-4 sm:inset-x-auto sm:right-4 sm:left-auto sm:bottom-4 z-50 sm:max-w-sm animate-in slide-in-from-bottom-4 duration-300"
    >
      <div className="bg-card border border-primary/30 rounded-xl shadow-2xl p-4 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Download className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-sm">ثبّت مُذكّري الذكي</p>
              <p className="text-xs text-muted-foreground">للوصول السريع والعمل بدون إنترنت</p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            aria-label="إغلاق"
            className="text-muted-foreground hover:text-foreground shrink-0 -mt-1 -mr-1 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {isIOS && showIOSHint ? (
          <div className="text-xs text-muted-foreground bg-muted/50 p-2.5 rounded-md leading-relaxed">
            على iPhone: اضغط زر المشاركة <ShareIcon /> في سفاري، ثم اختر <strong>«إضافة إلى الشاشة الرئيسية»</strong>
          </div>
        ) : (
          <Button onClick={handleInstall} className="w-full" size="sm">
            <Download className="w-4 h-4 ml-1.5" />
            تثبيت التطبيق
          </Button>
        )}
      </div>
    </div>
  )
}

function ShareIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="inline w-3.5 h-3.5 mx-0.5 -mt-0.5">
      <path d="M12 3v12M12 3l-4 4M12 3l4 4M5 13v6a2 2 0 002 2h10a2 2 0 002-2v-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

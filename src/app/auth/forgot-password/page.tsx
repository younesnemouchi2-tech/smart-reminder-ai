'use client'

import { useState, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Sparkles, Mail, Loader2, ArrowLeft, KeyRound, CheckCircle2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'

function ForgotPasswordForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [resetToken, setResetToken] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'حدث خطأ. حاول مرة أخرى.')
        return
      }
      setSuccess(true)
      // In dev/preview mode the token is returned so we can redirect directly
      if (data.resetToken) {
        setResetToken(data.resetToken)
        // Auto-redirect to reset page after a short delay
        setTimeout(() => {
          router.push(`/auth/reset-password?token=${encodeURIComponent(data.resetToken)}`)
        }, 1500)
      }
    } catch {
      setError('فشل الاتصال بالخادم. تحقق من الإنترنت.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="p-6">
      {!success ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">البريد الإلكتروني</Label>
            <div className="relative">
              <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="pr-9"
                dir="ltr"
                autoComplete="email"
              />
            </div>
          </div>
          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg text-center">
              {error}
            </div>
          )}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'إرسال رابط إعادة التعيين'}
          </Button>
        </form>
      ) : (
        <div className="space-y-4 text-center">
          <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
            <CheckCircle2 className="h-7 w-7 text-primary" />
          </div>
          <div>
            <p className="font-medium">تم إنشاء رابط إعادة التعيين</p>
            <p className="text-sm text-muted-foreground mt-1">
              {resetToken
                ? 'سيتم توجيهك لإعادة التعيين خلال لحظات...'
                : 'إذا كان البريد مسجلاً، سيصلك رابط إعادة التعيين قريباً.'}
            </p>
          </div>
          {resetToken && (
            <Button
              onClick={() => router.push(`/auth/reset-password?token=${encodeURIComponent(resetToken)}`)}
              className="w-full"
            >
              المتابعة لإعادة التعيين
            </Button>
          )}
        </div>
      )}

      <div className="mt-4 pt-4 border-t text-center text-sm">
        <Link href="/auth/signin" className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
          <ArrowLeft className="h-3 w-3" /> العودة لتسجيل الدخول
        </Link>
      </div>
    </Card>
  )
}

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-background p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20 mb-4">
            <KeyRound className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold">نسيت كلمة المرور؟</h1>
          <p className="text-sm text-muted-foreground mt-1">
            أدخل بريدك الإلكتروني وسنرسل لك رابطاً لإعادة التعيين
          </p>
        </div>
        <Suspense fallback={<div className="text-center text-muted-foreground">جاري التحميل...</div>}>
          <ForgotPasswordForm />
        </Suspense>
        <div className="mt-4 text-center">
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
            <ArrowLeft className="h-3 w-3" /> العودة للرئيسية
          </Link>
        </div>
      </motion.div>
    </div>
  )
}

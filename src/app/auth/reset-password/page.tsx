'use client'

import { useState, Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { KeyRound, Lock, Loader2, ArrowLeft, CheckCircle2, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token') || ''

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // If no token in URL, show error
  useEffect(() => {
    if (!token) {
      setError('الرابط غير صالح. تأكد من فتح الرابط الكامل من البريد الإلكتروني.')
    }
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!token) {
      setError('الرمز غير موجود في الرابط.')
      return
    }
    if (password !== confirmPassword) {
      setError('كلمتا المرور غير متطابقتين.')
      return
    }
    if (password.length < 6) {
      setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'حدث خطأ. حاول مرة أخرى.')
        return
      }
      setSuccess(true)
      // Auto-redirect to signin after 2 seconds
      setTimeout(() => router.push('/auth/signin'), 2000)
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
            <Label htmlFor="password">كلمة المرور الجديدة</Label>
            <div className="relative">
              <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="6 أحرف على الأقل"
                className="pr-9 pl-9"
                dir="ltr"
                autoComplete="new-password"
                disabled={!token}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword">تأكيد كلمة المرور</Label>
            <div className="relative">
              <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="أعد كتابة كلمة المرور"
                className="pr-9"
                dir="ltr"
                autoComplete="new-password"
                disabled={!token}
              />
            </div>
          </div>
          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg text-center">
              {error}
            </div>
          )}
          <Button type="submit" disabled={loading || !token} className="w-full">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'تحديث كلمة المرور'}
          </Button>
        </form>
      ) : (
        <div className="space-y-4 text-center">
          <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
            <CheckCircle2 className="h-7 w-7 text-primary" />
          </div>
          <div>
            <p className="font-medium">تم تحديث كلمة المرور بنجاح</p>
            <p className="text-sm text-muted-foreground mt-1">
              سيتم توجيهك لتسجيل الدخول خلال لحظات...
            </p>
          </div>
          <Button onClick={() => router.push('/auth/signin')} className="w-full">
            تسجيل الدخول الآن
          </Button>
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

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-background p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20 mb-4">
            <KeyRound className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold">كلمة مرور جديدة</h1>
          <p className="text-sm text-muted-foreground mt-1">اختر كلمة مرور جديدة لحسابك</p>
        </div>
        <Suspense fallback={<div className="text-center text-muted-foreground">جاري التحميل...</div>}>
          <ResetPasswordForm />
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

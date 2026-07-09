'use client'

import { SessionProvider } from 'next-auth/react'
import { ThemeProvider } from '@/components/theme-provider'
import { ServiceWorkerRegister } from '@/components/sw-register'
import { PwaInstallPrompt } from '@/components/pwa-install-prompt'
import { Toaster } from '@/components/ui/toaster'
import HomeContent from '@/components/home-content'

export default function Home() {
  return (
    <SessionProvider>
      <ThemeProvider>
        <HomeContent />
        <Toaster />
        <ServiceWorkerRegister />
        <PwaInstallPrompt />
      </ThemeProvider>
    </SessionProvider>
  )
}

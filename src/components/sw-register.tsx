'use client'

import { useEffect } from 'react'

/**
 * Registers the service worker for offline support and PWA capabilities.
 * Only runs in production to avoid caching issues during development.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator)) return
    if (process.env.NODE_ENV !== 'production') return

    const register = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
          updateViaCache: 'none',
        })

        // Check for SW updates every hour
        setInterval(() => {
          registration.update().catch(() => {})
        }, 60 * 60 * 1000)

        // If a new SW takes over, reload to apply changes
        let refreshing = false
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          if (refreshing) return
          refreshing = true
          window.location.reload()
        })
      } catch (err) {
        console.warn('[PWA] Service worker registration failed:', err)
      }
    }

    // Register after window load to not compete with initial resources
    if (document.readyState === 'complete') {
      register()
    } else {
      window.addEventListener('load', register)
      return () => window.removeEventListener('load', register)
    }
  }, [])

  return null
}

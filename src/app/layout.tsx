import type { Metadata, Viewport } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";
import { ServiceWorkerRegister } from "@/components/sw-register";

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
  weight: ["200", "300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "مُذكّري الذكي - إدارة المهام بالذكاء الاصطناعي",
  description: "تطبيق ذكي لإدارة المهام والتذكيرات مدعوم بالذكاء الاصطناعي",
  keywords: ["إدارة المهام", "تذكيرات", "ذكاء اصطناعي", "إنتاجية", "منظم", "تذكير"],
  authors: [{ name: "Smart Reminder AI" }],
  manifest: "/manifest.json",
  applicationName: "مُذكّري الذكي",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "مُذكّري الذكي",
  },
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: ["/icon-192.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#10b981",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        {/* PWA: iOS touch icon (full size, no rounded corners) */}
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        {/* PWA: allow standalone mode on iOS */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="مُذكّري الذكي" />
      </head>
      <body className={`${cairo.variable} font-cairo antialiased bg-background text-foreground`}>
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}

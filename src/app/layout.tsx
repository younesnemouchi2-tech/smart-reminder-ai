import type { Metadata, Viewport } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";
import { SessionProvider } from "@/components/session-provider";
import { ServiceWorkerRegister } from "@/components/sw-register";

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
  weight: ["200", "300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "مُذكّري الذكي - إدارة المهام بالذكاء الاصطناعي",
  description: "تطبيق ذكي لإدارة المهام والتذكيرات مدعوم بالذكاء الاصطناعي",
  keywords: ["إدارة المهام", "تذكيرات", "ذكاء اصطناعي", "إنتاجية"],
  authors: [{ name: "Smart Reminder AI" }],
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "مُذكّري الذكي" },
  icons: { icon: "/icon-192.png", apple: "/icon-192.png" },
};

export const viewport: Viewport = {
  themeColor: "#10b981",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body className={`${cairo.variable} font-cairo antialiased bg-background text-foreground`}>
        <SessionProvider>
          <ThemeProvider>
            {children}
            <Toaster />
            <ServiceWorkerRegister />
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}

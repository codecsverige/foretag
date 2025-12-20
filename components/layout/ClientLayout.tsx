'use client'

/* ────────────────────────────────────────────────
   components/layout/ClientLayout.tsx
   Client-side layout wrapper for Auth context
──────────────────────────────────────────────── */

import { AuthProvider } from '@/context/AuthContext'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'

interface ClientLayoutProps {
  children: React.ReactNode
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  return (
    <AuthProvider>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">
          {children}
        </main>
        <Footer />
      </div>
    </AuthProvider>
  )
}

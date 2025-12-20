import type { Metadata } from 'next'
import './globals.css'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { AuthProvider } from '@/context/AuthContext'

export const metadata: Metadata = {
  title: 'BokaNära - Hitta lokala tjänster',
  description: 'Upptäck och boka lokala tjänster nära dig. Frisör, massage, städning och mer.',
  keywords: 'boka, tjänster, lokala företag, frisör, massage, städning, Sverige',
  openGraph: {
    title: 'BokaNära - Hitta lokala tjänster',
    description: 'Upptäck och boka lokala tjänster nära dig.',
    type: 'website',
    locale: 'sv_SE',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="sv">
      <body className="font-sans antialiased">
        <AuthProvider>
          <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-1">
              {children}
            </main>
            <Footer />
          </div>
        </AuthProvider>
      </body>
    </html>
  )
}

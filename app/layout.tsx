import type { Metadata } from 'next'
import './globals.css'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import Providers from '@/components/providers/Providers'

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
        <Providers>
          <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-1">
              {children}
            </main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  )
}

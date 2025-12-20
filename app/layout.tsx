import type { Metadata } from 'next'
// TODO: Re-enable Google Fonts when deploying to environment with internet access
// import { Inter } from 'next/font/google'
import './globals.css'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'

// TODO: Re-enable when Google Fonts import is restored
// const inter = Inter({ subsets: ['latin'] })

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
      {/* TODO: Use inter.className when Google Fonts is restored */}
      <body className="font-sans">
        <div className="min-h-screen flex flex-col">
          <Header />
          <main className="flex-1">
            {children}
          </main>
          <Footer />
        </div>
      </body>
    </html>
  )
}

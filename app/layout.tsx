import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { AuthProvider } from '@/context/AuthContext'
import { ReactQueryProvider } from '@/lib/react-query-provider'

const inter = Inter({ 
  subsets: ['latin'], 
  display: 'swap',
  preload: true,
  fallback: ['system-ui', 'arial']
})

export const metadata: Metadata = {
  title: 'BokaNära - Städ & flyttjänster',
  description: 'Hitta och boka städning, fönsterputs och flyttstäd nära dig. Jämför företag och boka enkelt.',
  keywords: 'boka, städning, flyttstäd, fönsterputs, städfirma, Sverige',
  openGraph: {
    title: 'BokaNära - Städ & flyttjänster',
    description: 'Hitta och boka städning, fönsterputs och flyttstäd nära dig.',
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
      <body className={inter.className}>
        <ReactQueryProvider>
          <AuthProvider>
            <div className="min-h-screen flex flex-col">
              <Header />
              <main className="flex-1 w-full">
                {children}
              </main>
              <Footer />
            </div>
          </AuthProvider>
        </ReactQueryProvider>
      </body>
    </html>
  )
}

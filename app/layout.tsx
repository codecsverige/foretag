import type { Metadata } from 'next'
import './globals.css'
import ClientLayout from '@/components/layout/ClientLayout'

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
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  )
}

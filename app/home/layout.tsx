import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Hem - BokaNära',
  description: 'Se de senaste företagen och tjänsterna nära dig. Boka frisör, massage, städning och mer.',
  keywords: 'boka, tjänster, lokala företag, nya företag, Sverige',
  openGraph: {
    title: 'Hem - BokaNära',
    description: 'Se de senaste företagen och tjänsterna nära dig.',
    type: 'website',
    locale: 'sv_SE',
  },
}

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

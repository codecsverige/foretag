import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Om oss | BokaNära',
  description: 'Lär känna teamet bakom BokaNära och vår vision att förenkla bokning för alla.',
}

export default function OmOssPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <Link href="/" className="text-blue-600 hover:underline mb-6 inline-block">
          ← Tillbaka till startsidan
        </Link>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Om BokaNära</h1>

        <div className="bg-white rounded-lg shadow-sm p-8 space-y-8">
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">Vår vision</h2>
            <p className="text-gray-700 text-lg">
              Vi tror att det ska vara enkelt att hitta och boka lokala tjänster. BokaNära skapades 
              för att koppla samman kunder med lokala företag på ett smidigt och effektivt sätt.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">Vår historia</h2>
            <p className="text-gray-700">
              BokaNära grundades med en enkel idé: att göra det lättare för människor att upptäcka 
              och boka tjänster i sitt närområde. Vi såg hur många fantastiska lokala företag hade 
              svårt att nå ut till nya kunder, samtidigt som kunder hade svårt att hitta rätt tjänst.
            </p>
            <p className="text-gray-700">
              Idag hjälper vi tusentals företag att växa sin verksamhet och ger kunder en smidig 
              bokningsupplevelse.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">Våra värderingar</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center p-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Enkelhet</h3>
                <p className="text-gray-600 text-sm">
                  Vi gör tekniken enkel så att du kan fokusera på det du gör bäst.
                </p>
              </div>
              <div className="text-center p-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Gemenskap</h3>
                <p className="text-gray-600 text-sm">
                  Vi stärker lokala företag och bygger starkare samhällen.
                </p>
              </div>
              <div className="text-center p-4">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Förtroende</h3>
                <p className="text-gray-600 text-sm">
                  Vi bygger långsiktiga relationer baserade på tillit och transparens.
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">Kontakta oss</h2>
            <p className="text-gray-700">
              Har du frågor eller vill veta mer? Vi finns här för dig.
            </p>
            <Link
              href="/kontakt"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Kontakta oss
            </Link>
          </section>
        </div>
      </div>
    </div>
  )
}

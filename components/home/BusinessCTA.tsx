import Link from 'next/link'

export default function BusinessCTA() {
  return (
    <section className="py-12 bg-gradient-to-r from-gray-900 to-gray-950">
      <div className="max-w-5xl mx-auto px-4">
        <div className="md:flex items-center justify-between">
          <div className="mb-6 md:mb-0">
            <h2 className="text-xl font-semibold text-white mb-2">Nå fler kunder med BokaNära</h2>
            <p className="text-gray-400">Skapa en professionell sida för ditt företag – kostnadsfritt.</p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/skapa"
              className="bg-brand hover:bg-brand-dark text-white px-5 py-2.5 rounded-xl font-semibold transition-colors shadow-sm hover:shadow"
            >
              Registrera företag
            </Link>
            <Link
              href="/login"
              className="bg-white/10 hover:bg-white/15 border border-white/15 text-white px-5 py-2.5 rounded-xl font-medium transition-colors"
            >
              Logga in
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

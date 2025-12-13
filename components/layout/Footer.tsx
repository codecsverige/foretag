import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">🏢</span>
              <span className="text-xl font-bold text-white">BokaNära</span>
            </div>
            <p className="text-sm">
              Hitta och boka lokala tjänster enkelt. Vi kopplar dig med de bästa företagen i din stad.
            </p>
          </div>

          {/* Kategorier */}
          <div>
            <h3 className="font-semibold text-white mb-4">Populära kategorier</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/sok?kategori=frisor" className="hover:text-white transition">💇 Frisör</Link></li>
              <li><Link href="/sok?kategori=massage" className="hover:text-white transition">💆 Massage</Link></li>
              <li><Link href="/sok?kategori=stadning" className="hover:text-white transition">🧹 Städning</Link></li>
              <li><Link href="/sok?kategori=bil" className="hover:text-white transition">🚗 Bil & Motor</Link></li>
              <li><Link href="/sok?kategori=halsa" className="hover:text-white transition">🏥 Hälsa</Link></li>
            </ul>
          </div>

          {/* Städer */}
          <div>
            <h3 className="font-semibold text-white mb-4">Populära städer</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/sok?stad=stockholm" className="hover:text-white transition">Stockholm</Link></li>
              <li><Link href="/sok?stad=goteborg" className="hover:text-white transition">Göteborg</Link></li>
              <li><Link href="/sok?stad=malmo" className="hover:text-white transition">Malmö</Link></li>
              <li><Link href="/sok?stad=uppsala" className="hover:text-white transition">Uppsala</Link></li>
              <li><Link href="/sok?stad=vasteras" className="hover:text-white transition">Västerås</Link></li>
            </ul>
          </div>

          {/* Info */}
          <div>
            <h3 className="font-semibold text-white mb-4">Information</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/om-oss" className="hover:text-white transition">Om oss</Link></li>
              <li><Link href="/for-foretag" className="hover:text-white transition">För företag</Link></li>
              <li><Link href="/kontakt" className="hover:text-white transition">Kontakt</Link></li>
              <li><Link href="/integritet" className="hover:text-white transition">Integritetspolicy</Link></li>
              <li><Link href="/villkor" className="hover:text-white transition">Användarvillkor</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
          <p>© {new Date().getFullYear()} BokaNära. Alla rättigheter förbehållna.</p>
        </div>
      </div>
    </footer>
  )
}

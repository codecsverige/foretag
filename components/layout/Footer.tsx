import Link from 'next/link'
import { HiMail, HiPhone, HiLocationMarker } from 'react-icons/hi'

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 bg-blue-600 rounded flex items-center justify-center">
                <span className="text-white font-bold text-xs">B</span>
              </div>
              <span className="font-semibold text-white">BokaNära</span>
            </div>
            <p className="text-xs leading-relaxed">
              Sveriges plattform för att hitta och boka lokala tjänster.
            </p>
          </div>

          {/* Tjänster */}
          <div>
            <h3 className="font-medium text-white text-sm mb-3">Tjänster</h3>
            <ul className="space-y-2 text-xs">
              <li><Link href="/sok?kategori=frisor" className="hover:text-white transition">Frisör</Link></li>
              <li><Link href="/sok?kategori=massage" className="hover:text-white transition">Massage</Link></li>
              <li><Link href="/sok?kategori=stadning" className="hover:text-white transition">Städning</Link></li>
              <li><Link href="/sok?kategori=halsa" className="hover:text-white transition">Hälsa & Vård</Link></li>
              <li><Link href="/sok" className="hover:text-white transition">Alla kategorier</Link></li>
            </ul>
          </div>

          {/* Städer */}
          <div>
            <h3 className="font-medium text-white text-sm mb-3">Städer</h3>
            <ul className="space-y-2 text-xs">
              <li><Link href="/sok?stad=Stockholm" className="hover:text-white transition">Stockholm</Link></li>
              <li><Link href="/sok?stad=Göteborg" className="hover:text-white transition">Göteborg</Link></li>
              <li><Link href="/sok?stad=Malmö" className="hover:text-white transition">Malmö</Link></li>
              <li><Link href="/sok?stad=Uppsala" className="hover:text-white transition">Uppsala</Link></li>
            </ul>
          </div>

          {/* För företag */}
          <div>
            <h3 className="font-medium text-white text-sm mb-3">För företag</h3>
            <ul className="space-y-2 text-xs">
              <li><Link href="/skapa" className="hover:text-white transition">Registrera företag</Link></li>
              <li><Link href="/login" className="hover:text-white transition">Logga in</Link></li>
              <li><Link href="/priser" className="hover:text-white transition">Priser</Link></li>
            </ul>
          </div>

          {/* Information */}
          <div>
            <h3 className="font-medium text-white text-sm mb-3">Information</h3>
            <ul className="space-y-2 text-xs">
              <li><Link href="/om-oss" className="hover:text-white transition">Om BokaNära</Link></li>
              <li><Link href="/kontakt" className="hover:text-white transition">Kontakt</Link></li>
              <li><Link href="/integritet" className="hover:text-white transition">Integritetspolicy</Link></li>
              <li><Link href="/villkor" className="hover:text-white transition">Användarvillkor</Link></li>
            </ul>
          </div>
        </div>

        {/* Contact & Trust */}
        <div className="border-t border-gray-800 mt-8 pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex flex-wrap items-center gap-4 text-xs">
              <a href="mailto:info@bokanara.se" className="flex items-center gap-1.5 hover:text-white transition">
                <HiMail className="w-4 h-4" />
                info@bokanara.se
              </a>
              <span className="flex items-center gap-1.5">
                <HiLocationMarker className="w-4 h-4" />
                Stockholm, Sverige
              </span>
            </div>
            
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/>
                </svg>
                Säker betalning
              </span>
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                </svg>
                Verifierade företag
              </span>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-gray-800 mt-6 pt-6 flex flex-col md:flex-row justify-between items-center gap-2 text-xs">
          <p>© {new Date().getFullYear()} BokaNära AB. Org.nr: 559XXX-XXXX</p>
          <p className="text-gray-500">Alla rättigheter förbehållna.</p>
        </div>
      </div>
    </footer>
  )
}

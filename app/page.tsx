'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { HiSearch, HiArrowRight, HiShieldCheck, HiCheckCircle, HiBadgeCheck, HiStar } from 'react-icons/hi'
import { getCompanies } from '@/lib/companiesCache'
import CompanyCard from '@/components/company/CompanyCard'

const categories = [
  { id: 'frisor', name: 'Frisör & Skönhet' },
  { id: 'massage', name: 'Massage & Spa' },
  { id: 'stadning', name: 'Städ & Hemservice' },
  { id: 'bil', name: 'Bil & Motor' },
  { id: 'halsa', name: 'Hälsa & Sjukvård' },
  { id: 'restaurang', name: 'Restaurang & Café' },
  { id: 'fitness', name: 'Träning & Fitness' },
  { id: 'utbildning', name: 'Utbildning' },
]

interface Company {
  id: string
  name: string
  category?: string
  categoryName?: string
  city?: string
  rating?: number
  reviewCount?: number
  priceFrom?: number
  premium?: boolean
  image?: string
  images?: string[]
  description?: string
  verified?: boolean
  services?: Array<{ price?: number }>
}

export default function Home() {
  const router = useRouter()
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    let mounted = true
    
    async function loadCompanies() {
      try {
        const data = await getCompanies()
        if (mounted) {
          setCompanies(data.slice(0, 6))
          setLoading(false)
        }
      } catch (error) {
        console.error('Error:', error)
        if (mounted) setLoading(false)
      }
    }

    loadCompanies()
    return () => { mounted = false }
  }, [])

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/sok?q=${encodeURIComponent(searchQuery)}`)
    }
  }, [searchQuery, router])

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-b from-gray-50 to-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-12 md:py-16">
          <div className="text-center max-w-2xl mx-auto">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Hitta och boka lokala tjänster
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              Upptäck verifierade företag i din stad. Jämför priser, läs omdömen och boka direkt.
            </p>

            {/* Search */}
            <form onSubmit={handleSearch} className="max-w-xl mx-auto">
              <div className="flex gap-2 shadow-sm">
                <div className="flex-1 relative">
                  <HiSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Sök företag, tjänst eller stad..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none text-base"
                  />
                </div>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3.5 rounded-lg font-medium transition-colors"
                >
                  Sök
                </button>
              </div>
            </form>

            {/* Trust indicators */}
            <div className="flex flex-wrap items-center justify-center gap-6 mt-8 text-sm text-gray-500">
              <span className="flex items-center gap-1.5">
                <HiBadgeCheck className="w-5 h-5 text-blue-600" />
                Verifierade företag
              </span>
              <span className="flex items-center gap-1.5">
                <HiStar className="w-5 h-5 text-amber-500" />
                Äkta kundomdömen
              </span>
              <span className="flex items-center gap-1.5">
                <HiShieldCheck className="w-5 h-5 text-green-600" />
                Säker bokning
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-10 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Populära kategorier</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/sok?kategori=${cat.id}`}
                className="px-4 py-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 hover:border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors text-center"
              >
                {cat.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Companies */}
      <section className="py-10 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Utvalda företag</h2>
            <Link 
              href="/sok" 
              className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
            >
              Visa alla <HiArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg border border-gray-200 overflow-hidden animate-pulse">
                  <div className="h-48 bg-gray-100"></div>
                  <div className="p-4">
                    <div className="h-3 bg-gray-100 rounded w-1/4 mb-3"></div>
                    <div className="h-4 bg-gray-100 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-100 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : companies.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {companies.map((company) => (
                <CompanyCard key={company.id} company={company} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <p className="text-gray-500 mb-4">Inga företag registrerade ännu.</p>
              <Link 
                href="/skapa" 
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Registrera ditt företag →
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* How it works */}
      <section className="py-12 bg-white border-t border-gray-200">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-xl font-semibold text-gray-900 mb-8 text-center">Så fungerar det</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 text-lg font-bold">
                1
              </div>
              <h3 className="font-medium text-gray-900 mb-2">Sök tjänst</h3>
              <p className="text-sm text-gray-500">Hitta företag som erbjuder den tjänst du behöver i ditt område.</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 text-lg font-bold">
                2
              </div>
              <h3 className="font-medium text-gray-900 mb-2">Jämför & välj</h3>
              <p className="text-sm text-gray-500">Läs omdömen, jämför priser och välj det företag som passar dig.</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 text-lg font-bold">
                3
              </div>
              <h3 className="font-medium text-gray-900 mb-2">Boka enkelt</h3>
              <p className="text-sm text-gray-500">Boka direkt online eller ring företaget. Bekräftelse via SMS.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA for businesses */}
      <section className="py-12 bg-gray-900">
        <div className="max-w-5xl mx-auto px-4">
          <div className="md:flex items-center justify-between">
            <div className="mb-6 md:mb-0">
              <h2 className="text-xl font-semibold text-white mb-2">Nå fler kunder med BokaNära</h2>
              <p className="text-gray-400">Skapa en professionell sida för ditt företag – kostnadsfritt.</p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/skapa"
                className="bg-white text-gray-900 px-5 py-2.5 rounded-lg font-medium hover:bg-gray-100 transition-colors"
              >
                Registrera företag
              </Link>
              <Link
                href="/login"
                className="border border-gray-700 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-gray-800 transition-colors"
              >
                Logga in
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

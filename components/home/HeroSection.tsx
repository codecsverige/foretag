'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { HiSearch, HiLocationMarker, HiShieldCheck, HiBadgeCheck, HiStar } from 'react-icons/hi'

// Popular services for quick links
const popularServices = [
  { id: 'hemstadning', name: 'Hemstädning', category: 'stadning' },
  { id: 'flyttstadning', name: 'Flyttstädning', category: 'stadning' },
  { id: 'fonsterputs', name: 'Fönsterputs', category: 'stadning' },
  { id: 'storstadning', name: 'Storstädning', category: 'stadning' },
  { id: 'flytthjalp', name: 'Flytthjälp', category: 'flytt' },
  { id: 'kontorsstadning', name: 'Kontorsstädning', category: 'stadning' },
]

// Popular cities
const cities = ['Stockholm', 'Göteborg', 'Malmö', 'Uppsala', 'Västerås', 'Örebro']

export default function HeroSection() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [city, setCity] = useState('')

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (searchQuery.trim()) params.set('q', searchQuery.trim())
    if (city) params.set('stad', city)
    router.push(`/sok${params.toString() ? '?' + params.toString() : ''}`, { scroll: false })
  }, [searchQuery, city, router])

  return (
    <section className="bg-gradient-to-b from-brand/5 via-gray-50 to-white border-b border-gray-200">
      <div className="max-w-5xl mx-auto px-4 py-12 md:py-16 lg:py-20">
        <div className="text-center max-w-2xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Hitta och boka städ- och flyttjänster
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Jämför företag, läs omdömen och boka enkelt i din stad.
          </p>

          {/* Improved Search Bar - Two Fields */}
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
            <div className="flex flex-col bg-white border border-gray-200 rounded-2xl shadow-lg overflow-hidden transition focus-within:border-brand/40 focus-within:ring-4 focus-within:ring-brand/10">
              {/* Mobile: Stacked layout */}
              <div className="flex flex-col sm:flex-row">
                {/* Service Search Field */}
                <div className="flex-1 relative border-b sm:border-b-0 sm:border-r border-gray-200">
                  <HiSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Vad vill du boka?"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 sm:py-4 outline-none text-base bg-transparent placeholder:text-gray-400"
                  />
                </div>
                
                {/* City Field */}
                <div className="relative sm:w-48 border-b sm:border-b-0 border-gray-200">
                  <HiLocationMarker className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 sm:py-4 outline-none text-base bg-transparent appearance-none cursor-pointer text-gray-700"
                  >
                    <option value="">Var?</option>
                    {cities.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              {/* Search Button - Full width on mobile */}
              <button
                type="submit"
                className="bg-brand hover:bg-brand-dark text-white px-8 py-3.5 sm:py-4 font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <HiSearch className="w-5 h-5" />
                <span>Sök</span>
              </button>
            </div>
          </form>

          {/* Popular Services Quick Links */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            <span className="text-sm text-gray-500">Populärt:</span>
            {popularServices.map((service) => (
              <Link
                key={service.id}
                href={`/sok?kategori=${service.category}&tjanst=${service.id}`}
                className="text-sm text-gray-600 hover:text-brand px-3 py-1.5 bg-white/80 hover:bg-white border border-gray-200 hover:border-brand/30 rounded-full transition-colors"
              >
                {service.name}
              </Link>
            ))}
          </div>

          {/* Trust Badges */}
          <div className="flex flex-wrap items-center justify-center gap-3 mt-8 text-sm text-gray-600">
            <span className="flex items-center gap-1.5 bg-white/80 border border-gray-200 rounded-full px-3 py-1.5 shadow-sm">
              <HiBadgeCheck className="w-5 h-5 text-blue-600" />
              Verifierade företag
            </span>
            <span className="flex items-center gap-1.5 bg-white/80 border border-gray-200 rounded-full px-3 py-1.5 shadow-sm">
              <HiStar className="w-5 h-5 text-amber-500" />
              Äkta kundomdömen
            </span>
            <span className="flex items-center gap-1.5 bg-white/80 border border-gray-200 rounded-full px-3 py-1.5 shadow-sm">
              <HiShieldCheck className="w-5 h-5 text-green-600" />
              Säker bokning
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}

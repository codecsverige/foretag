'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { HiSearch, HiShieldCheck, HiBadgeCheck, HiStar } from 'react-icons/hi'

export default function HeroSection() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/sok?q=${encodeURIComponent(searchQuery)}`, { scroll: false })
    }
  }, [searchQuery, router])

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

          <form onSubmit={handleSearch} className="max-w-xl mx-auto">
            <div className="flex gap-2 p-2 bg-white border border-gray-200 rounded-2xl shadow-sm transition focus-within:border-brand/40 focus-within:ring-4 focus-within:ring-brand/10">
              <div className="flex-1 relative">
                <HiSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Sök företag, tjänst eller stad..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-3 py-3 rounded-xl outline-none text-base bg-transparent placeholder:text-gray-400"
                />
              </div>
              <button
                type="submit"
                className="bg-brand hover:bg-brand-dark text-white px-6 py-3 rounded-xl font-semibold transition-colors shadow-sm hover:shadow"
              >
                Sök
              </button>
            </div>
          </form>

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

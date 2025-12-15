'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { HiSearch, HiFilter, HiX } from 'react-icons/hi'
import CompanyCard from '@/components/company/CompanyCard'
import { db } from '@/lib/firebase'
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore'

// الفئات
const categories = [
  { id: '', name: 'Alla kategorier', emoji: '📂' },
  { id: 'frisor', name: 'Frisör', emoji: '💇' },
  { id: 'massage', name: 'Massage', emoji: '💆' },
  { id: 'stadning', name: 'Städning', emoji: '🧹' },
  { id: 'bil', name: 'Bil & Motor', emoji: '🚗' },
  { id: 'halsa', name: 'Hälsa', emoji: '🏥' },
  { id: 'restaurang', name: 'Restaurang', emoji: '🍽️' },
  { id: 'fitness', name: 'Fitness', emoji: '💪' },
  { id: 'utbildning', name: 'Utbildning', emoji: '📚' },
]

const cities = [
  { id: '', name: 'Alla städer' },
  { id: 'Stockholm', name: 'Stockholm' },
  { id: 'Göteborg', name: 'Göteborg' },
  { id: 'Malmö', name: 'Malmö' },
  { id: 'Uppsala', name: 'Uppsala' },
  { id: 'Västerås', name: 'Västerås' },
  { id: 'Örebro', name: 'Örebro' },
  { id: 'Linköping', name: 'Linköping' },
  { id: 'Helsingborg', name: 'Helsingborg' },
]

interface Company {
  id: string
  name: string
  category: string
  categoryName: string
  emoji: string
  city: string
  rating: number
  reviewCount: number
  priceFrom: number
  premium?: boolean
}

function SearchContent() {
  const searchParams = useSearchParams()
  
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '')
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('kategori') || '')
  const [selectedCity, setSelectedCity] = useState(searchParams.get('stad') || '')
  const [sortBy, setSortBy] = useState('newest')
  const [showFilters, setShowFilters] = useState(false)

  // Fetch companies from Firestore
  useEffect(() => {
    async function fetchCompanies() {
      if (!db) {
        setCompanies([])
        setLoading(false)
        return
      }
      
      setLoading(true)
      try {
        let q = query(
          collection(db, 'companies'),
          where('status', '==', 'active')
        )
        
        // Note: Firestore has limitations on compound queries
        // For production, you'd want to use Algolia or similar for search
        
        const snapshot = await getDocs(q)
        let results = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          priceFrom: doc.data().services?.[0]?.price || 0,
        })) as Company[]
        
        // Client-side filtering (for simplicity)
        if (searchQuery) {
          const query = searchQuery.toLowerCase()
          results = results.filter(c => 
            c.name?.toLowerCase().includes(query) ||
            c.categoryName?.toLowerCase().includes(query)
          )
        }
        
        if (selectedCategory) {
          results = results.filter(c => c.category === selectedCategory)
        }
        
        if (selectedCity) {
          results = results.filter(c => c.city === selectedCity)
        }
        
        // Sort
        switch (sortBy) {
          case 'rating':
            results.sort((a, b) => (b.rating || 0) - (a.rating || 0))
            break
          case 'price_low':
            results.sort((a, b) => (a.priceFrom || 0) - (b.priceFrom || 0))
            break
          case 'price_high':
            results.sort((a, b) => (b.priceFrom || 0) - (a.priceFrom || 0))
            break
          default: // newest
            // Already sorted by createdAt from Firestore
            break
        }
        
        // Premium first
        results.sort((a, b) => (b.premium ? 1 : 0) - (a.premium ? 1 : 0))
        
        setCompanies(results)
      } catch (error) {
        console.error('Error fetching companies:', error)
        setCompanies([])
      } finally {
        setLoading(false)
      }
    }
    
    fetchCompanies()
  }, [searchQuery, selectedCategory, selectedCity, sortBy])

  const activeFiltersCount = [selectedCategory, selectedCity].filter(Boolean).length

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Search Header */}
      <div className="bg-white border-b sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1 relative">
              <HiSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Sök företag eller tjänst..."
                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:border-brand focus:ring-1 focus:ring-brand outline-none"
              />
            </div>

            {/* Filter Button (Mobile) */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="md:hidden flex items-center justify-center gap-2 px-4 py-3 border border-gray-200 rounded-xl"
            >
              <HiFilter className="w-5 h-5" />
              Filter
              {activeFiltersCount > 0 && (
                <span className="bg-brand text-white text-xs px-2 py-0.5 rounded-full">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            {/* Desktop Filters */}
            <div className="hidden md:flex gap-4">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-3 border border-gray-200 rounded-xl focus:border-brand outline-none min-w-[160px]"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.emoji} {cat.name}
                  </option>
                ))}
              </select>

              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="px-4 py-3 border border-gray-200 rounded-xl focus:border-brand outline-none min-w-[140px]"
              >
                {cities.map((city) => (
                  <option key={city.id} value={city.id}>
                    {city.name}
                  </option>
                ))}
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-3 border border-gray-200 rounded-xl focus:border-brand outline-none min-w-[140px]"
              >
                <option value="newest">Senaste</option>
                <option value="rating">Högst betyg</option>
                <option value="price_low">Lägst pris</option>
                <option value="price_high">Högst pris</option>
              </select>
            </div>
          </div>

          {/* Mobile Filters Panel */}
          {showFilters && (
            <div className="md:hidden mt-4 p-4 bg-gray-50 rounded-xl">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl"
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.emoji} {cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stad</label>
                  <select
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl"
                  >
                    {cities.map((city) => (
                      <option key={city.id} value={city.id}>{city.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sortera</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl"
                  >
                    <option value="newest">Senaste</option>
                    <option value="rating">Högst betyg</option>
                    <option value="price_low">Lägst pris</option>
                    <option value="price_high">Högst pris</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Active Filters */}
          {(selectedCategory || selectedCity) && (
            <div className="flex flex-wrap gap-2 mt-4">
              {selectedCategory && (
                <span className="inline-flex items-center gap-1 bg-brand/10 text-brand px-3 py-1 rounded-full text-sm">
                  {categories.find((c) => c.id === selectedCategory)?.emoji}{' '}
                  {categories.find((c) => c.id === selectedCategory)?.name}
                  <button onClick={() => setSelectedCategory('')}>
                    <HiX className="w-4 h-4" />
                  </button>
                </span>
              )}
              {selectedCity && (
                <span className="inline-flex items-center gap-1 bg-brand/10 text-brand px-3 py-1 rounded-full text-sm">
                  📍 {selectedCity}
                  <button onClick={() => setSelectedCity('')}>
                    <HiX className="w-4 h-4" />
                  </button>
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand"></div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-gray-900">
                {companies.length} företag hittade
              </h1>
            </div>

            {companies.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {companies.map((company) => (
                  <CompanyCard key={company.id} company={company} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">🔍</div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Inga företag hittades
                </h2>
                <p className="text-gray-600 mb-6">
                  Prova att ändra dina sökfilter eller sök efter något annat.
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('')
                    setSelectedCategory('')
                    setSelectedCity('')
                  }}
                  className="text-brand hover:underline"
                >
                  Rensa alla filter
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand"></div>
      </div>
    }>
      <SearchContent />
    </Suspense>
  )
}

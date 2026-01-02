'use client'

import { useState, useEffect, Suspense, useCallback, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { HiSearch, HiAdjustments, HiX } from 'react-icons/hi'
import { getCompanies } from '@/lib/companiesCache'
import CompanyCard from '@/components/company/CompanyCard'

const categories = [
  { id: '', name: 'Alla kategorier', subServices: [] },
  { 
    id: 'stadning', 
    name: 'Städning',
    subServices: [
      { id: 'hemstadning', name: 'Hemstädning' },
      { id: 'flyttstadning', name: 'Flyttstädning' },
      { id: 'kontorsstadning', name: 'Kontorsstädning' },
      { id: 'trappstadning', name: 'Trappstädning' },
      { id: 'byggstadning', name: 'Byggstädning' },
      { id: 'fonsterputs', name: 'Fönsterputs' },
    ]
  },
  { 
    id: 'flytt', 
    name: 'Flytt & Transport',
    subServices: [
      { id: 'flytthjalp', name: 'Flytthjälp' },
      { id: 'flytt-stadning', name: 'Flytt med städning' },
      { id: 'transport', name: 'Transport småjobb' },
      { id: 'bortforsling', name: 'Bortforsling' },
    ]
  },
  { 
    id: 'hantverk', 
    name: 'Hantverk & Småjobb',
    subServices: [
      { id: 'montering', name: 'Montering' },
      { id: 'snickeri', name: 'Snickeri' },
      { id: 'el', name: 'El småjobb' },
      { id: 'vvs', name: 'VVS småjobb' },
    ]
  },
  { 
    id: 'hem-fastighet', 
    name: 'Hem & Fastighet',
    subServices: [
      { id: 'grasklippning', name: 'Gräsklippning' },
      { id: 'snoskottning', name: 'Snöskottning' },
      { id: 'tradgardsarbete', name: 'Trädgårdsarbete' },
      { id: 'fastighetsskotsel', name: 'Fastighetsskötsel' },
    ]
  },
]

const allowedCategories = new Set(['stadning', 'flytt', 'hantverk', 'hem-fastighet', 'annat'])

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
  subServiceNames?: string[]
}

function SearchContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const prefetched = useRef(false)

  const initialCategoryParam = searchParams.get('kategori') || ''
  const initialCategory = allowedCategories.has(initialCategoryParam) ? initialCategoryParam : ''
  
  const [allCompanies, setAllCompanies] = useState<Company[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '')
  const [selectedCategory, setSelectedCategory] = useState(initialCategory)
  const [selectedSubService, setSelectedSubService] = useState('')
  const [selectedCity, setSelectedCity] = useState(searchParams.get('stad') || '')
  const [sortBy, setSortBy] = useState('newest')
  const [showFilters, setShowFilters] = useState(false)
  
  const currentCategorySubServices = categories.find(c => c.id === selectedCategory)?.subServices || []

  useEffect(() => {
    let mounted = true
    
    async function loadCompanies() {
      try {
        const data = await getCompanies()
        if (mounted) {
          setAllCompanies(data)
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

  useEffect(() => {
    let results = [...allCompanies]

    results = results.filter((c) => allowedCategories.has(c.category || ''))
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      results = results.filter(c => 
        c.name?.toLowerCase().includes(query) ||
        c.categoryName?.toLowerCase().includes(query) ||
        c.description?.toLowerCase().includes(query) ||
        c.city?.toLowerCase().includes(query) ||
        c.subServiceNames?.some((s: string) => s.toLowerCase().includes(query))
      )
    }
    
    if (selectedCategory) {
      results = results.filter(c => c.category === selectedCategory)
    }
    
    if (selectedSubService) {
      results = results.filter(c => 
        c.subServiceNames?.some((s: string) => s.toLowerCase().includes(selectedSubService.toLowerCase()))
      )
    }
    
    if (selectedCity) {
      results = results.filter(c => c.city === selectedCity)
    }
    
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
    }
    
    results.sort((a, b) => (b.premium ? 1 : 0) - (a.premium ? 1 : 0))
    
    setCompanies(results)
  }, [allCompanies, searchQuery, selectedCategory, selectedSubService, selectedCity, sortBy])

  useEffect(() => {
    const top = companies.slice(0, 3)
    if (top.length === 0 || prefetched.current) return
    prefetched.current = true
    top.forEach((c) => {
      router.prefetch(`/foretag/${c.id}`)
    })
  }, [companies, router])

  const clearFilters = useCallback(() => {
    setSearchQuery('')
    setSelectedCategory('')
    setSelectedSubService('')
    setSelectedCity('')
  }, [])
  
  const handleCategoryChange = useCallback((newCategory: string) => {
    setSelectedCategory(newCategory)
    setSelectedSubService('')
  }, [])

  const activeFiltersCount = [selectedCategory, selectedCity].filter(Boolean).length

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Search Header */}
      <div className="bg-white border-b border-gray-200 sticky top-16 z-30">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex gap-3">
            {/* Search Input */}
            <div className="flex-1 relative">
              <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Sök företag, tjänst eller stad..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              />
            </div>

            {/* Filter Toggle (Mobile) */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="md:hidden flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg"
            >
              <HiAdjustments className="w-5 h-5" />
              {activeFiltersCount > 0 && (
                <span className="bg-blue-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            {/* Desktop Filters */}
            <div className="hidden md:flex gap-2">
              <select
                value={selectedCategory}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="px-3 py-2.5 border border-gray-300 rounded-lg focus:border-blue-500 outline-none text-sm"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>

              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="px-3 py-2.5 border border-gray-300 rounded-lg focus:border-blue-500 outline-none text-sm"
              >
                {cities.map((city) => (
                  <option key={city.id} value={city.id}>{city.name}</option>
                ))}
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2.5 border border-gray-300 rounded-lg focus:border-blue-500 outline-none text-sm"
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
            <div className="md:hidden mt-4 p-4 bg-gray-50 rounded-lg space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Kategori</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-white"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Stad</label>
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-white"
                >
                  {cities.map((city) => (
                    <option key={city.id} value={city.id}>{city.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Sortera</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-white"
                >
                  <option value="newest">Senaste</option>
                  <option value="rating">Högst betyg</option>
                  <option value="price_low">Lägst pris</option>
                  <option value="price_high">Högst pris</option>
                </select>
              </div>
            </div>
          )}

          {/* Active Filters */}
          {(selectedCategory || selectedCity || selectedSubService) && (
            <div className="flex flex-wrap gap-2 mt-3">
              {selectedCategory && (
                <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full text-sm">
                  {categories.find((c) => c.id === selectedCategory)?.name}
                  <button onClick={() => handleCategoryChange('')} className="hover:text-blue-900">
                    <HiX className="w-4 h-4" />
                  </button>
                </span>
              )}
              {selectedSubService && (
                <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 px-2.5 py-1 rounded-full text-sm">
                  {currentCategorySubServices.find((s) => s.id === selectedSubService)?.name}
                  <button onClick={() => setSelectedSubService('')} className="hover:text-green-900">
                    <HiX className="w-4 h-4" />
                  </button>
                </span>
              )}
              {selectedCity && (
                <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full text-sm">
                  {selectedCity}
                  <button onClick={() => setSelectedCity('')} className="hover:text-blue-900">
                    <HiX className="w-4 h-4" />
                  </button>
                </span>
              )}
              <button 
                onClick={clearFilters}
                className="text-gray-500 hover:text-gray-700 text-sm"
              >
                Rensa alla
              </button>
            </div>
          )}

          {/* Sub-services filter */}
          {selectedCategory && currentCategorySubServices.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-100">
              <span className="text-xs text-gray-500 self-center mr-1">Filtrera:</span>
              {currentCategorySubServices.map((sub) => (
                <button
                  key={sub.id}
                  onClick={() => setSelectedSubService(selectedSubService === sub.id ? '' : sub.id)}
                  className={`px-3 py-1.5 rounded-full text-sm transition ${
                    selectedSubService === sub.id
                      ? 'bg-brand text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {sub.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {loading ? (
          <div className="grid grid-cols-1 gap-5">
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
        ) : (
          <>
            <div className="flex items-center justify-between mb-5">
              <p className="text-sm text-gray-600">
                <span className="font-medium text-gray-900">{companies.length}</span> företag
                {searchQuery && <span> för "{searchQuery}"</span>}
              </p>
            </div>

            {companies.length > 0 ? (
              <div className="grid grid-cols-1 gap-5">
                {companies.map((company) => (
                  <CompanyCard key={company.id} company={company} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
                <p className="text-gray-500 mb-4">Inga företag matchade din sökning.</p>
                <button
                  onClick={clearFilters}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Rensa filter och visa alla
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
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
      </div>
    }>
      <SearchContent />
    </Suspense>
  )
}

'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { HiSearch, HiLocationMarker } from 'react-icons/hi'
import { db } from '@/lib/firebase'
import { collection, query, limit, getDocs } from 'firebase/firestore'

interface Suggestion {
  type: 'category' | 'company' | 'city'
  text: string
  subtext?: string
  icon?: string
}

const categories = [
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
  'Stockholm', 'Göteborg', 'Malmö', 'Uppsala', 'Västerås',
  'Örebro', 'Linköping', 'Helsingborg', 'Jönköping', 'Norrköping'
]

interface EnhancedSearchBoxProps {
  variant?: 'hero' | 'compact'
  initialQuery?: string
  initialCity?: string
}

export default function EnhancedSearchBox({ 
  variant = 'hero',
  initialQuery = '',
  initialCity = ''
}: EnhancedSearchBoxProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState(initialQuery)
  const [selectedCity, setSelectedCity] = useState(initialCity)
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [companies, setCompanies] = useState<any[]>([])
  const searchRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Load companies for autocomplete
    if (db) {
      loadCompanies()
    }
  }, [])

  useEffect(() => {
    // Update suggestions when search query changes
    if (searchQuery.length > 0) {
      generateSuggestions()
      setShowSuggestions(true)
    } else {
      setSuggestions([])
      setShowSuggestions(false)
    }
  }, [searchQuery])

  useEffect(() => {
    // Click outside to close suggestions
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const loadCompanies = async () => {
    try {
      const q = query(collection(db!, 'companies'), limit(100))
      const snapshot = await getDocs(q)
      const companiesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setCompanies(companiesData)
    } catch (error) {
      console.error('Error loading companies:', error)
    }
  }

  const generateSuggestions = () => {
    const query = searchQuery.toLowerCase()
    const newSuggestions: Suggestion[] = []

    // Match categories
    categories.forEach(cat => {
      if (cat.name.toLowerCase().includes(query)) {
        newSuggestions.push({
          type: 'category',
          text: cat.name,
          icon: cat.emoji
        })
      }
    })

    // Match companies
    companies.forEach(company => {
      if (company.name.toLowerCase().includes(query)) {
        newSuggestions.push({
          type: 'company',
          text: company.name,
          subtext: `${company.categoryName} • ${company.city}`,
          icon: company.emoji || '🏢'
        })
      }
    })

    // Match cities
    cities.forEach(city => {
      if (city.toLowerCase().includes(query)) {
        newSuggestions.push({
          type: 'city',
          text: city,
          icon: '📍'
        })
      }
    })

    setSuggestions(newSuggestions.slice(0, 8))
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    
    const params = new URLSearchParams()
    if (searchQuery) params.set('q', searchQuery)
    if (selectedCity) params.set('stad', selectedCity)
    
    router.push(`/sok?${params.toString()}`)
    setShowSuggestions(false)
  }

  const handleSuggestionClick = (suggestion: Suggestion) => {
    if (suggestion.type === 'category') {
      const category = categories.find(c => c.name === suggestion.text)
      router.push(`/sok?kategori=${category?.id}`)
    } else if (suggestion.type === 'company') {
      const company = companies.find(c => c.name === suggestion.text)
      if (company) {
        router.push(`/foretag/${company.id}`)
      }
    } else if (suggestion.type === 'city') {
      setSelectedCity(suggestion.text.toLowerCase())
      setShowSuggestions(false)
    }
  }

  const isHero = variant === 'hero'

  return (
    <div ref={searchRef} className="relative">
      <form onSubmit={handleSearch} className={isHero ? "max-w-3xl mx-auto bg-white rounded-2xl shadow-2xl p-4 md:p-6" : "w-full"}>
        <div className={`flex ${isHero ? 'flex-col md:flex-row' : 'flex-row'} gap-4`}>
          {/* Search Input */}
          <div className="flex-1 relative">
            <HiSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Vad söker du? (t.ex. frisör, massage)"
              className={`w-full pl-12 pr-4 ${isHero ? 'py-3' : 'py-2'} border-2 border-gray-200 rounded-xl text-gray-800 focus:border-brand focus:outline-none`}
            />
          </div>

          {/* City Select */}
          <div className={`relative ${isHero ? 'md:w-48' : 'w-40'}`}>
            <HiLocationMarker className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select 
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className={`w-full pl-12 pr-4 ${isHero ? 'py-3' : 'py-2'} border-2 border-gray-200 rounded-xl text-gray-800 focus:border-brand focus:outline-none appearance-none bg-white`}
            >
              <option value="">Alla städer</option>
              {cities.map(city => (
                <option key={city} value={city.toLowerCase()}>{city}</option>
              ))}
            </select>
          </div>

          {/* Search Button */}
          <button 
            type="submit"
            className={`bg-brand hover:bg-brand-dark text-white ${isHero ? 'px-8 py-3' : 'px-6 py-2'} rounded-xl font-semibold transition flex items-center justify-center gap-2`}
          >
            <HiSearch className="w-5 h-5" />
            {isHero && 'Sök'}
          </button>
        </div>
      </form>

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-200 max-h-96 overflow-y-auto z-50">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => handleSuggestionClick(suggestion)}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 border-b border-gray-100 last:border-0"
            >
              <span className="text-2xl">{suggestion.icon}</span>
              <div className="flex-1">
                <div className="font-medium text-gray-900">{suggestion.text}</div>
                {suggestion.subtext && (
                  <div className="text-sm text-gray-500">{suggestion.subtext}</div>
                )}
              </div>
              <span className="text-xs text-gray-400 uppercase">
                {suggestion.type === 'category' ? 'Kategori' : 
                 suggestion.type === 'company' ? 'Företag' : 'Stad'}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

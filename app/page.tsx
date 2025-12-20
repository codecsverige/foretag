'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { HiSearch, HiLocationMarker, HiArrowRight } from 'react-icons/hi'
import CompanyCard from '@/components/company/CompanyCard'
import CategoryGrid from '@/components/search/CategoryGrid'
import { collection, query, orderBy, limit, where, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'

// الفئات
const categories = [
  { id: 'frisor', name: 'Frisör', emoji: '💇', count: 0 },
  { id: 'massage', name: 'Massage', emoji: '💆', count: 0 },
  { id: 'stadning', name: 'Städning', emoji: '🧹', count: 0 },
  { id: 'bil', name: 'Bil & Motor', emoji: '🚗', count: 0 },
  { id: 'halsa', name: 'Hälsa', emoji: '🏥', count: 0 },
  { id: 'restaurang', name: 'Restaurang', emoji: '🍽️', count: 0 },
  { id: 'fitness', name: 'Fitness', emoji: '💪', count: 0 },
  { id: 'utbildning', name: 'Utbildning', emoji: '📚', count: 0 },
]

interface Company {
  id: string
  name: string
  category: string
  categoryName: string
  emoji: string
  city: string
  rating?: number
  reviewCount?: number
  priceFrom: number
  premium?: boolean
  services?: Array<{ name: string; price: number; duration: number }>
}

export default function Home() {
  const [premiumCompanies, setPremiumCompanies] = useState<Company[]>([])
  const [latestCompanies, setLatestCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    // If no Firestore, try localStorage
    if (!db) {
      const loadFromLocalStorage = () => {
        try {
          const savedCompanies = JSON.parse(localStorage.getItem('companies') || '[]')
          const companiesData = savedCompanies.map((c: any) => ({
            ...c,
            priceFrom: c.services?.[0]?.price || 0,
          }))
          
          // Sort by premium and createdAt
          const premium = companiesData.filter((c: any) => c.premium).slice(0, 6)
          const latest = companiesData
            .sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0))
            .slice(0, 6)
          
          setPremiumCompanies(premium)
          setLatestCompanies(latest)
          setLoading(false)
        } catch (error) {
          console.error('Error loading from localStorage:', error)
          setPremiumCompanies([])
          setLatestCompanies([])
          setLoading(false)
        }
      }
      
      loadFromLocalStorage()
      
      // Listen for localStorage changes
      const handleStorageChange = () => {
        loadFromLocalStorage()
      }
      
      window.addEventListener('storage', handleStorageChange)
      return () => {
        window.removeEventListener('storage', handleStorageChange)
      }
    }
    
    // Real-time listener for premium companies
    const premiumQuery = query(
      collection(db, 'companies'),
      where('status', '==', 'active'),
      where('premium', '==', true),
      limit(6)
    )
    
    const unsubscribePremium = onSnapshot(
      premiumQuery,
      (snapshot) => {
        const companies = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          priceFrom: doc.data().services?.[0]?.price || 0,
        })) as Company[]
        setPremiumCompanies(companies)
      },
      (error) => {
        console.error('Error fetching premium companies:', error)
        setPremiumCompanies([])
      }
    )
    
    // Real-time listener for latest companies
    const latestQuery = query(
      collection(db, 'companies'),
      where('status', '==', 'active'),
      orderBy('createdAt', 'desc'),
      limit(6)
    )
    
    const unsubscribeLatest = onSnapshot(
      latestQuery,
      (snapshot) => {
        const companies = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          priceFrom: doc.data().services?.[0]?.price || 0,
        })) as Company[]
        setLatestCompanies(companies)
        setLoading(false)
      },
      (error) => {
        console.error('Error fetching latest companies:', error)
        setLatestCompanies([])
        setLoading(false)
      }
    )
    
    return () => {
      unsubscribePremium()
      unsubscribeLatest()
    }
  }, [])
  
  // Show placeholder if no companies yet
  const showPlaceholder = !loading && premiumCompanies.length === 0 && latestCompanies.length === 0

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Hitta lokala tjänster
            <span className="block text-blue-200 text-2xl md:text-3xl font-normal mt-2">
              nära dig
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-blue-100 mb-10 max-w-2xl mx-auto">
            Upptäck företag i din stad. Boka frisör, massage, städning och mer – enkelt och snabbt.
          </p>

          {/* Search Box */}
          <form action="/sok" method="GET" className="max-w-3xl mx-auto bg-white rounded-2xl shadow-2xl p-4 md:p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <HiSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  name="q"
                  placeholder="Vad söker du? (t.ex. frisör, massage)"
                  className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl text-gray-800 focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div className="relative md:w-48">
                <HiLocationMarker className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <select 
                  name="stad"
                  className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl text-gray-800 focus:border-blue-500 focus:outline-none appearance-none bg-white"
                >
                  <option value="">Alla städer</option>
                  <option value="stockholm">Stockholm</option>
                  <option value="goteborg">Göteborg</option>
                  <option value="malmo">Malmö</option>
                  <option value="uppsala">Uppsala</option>
                </select>
              </div>
              <button 
                type="submit"
                className="bg-brand hover:bg-brand-dark text-white px-8 py-3 rounded-xl font-semibold transition flex items-center justify-center gap-2"
              >
                <HiSearch className="w-5 h-5" />
                Sök
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Categories */}
      <section className="py-12 md:py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 text-center">
            📂 Populära kategorier
          </h2>
          <CategoryGrid categories={categories} />
        </div>
      </section>

      {/* Featured Companies or Placeholder */}
      {loading ? (
        <section className="py-12 md:py-16">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand mx-auto"></div>
            <p className="text-gray-600 mt-4">Laddar företag...</p>
          </div>
        </section>
      ) : showPlaceholder ? (
        <section className="py-12 md:py-16">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <div className="bg-blue-50 rounded-2xl p-8 md:p-12">
              <div className="text-6xl mb-4">🏢</div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                Var först med att lista ditt företag!
              </h2>
              <p className="text-gray-600 mb-6 max-w-xl mx-auto">
                Inga företag har registrerats ännu. Bli den första och nå tusentals potentiella kunder.
              </p>
              <Link
                href="/skapa"
                className="inline-flex items-center gap-2 bg-brand text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-brand-dark transition"
              >
                Skapa annons gratis
                <HiArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </section>
      ) : (
        <>
          {/* Premium Companies */}
          {premiumCompanies.length > 0 && (
            <section className="py-12 md:py-16">
              <div className="max-w-7xl mx-auto px-4">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                    ⭐ Utvalda företag
                  </h2>
                  <Link href="/sok?premium=true" className="text-brand hover:text-brand-dark flex items-center gap-1">
                    Visa alla <HiArrowRight />
                  </Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {premiumCompanies.map((company: any) => (
                    <CompanyCard key={company.id} company={company} />
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Latest Companies */}
          {latestCompanies.length > 0 && (
            <section className="py-12 md:py-16 bg-gray-50">
              <div className="max-w-7xl mx-auto px-4">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                    🆕 Nya företag
                  </h2>
                  <Link href="/sok?sort=newest" className="text-brand hover:text-brand-dark flex items-center gap-1">
                    Visa alla <HiArrowRight />
                  </Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {latestCompanies.map((company: any) => (
                    <CompanyCard key={company.id} company={company} />
                  ))}
                </div>
              </div>
            </section>
          )}
        </>
      )}

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            🏢 Har du ett företag?
          </h2>
          <p className="text-xl text-indigo-100 mb-8">
            Skapa din gratis annons och nå tusentals nya kunder. Få bokningar direkt och SMS-påminnelser för att minska no-shows.
          </p>
          <Link
            href="/skapa"
            className="inline-flex items-center gap-2 bg-white text-indigo-600 px-8 py-4 rounded-xl font-bold text-lg hover:bg-indigo-50 transition shadow-lg"
          >
            Skapa annons gratis
            <HiArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl md:text-4xl font-bold text-brand">Gratis</div>
              <div className="text-gray-600">Att lista företag</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-brand">SMS</div>
              <div className="text-gray-600">Påminnelser</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-brand">Enkelt</div>
              <div className="text-gray-600">Att boka</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-brand">Lokalt</div>
              <div className="text-gray-600">I din stad</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { HiArrowRight, HiClock } from 'react-icons/hi'
import { getCompanies } from '@/lib/companiesCache'
import CompanyCard from '@/components/company/CompanyCard'

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

// Get recently viewed companies from localStorage
function getRecentlyViewed(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const viewed = localStorage.getItem('recentlyViewedCompanies')
    return viewed ? JSON.parse(viewed) : []
  } catch {
    return []
  }
}

export default function CompanySection() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasRecentlyViewed, setHasRecentlyViewed] = useState(false)

  useEffect(() => {
    let mounted = true
    
    async function loadCompanies() {
      try {
        const data = await getCompanies()
        
        if (mounted) {
          const recentIds = getRecentlyViewed()
          setHasRecentlyViewed(recentIds.length > 0)
          
          let displayCompanies: Company[] = []
          
          if (recentIds.length > 0) {
            // Show recently viewed companies first
            const recentCompanies = recentIds
              .map(id => data.find(c => c.id === id))
              .filter((c): c is Company => c !== undefined)
              .slice(0, 6)
            displayCompanies = recentCompanies
          }
          
          // If no recently viewed or not enough, show newest companies
          if (displayCompanies.length < 4) {
            const otherCompanies = data
              .filter(c => !displayCompanies.find(d => d.id === c.id))
              .slice(0, 6 - displayCompanies.length)
            displayCompanies = [...displayCompanies, ...otherCompanies]
          }
          
          setCompanies(displayCompanies.slice(0, 6))
          setLoading(false)
        }
      } catch (err: any) {
        console.error('[CompanySection] Error:', err)
        if (mounted) {
          setError(err.message || 'Kunde inte ladda företag')
          setLoading(false)
        }
      }
    }

    loadCompanies()
    return () => { mounted = false }
  }, [])

  return (
    <section className="py-10 bg-gray-50">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            {hasRecentlyViewed && <HiClock className="w-5 h-5 text-gray-400" />}
            <h2 className="text-xl font-semibold text-gray-900">
              {hasRecentlyViewed ? 'Nyligen visade' : 'Senaste företag'}
            </h2>
          </div>
          <Link 
            href="/sok" 
            className="text-sm text-brand hover:text-brand-dark font-medium flex items-center gap-1"
          >
            Visa alla <HiArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {error ? (
          <div className="text-center py-12 bg-red-50 rounded-2xl border border-red-200">
            <p className="text-red-600 mb-2">Fel vid laddning av företag</p>
            <p className="text-red-500 text-sm">{error}</p>
          </div>
        ) : loading ? (
          <div className="flex flex-col gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="w-full">
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden animate-pulse flex flex-row">
                  <div className="w-48 sm:w-60 md:w-80 aspect-[4/3] bg-gray-100 flex-shrink-0" />
                  <div className="px-4 py-3 flex-1">
                    <div className="h-4 bg-gray-100 rounded w-1/3 mb-3"></div>
                    <div className="h-3 bg-gray-100 rounded w-1/2 mb-2"></div>
                    <div className="h-3 bg-gray-100 rounded w-1/4"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : companies.length > 0 ? (
          <div className="flex flex-col gap-4">
            {companies.map((company) => (
              <div key={company.id} className="w-full">
                <CompanyCard company={company} variant="row" />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-2xl border border-gray-200">
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
  )
}

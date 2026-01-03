'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { HiArrowRight } from 'react-icons/hi'
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

const allowedCategories = new Set(['stadning', 'flytt', 'hantverk', 'hem-fastighet', 'annat'])

export default function CompanySection() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    
    async function loadCompanies() {
      try {
        console.log('[CompanySection] Fetching companies...')
        const data = await getCompanies()
        console.log('[CompanySection] Raw data:', data.length, 'companies')
        
        if (mounted) {
          // Show all companies if no category filter matches, otherwise filter
          let filtered = data.filter((c) => allowedCategories.has(c.category || ''))
          
          // If no companies match the filter, show all companies
          if (filtered.length === 0 && data.length > 0) {
            console.log('[CompanySection] No category matches, showing all companies')
            filtered = data
          }
          
          const sorted = filtered
            .sort((a, b) => (b.premium ? 1 : 0) - (a.premium ? 1 : 0))
            .slice(0, 6)
          
          console.log('[CompanySection] Filtered:', sorted.length, 'companies')
          setCompanies(sorted)
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
          <h2 className="text-xl font-semibold text-gray-900">Utvalda företag</h2>
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
          <div className="grid grid-cols-1 gap-5">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-200 overflow-hidden animate-pulse">
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
          <div className="grid grid-cols-1 gap-5">
            {companies.map((company) => (
              <CompanyCard key={company.id} company={company} />
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

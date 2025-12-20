'use client'

import { useEffect, useState } from 'react'
import CompanyCard from './CompanyCard'

interface Company {
  id: string
  name: string
  category: string
  categoryName?: string
  emoji?: string
  city: string
  address?: string
  description?: string
  phone?: string
  email?: string
  website?: string
  services?: Array<{
    name: string
    price: number
    duration: number
    description?: string
  }>
  openingHours?: any
  rating?: number
  reviewCount?: number
  views?: number
  status?: string
  premium?: boolean
  priceFrom?: number
  createdAt?: any
  updatedAt?: any
}

interface CompanyListProps {
  initialPremiumCompanies: Company[]
  initialLatestCompanies: Company[]
}

export default function CompanyList({ 
  initialPremiumCompanies, 
  initialLatestCompanies 
}: CompanyListProps) {
  const [premiumCompanies, setPremiumCompanies] = useState(initialPremiumCompanies)
  const [latestCompanies, setLatestCompanies] = useState(initialLatestCompanies)

  useEffect(() => {
    // Merge localStorage data with server data for SKIP_AUTH mode
    try {
      const localCompanies = JSON.parse(localStorage.getItem('companies') || '[]') as Company[]
      
      if (localCompanies.length > 0) {
        console.log('📦 Found', localCompanies.length, 'companies in localStorage')
        
        // Process local companies
        const processedLocalCompanies = localCompanies.map(company => ({
          ...company,
          priceFrom: company.services?.[0]?.price || 0,
        }))

        // Merge with server data, avoiding duplicates
        const serverIds = new Set([
          ...initialPremiumCompanies.map(c => c.id),
          ...initialLatestCompanies.map(c => c.id)
        ])

        const uniqueLocalCompanies = processedLocalCompanies.filter(
          company => !serverIds.has(company.id)
        )

        // Add local companies to latest (not premium since they're free)
        if (uniqueLocalCompanies.length > 0) {
          console.log('✨ Adding', uniqueLocalCompanies.length, 'unique local companies to display')
          
          // Sort by createdAt (most recent first)
          const sortedLocal = [...uniqueLocalCompanies].sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0
            return dateB - dateA
          })

          setLatestCompanies([
            ...sortedLocal,
            ...initialLatestCompanies,
          ].slice(0, 6)) // Keep only 6 latest
        }
      }
    } catch (error) {
      console.error('Error reading from localStorage:', error)
    }
  }, [initialPremiumCompanies, initialLatestCompanies])

  const showPlaceholder = premiumCompanies.length === 0 && latestCompanies.length === 0

  if (showPlaceholder) {
    return null // Parent will show placeholder
  }

  return (
    <>
      {/* Premium Companies */}
      {premiumCompanies.length > 0 && (
        <section className="py-12 md:py-16">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                ⭐ Utvalda företag
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {premiumCompanies.map((company) => (
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
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {latestCompanies.map((company) => (
                <CompanyCard key={company.id} company={company} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  )
}

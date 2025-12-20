'use client'

import { useEffect, useState } from 'react'
import { collection, query, orderBy, limit, where, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import CompanyCard from './CompanyCard'

interface Company {
  id: string
  name: string
  category?: string
  categoryName?: string
  emoji?: string
  city?: string
  rating?: number
  reviewCount?: number
  image?: string
  priceFrom?: number
  premium?: boolean
  services?: Array<{ price?: number }>
  status?: string
  createdAt?: Date | string | number
}

interface CompanyListProps {
  initialPremiumCompanies: Company[]
  initialLatestCompanies: Company[]
}

export default function CompanyList({ 
  initialPremiumCompanies, 
  initialLatestCompanies 
}: CompanyListProps) {
  const [premiumCompanies, setPremiumCompanies] = useState<Company[]>(initialPremiumCompanies)
  const [latestCompanies, setLatestCompanies] = useState<Company[]>(initialLatestCompanies)

  // Load from localStorage on initial mount if no initial data
  useEffect(() => {
    if (initialLatestCompanies.length === 0 && initialPremiumCompanies.length === 0) {
      const savedCompanies = localStorage.getItem('companies')
      if (savedCompanies) {
        try {
          const companies = JSON.parse(savedCompanies)
          // Sort by createdAt (most recent first)
          const sortedCompanies = companies.sort((a: Company, b: Company) => {
            const dateA = typeof a.createdAt === 'string' ? new Date(a.createdAt).getTime() : (a.createdAt as number) || 0
            const dateB = typeof b.createdAt === 'string' ? new Date(b.createdAt).getTime() : (b.createdAt as number) || 0
            return dateB - dateA
          })
          setLatestCompanies(sortedCompanies.slice(0, 6))
        } catch (e) {
          console.error('Error loading from localStorage:', e)
        }
      }
    }
  }, [initialLatestCompanies.length, initialPremiumCompanies.length])

  useEffect(() => {
    // Only set up listeners on client-side if db is available
    if (!db) {
      return
    }

    // Set up real-time listener for premium companies
    const premiumQuery = query(
      collection(db, 'companies'),
      where('status', '==', 'active'),
      where('premium', '==', true),
      limit(6)
    )

    // Set up real-time listener for latest companies
    const latestQuery = query(
      collection(db, 'companies'),
      where('status', '==', 'active'),
      orderBy('createdAt', 'desc'),
      limit(6)
    )

    const unsubscribePremium = onSnapshot(premiumQuery, (snapshot) => {
      const companies = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        priceFrom: doc.data().services?.[0]?.price || 0,
      })) as Company[]
      setPremiumCompanies(companies)
    }, (error) => {
      console.error('Error in premium companies listener:', error)
    })

    const unsubscribeLatest = onSnapshot(latestQuery, (snapshot) => {
      const companies = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        priceFrom: doc.data().services?.[0]?.price || 0,
      })) as Company[]
      setLatestCompanies(companies)
    }, (error) => {
      console.error('Error in latest companies listener:', error)
    })

    // Cleanup listeners on unmount
    return () => {
      unsubscribePremium()
      unsubscribeLatest()
    }
  }, [])

  const showPlaceholder = premiumCompanies.length === 0 && latestCompanies.length === 0

  return (
    <>
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

      {latestCompanies.length > 0 && (
        <section className={`py-12 md:py-16 ${premiumCompanies.length > 0 ? 'bg-gray-50' : ''}`}>
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

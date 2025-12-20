'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { HiArrowRight } from 'react-icons/hi'
import CompanyCard from '@/components/company/CompanyCard'
import { db } from '@/lib/firebase'
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore'

interface Company {
  id: string
  name: string
  category?: string
  categoryName?: string
  emoji?: string
  city?: string
  rating?: number
  reviewCount?: number
  priceFrom?: number
  premium?: boolean
  services?: Array<{ price?: number }>
  createdAt?: any
  status?: string
}

export default function CompaniesDisplay() {
  const [premiumCompanies, setPremiumCompanies] = useState<Company[]>([])
  const [latestCompanies, setLatestCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!db) {
      setError('Firebase er ikke konfigureret korrekt')
      setLoading(false)
      return
    }

    try {
      // Subscribe to premium companies
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
          } as Company))
          setPremiumCompanies(companies)
          setError(null)
        },
        (err) => {
          console.error('Error fetching premium companies:', err)
          setError('Kunde inte hämta premium-företag')
        }
      )

      // Subscribe to latest companies
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
          } as Company))
          setLatestCompanies(companies)
          setLoading(false)
          setError(null)
        },
        (err) => {
          console.error('Error fetching latest companies:', err)
          setError('Kunde inte hämta senaste företag')
          setLoading(false)
        }
      )

      // Cleanup subscriptions
      return () => {
        unsubscribePremium()
        unsubscribeLatest()
      }
    } catch (err: unknown) {
      console.error('Error setting up Firestore listeners:', err)
      setError('Kunde inte ansluta till databasen')
      setLoading(false)
    }
  }, [])

  // Loading state
  if (loading) {
    return (
      <section className="py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="text-6xl mb-4 animate-pulse">⏳</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Laddar företag...
          </h2>
          <p className="text-gray-600">Vänligen vänta medan vi hämtar de senaste annonserna.</p>
        </div>
      </section>
    )
  }

  // Error state
  if (error) {
    return (
      <section className="py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="bg-red-50 rounded-2xl p-8 md:p-12">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              Något gick fel
            </h2>
            <p className="text-red-600 mb-6">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 bg-brand text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-brand-dark transition"
            >
              Försök igen
            </button>
          </div>
        </div>
      </section>
    )
  }

  // Empty state
  const showPlaceholder = premiumCompanies.length === 0 && latestCompanies.length === 0

  if (showPlaceholder) {
    return (
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
    )
  }

  // Companies display
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
              <Link href="/sok?premium=true" className="text-brand hover:text-brand-dark flex items-center gap-1">
                Visa alla <HiArrowRight />
              </Link>
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
              <Link href="/sok?sort=newest" className="text-brand hover:text-brand-dark flex items-center gap-1">
                Visa alla <HiArrowRight />
              </Link>
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

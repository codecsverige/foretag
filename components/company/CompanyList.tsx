'use client'

import { useState, useEffect } from 'react'
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import CompanyCard from './CompanyCard'
import Link from 'next/link'
import { HiArrowRight } from 'react-icons/hi'

interface Company {
  id: string
  name: string
  category: string
  categoryName: string
  emoji: string
  city: string
  address?: string
  phone?: string
  description?: string
  services?: Array<{ name: string; price: number; duration: number }>
  rating?: number
  reviewCount?: number
  premium?: boolean
  priceFrom: number
}

export default function CompanyList() {
  const [premiumCompanies, setPremiumCompanies] = useState<Company[]>([])
  const [latestCompanies, setLatestCompanies] = useState<Company[]>([])
  const [error, setError] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!db) {
      setError('Firebase är inte konfigurerad. Kontrollera dina miljövariabler.')
      setLoading(false)
      return
    }

    // Set up real-time listener for premium companies
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
        console.log('✅ Premium companies updated:', companies.length)
      },
      (error) => {
        console.error('❌ Error loading premium companies:', error)
        setError('Kunde inte ladda premium-företag. Försök igen senare.')
      }
    )

    // Set up real-time listener for latest companies
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
        console.log('✅ Latest companies updated:', companies.length)
      },
      (error) => {
        console.error('❌ Error loading latest companies:', error)
        setError('Kunde inte ladda nya företag. Försök igen senare.')
        setLoading(false)
      }
    )

    // Cleanup subscriptions on unmount
    return () => {
      unsubscribePremium()
      unsubscribeLatest()
    }
  }, [])

  if (loading) {
    return (
      <div className="py-12 md:py-16 text-center">
        <div className="max-w-7xl mx-auto px-4">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-48 mx-auto mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-gray-100 rounded-2xl h-64"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="bg-red-50 border border-red-200 rounded-2xl p-8">
            <div className="text-4xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold text-red-900 mb-2">Ett fel uppstod</h2>
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      </div>
    )
  }

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

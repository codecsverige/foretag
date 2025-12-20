'use client'

import { useState, useEffect } from 'react'
import { collection, query, where, orderBy, limit, onSnapshot, QuerySnapshot, DocumentData } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Company } from '@/lib/types'
import CompanyCard from './CompanyCard'

interface CompanyListProps {
  type: 'premium' | 'latest'
  maxItems?: number
}

export default function CompanyList({ type, maxItems = 6 }: CompanyListProps) {
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!db) {
      setError('Firebase not initialized')
      setLoading(false)
      return
    }

    try {
      // Build query based on type
      let q
      if (type === 'premium') {
        q = query(
          collection(db, 'companies'),
          where('status', '==', 'active'),
          where('premium', '==', true),
          limit(maxItems)
        )
      } else {
        q = query(
          collection(db, 'companies'),
          where('status', '==', 'active'),
          orderBy('createdAt', 'desc'),
          limit(maxItems)
        )
      }

      // Real-time listener with onSnapshot
      const unsubscribe = onSnapshot(
        q,
        (snapshot: QuerySnapshot<DocumentData>) => {
          const fetchedCompanies = snapshot.docs.map(doc => {
            const data = doc.data()
            return {
              id: doc.id,
              ...data,
              priceFrom: data.services?.[0]?.price || 0,
            } as Company
          })
          
          setCompanies(fetchedCompanies)
          setLoading(false)
          setError(null)
          console.log(`✅ Real-time update: ${fetchedCompanies.length} ${type} companies loaded`)
        },
        (err) => {
          console.error(`❌ Error fetching ${type} companies:`, err)
          setError(`Could not load ${type} companies`)
          setLoading(false)
        }
      )

      // Cleanup listener on unmount
      return () => {
        console.log(`🧹 Cleaning up ${type} companies listener`)
        unsubscribe()
      }
    } catch (err) {
      console.error('Error setting up listener:', err)
      setError('Failed to initialize data listener')
      setLoading(false)
    }
  }, [type, maxItems])

  // Loading state
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden h-80 animate-pulse">
            <div className="h-48 bg-gray-200" />
            <div className="p-4 space-y-3">
              <div className="h-4 bg-gray-200 rounded w-20" />
              <div className="h-6 bg-gray-200 rounded w-3/4" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <div className="text-red-600 mb-2">⚠️ {error}</div>
        <p className="text-sm text-red-500">Please try again later or contact support if the issue persists.</p>
      </div>
    )
  }

  // Empty state
  if (companies.length === 0) {
    return (
      <div className="bg-gray-50 rounded-xl p-8 text-center">
        <div className="text-4xl mb-3">🏢</div>
        <p className="text-gray-600">
          {type === 'premium' ? 'No premium companies yet' : 'No companies listed yet'}
        </p>
      </div>
    )
  }

  // Display companies
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {companies.map((company) => (
        <CompanyCard key={company.id} company={company} />
      ))}
    </div>
  )
}

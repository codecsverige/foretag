'use client'

import { db } from '@/lib/firebase'
import { collection, getDocs, query, where, orderBy, limit, doc, getDoc } from 'firebase/firestore'

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
  discountPercent?: number
  discountText?: string
  discount?: {
    enabled?: boolean
    label?: string
    type?: 'percent' | 'amount'
    value?: number
    appliesTo?: 'all' | 'services'
    serviceNames?: string[]
    startDate?: string
    endDate?: string
    showBadge?: boolean
  }
  premium?: boolean
  services?: Array<{ price?: number; name?: string; duration?: number }>
  description?: string
  phone?: string
  email?: string
  website?: string
  address?: string
  images?: string[]
  openingHours?: Record<string, { open: string; close: string; closed: boolean }>
  verified?: boolean
  status?: string
  createdAt?: any
}

// Simple in-memory cache
let companiesCache: Company[] = []
let lastFetchTime = 0
const CACHE_DURATION = 300000 // 5 minutes (increased from 1 minute)

// Single company cache
const singleCompanyCache: Map<string, { data: Company; time: number }> = new Map()

// Prefetch flag to prevent duplicate simultaneous requests
let isFetching = false
let fetchPromise: Promise<Company[]> | null = null

export async function getCompanies(forceRefresh = false): Promise<Company[]> {
  const now = Date.now()
  
  // Return cached data if still valid
  if (!forceRefresh && companiesCache.length > 0 && (now - lastFetchTime) < CACHE_DURATION) {
    return companiesCache
  }
  
  // If already fetching, return the existing promise
  if (isFetching && fetchPromise) {
    return fetchPromise
  }
  
  if (!db) {
    return []
  }

  // Set fetching flag and create fetch promise
  isFetching = true
  fetchPromise = (async () => {
    try {
      const companiesQuery = query(
        collection(db, 'companies'),
        where('status', '==', 'active'),
        orderBy('createdAt', 'desc'),
        limit(50)
      )
      
      const snapshot = await getDocs(companiesQuery)
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        priceFrom: (() => {
          const services = doc.data().services || []
          const min = services.reduce((acc: number, s: any) => {
            const p = Number(s?.price || 0)
            if (!Number.isFinite(p) || p <= 0) return acc
            return p < acc ? p : acc
          }, Number.POSITIVE_INFINITY)
          return min === Number.POSITIVE_INFINITY ? 0 : min
        })(),
      })) as Company[]
      
      // Update cache
      companiesCache = data
      lastFetchTime = now
      
      // Also cache individual companies
      data.forEach(company => {
        singleCompanyCache.set(company.id, { data: company, time: now })
      })
      
      return data
    } catch (error) {
      console.error('Error fetching companies:', error)
      return companiesCache // Return stale cache on error
    } finally {
      isFetching = false
      fetchPromise = null
    }
  })()
  
  return fetchPromise
}

export async function getCompanyById(id: string): Promise<Company | null> {
  const now = Date.now()
  
  // Check cache first
  const cached = singleCompanyCache.get(id)
  if (cached && (now - cached.time) < CACHE_DURATION) {
    return cached.data
  }
  
  if (!db) {
    return null
  }

  try {
    const docRef = doc(db, 'companies', id)
    const docSnap = await getDoc(docRef)

    if (!docSnap.exists()) {
      return null
    }

    const data = { id: docSnap.id, ...docSnap.data() } as Company
    
    // Update cache
    singleCompanyCache.set(id, { data, time: now })
    
    return data
  } catch (error) {
    console.error('Error fetching company:', error)
    return cached?.data || null
  }
}

export function clearCache() {
  companiesCache = []
  lastFetchTime = 0
  singleCompanyCache.clear()
}

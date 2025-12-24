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
const CACHE_DURATION = 60000 // 1 minute

// Single company cache
const singleCompanyCache: Map<string, { data: Company; time: number }> = new Map()

export async function getCompanies(forceRefresh = false): Promise<Company[]> {
  const now = Date.now()
  
  // Return cached data if still valid
  if (!forceRefresh && companiesCache.length > 0 && (now - lastFetchTime) < CACHE_DURATION) {
    return companiesCache
  }
  
  if (!db) {
    return []
  }

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
      priceFrom: doc.data().services?.[0]?.price || 0,
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
  }
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

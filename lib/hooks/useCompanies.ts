'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { db } from '@/lib/firebase'
import { 
  collection, 
  getDocs, 
  getDoc, 
  doc, 
  query, 
  where, 
  orderBy, 
  limit,
  updateDoc,
  DocumentData 
} from 'firebase/firestore'

interface Company {
  id: string
  name: string
  category?: string
  categoryName?: string
  city?: string
  rating?: number
  reviewCount?: number
  status?: 'active' | 'draft' | 'archived'
  published?: boolean
  settings?: {
    showAbout?: boolean
    showReviews?: boolean
    showMap?: boolean
    showContact?: boolean
  }
  [key: string]: any
}

// Fetch all active companies
export function useCompanies(options?: { limit?: number; category?: string; city?: string }) {
  return useQuery({
    queryKey: ['companies', options],
    queryFn: async () => {
      if (!db) throw new Error('Database not initialized')

      let q = query(
        collection(db, 'companies'),
        where('status', '==', 'active'),
        orderBy('createdAt', 'desc')
      )

      if (options?.category) {
        q = query(q, where('category', '==', options.category))
      }
      if (options?.city) {
        q = query(q, where('city', '==', options.city))
      }
      if (options?.limit) {
        q = query(q, limit(options.limit))
      }

      const snapshot = await getDocs(q)
      return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Company))
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Fetch single company by ID
export function useCompany(id: string) {
  return useQuery({
    queryKey: ['company', id],
    queryFn: async () => {
      if (!db) throw new Error('Database not initialized')
      
      const docRef = doc(db, 'companies', id)
      const docSnap = await getDoc(docRef)
      
      if (!docSnap.exists()) return null
      
      return { ...docSnap.data(), id: docSnap.id } as Company
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  })
}

// Update company mutation
export function useUpdateCompany() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Company> }) => {
      if (!db) throw new Error('Database not initialized')
      
      const docRef = doc(db, 'companies', id)
      await updateDoc(docRef, { ...data, updatedAt: new Date() })
      
      return { id, data }
    },
    onSuccess: (result) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['company', result.id] })
      queryClient.invalidateQueries({ queryKey: ['companies'] })
    },
  })
}

// Fetch reviews for a company
export function useCompanyReviews(companyId: string) {
  return useQuery({
    queryKey: ['reviews', companyId],
    queryFn: async () => {
      if (!db) throw new Error('Database not initialized')
      
      const reviewsQuery = query(
        collection(db, 'reviews'),
        where('companyId', '==', companyId),
        orderBy('createdAt', 'desc')
      )
      
      const snapshot = await getDocs(reviewsQuery)
      return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }))
    },
    enabled: !!companyId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

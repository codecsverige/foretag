/**
 * TypeScript types for the Ads system
 */

export interface AdService {
  name: string
  price: number
  duration: number
  description: string
}

export interface Ad {
  id: string
  companyName: string
  category: string
  categoryName: string
  emoji: string
  city: string
  address?: string
  description: string
  phone: string
  email?: string
  website?: string
  services: AdService[]
  images?: string[] // URLs from Firebase Storage
  status: 'published' | 'under_review' | 'archived'
  ownerId?: string
  ownerName?: string
  ownerEmail?: string
  createdAt: any // Firestore Timestamp
  updatedAt: any // Firestore Timestamp
}

// Shared type definitions for the application

export interface Company {
  id: string
  name: string
  category?: string
  categoryName?: string
  emoji?: string
  city?: string
  address?: string
  description?: string
  phone?: string
  email?: string
  website?: string
  rating?: number
  reviewCount?: number
  views?: number
  image?: string
  priceFrom?: number
  premium?: boolean
  status?: 'pending' | 'active' | 'inactive'
  services?: Service[]
  openingHours?: OpeningHours
  ownerId?: string
  ownerName?: string
  ownerEmail?: string
  createdAt?: any
  updatedAt?: any
}

export interface Service {
  name: string
  price: number
  duration: number
  description: string
}

export interface OpeningHours {
  [key: string]: {
    open: string
    close: string
    closed: boolean
  }
}

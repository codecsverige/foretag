// Subscription System Configuration and Utilities

export type PlanType = 'free' | 'pro' | 'premium'

export interface PlanLimits {
  freeBookings: number
  freeEdits: number
  freeDeletes: number
  showFullPhone: boolean
  canUseDiscounts: boolean
  searchPriority: number
}

export interface Plan {
  id: PlanType
  name: string
  price: number
  period: string
  features: string[]
  limits: PlanLimits
  popular: boolean
}

export interface UserSubscription {
  plan: PlanType
  freeBookingsUsed: number
  freeEditsUsed: number
  freeDeletesUsed: number
  subscriptionStart?: Date
  subscriptionEnd?: Date
}

// Plan configurations
export const PLANS: Plan[] = [
  { 
    id: 'free', 
    name: 'Gratis', 
    price: 0, 
    period: '', 
    features: [
      'Upp till 3 annonser',
      'Första 3 bokningar gratis',
      'Telefonnummer delvis dolt',
      '1 redigering ingår',
      'Grundläggande statistik'
    ],
    limits: {
      freeBookings: 3,
      freeEdits: 1,
      freeDeletes: 1,
      showFullPhone: false,
      canUseDiscounts: false,
      searchPriority: 0
    },
    popular: false 
  },
  { 
    id: 'pro', 
    name: 'Pro', 
    price: 199, 
    period: '/mån', 
    features: [
      'Upp till 3 annonser',
      'Obegränsade bokningar',
      'Telefonnummer visas helt',
      'Obegränsade redigeringar',
      'Avancerad statistik',
      'Pro-märke ⭐'
    ],
    limits: {
      freeBookings: Infinity,
      freeEdits: Infinity,
      freeDeletes: Infinity,
      showFullPhone: true,
      canUseDiscounts: false,
      searchPriority: 1
    },
    popular: true 
  },
  { 
    id: 'premium', 
    name: 'Premium', 
    price: 399, 
    period: '/mån', 
    features: [
      'Upp till 3 annonser',
      'Obegränsade bokningar',
      'Telefonnummer visas helt',
      'Obegränsade redigeringar',
      'Full statistik & rapporter',
      'Kampanjer & rabatter',
      'Prioriterad i sökresultat',
      'Premium-märke 💎'
    ],
    limits: {
      freeBookings: Infinity,
      freeEdits: Infinity,
      freeDeletes: Infinity,
      showFullPhone: true,
      canUseDiscounts: true,
      searchPriority: 2
    },
    popular: false 
  }
]

// Global limits
export const SUBSCRIPTION_LIMITS = {
  maxAdsPerAccount: 3,
  freeBookingsLimit: 3,
  freeEditsLimit: 1,
  freeDeletesLimit: 1
}

// Utility functions
export function getPlan(planId: PlanType): Plan {
  return PLANS.find(p => p.id === planId) || PLANS[0]
}

export function canViewBooking(subscription: UserSubscription, bookingIndex: number): boolean {
  const plan = getPlan(subscription.plan)
  if (plan.limits.freeBookings === Infinity) return true
  return bookingIndex < plan.limits.freeBookings
}

export function canEditAd(subscription: UserSubscription): boolean {
  const plan = getPlan(subscription.plan)
  if (plan.limits.freeEdits === Infinity) return true
  return subscription.freeEditsUsed < plan.limits.freeEdits
}

export function canDeleteAd(subscription: UserSubscription): boolean {
  const plan = getPlan(subscription.plan)
  if (plan.limits.freeDeletes === Infinity) return true
  return subscription.freeDeletesUsed < plan.limits.freeDeletes
}

export function canUseDiscounts(subscription: UserSubscription): boolean {
  const plan = getPlan(subscription.plan)
  return plan.limits.canUseDiscounts
}

export function shouldShowFullPhone(subscription: UserSubscription): boolean {
  const plan = getPlan(subscription.plan)
  return plan.limits.showFullPhone
}

export function getSearchPriority(subscription: UserSubscription): number {
  const plan = getPlan(subscription.plan)
  return plan.limits.searchPriority
}

// Format phone number (hide middle digits for free users)
export function formatPhoneNumber(phone: string, showFull: boolean): string {
  if (!phone) return ''
  if (showFull) return phone
  
  // Hide middle digits: 070 123 45 67 -> 07X XXX XX 67
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length < 6) return phone
  
  const start = cleaned.slice(0, 2)
  const end = cleaned.slice(-2)
  const middleLength = cleaned.length - 4
  const hidden = 'X'.repeat(middleLength)
  
  // Format with spaces
  if (cleaned.length === 10) {
    return `${start}X ${hidden.slice(0, 3)} XX ${end}`
  }
  
  return `${start}${'X'.repeat(middleLength)}${end}`
}

// Get remaining free bookings
export function getRemainingFreeBookings(subscription: UserSubscription): number {
  const plan = getPlan(subscription.plan)
  if (plan.limits.freeBookings === Infinity) return Infinity
  return Math.max(0, plan.limits.freeBookings - subscription.freeBookingsUsed)
}

// Check if subscription is active
export function isSubscriptionActive(subscription: UserSubscription): boolean {
  if (subscription.plan === 'free') return true
  if (!subscription.subscriptionEnd) return false
  return new Date(subscription.subscriptionEnd) > new Date()
}

// Get plan badge
export function getPlanBadge(planId: PlanType): { text: string; className: string } | null {
  switch (planId) {
    case 'pro':
      return { text: 'Pro ⭐', className: 'bg-brand/10 text-brand' }
    case 'premium':
      return { text: 'Premium 💎', className: 'bg-purple-100 text-purple-700' }
    default:
      return null
  }
}

// Default subscription for new users
export function getDefaultSubscription(): UserSubscription {
  return {
    plan: 'free',
    freeBookingsUsed: 0,
    freeEditsUsed: 0,
    freeDeletesUsed: 0
  }
}

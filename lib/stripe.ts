import Stripe from 'stripe'

// Initialize Stripe with secret key
let stripeClient: Stripe | null = null

export function getStripe() {
  if (stripeClient) return stripeClient

  const secretKey = process.env.STRIPE_SECRET_KEY

  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY is not set')
  }

  stripeClient = new Stripe(secretKey, {
    apiVersion: '2025-12-15.clover',
  })

  return stripeClient
}

// Price IDs from Stripe Dashboard
export const STRIPE_PRICES = {
  pro: process.env.STRIPE_PRO_PRICE_ID!,
  premium: process.env.STRIPE_PREMIUM_PRICE_ID!,
}

// Plan configurations with Stripe price IDs
export const STRIPE_PLANS = {
  pro: {
    name: 'Pro',
    price: 199,
    priceId: STRIPE_PRICES.pro,
    features: [
      'Upp till 3 annonser',
      'Obegränsade bokningar',
      'Telefonnummer visas helt',
      'Obegränsade redigeringar',
      'Avancerad statistik',
      'Pro-märke ⭐'
    ]
  },
  premium: {
    name: 'Premium',
    price: 399,
    priceId: STRIPE_PRICES.premium,
    features: [
      'Upp till 3 annonser',
      'Obegränsade bokningar',
      'Telefonnummer visas helt',
      'Obegränsade redigeringar',
      'Full statistik & rapporter',
      'Kampanjer & rabatter',
      'Prioriterad i sökresultat',
      'Premium-märke 💎'
    ]
  }
}

// Helper to get base URL
export function getBaseUrl() {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }
  return 'http://localhost:3000'
}

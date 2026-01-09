import { NextRequest, NextResponse } from 'next/server'
import { getStripe, STRIPE_PRICES } from '@/lib/stripe'

export async function POST(request: NextRequest) {
  try {
    const { userId, userEmail, planId } = await request.json()

    if (!userId || !userEmail || !planId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get the price ID for the selected plan (uses fallback values from lib/stripe.ts)
    const priceId = planId === 'pro' ? STRIPE_PRICES.pro : STRIPE_PRICES.premium

    // Get base URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')

    const stripe = getStripe()

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer_email: userEmail,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/konto/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/konto?tab=subscription`,
      metadata: {
        userId,
        planId,
      },
      subscription_data: {
        metadata: {
          userId,
          planId,
        },
      },
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      locale: 'sv',
    })

    return NextResponse.json({ url: session.url })
  } catch (error: any) {
    console.error('Stripe checkout error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}

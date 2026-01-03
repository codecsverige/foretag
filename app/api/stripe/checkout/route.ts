import { NextRequest, NextResponse } from 'next/server'
import { stripe, STRIPE_PRICES, getBaseUrl } from '@/lib/stripe'
import { adminDb } from '@/lib/firebase-admin'

export async function POST(request: NextRequest) {
  try {
    const { userId, userEmail, planId } = await request.json()

    if (!userId || !userEmail || !planId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get the price ID for the selected plan
    const priceId = planId === 'pro' ? STRIPE_PRICES.pro : STRIPE_PRICES.premium

    if (!priceId) {
      return NextResponse.json(
        { error: 'Invalid plan selected' },
        { status: 400 }
      )
    }

    const baseUrl = getBaseUrl()

    // Check if user already has a Stripe customer ID
    let customerId: string | undefined

    if (adminDb) {
      const userDoc = await adminDb.collection('users').doc(userId).get()
      const userData = userDoc.data()
      customerId = userData?.stripeCustomerId
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : userEmail,
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

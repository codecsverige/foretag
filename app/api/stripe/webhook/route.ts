import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { adminDb } from '@/lib/firebase-admin'
import Stripe from 'stripe'

// Disable body parsing for webhooks
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (error: any) {
    console.error('Webhook signature verification failed:', error.message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        await handleCheckoutCompleted(session)
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionUpdated(subscription)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionDeleted(subscription)
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        await handlePaymentSucceeded(invoice)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        await handlePaymentFailed(invoice)
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook processing error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  if (!adminDb) {
    console.error('Firebase Admin not initialized')
    return
  }

  const userId = session.metadata?.userId
  const planId = session.metadata?.planId

  if (!userId || !planId) {
    console.error('Missing metadata in checkout session')
    return
  }

  // Get subscription details
  const subscription = await stripe.subscriptions.retrieve(session.subscription as string)

  // Update user document
  await adminDb.collection('users').doc(userId).set({
    plan: planId,
    stripeCustomerId: session.customer as string,
    stripeSubscriptionId: subscription.id,
    subscriptionStatus: subscription.status,
    subscriptionStart: new Date(subscription.current_period_start * 1000),
    subscriptionEnd: new Date(subscription.current_period_end * 1000),
    updatedAt: new Date(),
  }, { merge: true })

  console.log(`User ${userId} upgraded to ${planId}`)
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  if (!adminDb) return

  const userId = subscription.metadata?.userId

  if (!userId) {
    // Try to find user by customer ID
    const usersSnapshot = await adminDb
      .collection('users')
      .where('stripeCustomerId', '==', subscription.customer)
      .limit(1)
      .get()

    if (usersSnapshot.empty) {
      console.error('User not found for subscription update')
      return
    }

    const userDoc = usersSnapshot.docs[0]
    await updateUserSubscription(userDoc.id, subscription)
  } else {
    await updateUserSubscription(userId, subscription)
  }
}

async function updateUserSubscription(userId: string, subscription: Stripe.Subscription) {
  if (!adminDb) return

  const planId = subscription.metadata?.planId || 
    (subscription.items.data[0]?.price.id === process.env.STRIPE_PRO_PRICE_ID ? 'pro' : 'premium')

  await adminDb.collection('users').doc(userId).set({
    plan: subscription.status === 'active' ? planId : 'free',
    subscriptionStatus: subscription.status,
    subscriptionEnd: new Date(subscription.current_period_end * 1000),
    updatedAt: new Date(),
  }, { merge: true })
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  if (!adminDb) return

  const userId = subscription.metadata?.userId

  if (!userId) {
    const usersSnapshot = await adminDb
      .collection('users')
      .where('stripeSubscriptionId', '==', subscription.id)
      .limit(1)
      .get()

    if (!usersSnapshot.empty) {
      const userDoc = usersSnapshot.docs[0]
      await downgradeUser(userDoc.id)
    }
  } else {
    await downgradeUser(userId)
  }
}

async function downgradeUser(userId: string) {
  if (!adminDb) return

  await adminDb.collection('users').doc(userId).set({
    plan: 'free',
    subscriptionStatus: 'canceled',
    updatedAt: new Date(),
  }, { merge: true })

  console.log(`User ${userId} downgraded to free`)
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log(`Payment succeeded for invoice ${invoice.id}`)
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  console.log(`Payment failed for invoice ${invoice.id}`)
  // You could send an email notification here
}

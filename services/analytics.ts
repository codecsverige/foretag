/**
 * Google Analytics 4 - BokaNära
 * Spårar användarhändelser och konverteringar
 */

// Check if we're in browser environment
const isBrowser = typeof window !== 'undefined'

// Dynamically import react-ga4 only on client side
let ReactGA: any = null

// Initialize GA4
let isInitialized = false

export const initGA = async () => {
  if (!isBrowser) return
  
  const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID
  
  if (measurementId && !isInitialized) {
    try {
      // Dynamic import for client-side only
      const GA = await import('react-ga4')
      ReactGA = GA.default
      
      ReactGA.initialize(measurementId, {
        gaOptions: {
          anonymizeIp: true, // GDPR-kompatibel
        },
      })
      isInitialized = true
      console.log('✅ Google Analytics initialiserad')
    } catch (error: any) {
      console.warn('❌ GA-initialisering misslyckades:', error.message)
    }
  }
}

// Spåra sidvisningar
export const trackPageView = (path: string, title?: string) => {
  if (!isInitialized || !ReactGA) return
  
  try {
    ReactGA.send({ 
      hitType: 'pageview', 
      page: path,
      title: title 
    })
  } catch (error: any) {
    console.warn('GA sidvisningsfel:', error.message)
  }
}

// Spåra anpassade händelser
export const trackEvent = (
  category: string, 
  action: string, 
  label?: string, 
  value?: number
) => {
  if (!isInitialized || !ReactGA) return
  
  try {
    ReactGA.event({
      category,
      action,
      label,
      value,
    })
  } catch (error: any) {
    console.warn('GA händelsefel:', error.message)
  }
}

// Sätt användaregenskaper
export const setUserProperties = (properties: Record<string, any>) => {
  if (!isInitialized || !ReactGA) return
  
  try {
    ReactGA.gtag('set', 'user_properties', properties)
  } catch (error: any) {
    console.warn('GA användaregenskaper fel:', error.message)
  }
}

// === Affärshändelser för BokaNära ===

// Användarhändelser
export const trackSignUp = (method = 'google') => {
  trackEvent('User', 'Sign Up', method)
  setUserProperties({
    user_type: 'new_user',
    signup_method: method,
    signup_date: new Date().toISOString().split('T')[0]
  })
}

export const trackLogin = (method = 'google') => {
  trackEvent('User', 'Login', method)
  setUserProperties({
    user_type: 'returning_user',
    last_login: new Date().toISOString().split('T')[0]
  })
}

// Företagshändelser
export const trackCompanyCreated = (category: string) => {
  trackEvent('Company', 'Created', category)
}

export const trackCompanyViewed = (companyId: string, category?: string) => {
  trackEvent('Company', 'Viewed', category || companyId)
}

export const trackCompanySearched = (query: string, city?: string) => {
  trackEvent('Search', 'Company Search', `${query}${city ? ` in ${city}` : ''}`)
}

// Bokningshändelser
export const trackBookingStarted = (companyId: string, service?: string) => {
  trackEvent('Booking', 'Started', service || companyId)
}

export const trackBookingCompleted = (companyId: string, service?: string, price?: number) => {
  trackEvent('Booking', 'Completed', service || companyId, price)
}

export const trackBookingCancelled = (bookingId: string) => {
  trackEvent('Booking', 'Cancelled', bookingId)
}

// SMS-påminnelser
export const trackSmsReminderOptIn = () => {
  trackEvent('SMS', 'Reminder Opt-In', 'booking')
}

export const trackSmsReminderSent = (type: string) => {
  trackEvent('SMS', 'Reminder Sent', type)
}

// Premium/Betalning
export const trackPremiumViewed = () => {
  trackEvent('Premium', 'Viewed', 'pricing_page')
}

export const trackPremiumPurchased = (plan: string, amount: number) => {
  trackEvent('Revenue', 'Premium Purchased', plan, amount)
  
  if (ReactGA) {
    ReactGA.gtag('event', 'purchase', {
      currency: 'SEK',
      value: amount,
      transaction_id: `premium_${Date.now()}`,
      items: [{ item_name: plan }]
    })
  }
}

// Omdömen
export const trackReviewSubmitted = (companyId: string, rating: number) => {
  trackEvent('Review', 'Submitted', companyId, rating)
}

// Felhändelser
export const trackError = (errorType: string, errorMessage: string) => {
  trackEvent('Error', errorType, errorMessage)
}

// Engagemangshändelser
export const trackContactClicked = (companyId: string, method: 'phone' | 'email' | 'website') => {
  trackEvent('Engagement', 'Contact Clicked', `${companyId}_${method}`)
}

export const trackShareClicked = (companyId: string, platform?: string) => {
  trackEvent('Engagement', 'Share Clicked', platform || companyId)
}

export default {
  initGA,
  trackPageView,
  trackEvent,
  setUserProperties,
  trackSignUp,
  trackLogin,
  trackCompanyCreated,
  trackCompanyViewed,
  trackCompanySearched,
  trackBookingStarted,
  trackBookingCompleted,
  trackBookingCancelled,
  trackSmsReminderOptIn,
  trackSmsReminderSent,
  trackPremiumViewed,
  trackPremiumPurchased,
  trackReviewSubmitted,
  trackError,
  trackContactClicked,
  trackShareClicked,
}

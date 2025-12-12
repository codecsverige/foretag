/**
 * Google Analytics 4 - VägVänner
 * Spårar användarhändelser och konverteringar
 */

import ReactGA from 'react-ga4';

// Initialisera GA4
let isInitialized = false;

export const initGA = () => {
  const measurementId = process.env.REACT_APP_GA_MEASUREMENT_ID;
  
  // Initialisera endast om ID finns och inte redan initialiserad
  if (measurementId && !isInitialized) {
    try {
      ReactGA.initialize(measurementId, {
        gaOptions: {
          anonymizeIp: true, // GDPR-kompatibel
        },
      });
      isInitialized = true;
      console.log('✅ Google Analytics initialiserad');
    } catch (error) {
      console.warn('❌ GA-initialisering misslyckades:', error.message);
    }
  }
};

// Spåra sidvisningar
export const trackPageView = (path, title) => {
  if (!isInitialized) return;
  
  try {
    ReactGA.send({ 
      hitType: 'pageview', 
      page: path,
      title: title 
    });
  } catch (error) {
    console.warn('GA sidvisningsfel:', error.message);
  }
};

// Spåra anpassade händelser
export const trackEvent = (category, action, label, value) => {
  if (!isInitialized) return;
  
  try {
    ReactGA.event({
      category,
      action,
      label,
      value,
    });
  } catch (error) {
    console.warn('GA händelsefel:', error.message);
  }
};

// Sätt användaregenskaper (för retentionsanalys)
export const setUserProperties = (properties) => {
  if (!isInitialized) return;
  
  try {
    ReactGA.gtag('set', 'user_properties', properties);
  } catch (error) {
    console.warn('GA användaregenskaper fel:', error.message);
  }
};

// === Affärshändelser ===

// Användarhändelser
export const trackSignUp = (method = 'google') => {
  trackEvent('User', 'Sign Up', method);
  
  // Sätt användaregenskaper för retentionsspårning
  setUserProperties({
    user_type: 'new_user',
    signup_method: method,
    signup_date: new Date().toISOString().split('T')[0]
  });
};

export const trackPhoneVerified = () => {
  trackEvent('User', 'Phone Verified', 'SMS');
  
  // Markera användare som verifierad (kritiskt för retention!)
  setUserProperties({
    phone_verified: 'yes',
    verification_date: new Date().toISOString().split('T')[0]
  });
};

export const trackLogin = (method = 'google') => {
  trackEvent('User', 'Login', method);
  
  // Spåra återkommande användare
  setUserProperties({
    user_type: 'returning_user',
    last_login: new Date().toISOString().split('T')[0]
  });
};

// App-installation/avinstallation (PWA)
export const trackAppInstalled = () => {
  trackEvent('App', 'Installed', 'PWA');
  setUserProperties({ app_installed: 'yes' });
};

export const trackAppUninstalled = () => {
  trackEvent('App', 'Uninstalled', 'PWA');
};

// Användarretention
export const trackUserRetention = (daysSinceSignup) => {
  const retentionMilestone = 
    daysSinceSignup === 1 ? 'Day 1' :
    daysSinceSignup === 7 ? 'Day 7' :
    daysSinceSignup === 30 ? 'Day 30' :
    null;
  
  if (retentionMilestone) {
    trackEvent('Retention', 'Active User', retentionMilestone);
  }
};

// Resehändelser
export const trackRideCreated = (type, price) => {
  trackEvent('Ride', 'Created', type, price); // type: "offer" | "request"
};

export const trackRideViewed = (rideId) => {
  trackEvent('Ride', 'Viewed', rideId);
};

export const trackRideSearched = (from, to) => {
  trackEvent('Search', 'Ride Search', `${from} → ${to}`);
};

// Bokningshändelser
export const trackBookingSent = (rideId, price) => {
  trackEvent('Booking', 'Sent', rideId, price);
};

export const trackBookingCancelled = (rideId) => {
  trackEvent('Booking', 'Cancelled', rideId);
};

// Betalningshändelser (Intäkter!)
export const trackContactUnlocked = (amount = 10) => {
  trackEvent('Revenue', 'Contact Unlocked', 'PayPal', amount);
  
  // Spåra även som konvertering
  ReactGA.gtag('event', 'purchase', {
    currency: 'SEK',
    value: amount,
    transaction_id: `unlock_${Date.now()}`,
  });
};

export const trackPaymentAuthorized = (amount = 10) => {
  trackEvent('Payment', 'Authorized', 'PayPal', amount);
};

export const trackPaymentCaptured = (amount = 10) => {
  trackEvent('Payment', 'Captured', 'PayPal', amount);
};

export const trackPaymentFailed = (reason) => {
  trackEvent('Payment', 'Failed', reason);
};

// Engagemangshändelser
export const trackAlertCreated = (route) => {
  trackEvent('Engagement', 'Alert Created', route);
};

export const trackMessageSent = (type) => {
  trackEvent('Engagement', 'Message Sent', type);
};

// Felhändelser
export const trackError = (errorType, errorMessage) => {
  trackEvent('Error', errorType, errorMessage);
};

export default {
  initGA,
  trackPageView,
  trackEvent,
  setUserProperties,
  trackSignUp,
  trackPhoneVerified,
  trackLogin,
  trackAppInstalled,
  trackAppUninstalled,
  trackUserRetention,
  trackRideCreated,
  trackRideViewed,
  trackRideSearched,
  trackBookingSent,
  trackBookingCancelled,
  trackContactUnlocked,
  trackPaymentAuthorized,
  trackPaymentCaptured,
  trackPaymentFailed,
  trackAlertCreated,
  trackMessageSent,
  trackError,
};
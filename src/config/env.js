/**
 * Configuration d'environnement pour PayPal
 * 
 * Pour résoudre les problèmes en localhost, assurez-vous que :
 * 1. REACT_APP_PAYPAL_CLIENT_ID est défini dans votre fichier .env.local
 * 2. Le Client ID est valide pour l'environnement de développement
 */

export const ENV_CONFIG = {
  // PayPal Client IDs (LIVE is required in production)
  PAYPAL_CLIENT_ID_PROD: process.env.REACT_APP_PAYPAL_CLIENT_ID_PROD || process.env.REACT_APP_PAYPAL_CLIENT_ID || '',
  PAYPAL_CLIENT_ID_SANDBOX: process.env.REACT_APP_PAYPAL_CLIENT_ID_SANDBOX || process.env.REACT_APP_PAYPAL_CLIENT_ID_TEST || '',
  
  // Environment
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // Force LIVE mode unless explicitly overridden locally
  PAYPAL_MODE: 'prod',
  
  // Debug mode
  DEBUG: process.env.NODE_ENV === 'development'
};

/**
 * Vérifier si la configuration est valide
 */
export function validateConfig() {
  const issues = [];
  
  if (!ENV_CONFIG.PAYPAL_CLIENT_ID_PROD) {
    issues.push('Production PayPal Client ID is missing');
  }
  // Sandbox ID is optional when operating in LIVE
  
  return {
    isValid: issues.length === 0,
    issues
  };
}

/**
 * Obtenir la configuration PayPal pour l'environnement actuel
 */
export function getPayPalConfig() {
  const validation = validateConfig();
  
  if (!validation.isValid) {
    console.warn('PayPal configuration issues:', validation.issues);
  }

  // Runtime sandbox toggle via localStorage (vv_paypal_mode = 'sandbox' | 'prod')
  let mode = ENV_CONFIG.PAYPAL_MODE;
  try {
    const raw = localStorage.getItem('vv_paypal_mode');
    if (raw === 'sandbox' || raw === 'prod') mode = raw;
  } catch {}

  let clientId = mode === 'sandbox' ? ENV_CONFIG.PAYPAL_CLIENT_ID_SANDBOX : ENV_CONFIG.PAYPAL_CLIENT_ID_PROD;
  // In sandbox we prefer capture for easier testing; in prod we default to authorize
  let intent   = mode === 'sandbox' ? 'capture' : (ENV_CONFIG.NODE_ENV === 'development' ? 'capture' : 'authorize');

  try {
    const override = JSON.parse(localStorage.getItem('vv_paypal_toggle') || 'null');
    if (override && override.enabled && typeof override.clientId === 'string' && override.clientId.length > 10) {
      clientId = override.clientId;
      intent = override.intent === 'capture' || override.intent === 'authorize' ? override.intent : intent;
    }
  } catch {}

  return {
    clientId,
    intent,
    currency: 'SEK',
    debug: ENV_CONFIG.DEBUG
  };
} 
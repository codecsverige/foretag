/**
 * Configuration PayPal pour différents environnements
 */

const PAYPAL_CONFIG = {
  // Configuration pour le développement
  development: {
    clientId: process.env.REACT_APP_PAYPAL_CLIENT_ID || 'test_client_id',
    intent: 'capture', // Utiliser capture en développement
    currency: 'SEK',
    // Supprimer les options qui peuvent causer des problèmes en développement
    debug: true
  },
  
  // Configuration pour la production
  production: {
    clientId: process.env.REACT_APP_PAYPAL_CLIENT_ID,
    intent: 'authorize', // Utiliser authorize en production
    currency: 'SEK',
    disableFunding: 'credit,card',
    enableFunding: 'paylater,venmo',
    debug: false
  }
};

/**
 * Obtenir la configuration PayPal selon l'environnement
 */
export function getPayPalConfig() {
  const env = process.env.NODE_ENV || 'development';
  return PAYPAL_CONFIG[env] || PAYPAL_CONFIG.development;
}

/**
 * Obtenir les options pour PayPalScriptProvider
 */
export function getPayPalScriptOptions() {
  // Deprecated in favor of src/config/env.js
  const config = getPayPalConfig();
  const options = {
    "client-id": config.clientId,
    intent: config.intent,
    currency: config.currency
  };
  if (config.disableFunding) options["disable-funding"] = config.disableFunding;
  if (config.enableFunding) options["enable-funding"] = config.enableFunding;
  return options;
}

/**
 * Vérifier si PayPal est configuré correctement
 */
export function isPayPalConfigured() {
  const config = getPayPalConfig();
  return !!config.clientId && config.clientId !== 'test_client_id';
}

/**
 * Obtenir le type d'intent selon l'environnement
 */
export function getPayPalIntent() {
  const config = getPayPalConfig();
  return config.intent;
}

/**
 * Obtenir le statut PayPal selon l'environnement
 */
export function getPayPalStatus() {
  const intent = getPayPalIntent();
  return intent === 'capture' ? 'CAPTURED' : 'AUTHORIZED';
}

/**
 * Obtenir le statut de booking selon l'environnement
 */
export function getBookingStatus() {
  const intent = getPayPalIntent();
  return intent === 'capture' ? 'captured' : 'authorized';
} 
/* ────────────────────────────────────────────────
   src/utils/booking.js
   Utilitaires pour la gestion des réservations et paiements
──────────────────────────────────────────────── */

/**
 * Commission pour déverrouiller les informations de contact
 * @constant {number}
 */
export const COMMISSION = 10; // SEK

/**
 * Vérifie si une réservation est déverrouillée (payée)
 * @param {Object} booking - Objet de réservation
 * @returns {boolean} - true si la réservation est déverrouillée
 */
export function isUnlocked(booking) {
  if (!booking) return false;
  
  const status = (booking.status || "").toLowerCase();
  const paypalStatus = (booking.paypal?.status || "").toLowerCase();
  
  // États considérés comme "déverrouillés" (payés)
  // IMPORTANT: n'incluez PAS 'voided' comme déverrouillé, لأنه إلغاء وليس دفع
  const unlockedStates = ["authorized", "captured"]; 
  
  return unlockedStates.some((state) => 
    status === state || paypalStatus === state
  );
}

/**
 * Vérifie si une annonce passager est déverrouillée
 * @param {Object} ad - Objet d'annonce passager
 * @returns {boolean} - true si l'annonce est déverrouillée
 */
export function isAdUnlocked(ad) {
  if (!ad) return false;
  
  return ad.bookingType === "contact_unlock" || ad.archived === true;
}

/**
 * Calcule le montant total avec commission
 * @param {number} baseAmount - Montant de base
 * @returns {number} - Montant avec commission
 */
export function calculateTotalWithCommission(baseAmount = 0) {
  return baseAmount + COMMISSION;
}

/**
 * Formate le prix avec devise
 * @param {number|string} amount - Montant
 * @param {string} currency - Devise (par défaut 'kr')
 * @returns {string} - Prix formaté
 */
export function formatPrice(amount, currency = 'kr') {
  if (!amount || amount === 'Flex') return 'Flex';
  return `${amount} ${currency}`;
}

/**
 * États de réservation possibles
 */
export const BOOKING_STATES = {
  PENDING: 'pending',
  AUTHORIZED: 'authorized', 
  CAPTURED: 'captured',
  VOIDED: 'voided',
  CANCELLED: 'cancelled',
  FAILED: 'failed'
};

/**
 * Types de réservation
 */
export const BOOKING_TYPES = {
  SEAT_BOOKING: 'seat_booking',
  CONTACT_UNLOCK: 'contact_unlock'
};

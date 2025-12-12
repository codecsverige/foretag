import { useState, useCallback } from 'react';

/**
 * Hook personnalisé pour gérer les erreurs de paiement
 * 
 * @returns {Object} - Objet contenant les fonctions de gestion d'erreurs
 */
export function usePaymentError() {
  const [paymentError, setPaymentError] = useState(null);

  // Gestion des erreurs PayPal
  const handlePayPalError = useCallback((error) => {
    console.error('PayPal error:', error);
    
    let errorMessage = 'Betalningen misslyckades.';
    let errorType = 'payment';

    // Analyser le type d'erreur PayPal
    if (error.message) {
      if (error.message.includes('PAYER_ACTION_REQUIRED')) {
        errorMessage = 'Betalningen kräver ytterligare åtgärder från din sida.';
      } else if (error.message.includes('INSTRUMENT_DECLINED')) {
        errorMessage = 'Betalningsmetoden nekades. Försök med en annan metod.';
      } else if (error.message.includes('PAYMENT_ALREADY_DONE')) {
        errorMessage = 'Betalningen har redan genomförts.';
        errorType = 'info';
      } else if (error.message.includes('NETWORK_ERROR')) {
        errorMessage = 'Nätverksfel. Kontrollera din internetanslutning.';
        errorType = 'network';
      } else {
        errorMessage = error.message;
      }
    }

    setPaymentError({
      message: errorMessage,
      type: errorType,
      originalError: error
    });

    return {
      message: errorMessage,
      type: errorType
    };
  }, []);

  // Gestion des erreurs de transaction Firestore
  const handleTransactionError = useCallback((error) => {
    console.error('Transaction error:', error);
    
    let errorMessage = 'Transaktionen misslyckades.';
    let errorType = 'data';

    if (error.message) {
      if (error.message.includes('permission-denied')) {
        errorMessage = 'Du har inte behörighet att utföra denna åtgärd.';
      } else if (error.message.includes('unavailable')) {
        errorMessage = 'Tjänsten är inte tillgänglig just nu. Försök igen senare.';
        errorType = 'network';
      } else if (error.message.includes('already-exists')) {
        errorMessage = 'Denna åtgärd har redan utförts.';
        errorType = 'info';
      } else if (error.message.includes('not-found')) {
        errorMessage = 'Bokningen hittades inte. Den kan ha raderats.';
      } else {
        errorMessage = error.message;
      }
    }

    setPaymentError({
      message: errorMessage,
      type: errorType,
      originalError: error
    });

    return {
      message: errorMessage,
      type: errorType
    };
  }, []);

  // Gestion des erreurs de notification
  const handleNotificationError = useCallback((error) => {
    console.error('Notification error:', error);
    
    // Les erreurs de notification ne sont pas critiques, on les log juste
    return {
      message: 'Meddelandet kunde inte skickas, men betalningen lyckades.',
      type: 'warning'
    };
  }, []);

  // Nettoyer l'erreur
  const clearError = useCallback(() => {
    setPaymentError(null);
  }, []);

  // Vérifier si c'est une erreur critique
  const isCriticalError = useCallback((error) => {
    if (!error) return false;
    
    const criticalTypes = ['payment', 'data'];
    const criticalMessages = [
      'permission-denied',
      'unavailable',
      'INSTRUMENT_DECLINED',
      'PAYER_ACTION_REQUIRED'
    ];

    return criticalTypes.includes(error.type) || 
           criticalMessages.some(msg => error.message?.includes(msg));
  }, []);

  return {
    paymentError,
    handlePayPalError,
    handleTransactionError,
    handleNotificationError,
    clearError,
    isCriticalError
  };
} 
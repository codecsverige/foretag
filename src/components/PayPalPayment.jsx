import React, { useState, useCallback } from 'react';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { getPayPalConfig } from '../config/env';
import PropTypes from 'prop-types';

/**
 * PayPalPayment - Composant de paiement PayPal amélioré
 * 
 * @param {number} amount - Montant à payer
 * @param {string} currency - Devise (défaut: SEK)
 * @param {Function} onSuccess - Callback en cas de succès
 * @param {Function} onError - Callback en cas d'erreur
 * @param {Function} onCancel - Callback en cas d'annulation
 * @param {string} intent - Type d'intention (capture/authorize)
 * @param {Object} style - Style personnalisé
 * @param {boolean} disabled - Désactiver le bouton
 */
export default function PayPalPayment({
  amount, 
  currency = 'SEK', 
  onSuccess, 
  onError, 
  onCancel,
  intent = 'capture',
  style = {},
  disabled = false
}) {
  const cfg = getPayPalConfig();
  const effectiveIntent = cfg.intent || intent;
  const [phase, setPhase] = useState('idle');
  const [msg, setMsg] = useState('');
  const [sdkError, setSdkError] = useState(false);

  // Gestion du succès du paiement
  const handleSuccess = useCallback((order) => {
    setPhase('success');
    setMsg('Betalning lyckades!');
    if (onSuccess) {
      onSuccess(order);
    }
  }, [onSuccess]);

  // Gestion des erreurs
  const handleError = useCallback((error) => {
    console.error('PayPal payment error:', error);
    setPhase('error');
    setMsg('Kunde inte betala. Försök igen.');
    if (onError) {
      onError(error);
    }
  }, [onError]);

  // Gestion de l'annulation
  const handleCancel = useCallback(() => {
    setPhase('cancelled');
    setMsg('Betalning avbruten');
    if (onCancel) {
      onCancel();
    }
  }, [onCancel]);

  // Gestion de l'erreur SDK
  const handleSdkError = useCallback((error) => {
    console.error('PayPal SDK error:', error);
    setSdkError(true);
    setPhase('error');
    setMsg('PayPal kunde inte laddas. Kontrollera din internetanslutning.');
  }, []);

  // Création de la commande
  const createOrder = useCallback((data, actions) => {
    setPhase('loading'); 
    setMsg('');
    
    return actions.order.create({
      purchase_units: [{
        amount: {
          value: amount.toString(),
          currency_code: currency
        },
        description: `Kontaktupplåsning - ${amount} ${currency}`
      }]
    });
  }, [amount, currency]);

  // Gestion de l'approbation
  const handleApprove = useCallback(async (data, actions) => {
    setPhase('processing');
    
    try {
      let order;
      
      if (effectiveIntent === 'authorize') {
        order = await actions.order.authorize();
      } else {
        order = await actions.order.capture();
      }
      
      handleSuccess(order);
    } catch (error) {
      handleError(error);
    }
  }, [effectiveIntent, handleSuccess, handleError]);

  // Styles par défaut
  const defaultStyle = {
    layout: 'vertical',
    shape: 'rect',
    height: 45,
    ...style
  };

  // Messages selon la phase
  const getMessageStyle = () => {
    switch (phase) {
      case 'success':
        return 'text-emerald-700 bg-emerald-50 border-emerald-200';
      case 'cancelled':
        return 'text-yellow-700 bg-yellow-50 border-yellow-200';
      case 'error':
        return 'text-red-700 bg-red-50 border-red-200';
      case 'processing':
        return 'text-blue-700 bg-blue-50 border-blue-200';
      default:
        return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  // Fallback en cas d'erreur SDK
  if (sdkError) {
    return (
      <div className="w-full">
        <div className="flex flex-col items-center text-center max-w-2xl mx-auto">
          
          {/* Header Section */}
          <div className="mb-6 lg:mb-8">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-gradient-to-br from-red-50 to-orange-100 dark:from-slate-700 dark:to-slate-600 rounded-2xl shadow-inner">
                <span className="text-3xl">⚠️</span>
              </div>
            </div>
            
            <h3 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white mb-3">
              {intent === 'authorize' ? 'Lås upp kontakt' : 'Betala & publicera direkt'}
            </h3>
            <p className="text-sm lg:text-base text-gray-600 dark:text-gray-300 leading-relaxed max-w-md mx-auto">
              {intent === 'authorize' 
                ? `Betala ${amount} ${currency} för att låsa upp kontaktuppgifterna och kommunicera direkt`
                : `Betala ${amount} ${currency} som avgift—din resa publiceras direkt och blir synlig för alla`
              }
            </p>
          </div>
          
          {/* Error Card */}
          <div className="w-full max-w-md">
            <div className="bg-white dark:bg-slate-800 border border-red-200 dark:border-red-800 rounded-xl shadow-lg p-6">
              
              {/* Error Content */}
              <div className="text-center">
                <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg mb-4">
                  <div className="text-red-600 dark:text-red-400 text-4xl mb-2">⚠️</div>
                  <h4 className="text-lg font-semibold text-red-700 dark:text-red-300 mb-2">
                    PayPal kunde inte laddas
                  </h4>
                  <p className="text-red-600 dark:text-red-400 text-sm">
                    Kontrollera din internetanslutning och försök igen.
                  </p>
                </div>
                
                {/* Reload Button */}
                <button
                  onClick={() => window.location.reload()}
                  className="group bg-white dark:bg-slate-800 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 px-6 py-3 rounded-lg font-semibold transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5 flex items-center justify-center gap-2 w-full"
                >
                  <div className="p-1 bg-red-100 dark:bg-red-900 rounded group-hover:scale-110 transition-transform duration-200">
                    <span className="text-red-600 dark:text-red-400 text-sm">🔄</span>
                  </div>
                  <span>Ladda om sidan</span>
                </button>
                
                {/* Security Info */}
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-slate-700">
                  <div className="flex items-center justify-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <span>Säker betalning via PayPal</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex flex-col items-center text-center max-w-2xl mx-auto">
        
        {/* Header Section */}
        <div className="mb-6 lg:mb-8">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-700 dark:to-slate-600 rounded-2xl shadow-inner">
              <span className="text-3xl">💳</span>
            </div>
          </div>
          
          <h3 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white mb-3">
            {intent === 'authorize' ? 'Lås upp kontakt' : 'Betala & publicera direkt'}
          </h3>
          <p className="text-sm lg:text-base text-gray-600 dark:text-gray-300 leading-relaxed max-w-md mx-auto">
            {intent === 'authorize' 
              ? `Betala ${amount} ${currency} för att låsa upp kontaktuppgifterna och kommunicera direkt`
              : `Betala ${amount} ${currency} som avgift—din resa publiceras direkt och blir synlig för alla`
            }
          </p>
        </div>
        
        {/* Payment Card */}
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-lg p-6">
            
            {/* Amount Display */}
            <div className="text-center mb-6">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                <div className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-1">Belopp att betala</div>
                <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                  {amount} {currency}
                </div>
              </div>
            </div>

            {/* PayPal Buttons */}
            <div className="mb-4">
              <PayPalScriptProvider
                options={{
                  "client-id": cfg.clientId,
                  currency,
                  intent: effectiveIntent
                }}
              >
                <PayPalButtons
                  style={defaultStyle}
                  disabled={disabled || phase === 'processing'}
                  createOrder={createOrder}
                  onApprove={handleApprove}
                  onCancel={handleCancel}
                  onError={handleSdkError}
                />
              </PayPalScriptProvider>
            </div>
            
            {/* Status Message */}
            {phase !== 'idle' && (
              <div className={`p-3 rounded-lg border text-sm ${getMessageStyle()}`}>
                <div className="flex items-center justify-center gap-2">
                  {phase === 'success' && <span className="text-lg">✅</span>}
                  {phase === 'cancelled' && <span className="text-lg">⚠️</span>}
                  {phase === 'error' && <span className="text-lg">❌</span>}
                  {phase === 'processing' && <span className="text-lg">⏳</span>}
                  <span className="font-medium">{msg}</span>
                </div>
              </div>
            )}

            {/* Security Info */}
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-slate-700">
              <div className="flex items-center justify-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span>Säker betalning</span>
                </div>
                <span>•</span>
                <span>PayPal skydd</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// PropTypes pour la validation
PayPalPayment.propTypes = {
  amount: PropTypes.number.isRequired,
  currency: PropTypes.string,
  onSuccess: PropTypes.func,
  onError: PropTypes.func,
  onCancel: PropTypes.func,
  intent: PropTypes.oneOf(['capture', 'authorize']),
  style: PropTypes.object,
  disabled: PropTypes.bool
};

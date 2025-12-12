import React, { useState, useCallback } from 'react';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import PropTypes from 'prop-types';
import { getPayPalConfig, validateConfig } from '../config/env';

/**
 * PayPalSimple - Composant PayPal simplifié pour éviter les erreurs en localhost
 */
export default function PayPalSimple({
  amount,
  onSuccess,
  onError,
  onCancel,
  disabled = false
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Configuration PayPal
  const paypalConfig = getPayPalConfig();
  const validation = validateConfig();

  const paypalOptions = {
    "client-id": paypalConfig.clientId,
    currency: paypalConfig.currency,
    intent: paypalConfig.intent
  };

  const handleSuccess = useCallback((order) => {
    setLoading(false);
    setError('');
    if (onSuccess) {
      onSuccess(order);
    }
  }, [onSuccess]);

  const handleError = useCallback((err) => {
    console.error('PayPal error:', err);
    setLoading(false);
    setError('Betalningen misslyckades. Försök igen.');
    if (onError) {
      onError(err);
    }
  }, [onError]);

  const handleCancel = useCallback(() => {
    setLoading(false);
    setError('');
    if (onCancel) {
      onCancel();
    }
  }, [onCancel]);

  const createOrder = useCallback((data, actions) => {
    setLoading(true);
    setError('');
    
    return actions.order.create({
      application_context: {
        shipping_preference: 'NO_SHIPPING',
        user_action: 'PAY_NOW'
      },
      purchase_units: [{
        amount: {
          value: amount.toString(),
          currency_code: paypalConfig.currency
        },
        description: `Kontaktupplåsning - ${amount} ${paypalConfig.currency}`
      }]
    });
  }, [amount, paypalConfig.currency]);

  const handleApprove = useCallback(async (data, actions) => {
    try {
      let order;
      
      if (paypalConfig.intent === 'capture') {
        order = await actions.order.capture();
      } else {
        order = await actions.order.authorize();
      }
      
      handleSuccess(order);
    } catch (err) {
      // Recommended by PayPal: restart the approval flow on instrument declines
      const msg = String(err && (err.name || err.message || err))
        .toUpperCase();
      if (msg.includes('INSTRUMENT_DECLINED') || msg.includes('PAYER_ACTION_REQUIRED')) {
        if (actions && typeof actions.restart === 'function') {
          try { await actions.restart(); return; } catch {}
        }
      }
      handleError(err);
    }
  }, [paypalConfig.intent, handleSuccess, handleError]);

  // Afficher les erreurs de configuration
  if (!validation.isValid) {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="bg-white dark:bg-slate-800 border border-red-200 dark:border-red-800 rounded-xl shadow-lg p-6">
          <div className="text-center mb-4">
            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <span className="text-red-600 dark:text-red-400 text-3xl">⚠️</span>
            </div>
          </div>
          
          <h4 className="text-red-800 dark:text-red-300 font-semibold mb-3 text-center">
            PayPal Configuration Error
          </h4>
          <ul className="text-red-700 dark:text-red-400 text-sm space-y-1 mb-3">
            {validation.issues.map((issue, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-red-500 mt-0.5">•</span>
                <span>{issue}</span>
              </li>
            ))}
          </ul>
          <p className="text-red-600 dark:text-red-400 text-xs text-center">
            Check your environment variables and PayPal configuration.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-lg p-6">
        
        {/* Amount Display */}
        <div className="text-center mb-6">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
            <div className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-1">Belopp att betala</div>
            <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
              {amount} {paypalConfig.currency}
            </div>
          </div>
        </div>

        {/* PayPal Buttons */}
        <div className="mb-4">
          <PayPalScriptProvider options={paypalOptions}>
            <PayPalButtons
              style={{ layout: "vertical", shape: "rect", height: 45 }}
              disabled={disabled || loading}
              createOrder={createOrder}
              onApprove={handleApprove}
              onError={handleError}
              onCancel={handleCancel}
            />
          </PayPalScriptProvider>
        </div>
        
        {/* Status Messages */}
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-sm">
            <div className="flex items-center justify-center gap-2 text-red-700 dark:text-red-300">
              <span className="text-lg">❌</span>
              <span className="font-medium">{error}</span>
            </div>
          </div>
        )}
        
        {loading && (
          <div className="p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg text-sm">
            <div className="flex items-center justify-center gap-2 text-blue-700 dark:text-blue-300">
              <span className="text-lg">⏳</span>
              <span className="font-medium">Bearbetar betalning...</span>
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
  );
}

PayPalSimple.propTypes = {
  amount: PropTypes.number.isRequired,
  onSuccess: PropTypes.func,
  onError: PropTypes.func,
  onCancel: PropTypes.func,
  disabled: PropTypes.bool
}; 
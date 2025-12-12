import React, { useState } from 'react';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { getPayPalConfig } from '../config/env';

/**
 * Composant de test PayPal pour vérifier la configuration
 */
export default function PayPalTest() {
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');
  const cfg = getPayPalConfig();

  const handleSuccess = (order) => {
    setStatus('success');
    setMessage('Test payment successful!');
    console.log('Test payment success:', order);
  };

  const handleError = (error) => {
    setStatus('error');
    setMessage('Test payment failed');
    console.error('Test payment error:', error);
  };

  const handleCancel = () => {
    setStatus('cancelled');
    setMessage('Test payment cancelled');
  };

  if (!cfg.clientId) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <h3 className="text-red-800 font-semibold mb-2">PayPal Configuration Error</h3>
        <p className="text-red-600 text-sm">
          PayPal client ID is not configured properly. Check your environment variables.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <h3 className="text-blue-800 font-semibold mb-2">PayPal Test Component</h3>
      <p className="text-blue-600 text-sm mb-4">
        This is a test component to verify PayPal integration. Amount: 1 SEK
      </p>
      
      <PayPalScriptProvider options={{ "client-id": cfg.clientId, currency: cfg.currency, intent: cfg.intent }}>
        <PayPalButtons
          style={{ layout: "vertical", shape: "rect" }}
          createOrder={(data, actions) => {
            return actions.order.create({
              purchase_units: [{
                amount: {
                  value: "1.00"
                }
              }]
            });
          }}
          onApprove={handleSuccess}
          onError={handleError}
          onCancel={handleCancel}
        />
      </PayPalScriptProvider>

      {status !== 'idle' && (
        <div className={`mt-3 p-2 rounded text-sm ${
          status === 'success' ? 'bg-green-100 text-green-800' :
          status === 'error' ? 'bg-red-100 text-red-800' :
          'bg-yellow-100 text-yellow-800'
        }`}>
          {message}
        </div>
      )}
    </div>
  );
} 
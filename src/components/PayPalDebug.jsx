import React, { useState, useEffect } from 'react';
import PayPalSimple from './PayPalSimple';
import { getPayPalConfig } from '../config/env';

/**
 * Composant de débogage PayPal pour diagnostiquer les problèmes
 */
export default function PayPalDebug() {
  const [config, setConfig] = useState({});
  const [status, setStatus] = useState('checking');

  useEffect(() => {
    // Vérifier la configuration (always LIVE by default)
    const cfg = getPayPalConfig();
    const paypalConfig = {
      clientId: cfg.clientId,
      nodeEnv: process.env.NODE_ENV,
      hasClientId: !!cfg.clientId,
      clientIdLength: (cfg.clientId && cfg.clientId.length) || 0,
      intent: cfg.intent
    };
    setConfig(paypalConfig);
    setStatus(paypalConfig.hasClientId ? 'configured' : 'not-configured');
  }, []);

  const handleSuccess = (order) => {
    console.log('PayPal Debug - Success:', order);
    setStatus('success');
  };

  const handleError = (error) => {
    console.error('PayPal Debug - Error:', error);
    setStatus('error');
  };

  const handleCancel = () => {
    console.log('PayPal Debug - Cancelled');
    setStatus('cancelled');
  };

  return (
    <div className="p-6 bg-gray-50 border border-gray-200 rounded-lg">
      <h3 className="text-lg font-semibold mb-4">PayPal Debug Information</h3>
      
      {/* Configuration Info */}
      <div className="mb-4 p-3 bg-white border rounded">
        <h4 className="font-medium mb-2">Configuration:</h4>
        <ul className="text-sm space-y-1">
          <li>Environment: <span className="font-mono">{config.nodeEnv}</span></li>
          <li>Intent: <span className="font-mono">{config.intent}</span></li>
          <li>Client ID exists: <span className={config.hasClientId ? 'text-green-600' : 'text-red-600'}>
            {config.hasClientId ? 'Yes' : 'No'}
          </span></li>
          <li>Client ID length: <span className="font-mono">{config.clientIdLength}</span></li>
          <li>Client ID: <span className="font-mono text-xs break-all">
            {config.clientId ? `${config.clientId.substring(0, 20)}...` : 'Not set'}
          </span></li>
        </ul>
      </div>

      {/* Status */}
      <div className="mb-4 p-3 bg-white border rounded">
        <h4 className="font-medium mb-2">Status:</h4>
        <div className={`inline-block px-2 py-1 rounded text-sm ${
          status === 'configured' ? 'bg-green-100 text-green-800' :
          status === 'success' ? 'bg-blue-100 text-blue-800' :
          status === 'error' ? 'bg-red-100 text-red-800' :
          status === 'cancelled' ? 'bg-yellow-100 text-yellow-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {status}
        </div>
      </div>

      {/* PayPal Component */}
      {config.hasClientId && (
        <div className="mb-4">
          <h4 className="font-medium mb-2">Test PayPal Payment (1 SEK):</h4>
          <PayPalSimple
            amount={1}
            onSuccess={handleSuccess}
            onError={handleError}
            onCancel={handleCancel}
          />
        </div>
      )}

      {/* Instructions */}
      {!config.hasClientId && (
        <div className="p-3 bg-red-50 border border-red-200 rounded">
          <h4 className="font-medium text-red-800 mb-2">Configuration Required:</h4>
          <p className="text-red-700 text-sm">
            Add <code className="bg-red-100 px-1 rounded">REACT_APP_PAYPAL_CLIENT_ID</code> to your environment variables.
          </p>
        </div>
      )}
    </div>
  );
} 
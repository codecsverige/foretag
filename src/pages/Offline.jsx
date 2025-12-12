import React, { useState } from 'react';
import { WifiOff, RefreshCw, Home, Cloud } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

export default function Offline() {
  const [isChecking, setIsChecking] = useState(false);
  
  const checkConnection = () => {
    setIsChecking(true);
    
    // Check if online
    if (navigator.onLine) {
      window.location.reload();
    } else {
      setTimeout(() => {
        setIsChecking(false);
      }, 2000);
    }
  };
  
  // Auto-check when connection is restored
  React.useEffect(() => {
    const handleOnline = () => {
      window.location.reload();
    };
    
    window.addEventListener('online', handleOnline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, []);
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4">
      <Helmet>
        <meta name="robots" content="noindex, follow" />
        <link rel="canonical" href="https://vagvanner.se/offline" />
      </Helmet>
      <div className="max-w-md w-full text-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-10">
          {/* Offline Icon */}
          <div className="mx-auto w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <WifiOff className="w-10 h-10 text-gray-600" />
          </div>
          
          {/* Title */}
          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            Du är offline
          </h1>
          
          {/* Description */}
          <p className="text-gray-600 mb-8">
            Det verkar som att du inte har någon internetanslutning just nu. 
            Kontrollera din anslutning och försök igen.
          </p>
          
          {/* Tips */}
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-blue-900 mb-2">Tips:</h3>
            <ul className="text-sm text-blue-800 text-left space-y-1">
              <li>• Kontrollera din Wi-Fi-anslutning</li>
              <li>• Kontrollera mobildata</li>
              <li>• Prova att starta om din router</li>
              <li>• Flytta dig närmare routern</li>
            </ul>
          </div>
          
          {/* Action Button */}
          <button 
            onClick={checkConnection}
            disabled={isChecking}
            className="flex items-center justify-center gap-2 w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-5 h-5 ${isChecking ? 'animate-spin' : ''}`} />
            {isChecking ? 'Kontrollerar anslutning...' : 'Försök igen'}
          </button>
          
          {/* Cached Content Info */}
          <div className="mt-6 p-3 bg-gray-50 rounded-lg">
            <Cloud className="w-5 h-5 text-gray-400 mx-auto mb-2" />
            <p className="text-xs text-gray-500">
              Vissa sidor kan vara tillgängliga offline om du har besökt dem tidigare.
            </p>
          </div>
        </div>
        
        {/* Auto-refresh notice */}
        <p className="mt-6 text-sm text-gray-600">
          Sidan uppdateras automatiskt när anslutningen återställs
        </p>
      </div>
    </div>
  );
}
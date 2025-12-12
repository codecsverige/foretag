import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { AlertTriangle, Home, RefreshCw, Mail } from 'lucide-react';
import { SUPPORT_EMAIL } from "../config/legal.js";

export default function Error500() {
  const [isRetrying, setIsRetrying] = useState(false);
  
  const handleRetry = () => {
    setIsRetrying(true);
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center px-4">
      <Helmet>
        <meta name="robots" content="noindex, follow" />
        <link rel="canonical" href="https://vagvanner.se/500" />
      </Helmet>
      <div className="max-w-md w-full text-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-10">
          {/* Error Icon */}
          <div className="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-10 h-10 text-red-600" />
          </div>
          
          {/* Error Code */}
          <h1 className="text-6xl font-bold text-red-600 mb-2">500</h1>
          
          {/* Error Message */}
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Något gick fel
          </h2>
          
          <p className="text-gray-600 mb-8">
            Vi beklagar, men något gick fel på vår sida. 
            Vi arbetar på att lösa problemet så snart som möjligt.
          </p>
          
          {/* Action Buttons */}
          <div className="space-y-3">
            <button 
              onClick={handleRetry}
              disabled={isRetrying}
              className="flex items-center justify-center gap-2 w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-5 h-5 ${isRetrying ? 'animate-spin' : ''}`} />
              {isRetrying ? 'Laddar om...' : 'Försök igen'}
            </button>
            
            <Link 
              to="/"
              className="flex items-center justify-center gap-2 w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Home className="w-5 h-5" />
              Gå till startsidan
            </Link>
            
            <a 
              href={`mailto:${SUPPORT_EMAIL}`}
              className="flex items-center justify-center gap-2 w-full text-blue-600 py-3 px-4 rounded-lg hover:bg-blue-50 transition-colors"
            >
              <Mail className="w-5 h-5" />
              Rapportera problemet
            </a>
          </div>
        </div>
        
        {/* Error Details (for developers) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-6 p-4 bg-gray-100 rounded-lg text-left">
            <p className="text-xs text-gray-500 font-mono">
              Error ID: {Date.now().toString(36)}
              <br />
              Time: {new Date().toISOString()}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Home, Search, ArrowLeft } from 'lucide-react';

export default function Error404() {
  return (
    <>
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
        <link rel="canonical" href="https://vagvanner.se/404" />
      </Helmet>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-10">
          {/* Error Code */}
          <h1 className="text-8xl font-bold text-blue-600 mb-2">404</h1>
          
          {/* Error Message */}
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Sidan kunde inte hittas
          </h2>
          
          <p className="text-gray-600 mb-8">
            Tyvärr kunde vi inte hitta sidan du letar efter. 
            Den kan ha flyttats eller tagits bort.
          </p>
          
          {/* Action Buttons */}
          <div className="space-y-3">
            <Link 
              to="/"
              className="flex items-center justify-center gap-2 w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Home className="w-5 h-5" />
              Gå till startsidan
            </Link>
            
            <Link 
              to="/search"
              className="flex items-center justify-center gap-2 w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Search className="w-5 h-5" />
              Sök efter resor
            </Link>
            
            <button 
              onClick={() => window.history.back()}
              className="flex items-center justify-center gap-2 w-full text-blue-600 py-3 px-4 rounded-lg hover:bg-blue-50 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Gå tillbaka
            </button>
          </div>
        </div>
        
        {/* Additional Help Text */}
        <p className="mt-6 text-sm text-gray-600">
          Behöver du hjälp? 
          <Link to="/contact" className="text-blue-600 hover:underline ml-1">
            Kontakta oss
          </Link>
        </p>
      </div>
      </div>
    </>
  );
}
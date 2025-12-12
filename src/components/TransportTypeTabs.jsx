import React from 'react';
import { useNavigate } from 'react-router-dom';
// Using emojis instead of icons to avoid import issues

export default function TransportTypeTabs({ currentType = 'car' }) {
  const navigate = useNavigate();
  
  return (
    <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
      <button
        onClick={() => navigate('/')}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-all
          ${currentType === 'car' 
            ? 'bg-white text-blue-600 shadow-sm' 
            : 'text-gray-600 hover:text-gray-800'
          }
        `}
      >
        <span className="text-lg">🚗</span>
        <span>Samåkning</span>
      </button>
      
      <button
        onClick={() => navigate('/bus')}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-all
          ${currentType === 'bus' 
            ? 'bg-white text-blue-600 shadow-sm' 
            : 'text-gray-600 hover:text-gray-800'
          }
        `}
      >
        <span className="text-lg">🚌</span>
        <span>Buss</span>
      </button>
    </div>
  );
}
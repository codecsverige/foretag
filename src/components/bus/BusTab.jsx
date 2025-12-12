import React from 'react';
// Using emoji instead of icon

// Separate component for bus tab to avoid conflicts
export default function BusTab({ isActive, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all
        ${isActive 
          ? 'bg-blue-600 text-white shadow-md' 
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }
      `}
    >
      <span className="text-lg">🚌</span>
      <span>Buss</span>
    </button>
  );
}
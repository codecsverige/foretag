import React from "react";
import NotificationBadge from "./NotificationBadge.jsx";

/**
 * NotificationIndicator - Indicateur de notification flottant
 * @param {string} message - Message à afficher
 * @param {string} type - Type: 'new', 'update', 'warning', 'success'
 * @param {boolean} show - Afficher ou masquer l'indicateur
 * @param {string} position - Position: 'top', 'bottom', 'floating'
 */
export default function NotificationIndicator({ 
  message, 
  type = 'new', 
  show = false,
  position = 'floating',
  count = null
}) {
  if (!show) return null;

  const typeStyles = {
    new: 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white',
    update: 'bg-gradient-to-r from-emerald-500 to-green-600 text-white',
    warning: 'bg-gradient-to-r from-yellow-500 to-orange-600 text-white',
    success: 'bg-gradient-to-r from-green-500 to-emerald-600 text-white'
  };

  const typeIcons = {
    new: '🆕',
    update: '🔄',
    warning: '⚠️',
    success: '✅'
  };

  const positionStyles = {
    top: 'fixed top-4 left-1/2 transform -translate-x-1/2 z-50',
    bottom: 'fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50',
    floating: 'fixed top-20 right-4 z-50'
  };

  return (
    <div className={`${positionStyles[position]} animate-slide-in-right`}>
      <div className={`${typeStyles[type]} px-4 py-3 rounded-lg shadow-lg border-0 flex items-center gap-3 max-w-sm relative`}>
        <span className="text-lg">{typeIcons[type]}</span>
        <div className="flex-1">
          <p className="font-semibold text-sm">{message}</p>
        </div>
        {count && (
          <NotificationBadge 
            show={true} 
            count={count} 
            size="small"
            position="top-right"
          />
        )}
        {/* Effet de lueur */}
        <div className="absolute inset-0 rounded-lg bg-white opacity-20 animate-pulse"></div>
      </div>
    </div>
  );
}

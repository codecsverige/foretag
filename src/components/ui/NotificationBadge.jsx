import React from "react";

/**
 * NotificationBadge - Badge professionnel pour les notifications
 * @param {boolean} show - Afficher ou masquer le badge
 * @param {number} count - Nombre à afficher (optionnel)
 * @param {string} size - Taille du badge: 'small', 'medium', 'large'
 * @param {string} position - Position: 'top-right', 'top-left', 'bottom-right', 'bottom-left'
 */
export default function NotificationBadge({ 
  show = false, 
  count = null, 
  size = 'medium',
  position = 'top-right'
}) {
  if (!show) return null;

  const sizeClasses = {
    small: 'w-2.5 h-2.5 text-xs',
    medium: 'w-4 h-4 sm:w-5 sm:h-5 text-xs',
    large: 'w-6 h-6 text-sm'
  };

  const positionClasses = {
    'top-right': '-top-2 -right-2',
    'top-left': '-top-2 -left-2',
    'bottom-right': '-bottom-2 -right-2',
    'bottom-left': '-bottom-2 -left-2'
  };

  return (
    <div className={`absolute ${positionClasses[position]} z-20`}>
      <div className="relative">
        {/* Badge principal */}
        <div className={`${sizeClasses[size]} bg-gradient-to-r from-orange-500 to-orange-600 rounded-full shadow-lg flex items-center justify-center font-bold text-white border-2 border-white`}>
          {count && count > 0 ? (
            <span className="leading-none">
              {count > 99 ? '99+' : count}
            </span>
          ) : (
            <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
          )}
        </div>
        
        {/* Animation de pulsation */}
        <div className={`absolute inset-0 ${sizeClasses[size]} bg-orange-400 rounded-full animate-ping opacity-75`}></div>
        
        {/* Cercle externe d'animation */}
        <div className={`absolute inset-0 ${sizeClasses[size]} bg-orange-300 rounded-full animate-pulse opacity-50`}></div>
        
        {/* Lueur externe */}
        <div className={`absolute inset-0 ${sizeClasses[size]} bg-orange-200 rounded-full blur-sm opacity-30 animate-pulse`}></div>
      </div>
    </div>
  );
}

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { HiClock, HiCurrencyDollar } from 'react-icons/hi2';
import { BUS_ROUTES_CONFIG } from '../../config/busRoutes.config';

export default function BusCard({ route }) {
  const navigate = useNavigate();
  
  const handleClick = () => {
    navigate(`/bus/${route.id}`);
  };

  // Format time display
  const formatTime = (routeTime, routeTs) => {
    if (routeTs && routeTs.seconds) {
      const d = new Date(routeTs.seconds * 1000);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return routeTime || '--:--';
  };

  return (
    <div 
      onClick={handleClick}
      className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer p-4 border border-gray-100"
    >
      {/* Company and Bus Icon */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl text-blue-600">🚌</span>
          <span className="font-semibold text-gray-900">{route.company}</span>
        </div>
        <span className="text-sm text-gray-500">Buss</span>
      </div>

      {/* Route */}
      <div className="mb-3">
        <div className="flex items-center gap-2 text-lg">
          <span className="font-medium">{route.from}</span>
          <span className="text-gray-400">→</span>
          <span className="font-medium">{route.to}</span>
        </div>
      </div>

      {/* Time and Duration */}
      <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
        <div className="flex items-center gap-1">
          <HiClock className="w-4 h-4" />
          <span>{formatTime(route.departureTime, route.departureAt)} - {formatTime(route.arrivalTime, route.arrivalAt)}</span>
        </div>
        <span>•</span>
        <span>{route.duration || 'N/A'}</span>
      </div>

      {/* Price */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1">
          <HiCurrencyDollar className="w-5 h-5 text-green-600" />
          <span className="text-xl font-bold text-gray-900">{route.price} kr</span>
        </div>
        <span className="text-sm text-gray-500">
          {route.availableSeats} platser kvar
        </span>
      </div>

      {/* Amenities */}
      {route.amenities && route.amenities.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {route.amenities.slice(0, 4).map(amenity => {
            const amenityConfig = BUS_ROUTES_CONFIG.amenities[amenity];
            return amenityConfig ? (
              <span 
                key={amenity}
                className="text-lg" 
                title={amenityConfig.label}
              >
                {amenityConfig.icon}
              </span>
            ) : null;
          })}
          {route.amenities.length > 4 && (
            <span className="text-sm text-gray-500">+{route.amenities.length - 4}</span>
          )}
        </div>
      )}
    </div>
  );
}
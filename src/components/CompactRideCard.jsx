import React from "react";
import { FaMapMarkerAlt, FaClock, FaCalendarAlt, FaUsers, FaEuroSign } from "react-icons/fa";
import { extractCity } from "../utils/address";

export default function CompactRideCard({ ride, type = "driver", onAction, className = "" }) {
  const formatTime = (timeStr) => {
    if (!timeStr) return "";
    return timeStr.slice(0, 5); // HH:MM
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString('sv-SE', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "active": return "border-green-500 bg-green-50 dark:bg-green-900/20";
      case "pending": return "border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20";
      case "cancelled": return "border-red-500 bg-red-50 dark:bg-red-900/20";
      case "completed": return "border-blue-500 bg-blue-50 dark:bg-blue-900/20";
      default: return "border-gray-300 bg-white dark:bg-slate-800 dark:border-slate-600";
    }
  };

  const getTypeIcon = () => {
    switch (type) {
      case "driver": return "🚗";
      case "passenger": return "👤";
      case "booking": return "📋";
      case "unlock": return "🔓";
      default: return "🚗";
    }
  };

  return (
    <div className={`
      relative border-l-4 rounded-xl p-4 shadow-sm hover:shadow-lg transition-all duration-300 
      ${getStatusColor(ride.status)} ${className}
    `}>
      {/* Enhanced Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="p-2 bg-white dark:bg-slate-700 rounded-lg shadow-sm">
            <span className="text-lg">{getTypeIcon()}</span>
          </div>
          <span className="text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-slate-600 px-3 py-1 rounded-full">
            {type}
          </span>
        </div>
        
        {(ride.costMode === 'fixed_price' && ride.price) ? (
          <div className="flex items-center gap-2 font-bold text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-3 py-1.5 rounded-full">
            <FaEuroSign className="w-3 h-3" />
            <span className="text-sm">{ride.price}</span>
          </div>
        ) : (ride.costMode === 'cost_share' && Number(ride.approxPrice) > 0) ? (
          <div className="flex items-center gap-2 font-bold text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 px-3 py-1.5 rounded-full">
            <FaEuroSign className="w-3 h-3" />
            <span className="text-sm">ca {Number(ride.approxPrice)}</span>
          </div>
        ) : null}
      </div>

      {/* Enhanced Route */}
      <div className="flex items-center gap-2 mb-3 p-3 bg-white dark:bg-slate-700 rounded-lg">
        <div className="flex items-center gap-2">
          <FaMapMarkerAlt className="w-4 h-4 text-red-500 flex-shrink-0" />
          <span className="font-semibold text-gray-800 dark:text-gray-200 truncate">
            {extractCity(ride.origin)}
          </span>
        </div>
        <div className="flex-1 flex justify-center">
          <span className="text-gray-400 dark:text-gray-500 font-bold">→</span>
        </div>
        <div className="flex items-center gap-2">
          <FaMapMarkerAlt className="w-4 h-4 text-green-500 flex-shrink-0" />
          <span className="font-semibold text-gray-800 dark:text-gray-200 truncate">
            {extractCity(ride.destination)}
          </span>
        </div>
      </div>

      {/* Enhanced Date & Time */}
      <div className="flex items-center gap-4 mb-3 text-sm text-gray-600 dark:text-gray-400">
        <div className="flex items-center gap-2 bg-gray-100 dark:bg-slate-600 px-3 py-1.5 rounded-lg">
          <FaCalendarAlt className="w-4 h-4" />
          <span className="font-medium">{formatDate(ride.date)}</span>
        </div>
        <div className="flex items-center gap-2 bg-gray-100 dark:bg-slate-600 px-3 py-1.5 rounded-lg">
          <FaClock className="w-4 h-4" />
          <span className="font-medium">{formatTime(ride.departureTime || ride.time)}</span>
        </div>
        {(ride.availableSeats || ride.seats) && (
          <div className="flex items-center gap-2 bg-gray-100 dark:bg-slate-600 px-3 py-1.5 rounded-lg">
            <FaUsers className="w-4 h-4" />
            <span className="font-medium">{ride.availableSeats || ride.seats}</span>
          </div>
        )}
      </div>

      {/* Enhanced Message/description */}
      {ride.message && (
        <div className="text-sm text-gray-600 dark:text-gray-400 italic mb-3 p-3 bg-gray-50 dark:bg-slate-700 rounded-lg line-clamp-2">
          {ride.message}
        </div>
      )}

      {/* Enhanced Actions */}
      {onAction && (
        <div className="flex justify-end pt-3 border-t border-gray-200 dark:border-slate-600">
          {onAction}
        </div>
      )}

      {/* Enhanced Status indicator */}
      {ride.status && ride.status !== "active" && (
        <div className="absolute top-3 right-3">
          <div className={`
            text-sm px-3 py-1 rounded-full font-semibold shadow-sm
            ${ride.status === "completed" ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400" : ""}
            ${ride.status === "cancelled" ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400" : ""}
            ${ride.status === "pending" ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400" : ""}
          `}>
            {ride.status}
          </div>
        </div>
      )}
    </div>
  );
}

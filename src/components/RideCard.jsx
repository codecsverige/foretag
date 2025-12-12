import React from "react";

export default function RideCard({ ride, type = "driver", onAction, children }) {
  const getStatusColor = (status) => {
    switch (status) {
      case "active": return "bg-emerald-50 border-l-emerald-400";
      case "pending": return "bg-yellow-50 border-l-yellow-400";
      case "cancelled": return "bg-rose-50 border-l-rose-400";
      case "completed": return "bg-blue-50 border-l-blue-400";
      default: return "bg-gray-50 border-l-gray-400";
    }
  };

  return (
    <div className={`border-0 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-300 border-l-4 ${getStatusColor(ride.status)}`}>
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="font-bold text-gray-800 text-base">
            {ride.origin} 
            <span className="text-gray-400 mx-2">→</span> 
            {ride.destination}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-sm text-gray-600 bg-white rounded-lg px-3 py-1 shadow-sm">
            📅 {ride.date} • 🕐 {ride.time}
          </div>
          {ride && (
            ride.costMode === 'fixed_price' && ride.price ? (
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-3 py-1 rounded-lg font-semibold">
                {ride.price} kr
              </div>
            ) : (ride.costMode === 'cost_share' && Number(ride.approxPrice) > 0) ? (
              <div className="bg-gradient-to-r from-yellow-500 to-amber-600 text-white px-3 py-1 rounded-lg font-semibold">
                ca {Number(ride.approxPrice)} kr
              </div>
            ) : null
          )}
        </div>
      </div>

      {/* Content */}
      {children}

      {/* Actions */}
      {onAction && (
        <div className="flex justify-end pt-3">
          {onAction}
        </div>
      )}
    </div>
  );
}

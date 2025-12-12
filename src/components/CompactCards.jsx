import React from "react";
import { extractCity } from "../utils/address";
import { DeleteButton, ContactButton, CancelButton } from "./ui/CompactActionButton.jsx";

// Compact Passenger Ad Card
export function CompactPassengerAdCard({ ad, onDelete }) {
  const isUnlocked = ad.bookingType === "contact_unlock" || ad.archived === true;
  
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all duration-200">
      {/* Header compact */}
      <div className={`p-3 rounded-t-lg text-white ${
        isUnlocked 
          ? "bg-gradient-to-r from-green-500 to-emerald-600" 
          : "bg-gradient-to-r from-blue-500 to-indigo-600"
      }`}>
        <div className="flex justify-between items-start">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold mb-1 truncate">
              {extractCity(ad.origin)} → {extractCity(ad.destination)}
            </h3>
            <div className="flex gap-2 text-xs opacity-90">
              <span>📅 {ad.date}</span>
              <span>🕐 {ad.departureTime}</span>
            </div>
          </div>
          <div className="ml-2">
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              isUnlocked 
                ? "bg-green-100 text-green-800" 
                : "bg-yellow-100 text-yellow-800"
            }`}>
              {isUnlocked ? "Upplåst" : "Publicerad"}
            </span>
          </div>
        </div>
      </div>

      {/* Content compact */}
      <div className="p-3">
        {ad.message && (
          <p className="text-xs text-gray-600 mb-2 line-clamp-2">{ad.message}</p>
        )}
        
        <div className="flex justify-between items-center">
          <div className="text-xs text-gray-500">
            Passagerar-annons
          </div>
          <DeleteButton size="xs" onClick={onDelete} />
        </div>
      </div>
    </div>
  );
}

// Compact Seat Booking Card
export function CompactSeatBookingCard({ booking, onCancel }) {
  const getStatusColor = (status) => {
    if (status?.includes("cancelled")) return "bg-red-100 text-red-700";
    if (status?.includes("confirmed")) return "bg-green-100 text-green-700";
    return "bg-blue-100 text-blue-700";
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all duration-200">
      {/* Header compact */}
      <div className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white p-3 rounded-t-lg">
        <div className="flex justify-between items-start">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold mb-1 truncate">
              {extractCity(booking.origin || booking.rideOrigin)} → {extractCity(booking.destination || booking.rideDestination)}
            </h3>
            <div className="flex gap-2 text-xs opacity-90">
              <span>📅 {booking.date || booking.rideDate}</span>
              <span>🕐 {booking.departureTime || booking.rideTime}</span>
            </div>
          </div>
          {booking.price && (
            <div className="bg-white bg-opacity-20 rounded px-2 py-1 text-xs font-bold ml-2">
              {booking.price} kr
            </div>
          )}
        </div>
      </div>

      {/* Content compact */}
      <div className="p-3">
        <div className="flex justify-between items-center mb-2">
          <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(booking.status)}`}>
            {booking.status || "Aktiv"}
          </span>
          <span className="text-xs text-gray-500">
            Bokning
          </span>
        </div>

        {/* Driver contact shared */}
        {(booking.driverPhoneShared || booking.driverEmailShared) && (
          <div className="mb-2 p-2 bg-gradient-to-r from-emerald-50 to-green-50 rounded-lg text-[11px] text-emerald-800 flex items-center gap-2">
            <span>✅</span>
            <span className="font-semibold">Förarens kontakt delad</span>
            <div className="flex-1"></div>
            {booking.driverPhoneShared && (
              <a href={`tel:${booking.driverPhoneShared}`} className="underline text-emerald-700 truncate max-w-[90px]">{booking.driverPhoneShared}</a>
            )}
            {booking.driverEmailShared && (
              <a href={`mailto:${booking.driverEmailShared}`} className="underline text-emerald-700 truncate max-w-[120px]">{booking.driverEmailShared}</a>
            )}
          </div>
        )}

        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            <ContactButton size="xs" />
            <CancelButton size="xs" onClick={onCancel} />
          </div>
        </div>
      </div>
    </div>
  );
}

// Compact Unlock Card
export function CompactUnlockCard({ unlock, viewerUid }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all duration-200">
      {/* Header compact */}
      <div className="bg-gradient-to-r from-orange-500 to-yellow-600 text-white p-3 rounded-t-lg">
        <div className="flex justify-between items-start">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold mb-1 truncate">
              {extractCity(unlock.origin)} → {extractCity(unlock.destination)}
            </h3>
            <div className="flex gap-2 text-xs opacity-90">
              <span>📅 {unlock.date}</span>
              <span>🕐 {unlock.departureTime}</span>
            </div>
          </div>
          <div className="ml-2">
            <span className="text-xs bg-white bg-opacity-20 rounded px-2 py-0.5">
              🔓 Upplåst
            </span>
          </div>
        </div>
      </div>

      {/* Content compact */}
      <div className="p-3">
        {unlock.message && (
          <p className="text-xs text-gray-600 mb-2 line-clamp-2">{unlock.message}</p>
        )}
        
        <div className="flex justify-between items-center">
          <div className="text-xs text-gray-500">
            Kontakt upplåst
          </div>
          <ContactButton size="xs" />
        </div>
      </div>
    </div>
  );
}

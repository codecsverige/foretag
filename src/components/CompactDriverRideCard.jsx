import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { extractCity } from "../utils/address";
import { DeleteButton, CancelButton } from "./ui/CompactActionButton.jsx";

const BOOKINGS_PER_PAGE = 3; // Réduit pour version compacte

function CompactDriverRideCard({ ride, bookings, onDeleteRide, onCancelBooking, viewerUid }) {
  const nav = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [showBookings, setShowBookings] = useState(false);

  /* ───── إحصائيات محسنة ───── */
  const stats = useMemo(() => {
    const total = bookings.length;
    const active = bookings.filter((b) => !b.status?.startsWith("cancelled")).length;
    const newBookings = bookings.filter((b) => 
      b.createdAt > Date.now() - (24 * 60 * 60 * 1000) && !b.status?.startsWith("cancelled")
    ).length;

    return { total, active, newBookings };
  }, [bookings]);

  /* ───── حجوزات الصفحة الحالية ───── */
  const currentBookings = useMemo(() => {
    const startIndex = (currentPage - 1) * BOOKINGS_PER_PAGE;
    return bookings.slice(startIndex, startIndex + BOOKINGS_PER_PAGE);
  }, [bookings, currentPage]);

  const totalPages = Math.ceil(stats.total / BOOKINGS_PER_PAGE);

  return (
    <article className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
      {/* Header compact */}
      <header className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-3">
        <div className="flex justify-between items-start">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold mb-1 truncate">
              {extractCity(ride.origin)} → {extractCity(ride.destination)}
            </h3>
            <div className="flex flex-wrap gap-2 text-xs opacity-90">
              <span className="bg-white bg-opacity-20 rounded px-2 py-0.5">
                📅 {ride.date}
              </span>
              <span className="bg-white bg-opacity-20 rounded px-2 py-0.5">
                🕐 {ride.departureTime}
              </span>
            </div>
          </div>
          
          {(ride.costMode === 'fixed_price' && ride.price) ? (
            <div className="bg-white bg-opacity-20 rounded px-2 py-1 text-xs font-bold ml-2">
              {ride.price} kr
            </div>
          ) : (ride.costMode === 'cost_share' && Number(ride.approxPrice) > 0) ? (
            <div className="bg-white bg-opacity-20 rounded px-2 py-1 text-xs font-bold ml-2">
              ca {Number(ride.approxPrice)} kr
            </div>
          ) : null}
        </div>
      </header>

      {/* Stats compact */}
      <div className="p-3 bg-gray-50 border-b">
        <div className="flex items-center justify-between">
          <div className="flex gap-3 text-xs">
            <div className="text-center">
              <div className="font-bold text-blue-600">{stats.active}</div>
              <div className="text-gray-500">Aktiva</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-gray-600">{stats.total}</div>
              <div className="text-gray-500">Totalt</div>
            </div>
            {stats.newBookings > 0 && (
              <div className="text-center">
                <div className="font-bold text-green-600">{stats.newBookings}</div>
                <div className="text-gray-500">Nya</div>
              </div>
            )}
          </div>
          
          {stats.total > 0 && (
            <button
              onClick={() => setShowBookings(!showBookings)}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
            >
              {showBookings ? "Dölj" : "Visa"} bokningar
            </button>
          )}
        </div>

        {/* Progress bar */}
        {stats.total > 0 && (
          <div className="mt-2 bg-gray-200 rounded-full h-1.5">
            <div 
              className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${(stats.active / stats.total) * 100}%` }}
            />
          </div>
        )}
      </div>

      {/* Bookings list (collapsible) */}
      {showBookings && stats.total > 0 && (
        <div className="p-3 border-b">
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {currentBookings.map((booking) => (
              <div key={booking.id} className="flex items-center justify-between bg-gray-50 rounded p-2 text-xs">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-800 truncate">
                    {booking.fullName || "Användare"}
                  </div>
                  <div className="text-gray-500 text-xs">
                    {booking.status?.startsWith("cancelled") ? "Avbruten" : "Aktiv"}
                  </div>
                </div>
                
                <div className="flex gap-1 ml-2">
                  <button
                    onClick={() => nav(`/unlock/${booking.id}`)}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-xs"
                  >
                    Lås upp
                  </button>
                  <CancelButton
                    size="xs"
                    onClick={() => onCancelBooking(booking)}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Pagination compact */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-2 text-xs">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-2 py-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
              >
                ←
              </button>
              <span className="px-2">{currentPage}/{totalPages}</span>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-2 py-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
              >
                →
              </button>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="p-3 flex justify-end">
        <DeleteButton 
          size="sm"
          onClick={onDeleteRide}
        />
      </div>
    </article>
  );
}

export default React.memo(CompactDriverRideCard);

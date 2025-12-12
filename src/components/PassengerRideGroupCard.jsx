/* ──────────────────────────────────────────────
   src/components/PassengerRideGroupCard.jsx
   Groups all bookings for same ride - matching DriverRideCard style
────────────────────────────────────────────── */
import React, { useState, useMemo, useRef, useEffect } from "react";
import { runTransaction, doc } from "firebase/firestore";
import { db } from "../firebase/firebase.js";
import { extractCity } from "../utils/address.js";
import { sanitizeInput } from "../utils/security.js";
import { detectContact, getContactViolationMessage } from "../utils/messagingGuard.js";

export default function PassengerRideGroupCard({ rideGroup, viewerUid }) {
  const [selectedBookingId, setSelectedBookingId] = useState(null);
  const [inputs, setInputs] = useState({});
  const [busyMap, setBusyMap] = useState({});
  const [errorsMap, setErrorsMap] = useState({});
  const listRefs = useRef({});

  const { origin, destination, date, time, bookings } = rideGroup;
  const totalBookings = bookings.length;

  // Auto-select first booking
  useEffect(() => {
    if (bookings.length > 0 && !selectedBookingId) {
      setSelectedBookingId(bookings[0].id);
    }
  }, [bookings, selectedBookingId]);

  const selectedBooking = bookings.find(b => b.id === selectedBookingId);

  // Mark messages as read
  useEffect(() => {
    if (!selectedBookingId) return;
    (async () => {
      try {
        await runTransaction(db, async (tx) => {
          const ref = doc(db, "bookings", selectedBookingId);
          const snap = await tx.get(ref);
          if (!snap.exists()) return;
          const data = snap.data() || {};
          const existing = Array.isArray(data.messages) ? data.messages : [];
          let changed = false;
          const next = existing.map((m) => {
            if (m.from !== viewerUid && m.read === false) {
              changed = true;
              return { ...m, read: true };
            }
            return m;
          });
          if (changed) tx.update(ref, { messages: next });
        });
      } catch (err) {
        console.error("Mark read error:", err);
      }
    })();
  }, [selectedBookingId, viewerUid]);

  // Auto-scroll
  useEffect(() => {
    if (!selectedBookingId) return;
    const ref = listRefs.current[selectedBookingId];
    if (ref) {
      try { ref.scrollTop = ref.scrollHeight; } catch {}
    }
  }, [selectedBookingId, bookings]);

  const handleSend = async (bookingId) => {
    const trimmed = (inputs[bookingId] || "").trim();
    if (!trimmed || busyMap[bookingId]) return;

    const violation = detectContact(trimmed);
    if (violation.detected) {
      setErrorsMap(prev => ({ ...prev, [bookingId]: getContactViolationMessage(violation) }));
      return;
    }

    setErrorsMap(prev => ({ ...prev, [bookingId]: "" }));
    setBusyMap(prev => ({ ...prev, [bookingId]: true }));

    try {
      const sanitized = sanitizeInput(trimmed, "message");
      const newMsg = {
        from: viewerUid,
        text: sanitized,
        ts: Date.now(),
        read: false,
        senderUid: viewerUid
      };

      await runTransaction(db, async (tx) => {
        const ref = doc(db, "bookings", bookingId);
        const snap = await tx.get(ref);
        if (!snap.exists()) throw new Error("Booking not found");
        const data = snap.data() || {};
        const existing = Array.isArray(data.messages) ? data.messages : [];
        tx.update(ref, { messages: [...existing, newMsg] });
      });

      setInputs(prev => ({ ...prev, [bookingId]: "" }));
    } catch (err) {
      console.error("Send error:", err);
      setErrorsMap(prev => ({ ...prev, [bookingId]: "Kunde inte skicka meddelandet" }));
    } finally {
      setBusyMap(prev => ({ ...prev, [bookingId]: false }));
    }
  };

  return (
    <article className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-200 dark:border-slate-700">
      
      {/* Modern Header - Matching DriverRideCard */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLW9wYWNpdHk9IjAuMSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-20"></div>
        
        <div className="relative p-4 sm:p-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-2xl">🗺️</span>
                </div>
                <h2 className="text-xl font-bold text-white">
                  {extractCity(origin || '')}
                  <span className="mx-2 text-white/60">→</span>
                  {extractCity(destination || '')}
                </h2>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-md rounded-lg px-3 py-1.5 text-sm">
                  <span className="text-white/90">📅</span>
                  <span className="text-white font-medium">{date}</span>
                </div>
                <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-md rounded-lg px-3 py-1.5 text-sm">
                  <span className="text-white/90">🕐</span>
                  <span className="text-white font-medium">{time}</span>
                </div>
                <div className="flex items-center gap-1 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full px-2 py-1">
                  <span>⭐</span>
                  <span className="font-semibold text-xs">Min resa</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Communication Info */}
      <section className="p-3 border-b border-gray-100 dark:border-slate-700 bg-gradient-to-r from-gray-50 to-blue-50 dark:from-slate-700 dark:to-slate-600">
        <div className="p-3 bg-blue-50 dark:from-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
          <div className="flex items-start gap-2">
            <span className="text-lg mt-0.5">💬</span>
            <div className="flex-1">
              <p className="font-semibold text-sm text-blue-900 dark:text-blue-200">
                {totalBookings} förfrågan{totalBookings > 1 ? 'ar' : ''} till förare
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300">
                Chatta med olika förare för samma resa
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Drivers List + Chat - Matching DriverRideCard Layout */}
      <section className="p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Drivers Tabs */}
          <div className="w-full lg:w-80 border-b lg:border-b-0 lg:border-r border-gray-200 dark:border-slate-700">
            <div className="p-3 bg-gray-50 dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700">
              <h3 className="font-bold text-gray-800 dark:text-gray-200 text-sm">
                🚗 Förare ({totalBookings})
              </h3>
            </div>
            <div className="overflow-y-auto max-h-[300px] lg:max-h-[500px]">
              <div className="flex flex-col">
                {bookings.map((booking, index) => {
                  const isSelected = booking.id === selectedBookingId;
                  const messages = Array.isArray(booking.messages) ? booking.messages : [];
                  const unreadCount = messages.filter(m => m.from !== viewerUid && m.read === false).length;
                  const cancelled = booking.status?.startsWith("cancelled");
                  const paid = !!booking.paypal || !!booking.paidAt;
                  
                  return (
                    <button
                      key={booking.id}
                      onClick={() => setSelectedBookingId(booking.id)}
                      className={`
                        flex items-start gap-3 p-3 border-b border-gray-200 dark:border-slate-700 
                        transition-colors text-left w-full
                        ${isSelected 
                          ? 'bg-indigo-50 dark:bg-indigo-900/30 border-l-4 border-l-indigo-600' 
                          : 'hover:bg-gray-50 dark:hover:bg-slate-700/50'
                        }
                        ${cancelled ? 'opacity-50' : ''}
                      `}
                    >
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-900 dark:text-gray-100 text-sm mb-1">
                          {booking.driverName || 'Förare'}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          {paid ? '✅ Bekräftad' : cancelled ? '❌ Avbruten' : '⏳ Väntande'}
                        </div>
                      </div>
                      {unreadCount > 0 && (
                        <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {unreadCount}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Chat Window */}
          <div className="flex-1 flex flex-col bg-white dark:bg-slate-800" style={{ minHeight: '400px', maxHeight: '600px' }}>
            {selectedBooking ? (
              <>
                {/* Chat Header */}
                <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-b border-gray-200 dark:border-slate-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-gray-900 dark:text-gray-100">
                        Chatt med {selectedBooking.driverName || 'Förare'}
                      </h4>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {selectedBooking.status?.startsWith('cancelled') ? '❌ Avbruten' : selectedBooking.paypal ? '✅ Bekräftad' : '⏳ Väntande'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div 
                  ref={el => listRefs.current[selectedBooking.id] = el}
                  className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 dark:bg-slate-900"
                >
                  {(selectedBooking.messages || [])
                    .filter((msg) => {
                      try {
                        const myFirst = (selectedBooking.messages || []).find(m => (m.from === viewerUid || m.senderUid === viewerUid) && String(m.text || '').trim());
                        if (!myFirst) return true;
                        const sameSender = (msg.from === viewerUid || msg.senderUid === viewerUid);
                        const sameText = String(msg.text || '').trim() === String(myFirst.text || '').trim();
                        // Hide the viewer's initial booking text from chat (already shown in notification)
                        return !(sameSender && sameText);
                      } catch { return true; }
                    })
                    .map((msg, idx) => {
                    const isMine = msg.from === viewerUid || msg.senderUid === viewerUid;
                    return (
                      <div key={idx} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                        <div className={`
                          max-w-[80%] rounded-2xl px-4 py-2 shadow-sm
                          ${isMine 
                            ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white' 
                            : 'bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-slate-600'
                          }
                        `}>
                          <p className="text-sm whitespace-pre-wrap break-words">{msg.text}</p>
                          <p className={`text-[10px] mt-1 ${isMine ? 'text-white/70' : 'text-gray-500 dark:text-gray-400'}`}>
                            {new Date(msg.ts).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Input */}
                {!selectedBooking.status?.startsWith("cancelled") && (
                  <div className="p-4 bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700">
                    {errorsMap[selectedBooking.id] && (
                      <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                        {errorsMap[selectedBooking.id]}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={inputs[selectedBooking.id] || ""}
                        onChange={e => setInputs(prev => ({ ...prev, [selectedBooking.id]: e.target.value }))}
                        onKeyPress={e => e.key === 'Enter' && handleSend(selectedBooking.id)}
                        placeholder="Skriv meddelande..."
                        className="flex-1 px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
                        disabled={busyMap[selectedBooking.id]}
                      />
                      <button
                        onClick={() => handleSend(selectedBooking.id)}
                        disabled={busyMap[selectedBooking.id] || !(inputs[selectedBooking.id] || "").trim()}
                        className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {busyMap[selectedBooking.id] ? '...' : '📤'}
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
                <div className="text-center">
                  <div className="text-4xl mb-3">💬</div>
                  <p>Välj en förare för att chatta</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </article>
  );
}

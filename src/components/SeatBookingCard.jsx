/*  src/components/SeatBookingCard.jsx
    –  Modern design matching DriverRideCard style
-------------------------------------------------------------- */
import React, { useState, useMemo, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { runTransaction, doc } from "firebase/firestore";
import { db } from "../firebase/firebase.js";
import { extractCity } from "../utils/address.js";
import { sanitizeInput } from "../utils/security.js";
import { detectContact, getContactViolationMessage } from "../utils/messagingGuard.js";

export default function SeatBookingCard({ booking, viewerUid, onCancel }) {
  const navigate = useNavigate();
  const [chatOpen, setChatOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const listRef = useRef(null);

  const cancelled = booking.status?.startsWith("cancelled");
  const paid = !!booking.paypal || !!booking.paidAt;
  const driverShared = !!booking.driverPhoneShared || !!booking.driverEmailShared;
  
  const messages = useMemo(() => Array.isArray(booking.messages) ? booking.messages : [], [booking.messages]);
  const unreadCount = useMemo(() => {
    return messages.filter(m => m.from !== viewerUid && m.read === false).length;
  }, [messages, viewerUid]);

  // Mark messages as read when opening chat
  useEffect(() => {
    if (!chatOpen) return;
    (async () => {
      try {
        await runTransaction(db, async (tx) => {
          const ref = doc(db, "bookings", booking.id);
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
  }, [chatOpen, booking.id, viewerUid]);

  // Auto-scroll chat
  useEffect(() => {
    if (!chatOpen) return;
    try {
      if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
    } catch {}
  }, [messages, chatOpen]);

  const handleSendMessage = async () => {
    const trimmed = (message || "").trim();
    if (!trimmed || busy) return;

    // Contact detection
    const violation = detectContact(trimmed);
    if (violation.detected) {
      setError(getContactViolationMessage(violation));
      return;
    }

    setError("");
    setBusy(true);

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
        const ref = doc(db, "bookings", booking.id);
        const snap = await tx.get(ref);
        if (!snap.exists()) throw new Error("Booking not found");
        const data = snap.data() || {};
        const existing = Array.isArray(data.messages) ? data.messages : [];
        tx.update(ref, { messages: [...existing, newMsg] });
      });

      setMessage("");
    } catch (err) {
      console.error("Send error:", err);
      setError("Kunde inte skicka meddelandet");
    } finally {
      setBusy(false);
    }
  };

  return (
    <article className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-200 dark:border-slate-700">
      
      {/* Modern Header - Matching Driver Style */}
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
                  {extractCity(booking.ride_origin || '')}
                  <span className="mx-2 text-white/60">→</span>
                  {extractCity(booking.ride_destination || '')}
                </h2>
              </div>
              
              {/* Info Tags */}
              <div className="flex flex-wrap gap-2">
                <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-md rounded-lg px-3 py-1.5 text-sm">
                  <span className="text-white/90">📅</span>
                  <span className="text-white font-medium">{booking.ride_date}</span>
                </div>
                <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-md rounded-lg px-3 py-1.5 text-sm">
                  <span className="text-white/90">🕐</span>
                  <span className="text-white font-medium">{booking.ride_time}</span>
                </div>
                <div className="flex items-center gap-1 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full px-2 py-1">
                  <span>⭐</span>
                  <span className="font-semibold text-xs">Min bokning</span>
                </div>
              </div>
            </div>

            {/* Status Badge */}
            <div className="shrink-0">
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm shadow-lg ${
                cancelled 
                  ? 'bg-rose-100 text-rose-700' 
                  : paid 
                  ? 'bg-emerald-100 text-emerald-700' 
                  : 'bg-amber-100 text-amber-700'
              }`}>
                <span className="text-lg">
                  {cancelled ? '❌' : paid ? '✅' : '⏳'}
                </span>
                <span>{cancelled ? 'Avbruten' : paid ? 'Bekräftad' : 'Väntande'}</span>
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
              <p className="font-semibold text-sm text-blue-900 dark:text-blue-200 mb-1">
                Kommunikation
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300">
                {paid && driverShared 
                  ? "Kontaktuppgifter delade. Du kan kontakta föraren."
                  : paid
                  ? "Föraren kommer att kontakta dig direkt."
                  : "Chatta med föraren. Väntar på bekräftelse."
                }
              </p>
            </div>
          </div>
        </div>

        {/* Unread Badge */}
        {unreadCount > 0 && (
          <div className="mt-2 flex items-center gap-2 text-sm">
            <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
              {unreadCount}
            </div>
            <span className="text-gray-700 dark:text-gray-300 font-medium">Nya meddelanden</span>
          </div>
        )}
      </section>

      {/* Chat Section - Matching Driver Style */}
      <section className="p-4">
        {!chatOpen ? (
          <button
            onClick={() => setChatOpen(true)}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
          >
            <span>💬</span>
            <span>Öppna chatt med föraren</span>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {unreadCount}
              </span>
            )}
          </button>
        ) : (
          <div className="border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden">
            {/* Chat Header */}
            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-gray-900 dark:text-gray-100">
                  Chatt med föraren
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {booking.driverName || 'Förare'}
                </p>
              </div>
              <button
                onClick={() => setChatOpen(false)}
                className="px-3 py-1 bg-gray-200 hover:bg-gray-300 dark:bg-slate-600 dark:hover:bg-slate-500 rounded-lg text-xs font-semibold transition-colors"
              >
                ✕ Stäng
              </button>
            </div>

            {/* Messages */}
            <div 
              ref={listRef}
              className="h-64 overflow-y-auto p-4 space-y-3 bg-gray-50 dark:bg-slate-900"
            >
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                  <div className="text-center">
                    <div className="text-4xl mb-2">💬</div>
                    <p className="text-sm">Inga meddelanden ännu</p>
                  </div>
                </div>
              ) : (
                messages.map((msg, idx) => {
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
                })
              )}
            </div>

            {/* Input */}
            {!cancelled && (
              <div className="p-4 bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700">
                {error && (
                  <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                    {error}
                  </div>
                )}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Skriv meddelande..."
                    className="flex-1 px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
                    disabled={busy}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={busy || !message.trim()}
                    className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {busy ? '...' : '📤'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Contact Info - If Shared */}
      {paid && driverShared && (
        <section className="px-4 pb-4">
          <div className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/30 dark:to-green-900/30 rounded-lg p-4 border border-emerald-200 dark:border-emerald-700">
            <h4 className="text-sm font-bold text-emerald-700 dark:text-emerald-400 mb-3 flex items-center gap-2">
              <span className="text-lg">📞</span>
              <span>Förarens kontaktuppgifter</span>
            </h4>
            <div className="grid gap-3">
              {booking.driverPhoneShared && (
                <div className="flex items-center gap-3 p-3 bg-white dark:bg-emerald-900/20 rounded-lg">
                  <span className="text-lg">📞</span>
                  <div className="flex-1">
                    <div className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">Telefon</div>
                    <a href={`tel:${booking.driverPhoneShared}`} className="font-bold text-emerald-700 dark:text-emerald-300">
                      {booking.driverPhoneShared}
                    </a>
                  </div>
                </div>
              )}
              {booking.driverEmailShared && (
                <div className="flex items-center gap-3 p-3 bg-white dark:bg-emerald-900/20 rounded-lg">
                  <span className="text-lg">📧</span>
                  <div className="flex-1">
                    <div className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">E-post</div>
                    <a href={`mailto:${booking.driverEmailShared}`} className="font-bold text-emerald-700 dark:text-emerald-300 break-all">
                      {booking.driverEmailShared}
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Cancel Button - Matching Driver Delete Style */}
      {!cancelled && (
        <footer className="px-4 pb-4">
          <div className="flex justify-end">
            <button
              onClick={onCancel}
              className="group bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 flex items-center gap-2"
            >
              <span className="group-hover:scale-110 transition-transform duration-200">❌</span>
              <span>Avbryt bokning</span>
            </button>
          </div>
        </footer>
      )}
    </article>
  );
}

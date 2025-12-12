/* ──────────────────────────────────────────────
   src/components/DriverRideCard.jsx
   بطاقة إعلان السائق + قائمة الحجوزات - محسن للأداء
────────────────────────────────────────────── */
import React, { useState, useMemo, useCallback, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import { extractCity } from "../utils/address.js";
import { isUnlocked, COMMISSION } from "../utils/booking.js";
import Badge from "./Badge.jsx";
import ReportDialog from "./ReportDialog.jsx";
import { submitUnlockReport } from "../services/reportService.js";
import logger from "../utils/logger.js";
import { 
  BookingStatusExplainer, 
  PriceExplainer, 
  PassengerInfoExplainer, 
  ActionExplainer,
  BookingsSummary 
} from "./BookingEnhancer.jsx";
import SeatBookingInboxCard from "./inbox/SeatBookingInboxCard";
import { addDoc, collection, updateDoc, doc, runTransaction } from "firebase/firestore";
import { db } from "../firebase/firebase.js";
import { sanitizeInput } from "../utils/security.js";
import { detectContact, getContactViolationMessage } from "../utils/messagingGuard.js";
import { sendBookingApprovedNotification, sendBookingRejectedNotification } from "../services/notificationService.js";
import { useAuth } from "../context/AuthContext.jsx";

const BOOKINGS_PER_PAGE = 6; // عدد الحجوزات في الصفحة - محسن للعرض

/**
 * DriverRideCard
 *
 * @param {Object}   ride            كائن الرحلة
 * @param {Array}    bookings        حجوزات المقاعد المرتبطة
 * @param {Function} onDeleteRide    استدعاء عند الحذف
 * @param {Function} onCancelBooking استدعاء عند إلغاء حجز (من طرف السائق)
 */
function DriverRideCard({ ride, bookings, onDeleteRide, onCancelBooking, viewerUid }) {
  const nav = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedBookingId, setSelectedBookingId] = useState(null);
  const [inputs, setInputs] = useState({});
  const [busyMap, setBusyMap] = useState({});
  const [errorsMap, setErrorsMap] = useState({});
  const [busy, setBusy] = useState(false);
  const listRefs = React.useRef({});
  const seeded = React.useRef(new Set());

  /* ───── إحصائيات محسنة ───── */
  const stats = useMemo(() => {
    const total = bookings.length;
    const active = bookings.filter((b) => !b.status?.startsWith("cancelled")).length;
    const unlocked = bookings.filter(isUnlocked).length;
    const newBookings = bookings.filter((b) => 
      b.createdAt > Date.now() - (24 * 60 * 60 * 1000) && !b.status?.startsWith("cancelled")
    ).length;

    return { total, active, unlocked, newBookings };
  }, [bookings]);

  /* ───── حجوزات الصفحة الحالية ───── */
  const currentBookings = useMemo(() => {
    const startIndex = (currentPage - 1) * BOOKINGS_PER_PAGE;
    return bookings.slice(startIndex, startIndex + BOOKINGS_PER_PAGE);
  }, [bookings, currentPage]);

  const totalPages = Math.ceil(stats.total / BOOKINGS_PER_PAGE);

  // Select first booking by default
  useEffect(() => {
    if (currentBookings.length > 0 && !selectedBookingId) {
      setSelectedBookingId(currentBookings[0].id);
    }
  }, [currentBookings, selectedBookingId]);

  // Auto-scroll for selected booking
  useEffect(() => {
    if (!selectedBookingId) return;
    const ref = listRefs.current[selectedBookingId];
    if (ref) {
      try { ref.scrollTop = ref.scrollHeight; } catch {}
    }
  }, [selectedBookingId, bookings]);

  // Mark messages as read when selecting a booking
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
          if (changed) {
            tx.update(ref, { messages: next });
          }
        });
      } catch (err) {
        console.error("Mark read error:", err);
      }
    })();
  }, [selectedBookingId, viewerUid]);

  const handleSend = useCallback(async (bookingId) => {
    const text = (inputs[bookingId] || "").trim();
    if (!text) return;
    if (busyMap[bookingId]) return;

    const violation = detectContact(text);
    if (violation) {
      setErrorsMap(prev => ({ ...prev, [bookingId]: getContactViolationMessage(violation) }));
      setTimeout(() => {
        setErrorsMap(prev => ({ ...prev, [bookingId]: "" }));
      }, 8000);
      return;
    }

    setBusyMap(prev => ({ ...prev, [bookingId]: true }));
    try {
      await runTransaction(db, async (tx) => {
        const ref = doc(db, "bookings", bookingId);
        const snap = await tx.get(ref);
        if (!snap.exists()) return;
        const data = snap.data() || {};
        const existing = Array.isArray(data.messages) ? data.messages : [];
        const newMsg = {
          from: viewerUid,
          text: sanitizeInput(text),
          ts: Date.now(),
          read: false
        };
        tx.update(ref, { messages: [...existing, newMsg] });
      });
      setInputs(prev => ({ ...prev, [bookingId]: "" }));
    } catch (err) {
      setErrorsMap(prev => ({ ...prev, [bookingId]: "Kunde inte skicka meddelandet." }));
    }
    setBusyMap(prev => ({ ...prev, [bookingId]: false }));
  }, [inputs, busyMap, viewerUid]);

  const handleBookingApproval = useCallback(async (bookingId, action, sharedPhone = '') => {
    setBusy(true);
    try {
      let bookingData = null;
      await runTransaction(db, async (tx) => {
        const ref = doc(db, "bookings", bookingId);
        const snap = await tx.get(ref);
        if (!snap.exists()) return;
        const data = snap.data() || {};
        bookingData = data;
        const existing = Array.isArray(data.messages) ? data.messages : [];
        
        // Update booking status without inserting system messages into chat
        tx.update(ref, { 
          status: action,
          [`${action}At`]: Date.now(),
          driverSharedPhone: sharedPhone,
          messages: existing
        });
      });
      
      // Send notification to passenger
      if (bookingData) {
        const rideData = {
          origin: extractCity(ride.origin),
          destination: extractCity(ride.destination), 
          date: ride.date,
          departureTime: ride.departureTime
        };
        
        if (action === 'approved') {
          await sendBookingApprovedNotification(
            bookingData.passengerEmail,
            bookingData.passengerName,
            rideData
          );
        } else {
          await sendBookingRejectedNotification(
            bookingData.passengerEmail, 
            bookingData.passengerName,
            rideData
          );
        }
      }
      
      setBusy(false);
    } catch (err) {
      console.error("Approval error:", err);
      setBusy(false);
    }
  }, [viewerUid, ride]);

  const selectedBooking = currentBookings.find(b => b.id === selectedBookingId);

  const isExpired = useMemo(() => {
    try {
      const ms = Date.parse(`${ride.date || ''}T${ride.departureTime || '00:00'}:00.000`);
      return Number.isFinite(ms) ? ms < Date.now() : false;
    } catch { return false; }
  }, [ride.date, ride.departureTime]);

  const republishNextWeek = async () => {
    try {
      const when = new Date(`${ride.date || ''}T${ride.departureTime || '00:00'}:00.000`);
      if (isNaN(when)) throw new Error('Ogiltigt datum');
      const next = new Date(when.getTime() + 7 * 24 * 60 * 60 * 1000);
      const yyyy = next.getFullYear();
      const mm = String(next.getMonth() + 1).padStart(2, '0');
      const dd = String(next.getDate()).padStart(2, '0');
      const hh = String(next.getHours()).padStart(2, '0');
      const mi = String(next.getMinutes()).padStart(2, '0');

      const payload = {
        ...ride,
        date: `${yyyy}-${mm}-${dd}`,
        departureTime: `${hh}:${mi}`,
        createdAt: new Date().toISOString(),
        archived: false,
        expired: false,
      };
      delete payload.id;
      await addDoc(collection(db, 'rides'), payload);
      alert('✅ تم إعادة نشر الرحلة للأسبوع القادم');
    } catch (e) {
      alert(e?.message || 'Kunde inte återpublicera');
    }
  };

  return (
    <article className="bg-white dark:bg-slate-800 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-slate-700 overflow-hidden group">
      {/* Elegant Header */}
      <header className="bg-gradient-to-r from-indigo-500 to-purple-500 p-4 relative overflow-hidden">
        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 bg-white/5 backdrop-blur-sm"></div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
        
        <div className="relative z-10">
          <div className="flex items-start justify-between gap-3">
            {/* Route Information */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                  <span className="text-xl">🚗</span>
                </div>
                <h2 className="text-xl font-bold text-white">
                  {extractCity(ride.origin)}
                  <span className="mx-2 text-white/60">→</span>
                  {extractCity(ride.destination)}
                </h2>
              </div>
              
              {/* Info Tags */}
              <div className="flex flex-wrap gap-2">
                <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-md rounded-lg px-3 py-1.5 text-sm">
                  <span className="text-white/90">📅</span>
                  <span className="text-white font-medium">{ride.date}</span>
                </div>
                <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-md rounded-lg px-3 py-1.5 text-sm">
                  <span className="text-white/90">🕐</span>
                  <span className="text-white font-medium">{ride.departureTime}</span>
                </div>
                {ride.carBrand && (
                  <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-md rounded-lg px-3 py-1.5 text-sm">
                    <span className="text-white/90">🚙</span>
                    <span className="text-white font-medium">{ride.carBrand}</span>
                  </div>
                )}
                <div className="flex items-center gap-1 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full px-2 py-1">
                  <span>⭐</span>
                  <span className="font-semibold text-xs">Förarresa</span>
                </div>
              </div>
            </div>

            {/* Compact Cost Display */}
            <div className="shrink-0 text-center bg-white bg-opacity-15 rounded-lg p-2 shadow-sm">
              {ride.costMode === 'fixed_price' && ride.price ? (
                <>
                  <p className="text-xl font-bold">{ride.price} kr</p>
                  <span className="text-xs opacity-90">per plats</span>
                </>
              ) : (ride.costMode === 'cost_share' && Number(ride.approxPrice) > 0) ? (
                <>
                  <p className="text-xl font-bold">ca {Number(ride.approxPrice)} kr</p>
                  <span className="text-xs opacity-90">kostnadsdelning</span>
                </>
              ) : (
                <>
                  <p className="text-sm font-semibold">{
                    ride.costMode === 'by_agreement' ? 'Överenskommelse' : ride.costMode === 'free' ? 'Ingen ersättning' : ride.costMode === 'companionship' ? 'Endast sällskap' : 'Kostnadsdelning'
                  }</p>
                  <span className="text-xs opacity-90">—</span>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Enhanced Bookings Summary */}
      <section className="p-3 border-b border-gray-100 dark:border-slate-700 bg-gradient-to-r from-gray-50 to-blue-50 dark:from-slate-700 dark:to-slate-600">
        <BookingsSummary bookings={bookings} />
        
        <div className="grid grid-cols-4 gap-2 text-center mb-3">
          <InfoStat value={ride.seatsAvailable} label="Platser" color="indigo" icon="🪑" />
          <InfoStat value={stats.total} label="Totalt" color="green" icon="📋" />
          <InfoStat value={stats.active} label="Aktiva" color="blue" icon="✅" />
          <InfoStat value={stats.unlocked} label="Upplåsta" color="emerald" icon="🔓" />
        </div>

        {/* HIDDEN: Old payment info banner - frozen for rollback */}
        {false && (
          <div className="mt-3 p-3 bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-slate-700 dark:to-slate-600 border border-blue-200 dark:border-slate-600 rounded-lg text-[13px] leading-relaxed text-gray-700 dark:text-gray-300">
            <p className="font-semibold mb-1 flex items-center gap-1 text-blue-800 dark:text-blue-200"><span>💡</span>Så fungerar betalningen</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Du betalar endast <span className="font-semibold">{COMMISSION} kr</span> för att låsa upp varje passagerares kontakt.</li>
              <li>Telefon och e-post visas direkt i bokningen efter betalning.</li>
              <li>Ingen extra avgift tillkommer – ni sköter själva resten av planeringen.</li>
              <li>Om passageraren avbokar inom 24&nbsp;h återbetalas avgiften automatiskt.</li>
            </ul>
          </div>
        )}

        {/* NEW: Communication platform info */}
        <div className="mt-3 p-3 bg-blue-50 dark:from-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
          <div className="flex items-start gap-2">
            <span className="text-lg mt-0.5">💬</span>
            <div className="flex-1">
              <p className="font-semibold text-sm text-blue-900 dark:text-blue-200 mb-1">
                Kommunikation
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300">
                Chatta med bokade resenärer. Dela kontaktuppgifter när ni vill.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Bookings List - Always Expanded */}
      <section className="p-4 sm:p-5 space-y-4">
        {stats.total === 0 ? (
          <EmptyBookings />
        ) : (
          <>
            <div className="mb-4">
              <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                <span>📋</span>
                Bokningsförfrågningar ({stats.total})
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Alla bokningar visas nedan - svarar på varje förfrågan
              </p>
            </div>
            
            {currentBookings.map((booking, index) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                index={index}
                ride={ride}
                viewerUid={viewerUid}
                onApproval={handleBookingApproval}
                busy={busy}
              />
            ))}
            
            {totalPages > 1 && (
              <Pagination 
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            )}
          </>
        )}
      </section>

      {/* Compact Delete Button */}
      <footer className="px-3 pb-3 pt-1">
        <div className="flex justify-end">
          <button
            onClick={onDeleteRide}
            className="group bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 flex items-center gap-1"
          >
            <span className="group-hover:scale-110 transition-transform duration-200">🗑️</span>
            <span>Radera resa</span>
          </button>
        </div>
      </footer>
    </article>
  );
}

/* ────────── Booking Card Component ────────── */

const BookingCard = React.memo(({ booking, index, ride, viewerUid, onApproval, busy }) => {
  const { user } = useAuth();
  const [inputs, setInputs] = useState("");
  const [busyMsg, setBusyMsg] = useState(false);
  const [showPhoneShare, setShowPhoneShare] = useState(false);
  const [phoneToShare, setPhoneToShare] = useState("");
  const listRef = useRef(null);
  const requirePhone = !user?.phoneNumber;

  const status = (booking.status || '').toLowerCase();
  const messages = Array.isArray(booking.messages) ? booking.messages : [];
  const unreadCount = messages.filter(m => m.from !== viewerUid && m.read === false).length;
  const cancelled = booking.status?.startsWith("cancelled");

  // Auto-scroll when messages change
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputs.trim() || busyMsg) return;
    setBusyMsg(true);
    
    try {
      await runTransaction(db, async (tx) => {
        const ref = doc(db, "bookings", booking.id);
        const snap = await tx.get(ref);
        if (!snap.exists()) return;
        
        const data = snap.data() || {};
        const existing = Array.isArray(data.messages) ? data.messages : [];
        const newMsg = {
          from: viewerUid,
          text: sanitizeInput(inputs.trim()),
          ts: Date.now(),
          read: false
        };
        
        tx.update(ref, { messages: [...existing, newMsg] });
      });
      
      setInputs("");
    } catch (err) {
      console.error("Send message error:", err);
    } finally {
      setBusyMsg(false);
    }
  };

  const handleApprovalWithPhone = async (action) => {
    if (action === 'approved' && !showPhoneShare) {
      setShowPhoneShare(true);
      return;
    }
    
    await onApproval(booking.id, action, phoneToShare.trim());
    setShowPhoneShare(false);
    setPhoneToShare("");
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-slate-700 bg-gradient-to-r from-gray-50 to-blue-50 dark:from-slate-700 dark:to-slate-600">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
              status === 'approved' ? 'bg-green-600' : 
              status === 'rejected' ? 'bg-red-600' : 'bg-amber-600'
            }`}>
              {status === 'approved' ? '✓' : status === 'rejected' ? '✗' : index + 1}
            </div>
            <div>
              <h4 className="font-bold text-gray-900 dark:text-white">
                {booking.passengerName || 'Resenär'}
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                📧 {booking.passengerEmail}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                💺 {booking.seats || 1} plats{(booking.seats || 1) > 1 ? 'er' : ''}
              </p>
            </div>
          </div>
          
          {unreadCount > 0 && (
            <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white text-sm font-bold animate-pulse">
              {unreadCount}
            </div>
          )}
        </div>
      </div>

      {/* Swedish message notification */}
      {booking.passengerComment && (
        <div className="p-4 border-b border-gray-200 dark:border-slate-700 bg-blue-50 dark:bg-blue-900/20">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-sm">📬</span>
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">
                Meddelande från passageraren
              </h4>
              <div className="bg-white dark:bg-slate-800 rounded-lg p-3 border border-blue-200 dark:border-blue-600">
                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                  {booking.passengerComment}
                </p>
              </div>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                📱 Passagerarens kontaktuppgifter och resedetaljer inkluderade
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Action buttons area */}
      <div className="p-4 border-b border-gray-200 dark:border-slate-700">
        {status === 'requested' ? (
          <div className="space-y-3">
            {/* Approval buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => handleApprovalWithPhone('approved')}
                disabled={busy}
                className="flex-1 py-3 px-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl font-semibold transition-all duration-300 disabled:opacity-50"
              >
                ✅ Godkänn bokning
              </button>
              <button
                onClick={() => onApproval(booking.id, 'rejected')}
                disabled={busy}
                className="flex-1 py-3 px-4 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white rounded-xl font-semibold transition-all duration-300 disabled:opacity-50"
              >
                ❌ Avvisa bokning
              </button>
            </div>

            {/* Phone sharing option - appears after clicking approve */}
            {showPhoneShare && (
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-blue-600">📱</span>
                  <h5 className="font-semibold text-blue-900 dark:text-blue-200">
                    Vill du dela ditt telefonnummer? (valfritt)
                  </h5>
                </div>
                
                <div className="space-y-2">
                  <input
                    type="tel"
                    value={phoneToShare}
                    onChange={(e) => setPhoneToShare(e.target.value)}
                    placeholder="Ange telefonnummer att dela (valfritt)"
                    className="w-full px-3 py-2 border border-blue-300 dark:border-blue-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
                  />
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    Om du delar ditt nummer kan passageraren ringa dig direkt.
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => onApproval(booking.id, 'approved', phoneToShare.trim())}
                    disabled={busy}
                    className="flex-1 py-2 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50"
                  >
                    {phoneToShare.trim() ? '✅ Godkänn med telefon' : '✅ Godkänn utan telefon'}
                  </button>
                  <button
                    onClick={() => setShowPhoneShare(false)}
                    className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-lg font-semibold transition-colors"
                  >
                    Avbryt
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : status === 'approved' ? (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center">
                <span className="text-white text-xs">✓</span>
              </div>
              <div>
                <h4 className="font-semibold text-green-800 dark:text-green-200">
                  Bokning godkänd
                </h4>
                <p className="text-sm text-green-700 dark:text-green-300">
                  Nu kan ni chatta för att planera resan.
                </p>
              </div>
            </div>
          </div>
        ) : status === 'rejected' ? (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-red-600 rounded-full flex items-center justify-center">
                <span className="text-white text-xs">✗</span>
              </div>
              <div>
                <h4 className="font-semibold text-red-800 dark:text-red-200">
                  Bokning avvisad
                </h4>
                <p className="text-sm text-red-700 dark:text-red-300">
                  Förfrågan har avvisats.
                </p>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* Chat area - always visible but locked when pending */}
      <div className="border-0">
        <div className="bg-gray-50 dark:bg-slate-800 px-4 py-3 border-b border-gray-200 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <span className="text-lg">💬</span>
            <h4 className="font-semibold text-gray-900 dark:text-gray-100">
              Chatt med passageraren
            </h4>
            {status === 'requested' && (
              <span className="ml-auto px-2 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-semibold flex items-center gap-1">
                🔒 Låst
              </span>
            )}
          </div>
        </div>
        
        <div className="relative">
        <div ref={listRef} className="max-h-64 overflow-y-auto p-3 space-y-2 bg-white dark:bg-slate-800/40">
          {messages.filter((m) => !(m.from === 'system' || m.isSystemMessage)).length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">
              {status === 'requested' ? 'Chatten öppnar när du svarar' : 'Inga meddelanden ännu.'}
            </p>
          ) : (
            messages
              .filter((msg) => !(msg.from === 'system' || msg.isSystemMessage))
              .map((msg, idx) => {
              const isMine = msg.from === viewerUid;
              const isSystem = false;
              
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
                      {new Date(msg.ts || msg.createdAt).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
        {requirePhone && (
          <div className="absolute inset-0 backdrop-blur-sm bg-white/70 flex items-center justify-center text-center p-4">
            <div>
              <p className="text-sm text-gray-800 font-medium">Verifiera telefonnumret för att visa meddelanden.</p>
              <button
                onClick={() => { const ret = window.location.pathname + window.location.search; window.location.href = `/verify-phone?return=${encodeURIComponent(ret)}`; }}
                className="mt-2 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold"
              >Verifiera telefon</button>
            </div>
          </div>
        )}
        </div>
        
        {/* Input area */}
        <div className="p-3 border-t border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800/40">
          {status === 'requested' ? (
            <div className="relative">
              <input
                value="Chatt låst tills du svarar på bokningsförfrågan..."
                disabled
                className="w-full px-3 py-2 rounded-lg border bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-sm cursor-not-allowed"
              />
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                <span className="text-gray-400">🔒</span>
              </div>
            </div>
          ) : (
            (
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <input
                    value={inputs}
                    onChange={(e) => setInputs(e.target.value)}
                    placeholder="💬 Skriv meddelande..."
                    className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-slate-800 focus:border-blue-400 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-sm"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    disabled={busyMsg}
                  />
                </div>
                <button 
                  onClick={handleSendMessage} 
                  disabled={!inputs.trim() || busyMsg} 
                  className="px-3 py-2 rounded-lg bg-blue-600 text-white disabled:opacity-50 hover:bg-blue-700 transition-all duration-200 font-semibold shadow-sm min-w-[80px] flex items-center justify-center"
                >
                  {busyMsg ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <span className="text-lg">📤</span>
                  )}
                </button>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
});

/* ────────── Compact Sub-components ────────── */

const InfoStat = React.memo(({ value, label, color, icon }) => (
  <div className="bg-white dark:bg-slate-700 rounded-lg p-2 shadow-sm border border-gray-100 dark:border-slate-600">
    <div className="flex items-center justify-center gap-1 mb-1">
      <span className="text-sm">{icon}</span>
      <p className={`text-sm font-bold text-${color}-600 dark:text-${color}-400`}>{value}</p>
    </div>
    <p className="text-xs text-gray-600 dark:text-gray-300 font-medium">{label}</p>
  </div>
));

const BookingsHeader = React.memo(({ total, active, unlocked, currentPage, totalPages, onPageChange }) => (
  <header className="p-2 font-semibold bg-gradient-to-r from-gray-100 to-blue-100 dark:from-slate-600 dark:to-slate-500 border-b border-gray-200 dark:border-slate-600 rounded-t-lg flex items-center justify-between gap-2">
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-700 dark:text-gray-200">📋 Bokningar ({total})</span>
    </div>
    {total > 0 && (
      <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
        <LegendDot color="green" label={`${active} aktiva`} />
        <LegendDot color="emerald" label={`${unlocked} upplåsta`} />
        {totalPages > 1 && (
          <span className="text-gray-500 font-medium">• Sida {currentPage}/{totalPages}</span>
        )}
      </div>
    )}
  </header>
));

const LegendDot = React.memo(({ color, label }) => (
  <span className="flex items-center gap-1 text-xs">
    <span className={`w-1.5 h-1.5 bg-${color}-500 rounded-full shadow-sm`} />
    <span className="truncate font-medium">{label}</span>
  </span>
));

const EmptyBookings = React.memo(() => (
  <div className="p-4 text-center text-gray-500 dark:text-gray-400">
    <div className="bg-gradient-to-br from-gray-50 to-blue-50 dark:from-slate-700 dark:to-slate-600 rounded-xl p-4 border border-gray-200 dark:border-slate-600">
      <p className="text-2xl mb-2 opacity-40">📋</p>
      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Inga bokningar ännu</p>
      <p className="text-xs text-gray-500 dark:text-gray-400">
      Dina bokningar kommer att visas här när någon bokat din resa
    </p>
    </div>
  </div>
));

// Booking card with integrated chat - like bokningar tab
const BookingCardWithChat = React.memo(({ booking, onCancel, viewerUid }) => {
  const status = (booking.status || "").toLowerCase();
  const cancelled = status.startsWith("cancelled");
  const isNew = booking.createdAt > Date.now() - (24 * 60 * 60 * 1000);
  const unlocked = isUnlocked(booking);

  const getCardStyle = () => {
    if (cancelled) {
      return "bg-gradient-to-r from-rose-50 to-red-50 dark:from-rose-900/20 dark:to-red-900/20 border-rose-200 dark:border-rose-700";
    }
    if (unlocked) {
      return "bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 border-emerald-200 dark:border-emerald-700";
    }
    return "bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 border-amber-200 dark:border-amber-700";
  };

  return (
    <div className={`${getCardStyle()} border-2 rounded-2xl p-4 sm:p-5 shadow-md hover:shadow-lg transition-all duration-300`}>
      {/* Header with passenger info */}
      <div className="mb-4 pb-3 border-b-2 border-gray-200 dark:border-slate-600">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">👤</span>
              <h3 className="font-bold text-gray-800 dark:text-gray-200 text-lg">
                {booking.passengerName || 'Okänd resenär'}
              </h3>
              {isNew && !cancelled && (
                <span className="inline-flex items-center gap-1 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                  <span>●</span>
                  <span>Ny</span>
                </span>
              )}
            </div>
            
            <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
              <p className="flex items-center gap-2">
                <span>📧</span>
                <span className="truncate">{booking.passengerEmail}</span>
              </p>
              {booking.passengerPhone && (
                <p className="flex items-center gap-2">
                  <span>📞</span>
                  <span>{booking.passengerPhone}</span>
                </p>
              )}
              <p className="flex items-center gap-2">
                <span>💺</span>
                <span>{booking.seats} plats{booking.seats > 1 ? 'er' : ''}</span>
              </p>
            </div>
          </div>

          {cancelled && (
            <div className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 px-3 py-1 rounded-lg text-sm font-semibold">
              Avbruten
            </div>
          )}
        </div>

        {/* Passenger Swedish message */}
        {booking.passengerComment && (
          <div className="mt-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-700">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">💬</span>
              <div className="text-sm font-semibold text-blue-800 dark:text-blue-200">
                Meddelande från passageraren
              </div>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-lg p-3 border border-blue-300 dark:border-blue-600">
              <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                {booking.passengerComment}
              </div>
            </div>
            <div className="mt-2 text-xs text-blue-600 dark:text-blue-400">
              📱 Kontaktuppgifter och resedetaljer inkluderade i meddelandet
            </div>
          </div>
        )}
      </div>

      {/* Chat section */}
      {!cancelled && (
        <div className="pt-4">
          <div className="mb-3">
            <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
              <span>💬</span>
              <span>Chatta med resenären</span>
            </h4>
          </div>
          
          <SeatBookingInboxCard
            booking={booking}
            viewerUid={viewerUid}
            viewerEmail={booking.driverEmail || ""}
            onCancel={onCancel}
          />
        </div>
      )}

      {cancelled && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg text-center">
          <p className="text-sm text-red-700 dark:text-red-300 font-semibold">
            Denna bokning är avbruten
          </p>
        </div>
      )}
    </div>
  );
});

const ContactRow = React.memo(({ icon, text, href }) => (
  <div className="flex items-center gap-1 bg-white dark:bg-slate-700 rounded p-1 shadow-sm border border-gray-200 dark:border-slate-600">
    <span className="text-sm text-gray-500">{icon}</span>
    {href ? (
      <a href={href} className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 underline font-medium text-xs truncate flex-1">
        {text}
      </a>
    ) : (
      <span className="text-gray-700 dark:text-gray-300 text-xs truncate flex-1">{text}</span>
    )}
  </div>
));

const Divider = React.memo(() => (
  <div className="flex justify-center py-1">
    <div className="w-12 h-0.5 bg-gradient-to-r from-transparent via-gray-300 dark:via-slate-600 to-transparent rounded-full" />
  </div>
));

const ActionBtn = React.memo(({ color, onClick, children, className = "" }) => (
  <button
    onClick={onClick}
    className={`bg-gradient-to-r from-${color}-500 to-${color}-600 hover:from-${color}-600 hover:to-${color}-700 text-white px-2 py-1 rounded text-xs font-bold transition-all duration-300 shadow-sm hover:shadow-md transform hover:-translate-y-0.5 flex items-center gap-1 whitespace-nowrap min-w-0 ${className}`}
  >
    {children}
  </button>
));

const Pagination = React.memo(({ currentPage, totalPages, onPageChange }) => (
  <div className="flex justify-center items-center gap-2 mt-3 text-xs text-gray-700 dark:text-gray-300">
    <button
      onClick={() => onPageChange(currentPage - 1)}
      disabled={currentPage === 1}
      className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
    >
      ←
    </button>
    <span className="font-semibold bg-white dark:bg-slate-700 px-3 py-1.5 rounded shadow-sm">
      Sida {currentPage} av {totalPages}
    </span>
    <button
      onClick={() => onPageChange(currentPage + 1)}
      disabled={currentPage === totalPages}
      className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
    >
      →
    </button>
  </div>
));

/* ────────── PropTypes ────────── */

DriverRideCard.propTypes = {
  ride:            PropTypes.object.isRequired,
  bookings:        PropTypes.array.isRequired,
  onDeleteRide:    PropTypes.func.isRequired,
  onCancelBooking: PropTypes.func.isRequired,
  viewerUid:       PropTypes.string.isRequired,
};

InfoStat.propTypes = {
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  label: PropTypes.string.isRequired,
  color: PropTypes.string.isRequired,
  icon: PropTypes.string.isRequired,
};

BookingsHeader.propTypes = {
  total:    PropTypes.number.isRequired,
  active:   PropTypes.number.isRequired,
  unlocked: PropTypes.number.isRequired,
  currentPage: PropTypes.number.isRequired,
  totalPages: PropTypes.number.isRequired,
  onPageChange: PropTypes.func.isRequired,
};

LegendDot.propTypes = {
  color: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
};

BookingCardWithChat.propTypes = {
  booking:   PropTypes.object.isRequired,
  onCancel:  PropTypes.func.isRequired,
  viewerUid: PropTypes.string.isRequired,
};

ContactRow.propTypes = {
  icon:  PropTypes.string.isRequired,
  text:  PropTypes.string.isRequired,
  href:  PropTypes.string,
};

ActionBtn.propTypes = {
  color:    PropTypes.string.isRequired,
  onClick:  PropTypes.func.isRequired,
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

Pagination.propTypes = {
  currentPage: PropTypes.number.isRequired,
  totalPages: PropTypes.number.isRequired,
  onPageChange: PropTypes.func.isRequired,
};

export default React.memo(DriverRideCard);

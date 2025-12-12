import React, { useMemo, useRef, useState, useEffect, useCallback } from "react";
import { doc, runTransaction } from "firebase/firestore";
import { db } from "../../firebase/firebase.js";
import { extractCity } from "../../utils/address.js";
import { sanitizeInput } from "../../utils/security.js";
import { maskContactIfLocked } from "../../utils/messaging.js";
import { detectContact, getContactViolationMessage } from "../../utils/messagingGuard.js";
import { useAuth } from "../../context/AuthContext.jsx";

export default function SeatBookingInboxCard({ booking, viewerUid, viewerEmail, onCancel }) {
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [decisionBusy, setDecisionBusy] = useState(false);
  const listRef = useRef(null);

  const requirePhone = !user?.phoneNumber;

  const status = (booking.status || '').toLowerCase();
  const bookingMessages = useMemo(() => Array.isArray(booking?.messages) ? booking.messages : [], [booking?.messages]);
  const isUnlock = (booking.bookingType === 'contact_unlock') || (booking.rideRole === 'passenger');
  const isViewerUnlocker = String(viewerUid || '') === String(booking.userId || '');
  const isViewerCounterparty = String(viewerUid || '') === String(booking.counterpartyId || '');
  const isApproved = status === 'approved' || status === 'approved_by_driver' || status === 'approved_by_passenger';
  const isRejected = status === 'rejected' || status === 'rejected_by_driver' || status === 'rejected_by_passenger';
  const isLocked = useMemo(() => {
    // Seat booking: lock while requested. Contact unlock: lock until passenger approves
    if (isUnlock) return status !== 'approved_by_passenger';
    return status === 'requested';
  }, [status, isUnlock]);
  const contactWindowActive = true; // Simplified for now

  // Determine initial message text shown in the notification to avoid duplicating it in chat
  const initialTextToHide = useMemo(() => {
    try {
      const mine = bookingMessages.find((m) => (m.senderUid ?? m.from) === viewerUid);
      const text = String((mine?.text || booking.passengerComment || '')).trim();
      return text;
    } catch {
      return '';
    }
  }, [bookingMessages, viewerUid, booking?.passengerComment]);

  // Determine banner message and title (show above action buttons only when meaningful)
  const mineMsg = useMemo(() => {
    try {
      return bookingMessages.find((m) => (m.senderUid ?? m.from) === viewerUid && String(m.text || '').trim());
    } catch { return null; }
  }, [bookingMessages, viewerUid]);

  const otherMsg = useMemo(() => {
    try {
      return bookingMessages.find((m) => (m.senderUid ?? m.from) !== viewerUid && String(m.text || '').trim());
    } catch { return null; }
  }, [bookingMessages, viewerUid]);

  const bannerText = useMemo(() => {
    if (isUnlock) {
      return isViewerUnlocker ? (mineMsg?.text || '') : (otherMsg?.text || '');
    }
    // seat_booking fallback (passenger comment when available)
    if (String(booking.userId || '') === String(viewerUid || '')) {
      return String(booking.passengerComment || mineMsg?.text || '');
    }
    return String(otherMsg?.text || booking.passengerComment || '');
  }, [isUnlock, isViewerUnlocker, mineMsg?.text, otherMsg?.text, booking.passengerComment, booking.userId, viewerUid]);

  const bannerTitle = useMemo(() => {
    if (!bannerText) return '';
    if (isUnlock) {
      return isViewerUnlocker ? 'Ditt meddelande skickades' : 'Meddelande från föraren';
    }
    return String(booking.userId || '') === String(viewerUid || '')
      ? 'Ditt meddelande till föraren'
      : 'Meddelande från passageraren';
  }, [bannerText, isUnlock, isViewerUnlocker, booking.userId, viewerUid]);

  // Hide chat messages until approved for contact unlocks; also hide the initial booking text shown in the banner
  const bookingMessagesForView = useMemo(() => {
    if (isUnlock && !isApproved) return [];
    try {
      if (!initialTextToHide) return bookingMessages;
      return bookingMessages.filter((m) => {
        const sender = m.senderUid ?? m.from;
        const text = String(m.text || '').trim();
        // Skip the viewer's initial booking text since it's already displayed above
        return !(String(sender) === String(viewerUid) && text === initialTextToHide);
      });
    } catch {
      return bookingMessages;
    }
  }, [bookingMessages, isUnlock, isApproved, initialTextToHide, viewerUid]);

  // Enhanced cancel with complete removal
  const handleCancelWithAnimation = useCallback(async () => {
    setIsDeleting(true);
    
    // Start fade-out animation
    setTimeout(async () => {
      try {
        if (onCancel) {
          await onCancel();
        }
      } catch (err) {
        console.error("Cancel booking error:", err);
        setError("Kunde inte avbryta. Försök igen.");
        setTimeout(() => setError(""), 5000);
        setIsDeleting(false);
      }
      // Note: component will be unmounted after successful cancellation
    }, 400);
  }, [onCancel]);

  // Status display config
  const cardStyle = (isApproved) 
    ? { badge: '✅ Godkänd', cls: 'bg-green-50 border-green-200 text-green-800' }
    : (isRejected)
    ? { badge: '❌ Avvisad', cls: 'bg-red-50 border-red-200 text-red-800' }
    : { badge: '⏳ Väntar svar', cls: 'bg-amber-50 border-amber-200 text-amber-800' };

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [bookingMessages]);

  const handleSend = useCallback(async () => {
    const text = message.trim();
    if (!text || busy) return;

    setBusy(true);
    setError("");

    try {
      await runTransaction(db, async (tx) => {
        const ref = doc(db, "bookings", booking.id);
        const snap = await tx.get(ref);
        if (!snap.exists()) return;
        
        const data = snap.data() || {};
        const existing = Array.isArray(data.messages) ? data.messages : [];
        const newMsg = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          senderUid: viewerUid,
          senderEmail: "",
          text: sanitizeInput(text),
          createdAt: Date.now(),
          read: false,
        };
        
        tx.update(ref, { messages: [...existing, newMsg] });
      });
      
      setMessage("");
    } catch (err) {
      setError("Kunde inte skicka meddelandet.");
    } finally {
      setBusy(false);
    }
  }, [message, busy, booking.id, viewerUid]);

  // Passenger side actions for contact unlocks (approve/reject)
  const handlePassengerApprove = useCallback(async () => {
    if (!isUnlock || !isViewerCounterparty || isApproved || isRejected) return;
    setDecisionBusy(true);
    try {
      await runTransaction(db, async (tx) => {
        const ref = doc(db, "bookings", booking.id);
        const snap = await tx.get(ref);
        if (!snap.exists()) return;
        tx.update(ref, {
          status: "approved_by_passenger",
          approvedAt: Date.now(),
        });
      });
      try {
        const { sendNotification } = await import("../../services/notificationService.js");
        const to = (booking.unlockerEmail || booking.driverEmail || "").trim();
        if (to) {
          await sendNotification(
            to,
            "Din kontaktförfrågan godkänd ✅",
            "Passageraren har godkänt din kontaktförfrågan. Ni kan nu chatta i appen.",
            booking.passengerName || "Passagerare",
            "success"
          );
        }
      } catch (_) {}
    } catch (e) {
      setError("Kunde inte godkänna.");
      setTimeout(() => setError(""), 5000);
    } finally {
      setDecisionBusy(false);
    }
  }, [booking, isUnlock, isViewerCounterparty, isApproved, isRejected]);

  const handlePassengerReject = useCallback(async () => {
    if (!isUnlock || !isViewerCounterparty || isApproved || isRejected) return;
    setDecisionBusy(true);
    try {
      await runTransaction(db, async (tx) => {
        const ref = doc(db, "bookings", booking.id);
        const snap = await tx.get(ref);
        if (!snap.exists()) return;
        tx.update(ref, {
          status: "rejected_by_passenger",
          rejectedAt: Date.now(),
        });
      });
      try {
        const { sendNotification } = await import("../../services/notificationService.js");
        const to = (booking.unlockerEmail || booking.driverEmail || "").trim();
        if (to) {
          await sendNotification(
            to,
            "Kontaktförfrågan avvisad ❌",
            "Passageraren kunde tyvärr inte godkänna din kontaktförfrågan.",
            booking.passengerName || "Passagerare",
            "warning"
          );
        }
      } catch (_) {}
    } catch (e) {
      setError("Kunde inte avslå.");
      setTimeout(() => setError(""), 5000);
    } finally {
      setDecisionBusy(false);
    }
  }, [booking, isUnlock, isViewerCounterparty, isApproved, isRejected]);

  return (
    <div className={`border-2 rounded-xl shadow-md transition-all duration-500 ${cardStyle.cls} ${isDeleting ? 'opacity-0 scale-90 transform -translate-y-4' : 'opacity-100 scale-100'}`}>
      {/* Header with booking info */}
      <div className="p-4 border-b border-gray-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
              (status === 'approved' || status === 'approved_by_driver') ? 'bg-green-600' : 
              (status === 'rejected' || status === 'rejected_by_driver') ? 'bg-red-600' : 'bg-amber-600'
            }`}>
              {(status === 'approved' || status === 'approved_by_driver') ? '✓' : (status === 'rejected' || status === 'rejected_by_driver') ? '✗' : '⏳'}
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white">
                {isUnlock ? 'Kontaktförfrågan' : 'Bokningsförfrågan'}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                📍 {extractCity(booking.ride_origin)} → {extractCity(booking.ride_destination)}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="flex flex-col items-end gap-2">
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${cardStyle.cls}`}>
                {cardStyle.badge}
              </span>
              <p className="text-xs text-gray-500">
                📅 {booking.ride_date} kl. {booking.ride_time}
              </p>
              
              {/* Cancel button - hide for contact unlocks */}
              {!isUnlock && (
                <button
                  onClick={handleCancelWithAnimation}
                  disabled={isDeleting}
                  className="mt-2 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg transition-all duration-200 flex items-center gap-1 hover:scale-105 active:scale-95 disabled:opacity-50 shadow-sm hover:shadow-md"
                >
                  {isDeleting ? (
                    <>
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Avbryter…</span>
                    </>
                  ) : (
                    <>
                      <span>🗑️</span>
                      <span>Avbryt bokning</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Original message notification */}
      {String(bannerText || '').trim() && (
        <div className="p-4 border-b border-gray-200 dark:border-slate-700 bg-blue-50 dark:bg-blue-900/20">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-sm">📬</span>
            </div>
            <div className="flex-1">
              {bannerTitle && (
                <h4 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">
                  {bannerTitle}
                </h4>
              )}
              <div className="bg-white dark:bg-slate-800 rounded-lg p-3 border border-blue-200 dark:border-blue-600">
                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                  {bannerText}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Status notification area */}
      <div className="p-4 border-b border-gray-200 dark:border-slate-700">
        {isUnlock && isViewerUnlocker && !isApproved && !isRejected ? (
          <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-6 h-6 bg-emerald-600 rounded-full flex items-center justify-center">
                <span className="text-white text-xs">✓</span>
              </div>
              <h4 className="font-semibold text-emerald-800 dark:text-emerald-200">
                Meddelande skickat! Vänta på svar från passageraren
              </h4>
            </div>
            <p className="text-sm text-emerald-700 dark:text-emerald-300">
              Du får en notis när passageraren svarar.
            </p>
          </div>
        ) : isUnlock && isViewerCounterparty && !isApproved && !isRejected ? (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 bg-amber-600 rounded-full flex items-center justify-center">
                <span className="text-white text-xs">⏳</span>
              </div>
              <h4 className="font-semibold text-amber-800 dark:text-amber-200">Ny kontaktförfrågan</h4>
            </div>
            <p className="text-xs text-amber-700 dark:text-amber-300 mb-3">Chatten låses upp efter att du godkänt.</p>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={handlePassengerApprove} disabled={decisionBusy} className="w-full px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold disabled:opacity-50">Godkänn</button>
              <button onClick={handlePassengerReject} disabled={decisionBusy} className="w-full px-3 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold disabled:opacity-50">Avslå</button>
            </div>
          </div>
        ) : (!isUnlock && status === 'requested') ? (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-6 h-6 bg-amber-600 rounded-full flex items-center justify-center">
                <span className="text-white text-xs">⏳</span>
              </div>
              <h4 className="font-semibold text-amber-800 dark:text-amber-200">
                Väntar på förarens svar
              </h4>
            </div>
            <p className="text-sm text-amber-700 dark:text-amber-300 mb-3">Föraren granskar din förfrågan.</p>
          </div>
        ) : (isApproved) ? (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center">
                <span className="text-white text-xs">✓</span>
              </div>
              <h4 className="font-semibold text-green-800 dark:text-green-200">
                Bokning godkänd! 🎉
              </h4>
            </div>
            <p className="text-sm text-green-700 dark:text-green-300">
              Godkänd! Ni kan chatta.
            </p>
          </div>
        ) : (isRejected) ? (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-6 h-6 bg-red-600 rounded-full flex items-center justify-center">
                <span className="text-white text-xs">✗</span>
              </div>
              <h4 className="font-semibold text-red-800 dark:text-red-200">
                Bokning avvisad 😔
              </h4>
            </div>
            <p className="text-sm text-red-700 dark:text-red-300">
              Förfrågan avvisad.
            </p>
          </div>
        ) : null}
      </div>

      {/* Chat area - always visible, but locked when pending */}
      <div className="rounded-lg border-0 overflow-hidden">
        <div className="bg-gray-50 dark:bg-slate-800 px-4 py-3 border-b border-gray-200 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <span className="text-lg">💬</span>
            <h4 className="font-semibold text-gray-900 dark:text-gray-100">
              {`Chatt med ${isUnlock ? 'passageraren' : 'föraren'}`}
            </h4>
            {isLocked && (
              <span className="ml-auto px-2 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-semibold flex items-center gap-1">
                🔒 Låst
              </span>
            )}
          </div>
        </div>
        
        <div className="relative">
          <div ref={listRef} className="max-h-64 overflow-y-auto p-3 space-y-2 bg-white dark:bg-slate-800/40">
            {bookingMessagesForView.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">
                {isLocked ? (isUnlock ? 'Chatten öppnar när passageraren svarar' : 'Chatten öppnar när föraren svarar') : 'Inga meddelanden ännu.'}
              </p>
            ) : (
              bookingMessagesForView
                .slice()
                .sort((a, b) => (a?.createdAt || 0) - (b?.createdAt || 0))
                .filter((m) => !(m.from === 'system' || m.isSystemMessage))
                .map((m) => {
                  const mine = m.senderUid === viewerUid || m.from === viewerUid;
                  const isSystem = m.from === 'system' || m.isSystemMessage;
                  const text = contactWindowActive ? (m.text || '') : maskContactIfLocked(m.text || '');
                  if (isSystem) return null;
                  return (
                    <div key={m.id || m.createdAt} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`px-3 py-2 text-sm max-w-[80%] shadow-sm ${mine ? 'bg-green-100 text-gray-900 border border-green-200' : 'bg-white text-gray-900 border border-gray-200'} ${mine ? 'rounded-2xl rounded-br-md' : 'rounded-2xl rounded-bl-md'}`}>
                        <div className={`text-[10px] mb-1 font-medium ${mine ? 'text-green-700/70' : 'text-gray-600'}`}>
                          {mine ? 'Du' : (isUnlock ? 'Passageraren' : 'Föraren')}
                        </div>
                        <div className="whitespace-pre-wrap break-words leading-relaxed">{text}</div>
                        {m.createdAt && (
                          <div className={`mt-1 text-[10px] flex items-center justify-end ${mine ? 'text-green-700/70' : 'text-gray-500'}`}>
                            {new Date(m.createdAt).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        )}
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
          {error && (
            <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
              {error}
            </div>
          )}
          
          {isLocked ? (
            <div className="relative">
              <input
                value={`Chatt låst i väntan på ${isUnlock ? 'passagerarens svar' : 'förarens svar'}...`}
                disabled
                className="w-full px-3 py-2 rounded-lg border bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-sm cursor-not-allowed"
              />
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                <span className="text-gray-400">🔒</span>
              </div>
            </div>
          ) : (
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="💬 Skriv meddelande..."
                  className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-slate-800 focus:border-blue-400 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-sm"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                />
              </div>
              <button 
                onClick={handleSend} 
                disabled={!message.trim() || busy} 
                className="px-3 py-2 rounded-lg bg-blue-600 text-white disabled:opacity-50 hover:bg-blue-700 transition-all duration-200 font-semibold shadow-sm min-w-[80px] flex items-center justify-center"
                title="Skicka meddelande"
              >
                {busy ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <span className="text-lg">📤</span>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
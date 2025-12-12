import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { doc, runTransaction } from "firebase/firestore";
import { db } from "../../firebase/firebase.js";
import { extractCity } from "../../utils/address.js";
import { sanitizeInput } from "../../utils/security.js";
import { isUnlocked, COMMISSION } from "../../utils/booking.js";
import { maskContactIfLocked } from "../../utils/messaging.js";
import { detectContact, getContactViolationMessage } from "../../utils/messagingGuard.js";
import ReportDialog from "../ReportDialog.jsx";
import { submitUnlockReport } from "../../services/reportService.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { sendNotification } from "../../services/notificationService.js";

function ExpiredBadge({ date, time }) {
  try {
    const nowDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Stockholm', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
    const nowTime = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Stockholm', hour12: false, hour: '2-digit', minute: '2-digit' }).format(new Date());
    const d = String(date || '').slice(0,10);
    const t = String(time || '00:00').slice(0,5);
    const expired = d && ((d < nowDate) || (d === nowDate && t <= nowTime));
    if (!expired) return null;
    return (
      <div className="mt-2">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-black text-white text-[10px] font-bold rounded-full">⏳ Expired</span>
      </div>
    );
  } catch {
    return null;
  }
}

export default function DriverRideInboxCard({ ride, bookings = [], viewerUid, viewerEmail, onDelete, onCancelBooking }) {
  const { user } = useAuth();
  // Per-booking chat UI state (mirror SeatBookingInboxCard behavior)
  const [chatOpenMap, setChatOpenMap] = useState({});
  const [inputs, setInputs] = useState({});
  const [busyMap, setBusyMap] = useState({});
  const [errorsMap, setErrorsMap] = useState({});
  const [openingMap, setOpeningMap] = useState({});
  const [rapportOpenMap, setRapportOpenMap] = useState({});
  const [rapportBusyMap, setRapportBusyMap] = useState({});
  const [rapportDoneMap, setRapportDoneMap] = useState({});
  const [pulseMap, setPulseMap] = useState({});
  const listRefs = useRef({});
  const seeded = useRef(new Set());
  const prevUnreadRef = useRef({});

  const requirePhone = !user?.phoneNumber;

  const markBookingMessagesRead = useCallback(async (bookingId) => {
    try {
      await runTransaction(db, async (tx) => {
        const ref = doc(db, "bookings", bookingId);
        const snap = await tx.get(ref);
        if (!snap.exists()) return;
        const data = snap.data() || {};
        const existing = Array.isArray(data.messages) ? data.messages : [];
        let changed = false;
        const next = existing.map((m) => {
          const sender = m.senderUid ?? m.from;
          if (sender !== viewerUid && m.read === false) {
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
  }, [viewerUid]);

  const handleToggleChat = useCallback((bookingId) => {
    // Opening spinner behavior to mirror SeatBookingInboxCard
    setOpeningMap((prev) => ({ ...prev, [bookingId]: true }));
    setChatOpenMap((prev) => {
      const nextOpen = !prev[bookingId];
      const next = {};
      try {
        // Ensure only one chat is open at a time (WhatsApp-like)
        bookings.forEach((b) => { next[b.id] = false; });
      } catch {}
      if (nextOpen) {
        next[bookingId] = true;
        markBookingMessagesRead(bookingId);
        setTimeout(() => {
          try {
            const ref = listRefs.current[bookingId];
            if (ref) ref.scrollTop = ref.scrollHeight;
          } catch {}
        }, 50);
      }
      return next;
    });
    setTimeout(() => {
      setOpeningMap((prev) => ({ ...prev, [bookingId]: false }));
    }, 500);
  }, [markBookingMessagesRead, bookings]);

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

  const stats = useMemo(() => {
    const total = bookings.length;
    const active = bookings.filter((b) => !b.status?.startsWith("cancelled")).length;
    return { total, active };
  }, [bookings]);

  const sendPassengerNotif = useCallback(async (booking, title, body, type = "info") => {
    try {
      const to = (booking.passengerEmail || "").trim().toLowerCase();
      if (!to) return;
      await sendNotification(
        to,
        title,
        body,
        booking.passengerName || "Passagerare",
        type
      );
    } catch (e) {
      console.warn("Notification send error:", e?.message || e);
    }
  }, []);

  const handleApprove = useCallback(async (booking) => {
    if (!booking?.id) return;
    setBusyMap((prev) => ({ ...prev, [booking.id]: true }));
    try {
      await runTransaction(db, async (tx) => {
        const ref = doc(db, "bookings", booking.id);
        const snap = await tx.get(ref);
        if (!snap.exists()) return;
        const data = snap.data() || {};
        if ((data.status || "").startsWith("cancelled")) return;
        tx.update(ref, {
          status: "approved_by_driver",
          approvedAt: Date.now(),
        });
      });

      const route = `${extractCity(booking.ride_origin)} → ${extractCity(booking.ride_destination)}`;
      const when = booking.ride_date && booking.ride_time ? `\n📅 ${booking.ride_date} kl. ${booking.ride_time}` : "";
      
      // Send notification without blocking UI
      sendPassengerNotif(
        booking,
        "Din bokningsförfrågan godkänd ✅",
        `Föraren har godkänt din förfrågan.\n\n📍 Resa: ${route}${when}\n\nDu kan läsa bekräftelsen i appen.`,
        "success"
      ).catch(err => console.warn("Notification failed:", err));
      
    } catch (e) {
      setErrorsMap((prev) => ({ ...prev, [booking.id]: e?.message || "Kunde inte godkänna." }));
      setTimeout(() => setErrorsMap((prev) => ({ ...prev, [booking.id]: "" })), 6000);
    } finally {
      setBusyMap((prev) => ({ ...prev, [booking.id]: false }));
    }
  }, [sendPassengerNotif]);

  const handleReject = useCallback(async (booking) => {
    if (!booking?.id) return;
    setBusyMap((prev) => ({ ...prev, [booking.id]: true }));
    try {
      await runTransaction(db, async (tx) => {
        const ref = doc(db, "bookings", booking.id);
        const snap = await tx.get(ref);
        if (!snap.exists()) return;
        const data = snap.data() || {};
        if ((data.status || "").startsWith("cancelled")) return;
        tx.update(ref, {
          status: "rejected_by_driver",
          rejectedAt: Date.now(),
        });
      });

      const route = `${extractCity(booking.ride_origin)} → ${extractCity(booking.ride_destination)}`;
      const when = booking.ride_date && booking.ride_time ? `\n📅 ${booking.ride_date} kl. ${booking.ride_time}` : "";
      
      // Send notification without blocking UI
      sendPassengerNotif(
        booking,
        "Bokningsförfrågan avslogs ❌",
        `Tyvärr kunde föraren inte godkänna din förfrågan.\n\n📍 Resa: ${route}${when}\n\nTips: Sök andra resor i appen.`,
        "warning"
      ).catch(err => console.warn("Notification failed:", err));
      
    } catch (e) {
      setErrorsMap((prev) => ({ ...prev, [booking.id]: e?.message || "Kunde inte avslå." }));
      setTimeout(() => setErrorsMap((prev) => ({ ...prev, [booking.id]: "" })), 6000);
    } finally {
      setBusyMap((prev) => ({ ...prev, [booking.id]: false }));
    }
  }, [sendPassengerNotif]);

  const normalizeMessages = useCallback((booking) => {
    const raw = Array.isArray(booking?.messages) ? booking.messages : [];
    return raw.map((m) => ({
      senderUid: m?.senderUid ?? m?.from,
      createdAt: m?.createdAt ?? m?.ts,
      text: m?.text ?? "",
      read: m?.read === true,
      _raw: m,
    }));
  }, []);

  const unreadCountFor = useCallback((booking) => {
    try {
      const msgs = normalizeMessages(booking);
      return msgs.filter((m) => !m.read && m.senderUid !== viewerUid).length;
    } catch { return 0; }
  }, [normalizeMessages, viewerUid]);

  // Auto-scroll active chats on incoming messages
  useEffect(() => {
    try {
      bookings.forEach((b) => {
        if (chatOpenMap[b.id]) {
          const ref = listRefs.current[b.id];
          if (ref) ref.scrollTop = ref.scrollHeight;
        }
      });
    } catch {}
  }, [bookings, chatOpenMap]);

  // Detect unread increases to pulse the badge briefly (WhatsApp-like)
  useEffect(() => {
    const nextPulse = {};
    try {
      bookings.forEach((b) => {
        const current = unreadCountFor(b);
        const prev = prevUnreadRef.current[b.id] ?? 0;
        if (current > prev) nextPulse[b.id] = true;
        prevUnreadRef.current[b.id] = current;
      });
    } catch {}
    if (Object.keys(nextPulse).length > 0) {
      setPulseMap((prev) => ({ ...prev, ...nextPulse }));
      const timer = setTimeout(() => {
        setPulseMap((prev) => {
          const copy = { ...prev };
          Object.keys(nextPulse).forEach((id) => { delete copy[id]; });
          return copy;
        });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [bookings, unreadCountFor]);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
      {/* Header */}
      <header className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h2 className="text-xl font-bold text-white mb-2">
              {extractCity(ride.origin)} → {extractCity(ride.destination)}
            </h2>
            <div className="flex flex-wrap gap-2 text-sm">
              <span className="bg-white/20 px-3 py-1 rounded-full text-white">
                📅 {ride.date}
              </span>
              <span className="bg-white/20 px-3 py-1 rounded-full text-white">
                🕐 {ride.departureTime}
              </span>
              <span className="bg-emerald-500/90 px-3 py-1 rounded-full text-white font-semibold">
                💬 {stats.total} {stats.total === 1 ? 'resenär' : 'resenärer'}
              </span>
            </div>
          </div>
          <button
            onClick={onDelete}
            className="ml-4 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors text-sm"
          >
            🗑️ Radera resa
          </button>
        </div>
      </header>

      {/* Legal Notice */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-700 p-3">
        <p className="text-xs text-blue-800 dark:text-blue-200 text-center">
          💬 <strong>Kommunikationsplattform:</strong> VägVänner hanterar inte betalningar. Alla överenskommelser sker direkt mellan er.
        </p>
      </div>

      {stats.total === 0 ? (
        <div className="p-8 text-center text-gray-500 dark:text-gray-400">
          <div className="text-4xl mb-3">📭</div>
          <p className="font-semibold mb-1">Inga bokningar ännu</p>
          <p className="text-sm">När någon bokar din resa visas de här</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* For each booking, render as expanded notification card */}
          {bookings.map((booking) => {
            const unreadCount = unreadCountFor(booking);
            const isCancelled = (booking.status || '').startsWith('cancelled');
            const isApproved = (booking.status || '') === 'approved_by_driver';
            const isRejected = (booking.status || '') === 'rejected_by_driver';
            const chatOpen = !!chatOpenMap[booking.id];
            const participantName = String((booking.passengerName || '').trim() || 'Resenär');
            const seatCount = Number(booking.seats || 1);
            const messages = normalizeMessages(booking)
              .slice()
              .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
            return (
              <div key={booking.id} className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden">
                {/* Header with passenger info */}
                <div className="p-4 border-b border-gray-200 dark:border-slate-700 bg-gradient-to-r from-gray-50 to-blue-50 dark:from-slate-700 dark:to-slate-600">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                        isApproved ? 'bg-green-600' : 
                        isRejected ? 'bg-red-600' : 'bg-amber-600'
                      }`}>
                        {isApproved ? '✓' : isRejected ? '✗' : '📬'}
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 dark:text-white">
                          Bokningsförfrågan från {participantName}
                        </h4>
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

                {/* Swedish message notification - like SeatBookingInboxCard (hidden until phone verified) */}
                {booking.passengerComment && !requirePhone && (
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
                      </div>
                    </div>
                  </div>
                )}

                {/* Status notification area - like SeatBookingInboxCard */}
                <div className="p-4 border-b border-gray-200 dark:border-slate-700">
                  {!isCancelled && !isApproved && !isRejected ? (
                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-6 h-6 bg-amber-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs">⏳</span>
                        </div>
                        <h4 className="font-semibold text-amber-800 dark:text-amber-200">
                          Väntar på ditt svar
                        </h4>
                      </div>
                      <p className="text-sm text-amber-700 dark:text-amber-300 mb-3">
                        {participantName} väntar på ditt svar.
                      </p>
                    </div>
                  ) : isApproved ? (
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
                        Godkänd! Ni kan nu chatta.
                      </p>
                    </div>
                  ) : isRejected ? (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-6 h-6 bg-red-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs">✗</span>
                        </div>
                        <h4 className="font-semibold text-red-800 dark:text-red-200">
                          Bokning avvisad
                        </h4>
                      </div>
                      <p className="text-sm text-red-700 dark:text-red-300">
                        Förfrågan avvisad.
                      </p>
                    </div>
                  ) : null}
                </div>

                {/* Action buttons - always visible for pending requests */}
                {!isCancelled && !isApproved && !isRejected && (
                  <div className="p-4 border-b border-gray-200 dark:border-slate-700">
                    <div className="flex flex-col sm:flex-row gap-3">
                      <button
                        onClick={() => handleApprove(booking)}
                        disabled={!!busyMap[booking.id]}
                        className="flex-1 py-3 px-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl font-semibold transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        <span className="text-lg">✅</span>
                        <span>Godkänn bokning</span>
                      </button>
                      <button
                        onClick={() => handleReject(booking)}
                        disabled={!!busyMap[booking.id]}
                        className="flex-1 py-3 px-4 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white rounded-xl font-semibold transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        <span className="text-lg">❌</span>
                        <span>Avslå bokning</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Additional actions after approval - simplified */}
                {isApproved && (
                  <div className="p-4 border-b border-gray-200 dark:border-slate-700">
                    <div className="flex justify-center">
                      <button
                        onClick={() => handleToggleChat(booking.id)}
                        className="py-3 px-6 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
                      >
                        <span className="text-lg">💬</span>
                        <span>{chatOpen ? 'Stäng chatt' : 'Öppna chatt'}</span>
                        {!chatOpen && unreadCount > 0 && (
                          <span className="px-2 py-1 rounded-full text-xs font-bold bg-orange-500 text-white">{unreadCount}</span>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Frozen chat notification for pending requests */}
                {!isCancelled && !isApproved && !isRejected && (
                  <div className="p-4 border-b border-gray-200 dark:border-slate-700">
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border-2 border-dashed border-gray-300 dark:border-gray-600">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-6 h-6 bg-gray-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs">🔒</span>
                        </div>
                        <h4 className="font-semibold text-gray-700 dark:text-gray-300">
                          Chatt är låst
                        </h4>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Chatten aktiveras när du godkänner.
                      </p>
                    </div>
                  </div>
                )}

                {/* Error messages */}
                {errorsMap[booking.id] && (
                  <div className="p-4 border-b border-gray-200 dark:border-slate-700">
                    <div className="p-3 rounded-lg bg-gradient-to-r from-red-50 to-rose-50 border-2 border-red-200 text-sm">
                      <div className="flex items-start gap-2">
                        <span className="text-red-500 text-lg flex-shrink-0 mt-0.5">⚠️</span>
                        <div className="text-red-700 font-medium leading-relaxed">{errorsMap[booking.id]}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Chat area - only shown when opened */}
                {chatOpen && (
                  <div className="rounded-lg border overflow-hidden">
                    {/* Only participant name should be visible */}
                    <div className="px-3 py-2 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-slate-800 dark:to-slate-700 border-b border-gray-200 dark:border-slate-700 text-xs text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <span className="inline-flex items-center gap-1"><span>👤</span><span className="font-semibold truncate max-w-[40ch]">{participantName}</span></span>
                    </div>
                    <div className="relative">
                      <div
                        ref={(el) => (listRefs.current[booking.id] = el)}
                        className="max-h-64 overflow-y-auto p-3 space-y-2 bg-white dark:bg-slate-800/40"
                      >
                        {messages.length === 0 ? (
                          <p className="text-sm text-gray-500">Inga meddelanden ännu.</p>
                        ) : (
                          messages.map((m, idx) => {
                            const mine = m.senderUid === viewerUid;
                            const bubbleBase = mine
                              ? 'bg-green-100 text-gray-900 border border-green-200'
                              : 'bg-white text-gray-900 border border-gray-200';
                            const corner = mine ? 'rounded-2xl rounded-br-md' : 'rounded-2xl rounded-bl-md';
                            return (
                              <div key={m._raw?.id || m.createdAt || idx} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                                <div className={`px-3 py-2 text-sm max-w-[80%] shadow-sm ${bubbleBase} ${corner}`}>
                                  <div className={`text-[10px] mb-1 font-medium ${mine ? 'text-green-700/70' : 'text-gray-600'}`}>
                                    {mine ? 'Du' : participantName}
                                  </div>
                                  <div className="whitespace-pre-wrap break-words leading-relaxed">{m.text}</div>
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
                    {!isCancelled && (
                      <div className="p-3 border-t border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800/40">
                        <div className="flex gap-2 items-end">
                          <div className="flex-1">
                            <input
                              type="text"
                              value={inputs[booking.id] || ''}
                              onChange={(e) => setInputs((prev) => ({ ...prev, [booking.id]: e.target.value }))}
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleSend(booking.id);
                                }
                              }}
                              placeholder="💬 Skriv meddelande..."
                              className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-slate-800 focus:border-blue-400 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-sm"
                              disabled={busyMap[booking.id]}
                            />
                          </div>
                          <button
                            onClick={() => handleSend(booking.id)}
                            disabled={busyMap[booking.id] || !String(inputs[booking.id] || '').trim()}
                            className="px-3 py-2 rounded-lg bg-blue-600 text-white disabled:opacity-50 hover:bg-blue-700 transition-all duration-200 font-semibold shadow-sm min-w-[80px] flex items-center justify-center"
                            title="Skicka meddelande"
                          >
                            {busyMap[booking.id] ? (
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <span className="text-lg">📤</span>
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

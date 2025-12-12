import React, { useMemo, useRef, useState, useEffect, useCallback } from "react";
import { doc, runTransaction } from "firebase/firestore";
import { db } from "../../firebase/firebase.js";
import { extractCity } from "../../utils/address.js";
import { sanitizeInput } from "../../utils/security.js";
import { maskContactIfLocked } from "../../utils/messaging.js";
import { detectContact, getContactViolationMessage } from "../../utils/messagingGuard.js";
import ReportDialog from "../ReportDialog.jsx";
import { submitUnlockReport } from "../../services/reportService.js";
 

export default function SeatBookingInboxCard({ booking, viewerUid, viewerEmail, onCancel }) {
  const [chatOpen, setChatOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [hideBusy, setHideBusy] = useState(false);
  const [error, setError] = useState("");
  const [sentCount, setSentCount] = useState(0);
  const listRef = useRef(null);
  const [opening, setOpening] = useState(false);
  const [lastSentAt, setLastSentAt] = useState(0);
  const [rapportOpen, setRapportOpen] = useState(false);
  const [rapportBusy, setRapportBusy] = useState(false);
  const [rapportDone, setRapportDone] = useState(false);
  const [nowTick, setNowTick] = useState(Date.now());
  const [pulse, setPulse] = useState(false);
  const prevUnreadRef = useRef(0);
  const driverName = String((booking?.driverName || booking?.driverNameShared || '').trim() || '');
  // Status display config
  const status = (booking.status || '').toLowerCase();
  const isCancelled = status.startsWith('cancelled');
  const isRequested = status === 'requested' || !status;
  const isConfirmed = !!booking.paypal || !!booking.paidAt || !!booking.contactUnlockedAt;
  // expired local check
  const isExpired = useMemo(() => {
    try {
      const d = String(booking.ride_date || '').slice(0,10);
      const t = String(booking.ride_time || '00:00').slice(0,5);
      if (!d) return false;
      const tz = 'Europe/Stockholm';
      const nowDate = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
      const nowTime = new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour12: false, hour: '2-digit', minute: '2-digit' }).format(new Date());
      if (d < nowDate) return true; if (d > nowDate) return false; return t <= nowTime;
    } catch { return false; }
  }, [booking.ride_date, booking.ride_time]);
  const statusCfg = isCancelled
    ? { badge: '❌ Avbruten', cls: 'bg-rose-50 border border-rose-200 text-rose-700' }
    : isConfirmed
    ? { badge: '✅ Bekräftad', cls: 'bg-emerald-50 border border-emerald-200 text-emerald-700' }
    : isExpired
    ? { badge: '⏳ Avslutad', cls: 'bg-slate-50 border border-slate-300 text-slate-700' }
    : { badge: '⏳ Väntar på bekräftelse', cls: 'bg-amber-50 border border-amber-200 text-amber-700' };

  const bookingMessages = useMemo(() => Array.isArray(booking?.messages) ? booking.messages : [], [booking?.messages]);
  const unlocked = useMemo(() => !!(booking?.paypal || booking?.paidAt || booking?.contactUnlockedAt), [booking?.paypal, booking?.paidAt, booking?.contactUnlockedAt]);
  const driverPhoneShared = booking?.driverPhoneShared || "";
  const driverEmailShared = booking?.driverEmailShared || "";
  const [wasSeen, setWasSeen] = useState(booking.passengerSeen === true);

  // Unread count for passenger side
  const unreadCount = useMemo(() => {
    try {
      if (!Array.isArray(bookingMessages)) return 0;
      return bookingMessages.filter(m => !m.read && m.senderUid !== viewerUid).length;
    } catch { return 0; }
  }, [bookingMessages, viewerUid]);

// Default closed: do not auto-open on unread/new/recent. Open only when user clicks.

  // 48h report window helpers
  const toMs = (ts) => (typeof ts === 'number' ? ts : (ts && ts.toMillis ? ts.toMillis() : 0));
  const H48 = 48 * 60 * 60 * 1000;
  const openedAt = toMs(booking?.contactUnlockedAt) || toMs(booking?.paidAt) || toMs(booking?.createdAt);
  const reportEnds = openedAt ? openedAt + H48 : 0;
  const canReport = unlocked && !booking?.reported && reportEnds > nowTick;
  const windowEnded = unlocked && reportEnds > 0 && nowTick >= reportEnds;
  const contactWindowActive = unlocked && reportEnds > nowTick;

  useEffect(() => {
    const t = setInterval(() => setNowTick(Date.now()), 60 * 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!chatOpen) return;
    try { if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight; } catch {}
  }, [bookingMessages, chatOpen]);

  // WhatsApp-like: pulse unread badge briefly when count increases
  useEffect(() => {
    try {
      const prev = prevUnreadRef.current || 0;
      if (unreadCount > prev) {
        setPulse(true);
        const t = setTimeout(() => setPulse(false), 3000);
        return () => clearTimeout(t);
      }
      prevUnreadRef.current = unreadCount;
    } catch {}
  }, [unreadCount]);

  // Mark booking seen when opening the card/chat
  useEffect(() => {
    (async () => {
      try {
        if (!booking?.id) return;
        if (wasSeen) return;
        await runTransaction(db, async (tx) => {
          const ref = doc(db, 'bookings', booking.id);
          const snap = await tx.get(ref);
          if (!snap.exists()) return;
          const data = snap.data() || {};
          if (data.passengerSeen === true) return;
          tx.update(ref, { passengerSeen: true, passengerSeenAt: Date.now() });
        });
        setWasSeen(true);
      } catch {}
    })();
  }, [booking?.id, chatOpen, wasSeen]);

  // Mark messages read when opening chat
  useEffect(() => {
    (async () => {
      if (!chatOpen || !booking?.id) return;
      try {
        await runTransaction(db, async (tx) => {
          const ref = doc(db, "bookings", booking.id);
          const snap = await tx.get(ref);
          if (!snap.exists()) return;
          const data = snap.data() || {};
          const existing = Array.isArray(data.messages) ? data.messages : [];
          let changed = false;
          const next = existing.map((m) => {
            if (!m) return m;
            if (m.read === true) return m;
            if (m.senderUid === viewerUid) return m;
            changed = true;
            return { ...m, read: true };
          });
          if (changed) tx.update(ref, { messages: next });
        });
      } catch {}
    })();
  }, [chatOpen, booking?.id, viewerUid, db]);

  const handleSend = useCallback(async () => {
    const raw = sanitizeInput(message, "message");
    if (!raw || !viewerUid || !booking?.id) return;
    const containsContact = detectContact(raw);
    if (Date.now() - lastSentAt < 5000) {
      setError("Vänta några sekunder innan du skickar igen.");
      return;
    }
    if (!contactWindowActive && containsContact) {
      const errorMessage = getContactViolationMessage(raw);
      setError(errorMessage);
      // Clear error after 8 seconds
      setTimeout(() => {
        setError("");
      }, 8000);
      return;
    }
    const MAX_FREE = 999999; // unlimited - communication platform
    if (!unlocked && sentCount >= MAX_FREE) {
      setError("Du har nått meddelandegränsen.");
      return;
    }
    setBusy(true);
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
          // Never store or display email in chat messages
          senderEmail: "",
          text: raw,
          createdAt: Date.now(),
          read: false,
        };
        tx.update(ref, { messages: existing.concat([newMsg]).slice(-200) });
      });
      setMessage("");
      setError("");
      setSentCount((c) => c + 1);
      setLastSentAt(Date.now());
    } finally {
      setBusy(false);
    }
  }, [message, viewerUid, viewerEmail, booking?.id, unlocked, sentCount]);

  const handleHide = useCallback(async () => {
    if (!booking?.id || !viewerUid) return;
    setHideBusy(true);
    try {
      await runTransaction(db, async (tx) => {
        const ref = doc(db, "bookings", booking.id);
        const snap = await tx.get(ref);
        if (!snap.exists()) return;
        const data = snap.data() || {};
        const arr = Array.isArray(data.hiddenForUids) ? data.hiddenForUids : [];
        if (arr.includes(viewerUid)) return; // already hidden
        tx.update(ref, { hiddenForUids: arr.concat([viewerUid]).slice(-100) });
      });
      // Persist locally as well (fallback if server rejects later)
      try {
        const key = `vv_hidden_bookings_${viewerUid}`;
        const list = JSON.parse(localStorage.getItem(key) || '[]');
        if (!list.includes(booking.id)) {
          localStorage.setItem(key, JSON.stringify(list.concat([booking.id]).slice(-500)));
        }
      } catch {}
    } finally {
      setHideBusy(false);
    }
  }, [booking?.id, viewerUid]);

  return (
    <article className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm">
      {/* Header */}
      <header className="p-3 bg-white dark:bg-slate-800 border-b text-gray-800 dark:text-gray-100">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-bold text-lg">
              {extractCity(booking.ride_origin)} <span className="text-white/80">→</span> {extractCity(booking.ride_destination)}
            </h3>
            <div className="text-xs opacity-90 mt-1 flex gap-2">
              {booking.ride_date && <span>📅 {booking.ride_date}</span>}
              {booking.ride_time && <span>🕐 {booking.ride_time}</span>}
            </div>
          </div>
          <div className="text-right text-xs opacity-90">
            <div>ID: {booking.id?.slice(0,8)}</div>
            {booking.createdAt && <div>{new Date(booking.createdAt).toLocaleDateString('sv-SE')}</div>}
          </div>
        </div>
        {/* HIDDEN: Old payment system badges - frozen for rollback */}
        {false && !wasSeen && !isCancelled && (
          <div className="mt-2 inline-flex items-center gap-1 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
            <span>●</span>
            <span>Ny</span>
          </div>
        )}
        {/* HIDDEN: Old status messages - frozen for rollback */}
        {false && (
          <div className={`mt-2 p-2 rounded-lg text-xs sm:text-[13px] ${statusCfg.cls}`}>
            <div className="font-bold mb-1">{statusCfg.badge}</div>
            {isConfirmed ? (
              <p>
                Kontaktuppgifter är tillgängliga. Använd chatten för att komma överens om detaljer.
                { (driverPhoneShared || driverEmailShared) && (
                  <span className="font-semibold"> Kontaktuppgifterna visas nedan.</span>
                )}
              </p>
            ) : isCancelled ? (
              <p>Denna bokning är avbruten. Ingen åtgärd krävs.</p>
            ) : isExpired ? (
              <p>Resan är avslutad. Bokningsåtgärder är inaktiverade.</p>
            ) : (
              <p>Din förfrågan har skickats till föraren. Du kan ställa frågor i chatten. Föraren låser upp kontaktuppgifter om ni går vidare.</p>
            )}
          </div>
        )}
      </header>

      {/* Chat first (no Chatta or Betala buttons for passenger) */}
      <section className="p-3 border-b border-gray-100 dark:border-slate-700">
        <div className="flex items-center justify-between mb-3">
          <div className="font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
            <span className="text-lg">💬</span>
            <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent font-bold">Meddelanden</span>
            {unreadCount > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-sm ${pulse ? 'animate-bounce' : 'animate-pulse'}`}>{unreadCount}</span>
            )}
          </div>
          <button onClick={() => { const next = !chatOpen; setOpening(next); setTimeout(()=>setOpening(false), 500); setChatOpen(next); }} className="text-sm px-4 py-2 rounded-lg bg-gradient-to-r from-blue-100 to-cyan-100 hover:from-blue-200 hover:to-cyan-200 dark:bg-slate-700 transition-all duration-200 font-medium border border-blue-200">
            {opening ? (
              <span className="inline-flex items-center gap-2"><span className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></span><span>Öppnar…</span></span>
            ) : (
              <span className="inline-flex items-center gap-2">
                <span className="mr-1">💬</span>
                <span>{chatOpen ? 'Dölj' : (driverName ? `Meddelanden med ${driverName}` : 'Meddelanden')}</span>
                {!chatOpen && unreadCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-orange-500 text-white">{unreadCount}</span>
                )}
              </span>
            )}
          </button>
        </div>
        {chatOpen && (
          <div className="rounded-lg border overflow-hidden">
            <div ref={listRef} className="max-h-64 overflow-y-auto p-3 space-y-2 bg-white dark:bg-slate-800/40">
              {bookingMessages.length === 0 ? (
                <p className="text-sm text-gray-500">Inga meddelanden ännu.</p>
              ) : (
                bookingMessages
                  .slice()
                  .sort((a, b) => (a?.createdAt || 0) - (b?.createdAt || 0))
                  .map((m) => {
                    const mine = m.senderUid === viewerUid || m.from === viewerUid;
                    const isSystem = m.from === 'system' || m.isSystemMessage;
                    const text = contactWindowActive ? (m.text || '') : maskContactIfLocked(m.text || '');
                    
                    if (isSystem) {
                      return (
                        <div key={m.id || m.createdAt} className="flex justify-center my-3">
                          <div className="px-4 py-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl max-w-[90%] shadow-sm">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-blue-600">ℹ️</span>
                              <div className="text-xs font-semibold text-blue-800 dark:text-blue-200">
                                VägVänner System
                              </div>
                            </div>
                            <div className="text-sm text-blue-700 dark:text-blue-300 whitespace-pre-wrap leading-relaxed">
                              {text}
                            </div>
                            {m.createdAt && (
                              <div className="mt-2 text-xs text-blue-600 dark:text-blue-400 text-center">
                                {new Date(m.createdAt).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    }
                    
                    return (
                      <div key={m.id || m.createdAt} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                        <div className={`px-3 py-2 text-sm max-w-[80%] shadow-sm ${mine ? 'bg-green-100 text-gray-900 border border-green-200' : 'bg-white text-gray-900 border border-gray-200'} ${mine ? 'rounded-2xl rounded-br-md' : 'rounded-2xl rounded-bl-md'}`}>
                          <div className={`text-[10px] mb-1 font-medium ${mine ? 'text-green-700/70' : 'text-gray-600'}`}>
                            {mine ? 'Du' : 'Föraren'}
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
            <div className="p-3 border-t border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800/40">
              {status === 'requested' ? (
                // Blocked input when waiting for driver approval
                <div className="space-y-3">
                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-amber-600">⏳</span>
                      <div className="text-sm font-semibold text-amber-800 dark:text-amber-200">
                        Väntar på förarens svar
                      </div>
                    </div>
                    <p className="text-sm text-amber-700 dark:text-amber-300">
                      Din förfrågan har skickats till föraren. Du kommer få ett meddelande när föraren godkänner eller avvisar din bokning.
                    </p>
                  </div>
                  
                  <div className="relative">
                    <input
                      value="Chatt låst i väntan på förarens godkännande..."
                      disabled
                      className="w-full px-3 py-2 rounded-lg border bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-sm cursor-not-allowed"
                    />
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                      <span className="text-gray-400">🔒</span>
                    </div>
                  </div>
                </div>
              ) : (
                // Normal input for approved bookings
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
            {/* HIDDEN: Old chat rules for payment system - frozen for rollback */}
            {false && !unlocked && (
              <div className="mx-4 mb-3 p-3 rounded-lg bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-200">
                <div className="flex items-start gap-2">
                  <span className="text-amber-600 text-lg flex-shrink-0">ℹ️</span>
                  <div className="text-amber-800 text-sm font-medium">
                    <div className="font-semibold mb-1">Chatregler:</div>
                    <div className="text-xs leading-relaxed">
                      • Dela inte telefonnummer eller e-post i chatten<br/>
                      • Kontaktuppgifter visas när föraren låser upp<br/>
                      • Använd chatten för att ställa frågor om resan
                    </div>
                  </div>
                </div>
              </div>
            )}
            {error && (
              <div className="mx-4 mb-3 p-3 rounded-lg bg-gradient-to-r from-red-50 to-rose-50 border-2 border-red-200 text-sm">
                <div className="flex items-start gap-2">
                  <span className="text-red-500 text-lg flex-shrink-0 mt-0.5">⚠️</span>
                  <div className="text-red-700 font-medium leading-relaxed">{error}</div>
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* HIDDEN: 48h report system for payment - frozen for rollback */}
      {false && unlocked && !isCancelled && (
        <div className="px-4 mt-2">
          {booking?.reported || rapportDone ? (
            <div className="p-2 rounded-lg border bg-emerald-50 text-emerald-700 text-xs">✅ Tack! Din rapport har skickats.</div>
          ) : (openedAt && reportEnds > nowTick) ? (
            <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-amber-50 border border-amber-200">
              <div className="text-[12px] text-amber-700">⏱️ Rapport-tid: {Math.max(0, Math.floor((reportEnds - nowTick) / (60*60*1000)))}h {Math.max(0, Math.floor(((reportEnds - nowTick) % (60*60*1000)) / (60*1000)))}m kvar</div>
              <button onClick={() => setRapportOpen(true)} className="px-3 py-1.5 rounded bg-rose-600 text-white text-xs font-semibold disabled:opacity-50">Rapportera problem</button>
            </div>
          ) : (
            <div className="p-2 rounded-lg bg-white/50 border border-gray-200 text-[12px] text-gray-600">Rapportperioden har gått ut.</div>
          )}
          {windowEnded && (
            <button
              onClick={async () => {
                try {
                  const userToken = await (await import('firebase/auth')).getAuth().currentUser?.getIdToken?.();
                  if (!userToken) return;
                  await fetch(`${process.env.REACT_APP_FUNCTIONS_BASE || ''}/attemptBookingSettlement`, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ bookingId: booking.id, userToken })
                  });
                } catch {}
              }}
              className="mt-2 px-3 py-1.5 rounded bg-emerald-600 text-white text-xs font-semibold"
            >Synka betalning</button>
          )}
          <ReportDialog
            open={rapportOpen}
            busy={rapportBusy}
            onClose={() => setRapportOpen(false)}
            onSubmit={async ({ reason, message: msg }) => {
              setRapportBusy(true);
              try {
                await submitUnlockReport({
                  bookingId: booking.id,
                  rideId: booking.rideId,
                  reporterId: viewerUid,
                  reporterEmail: viewerEmail || "",
                  reporterName: "",
                  reason,
                  message: msg,
                });
                setRapportDone(true);
              } catch (e) {
                setError(e?.message || "Kunde inte skicka rapport.");
              } finally {
                setRapportBusy(false);
                setRapportOpen(false);
              }
            }}
          />
        </div>
      )}

      {/* Booking info + action */}
      <section className="p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="p-3 rounded-lg bg-gradient-to-r from-slate-50 to-gray-50 border-2 border-slate-200 shadow-sm">
              <div className="text-sm font-bold text-slate-800 truncate">{booking.passengerName || booking.passengerEmail || 'Okänd resenär'}</div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            {unreadCount > 0 && (
              <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-sm animate-pulse">
                <span className="mr-1">💬</span>{unreadCount} ny
              </span>
            )}
            {!isCancelled && !isExpired && isRequested && (
          <button onClick={onCancel} className="px-4 py-2 rounded-lg bg-gradient-to-r from-rose-500 to-rose-600 text-white text-xs font-bold transition-all duration-300 shadow hover:shadow-md transform hover:-translate-y-0.5">Avbryt bokning</button>
            )}
            {/* Hide-from-list removed per request */}
          </div>
        </div>

        {/* HIDDEN: Old waiting message for payment system - frozen for rollback */}
        {false && !isConfirmed && !isCancelled && (
          <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 text-sm shadow-sm">
            <div className="flex items-center gap-2 text-amber-800 mb-1">
              <span className="text-lg">⏳</span>
              <span className="font-semibold">Väntar på bekräftelse</span>
            </div>
            <p className="text-amber-700">Föraren granskar din förfrågan. Du kan avboka när som helst.</p>
          </div>
        )}

        {/* HIDDEN: Driver contact info (payment system) - frozen for rollback */}
        {false && contactWindowActive && !isCancelled && (
          <div className="mt-3">
            {(driverPhoneShared || driverEmailShared) ? (
              <div className="bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 dark:from-emerald-900/30 dark:to-green-900/30 border-2 border-emerald-300 dark:border-emerald-700 rounded-xl p-5 shadow-lg">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-gradient-to-r from-emerald-100 to-green-100 dark:bg-emerald-900 rounded-xl shadow-sm">
                    <span className="text-emerald-700 dark:text-emerald-300 text-lg">🎉</span>
                  </div>
                  <div>
                    <p className="text-base font-bold text-emerald-800 dark:text-emerald-300">Förarens kontaktuppgifter</p>
                    <p className="text-xs text-emerald-600">Kontakta föraren direkt</p>
                  </div>
                </div>
                <div className="grid gap-3 text-sm">
                  {driverPhoneShared && (
                    <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-white to-emerald-50 dark:bg-slate-700 rounded-lg border-2 border-emerald-200 dark:border-emerald-700 shadow-sm hover:shadow-md transition-all duration-200">
                      <span className="text-lg">📞</span>
                      <div className="flex-1">
                        <div className="text-xs text-emerald-600 font-medium">Telefon</div>
                        <a href={`tel:${driverPhoneShared}`} className="text-emerald-800 dark:text-emerald-400 hover:text-emerald-900 dark:hover:text-emerald-300 underline font-bold break-all transition-colors">{driverPhoneShared}</a>
                      </div>
                    </div>
                  )}
                  {driverEmailShared && (
                    <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-white to-emerald-50 dark:bg-slate-700 rounded-lg border-2 border-emerald-200 dark:border-emerald-700 shadow-sm hover:shadow-md transition-all duration-200">
                      <span className="text-lg">📧</span>
                      <div className="flex-1">
                        <div className="text-xs text-emerald-600 font-medium">E-post</div>
                        <a href={`mailto:${driverEmailShared}`} className="text-emerald-800 dark:text-emerald-400 hover:text-emerald-900 dark:hover:text-emerald-300 underline font-bold break-all transition-colors">{driverEmailShared}</a>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="mt-3 p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-green-50 border-2 border-emerald-200 text-sm shadow-sm">
                <div className="flex items-center gap-2 text-emerald-800 mb-1">
                  <span className="text-lg">⏳</span>
                  <span className="font-semibold">Väntar på kontakt</span>
                </div>
                <p className="text-emerald-700">Föraren kontaktar dig direkt. Håll utkik i chatten och din e‑post.</p>
              </div>
            )}
          </div>
        )}
      </section>
    </article>
  );
}


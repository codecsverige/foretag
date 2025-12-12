/* ──────────────────────────────────────────────
   src/components/UnlockCard.jsx
   تفاصيل عملية Unlock (contact_unlock)
────────────────────────────────────────────── */
import React, { useState, useMemo, useEffect } from "react";
import PropTypes from "prop-types";
import { extractCity } from "../utils/address";
import { doc, runTransaction, getDoc, arrayUnion } from "firebase/firestore";
import { db } from "../firebase/firebase.js";
import ReportDialog from "./ReportDialog";
import { submitUnlockReport } from "../services/reportService";
import { sendNotification } from "../services/notificationService";
import SeatBookingInboxCard from "./inbox/SeatBookingInboxCard";

/**
 * UnlockCard
 *
 * @param {Object}   unlock    مستند contact_unlock
 * @param {string}   viewerUid uid المستخدم الحالى
 * @param {Function} onCardDeleted callback when card is deleted
 */
function UnlockCard({ unlock, viewerUid, onCardDeleted }) {
  const isBuyer  = viewerUid === unlock.userId;
  const contact  = buildContact(unlock, isBuyer);
  const [isBeingDeleted, setIsBeingDeleted] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Handle card deletion with smooth animation
  const handleCardDeleted = (bookingId) => {
    setIsBeingDeleted(true);
    // Fade out animation before removing from DOM
    setTimeout(() => {
      if (onCardDeleted) {
        onCardDeleted(bookingId);
      }
    }, 400); // Animation duration
  };

  // --- Report logic ---
  const [reportOpen, setReportOpen] = useState(false);
  const [reportBusy, setReportBusy] = useState(false);
  const [reportSent, setReportSent] = useState(false);
  const [reportError, setReportError] = useState("");
  const [cancelBusy, setCancelBusy] = useState(false);

  // 48h window logic
  const canReport = useMemo(() => {
    if (unlock.reported) return false;
    if (!unlock.contactUnlockedAt) return false;
    const now = Date.now();
    const unlockedAt = typeof unlock.contactUnlockedAt === 'object' && unlock.contactUnlockedAt.toMillis
      ? unlock.contactUnlockedAt.toMillis()
      : unlock.contactUnlockedAt;
    return now - unlockedAt < 48 * 60 * 60 * 1000; // 48h in ms
  }, [unlock.reported, unlock.contactUnlockedAt]);

  // Countdown timer state
  const [timeRemaining, setTimeRemaining] = useState('');

  // Calculate and update countdown
  useEffect(() => {
    if (!unlock.contactUnlockedAt || !canReport) return;

    const updateCountdown = () => {
      const now = Date.now();
      const unlockedAt = typeof unlock.contactUnlockedAt === 'object' && unlock.contactUnlockedAt.toMillis
        ? unlock.contactUnlockedAt.toMillis()
        : unlock.contactUnlockedAt;
      
      const endTime = unlockedAt + (48 * 60 * 60 * 1000);
      const remaining = endTime - now;

      if (remaining <= 0) {
        setTimeRemaining('Tiden har gått ut');
        return;
      }

      const hours = Math.floor(remaining / (60 * 60 * 1000));
      const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
      setTimeRemaining(`${hours}h ${minutes}m kvar`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [unlock.contactUnlockedAt, canReport]);

  // Handle report submit
  async function handleReportSubmit({ reason, message }) {
    setReportBusy(true);
    setReportError("");
    try {
      await submitUnlockReport({
        bookingId: unlock.id,
        rideId: unlock.rideId,
        reporterId: viewerUid,
        reporterEmail: unlock.unlockerEmail || "",
        reporterName: isBuyer ? unlock.passengerName : unlock.driverNameShared || "",
        reason,
        message,
      });
      setReportSent(true);
      setReportOpen(false);
    } catch (e) {
      setReportError("Kunde inte skicka rapporten. Försök igen.");
    } finally {
      setReportBusy(false);
    }
  }

  // Single deletion: permanently remove booking for both parties
  const handleCancelUnlock = async () => {
    if (cancelBusy) return;
    setCancelBusy(true);
    try {
      await runTransaction(db, async (tx) => {
        // 1. حذف من مجموعة bookings
        const bookingRef = doc(db, 'bookings', unlock.id);
        const bookingSnap = await tx.get(bookingRef);
        if (bookingSnap.exists()) {
          tx.delete(bookingRef);
        }
        
        // 2. حذف من مجموعة unlocks
        try {
          const unlockRef = doc(db, 'unlocks', unlock.id);
          const unlockSnap = await tx.get(unlockRef);
          if (unlockSnap.exists()) {
            tx.delete(unlockRef);
          }
        } catch {}
        
        // 3. حذف أي بيانات مرتبطة في rides إذا كانت موجودة
        if (unlock.rideId) {
          try {
            const rideRef = doc(db, 'rides', unlock.rideId);
            const rideSnap = await tx.get(rideRef);
            if (rideSnap.exists()) {
              const rideData = rideSnap.data();
              // إزالة هذا الـ unlock من قائمة unlocks في الـ ride
              if (rideData.unlocks && Array.isArray(rideData.unlocks)) {
                const updatedUnlocks = rideData.unlocks.filter(u => u !== unlock.id);
                tx.update(rideRef, { unlocks: updatedUnlocks });
              }
              // إزالة أي bookings مرتبطة
              if (rideData.bookings && Array.isArray(rideData.bookings)) {
                const updatedBookings = rideData.bookings.filter(b => b !== unlock.id);
                tx.update(rideRef, { bookings: updatedBookings });
              }
            }
          } catch {}
        }
        
        // 4. حذف من مجموعة passenger_ads إذا كان مرتبطًا
        if (unlock.passengerAdId) {
          try {
            const adRef = doc(db, 'passenger_ads', unlock.passengerAdId);
            const adSnap = await tx.get(adRef);
            if (adSnap.exists()) {
              const adData = adSnap.data();
              // إزالة هذا الـ unlock من قائمة unlocks في الإعلان
              if (adData.unlocks && Array.isArray(adData.unlocks)) {
                const updatedUnlocks = adData.unlocks.filter(u => u !== unlock.id);
                tx.update(adRef, { unlocks: updatedUnlocks });
              }
            }
          } catch {}
        }
        
        // 5. حذف أي رسائل منفصلة إذا كانت موجودة
        if (unlock.conversationId) {
          try {
            const convRef = doc(db, 'conversations', unlock.conversationId);
            const convSnap = await tx.get(convRef);
            if (convSnap.exists()) {
              tx.delete(convRef);
            }
          } catch {}
        }
      });

      // إشعار الطرف الآخر بالحذف الكامل
      try {
        const counterpartyEmail = unlock.counterpartyEmail || unlock.passengerEmail || unlock.driverEmail || '';
        const counterpartyName = unlock.counterpartyId === unlock.userId 
          ? (unlock.passengerName || 'المستخدم')
          : (unlock.driverNameShared || unlock.driverName || 'المستخدم');
          
        if (counterpartyEmail) {
          await sendNotification(
            counterpartyEmail,
            'Kontakt raderad permanent 🗑️',
            `${counterpartyName} har raderat kontakten permanent. Alla meddelanden, kontaktuppgifter och relaterad data har tagits bort helt.`,
            'VägVänner',
            'warning'
          );
        }
      } catch (_) {}

      handleCardDeleted(unlock.id);
    } catch (e) {
      console.error('Cancel unlock error:', e);
      alert('Kunde inte radera kontakten helt. Försök igen.');
    } finally {
      setCancelBusy(false);
    }
  };

  return (
    <article className={`bg-white dark:bg-slate-800 rounded-2xl shadow-md hover:shadow-xl transition-all duration-400 border border-gray-100 dark:border-slate-700 overflow-hidden group ${
      isBeingDeleted ? 'opacity-0 transform scale-95 pointer-events-none' : 'opacity-100 transform scale-100'
    }`}>
      {/* Modern Header */}
      <header className="bg-gradient-to-r from-emerald-500 to-teal-500 p-5 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0 bg-white/5 backdrop-blur-sm"></div>
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
        
        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
            {/* Route Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                  <span className="text-xl">🔓</span>
                </div>
                <h2 className="text-xl font-bold text-white">
                  {extractCity(unlock.ride_origin)}
                  <span className="mx-2 text-white/60">→</span>
                  {extractCity(unlock.ride_destination)}
                </h2>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-md rounded-lg px-3 py-1.5 text-sm text-white">
                  <span>📅</span>
                  <span className="font-medium">{unlock.ride_date}</span>
                </div>
                <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-md rounded-lg px-3 py-1.5 text-sm text-white">
                  <span>🕐</span>
                  <span className="font-medium">{unlock.ride_time}</span>
                </div>
                <div className="inline-flex items-center gap-1.5 bg-emerald-400/20 backdrop-blur-md rounded-lg px-3 py-1.5 text-sm text-white">
                  <span>✅</span>
                  <span className="font-medium">Upplåst</span>
                </div>
              </div>
            </div>

            {/* Single delete button - match söker resor styling */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setConfirmOpen(true)}
                disabled={cancelBusy}
                className="mt-2 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg transition-all duration-200 flex items-center gap-1 hover:scale-105 active:scale-95 disabled:opacity-50 shadow-sm hover:shadow-md"
                title="Radera kontakt permanent"
              >
                <span>🗑️</span>
                <span>{cancelBusy ? 'Raderar…' : 'Radera kontakt'}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Stats hidden (payment system frozen) */}
      {false && (
        <section className="p-4 border-b border-gray-100 dark:border-slate-600 bg-gray-50 dark:bg-slate-700/50">
          <div className="grid grid-cols-3 gap-4 text-center">
            <InfoStat value={isBuyer ? "Köpt" : "Sålt"} label="Typ" color="emerald" />
            <InfoStat value={unlock.driverShareMode || "phone"} label="Delning" color="blue" />
            <InfoStat value={unlock.commission || 20} label="Avgift (kr)" color="purple" />
          </div>
        </section>
      )}

      {/* Body */}
      <section className="p-4 space-y-4">
        {/* HIDDEN: Old status message - frozen for rollback */}
        {false && (
          <Box color="emerald">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900 rounded-lg">
                <span className="text-lg text-emerald-600 dark:text-emerald-400">🔓</span>
              </div>
              <div>
                <span className="font-semibold text-base text-emerald-700 dark:text-emerald-300">Kontakt upplåst</span>
                <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-1">
                  Kontaktuppgifterna är nu synliga. Du kan kontakta{" "}
                  {isBuyer ? "passageraren" : "föraren"} direkt.
                </p>
              </div>
            </div>
          </Box>
        )}

        {/* Contact info - HIDDEN (frozen payment system) */}
        {false && (
          <Box color="gray">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 bg-gray-100 dark:bg-slate-600 rounded-lg">
                <span className="text-lg">👥</span>
              </div>
              <h3 className="font-semibold text-base text-gray-800 dark:text-gray-200">{contact.label}</h3>
            </div>
            <ul className="space-y-2">
              {contact.name && <ContactRow icon="👤" text={contact.name} />}
              {contact.email && (
                <ContactRow
                  icon="📧"
                  text={contact.email}
                  href={`mailto:${contact.email}`}
                />
              )}
              {contact.phone && (
                <ContactRow
                  icon="📞"
                  text={contact.phone}
                  href={`tel:${contact.phone}`}
                />
              )}
              {!contact.email && !contact.phone && (
                <ContactRow
                  icon="ℹ️"
                  text={`${isBuyer ? "Passageraren" : "Föraren"} kontaktar dig direkt.`}
                />
              )}
            </ul>
          </Box>
        )}

        {/* PayPal info - HIDDEN (frozen payment system) */}
        {false && unlock.paypal && (
          <Box color="emerald">
            <div className="mb-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-emerald-100 dark:bg-emerald-900 rounded-xl flex-shrink-0">
                  <span className="text-emerald-600 dark:text-emerald-400 text-2xl">💳</span>
                </div>
                <div>
                  <h4 className="font-semibold text-base text-emerald-700 dark:text-emerald-300">Betalning bekräftad</h4>
                  <p className="text-sm text-emerald-600 dark:text-emerald-400">Transaktionen är genomförd</p>
                </div>
              </div>
            </div>
            
            <div className="bg-emerald-50 dark:bg-emerald-900/30 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">Belopp:</span>
                <span className="font-bold text-emerald-700 dark:text-emerald-300 text-base">
                  {unlock.paypal.amount} {unlock.paypal.currency}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">Metod:</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm">💳</span>
                  <span className="text-emerald-700 dark:text-emerald-300 font-medium text-sm">PayPal</span>
                </div>
              </div>
              {unlock.paypal.payer?.name && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">Betalare:</span>
                  <span className="text-emerald-700 dark:text-emerald-300 font-medium text-sm">{unlock.paypal.payer.name}</span>
                </div>
              )}
              
              {/* Status indicator */}
              <div className="mt-4 pt-3 border-t border-emerald-200 dark:border-emerald-800">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-emerald-700 dark:text-emerald-300 font-medium">Säker betalning verifierad</span>
                </div>
              </div>
            </div>
          </Box>
        )}

        {/* Meta hidden (payment system frozen) */}
        {false && (
          <Box color="gray">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="font-semibold text-sm text-gray-700 dark:text-gray-300">Kontakt av:</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-slate-600 rounded-lg px-3 py-2">
                  {isBuyer ? "Dig" : unlock.unlockerEmail || "Okänd"}
                </p>
              </div>
              <div className="space-y-1">
                <p className="font-semibold text-sm text-gray-700 dark:text-gray-300">Datum:</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-slate-600 rounded-lg px-3 py-2">
                  {unlock.contactUnlockedAt
                    ? new Date(unlock.contactUnlockedAt).toLocaleDateString("sv-SE", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "Okänt"}
                </p>
              </div>
            </div>
          </Box>
        )}

        {/* Report button - HIDDEN (frozen payment system) */}
        {false && canReport && !reportSent && (
          <div className="pt-4 border-t border-gray-200 dark:border-slate-600">
            <div className="flex justify-between items-center">
              {/* 48 hour countdown */}
              <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                <span className="text-amber-600 dark:text-amber-400">⏱️</span>
                <span className="text-sm font-medium text-amber-700 dark:text-amber-300">
                  Rapport-tid: {timeRemaining || 'Beräknar...'}
                </span>
              </div>
              
              <button
                className="group bg-white dark:bg-slate-800 border border-rose-300 dark:border-rose-700 text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 px-5 py-3 rounded-xl font-semibold transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5 flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-sm"
                onClick={() => setReportOpen(true)}
                disabled={reportBusy}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-rose-100 dark:bg-rose-900 rounded-lg group-hover:scale-110 transition-transform duration-200">
                    <span className="text-rose-600 dark:text-rose-400">⚠️</span>
                  </div>
                  <span>Rapportera problem / Begär återbetalning</span>
                </div>
              </button>
            </div>
          </div>
        )}
        
        {false && reportSent && (
          <div className="pt-4 border-t border-gray-200 dark:border-slate-600">
            <div className="bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-900 rounded-lg">
                  <span className="text-emerald-600 dark:text-emerald-400">✅</span>
                </div>
                <span className="text-emerald-700 dark:text-emerald-300 font-semibold">
                  Tack! Din rapport har skickats.
                </span>
              </div>
            </div>
          </div>
        )}
        {false && reportError && (
          <div className="pt-3 text-rose-700 dark:text-rose-400 font-semibold text-right text-sm">{reportError}</div>
        )}
        
      {/* Chat management: filter messages deleted for this viewer */}
      {(() => {
        const rawMsgs = Array.isArray(unlock?.messages) ? unlock.messages : [];
        const filteredMsgs = rawMsgs.filter((m) => {
          try {
            const del = Array.isArray(m?.deletedForUids) ? m.deletedForUids : [];
            return !del.includes(viewerUid);
          } catch { return true; }
        });
        const filteredBooking = { ...unlock, messages: filteredMsgs };
        return (
          <div className="pt-6 border-t-2 border-gray-200 dark:border-slate-600">
            <SeatBookingInboxCard
              booking={filteredBooking}
              viewerUid={viewerUid}
              viewerEmail={unlock.unlockerEmail || ""}
              onCancel={() => {}}
            />
          </div>
        );
      })()}
      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-gray-200 dark:border-slate-700 max-w-sm w-full p-5">
            <div className="flex items-center gap-2 mb-2 text-amber-700 dark:text-amber-300">
              <span>⚠️</span>
            </div>
            <h4 className="font-bold text-gray-900 dark:text-gray-100 mb-1">Radera kontakt permanent?</h4>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
              Detta kommer att radera alla meddelanden, kontaktuppgifter och relaterad data permanent. Denna åtgärd kan inte ångras.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmOpen(false)}
                className="px-3 py-1.5 rounded-md text-xs font-semibold bg-gray-200 hover:bg-gray-300 text-gray-700"
              >
                Avbryt
              </button>
              <button
                onClick={async () => { setConfirmOpen(false); await handleCancelUnlock(); }}
                className="px-3 py-1.5 rounded-md text-xs font-semibold bg-red-600 hover:bg-red-700 text-white"
                disabled={cancelBusy}
              >
                Bekräfta
              </button>
            </div>
          </div>
        </div>
      )}
        
        <ReportDialog
          open={reportOpen}
          onClose={() => setReportOpen(false)}
          onSubmit={handleReportSubmit}
          busy={reportBusy}
        />
      </section>
    </article>
  );
}

/* ────────── Helpers ────────── */

const buildContact = (u, isBuyer) =>
  isBuyer
    ? {
        label: "Passagerarens uppgifter",
        name:  u.passengerName,
        email: u.passengerEmail,
        phone: u.passengerPhone,
      }
    : {
        label: "Förarens uppgifter",
        name:  u.driverNameShared,
        email: u.driverEmailShared,
        phone: u.driverPhoneShared,
      };

/* ────────── Sub-components ────────── */

const InfoStat = ({ value, label, color }) => (
  <div className="text-center p-3 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-600">
    <p className={`text-base font-bold text-${color}-600 dark:text-${color}-400 truncate mb-1`}>{value}</p>
    <p className="text-gray-600 dark:text-gray-400 text-sm">{label}</p>
  </div>
);

const Box = ({ color, children }) => (
  <div className={`p-4 bg-${color}-50 dark:bg-${color}-900/20 rounded-xl border border-${color}-200 dark:border-${color}-800/50`}>{children}</div>
);

const ContactRow = ({ icon, text, href }) => (
  <li className="flex items-center gap-3 p-2 bg-white dark:bg-slate-700 rounded-lg border border-gray-100 dark:border-slate-600">
    <div className="p-2 bg-gray-100 dark:bg-slate-600 rounded-lg">
      <span className="text-gray-600 dark:text-gray-300">{icon}</span>
    </div>
    {href ? (
      <a href={href} className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 underline font-medium flex-1">
        {text}
      </a>
    ) : (
      <span className="text-gray-700 dark:text-gray-300 flex-1">{text}</span>
    )}
  </li>
);

/* ────────── PropTypes ────────── */

UnlockCard.propTypes = {
  unlock:    PropTypes.object.isRequired,
  viewerUid: PropTypes.string.isRequired,
  onCardDeleted: PropTypes.func,
};

InfoStat.propTypes = {
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  label: PropTypes.string.isRequired,
  color: PropTypes.string.isRequired,
};

Box.propTypes = {
  color:    PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
};

ContactRow.propTypes = {
  icon: PropTypes.string.isRequired,
  text: PropTypes.string.isRequired,
  href: PropTypes.string,
};

export default React.memo(UnlockCard);

function ChatDeletionManager({ bookingId, viewerUid, messages, onCardDeleted }) {
  const [showOptions, setShowOptions] = useState(false);
  const [selectedMessages, setSelectedMessages] = useState({});
  const [deletionType, setDeletionType] = useState(''); // 'messages', 'conversation', 'card'
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [busy, setBusy] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const toggleMessageSelection = (messageId) => {
    setSelectedMessages(prev => ({
      ...prev,
      [messageId]: !prev[messageId]
    }));
  };

  const selectAllMessages = () => {
    const allSelected = {};
    messages.forEach(msg => {
      const id = String(msg.id ?? msg.createdAt);
      allSelected[id] = true;
    });
    setSelectedMessages(allSelected);
  };

  const clearSelection = () => {
    setSelectedMessages({});
  };

  const getSelectedCount = () => {
    return Object.values(selectedMessages).filter(Boolean).length;
  };

  const handleDeletionTypeChange = (type) => {
    setDeletionType(type);
    setShowConfirmation(true);
  };

  const handleConfirmDeletion = async () => {
    setBusy(true);
    setIsDeleting(true);

    try {
      if (deletionType === 'messages') {
        // Delete selected messages only
        await deleteSelectedMessages();
      } else if (deletionType === 'conversation') {
        // Delete all messages but keep the booking
        await deleteConversation();
      } else if (deletionType === 'card') {
        // Delete entire card/booking
        await deleteEntireCard();
      }
    } catch (error) {
      console.error("Error during deletion:", error);
      alert("Kunde inte genomföra raderingen. Försök igen.");
      setIsDeleting(false);
    } finally {
      setBusy(false);
      setShowConfirmation(false);
      setShowOptions(false);
      setSelectedMessages({});
      setDeletionType('');
    }
  };

  const deleteSelectedMessages = async () => {
    const selectedIds = Object.keys(selectedMessages).filter(k => selectedMessages[k]);
    if (!selectedIds.length) return;

    await runTransaction(db, async (tx) => {
      const ref = doc(db, 'bookings', bookingId);
      const snap = await tx.get(ref);
      if (!snap.exists()) return;
      
      const data = snap.data() || {};
      const existing = Array.isArray(data.messages) ? data.messages : [];
      const updated = existing.map((m) => {
        const id = String(m.id ?? m.createdAt);
        if (!selectedIds.includes(id)) return m;
        
        const del = Array.isArray(m.deletedForUids) ? m.deletedForUids : [];
        if (del.includes(viewerUid)) return m;
        return { ...m, deletedForUids: del.concat([viewerUid]).slice(-100) };
      });
      
      tx.update(ref, { messages: updated });
    });

    // Notify about message deletion
    try {
      const data = (await getDoc(doc(db, 'bookings', bookingId))).data() || {};
      const counterpartyEmail = data.counterpartyId === viewerUid 
        ? (data.unlockerEmail || data.driverEmail || "") 
        : (data.passengerEmail || data.driverEmail || "");
      
      if (counterpartyEmail) {
        await sendNotification(
          counterpartyEmail,
          "Meddelanden raderade",
          `Den andra parten har raderat ${selectedIds.length} meddelande${selectedIds.length > 1 ? 'n' : ''} från er konversation.`,
          "VägVänner",
          "info"
        );
      }
    } catch (notificationError) {
      console.error("Could not send message deletion notification:", notificationError);
    }

    // Refresh the page to show updated messages
    window.location.reload();
  };

  const deleteConversation = async () => {
    await runTransaction(db, async (tx) => {
      const ref = doc(db, 'bookings', bookingId);
      const snap = await tx.get(ref);
      if (!snap.exists()) return;
      
      tx.update(ref, { 
        messages: [],
        conversationDeletedBy: viewerUid,
        conversationDeletedAt: Date.now()
      });
    });

    // Notify about conversation deletion
    try {
      const data = (await getDoc(doc(db, 'bookings', bookingId))).data() || {};
      const counterpartyEmail = data.counterpartyId === viewerUid 
        ? (data.unlockerEmail || data.driverEmail || "") 
        : (data.passengerEmail || data.driverEmail || "");
      
      if (counterpartyEmail) {
        await sendNotification(
          counterpartyEmail,
          "Konversation raderad",
          "Den andra parten har raderat hela konversationen. Alla meddelanden har tagits bort.",
          "VägVänner",
          "info"
        );
      }
    } catch (notificationError) {
      console.error("Could not send conversation deletion notification:", notificationError);
    }

    // Refresh the page to show updated state
    window.location.reload();
  };

  const deleteEntireCard = async () => {
    await runTransaction(db, async (tx) => {
      const ref = doc(db, 'bookings', bookingId);
      const snap = await tx.get(ref);
      if (!snap.exists()) return;
      
      tx.update(ref, { 
        messages: [],
        conversationDeletedBy: viewerUid,
        conversationDeletedAt: Date.now(),
        isDeleted: true,
        deletedBy: viewerUid
      });
    });

    // Notify about card deletion
    try {
      const data = (await getDoc(doc(db, 'bookings', bookingId))).data() || {};
      const counterpartyEmail = data.counterpartyId === viewerUid 
        ? (data.unlockerEmail || data.driverEmail || "") 
        : (data.passengerEmail || data.driverEmail || "");
      
      if (counterpartyEmail) {
        await sendNotification(
          counterpartyEmail,
          "Kontakt raderad",
          "Den andra parten har raderat kontakten helt. Konversationen och all data är borttagen.",
          "VägVänner",
          "info"
        );
      }
    } catch (notificationError) {
      console.error("Could not send card deletion notification:", notificationError);
    }

    // Smooth card removal with animation
    setTimeout(() => {
      if (onCardDeleted) {
        onCardDeleted(bookingId);
      }
    }, 300);
  };

  const getDeletionText = () => {
    switch (deletionType) {
      case 'messages':
        const count = getSelectedCount();
        return `Detta kommer att radera ${count} vald${count > 1 ? 'a' : ''} meddelande${count > 1 ? 'n' : ''} från din vy.`;
      case 'conversation':
        return "Detta kommer att radera hela konversationen för båda parter. Kontakten finns kvar.";
      case 'card':
        return "Detta kommer att radera hela kontakten permanent för båda parter. Både konversation och kontaktuppgifter tas bort.";
      default:
        return "";
    }
  };

  return (
    <div className={`mb-3 transition-all duration-300 ${isDeleting ? 'opacity-50 pointer-events-none' : ''}`}>
      {!showOptions && !showConfirmation ? (
        <div className="flex justify-end">
          <button 
            onClick={() => setShowOptions(true)} 
            disabled={isDeleting}
            className="px-3 py-1.5 rounded-md border text-xs font-semibold bg-red-50 hover:bg-red-100 border-red-200 text-red-700 disabled:opacity-50 transition-colors"
          >
            🗑️ Radera
          </button>
        </div>
      ) : showOptions && !showConfirmation ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="text-sm font-semibold text-gray-800 mb-3">
            Välj vad du vill radera:
          </div>
          
          {/* Message Selection */}
          <div className="space-y-3 mb-4">
            <div className="border rounded-lg p-3 bg-white">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-gray-700">Enskilda meddelanden:</label>
                <div className="flex gap-2">
                  <button
                    onClick={selectAllMessages}
                    className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                  >
                    Välj alla
                  </button>
                  <button
                    onClick={clearSelection}
                    className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                  >
                    Rensa val
                  </button>
                </div>
              </div>
              
              <div className="max-h-32 overflow-y-auto space-y-1">
                {messages && messages.length ? (
                  messages.map((m) => {
                    const id = String(m.id ?? m.createdAt);
                    return (
                      <label key={id} className="flex items-start gap-2 text-xs text-gray-700 p-1 hover:bg-gray-50 rounded cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={!!selectedMessages[id]} 
                          onChange={() => toggleMessageSelection(id)}
                          className="mt-0.5 accent-blue-600"
                        />
                        <span className="flex-1 truncate">{(m.text || '').slice(0, 50) || '(tomt meddelande)'}</span>
                      </label>
                    );
                  })
                ) : (
                  <div className="text-xs text-gray-500 text-center py-2">Inga meddelanden</div>
                )}
              </div>
              
              {getSelectedCount() > 0 && (
                <button
                  onClick={() => handleDeletionTypeChange('messages')}
                  className="mt-2 w-full px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold rounded"
                >
                  Radera {getSelectedCount()} meddelande{getSelectedCount() > 1 ? 'n' : ''} (endast från din vy)
                </button>
              )}
            </div>
          </div>

          {/* Conversation Deletion */}
          <div className="space-y-2 mb-4">
            <button
              onClick={() => handleDeletionTypeChange('conversation')}
              className="w-full px-3 py-2 bg-yellow-500 hover:bg-yellow-600 text-white text-xs font-semibold rounded flex items-center gap-2"
            >
              <span>💬</span>
              Radera hela konversationen (för båda parter)
            </button>
          </div>

          {/* Card Deletion */}
          <div className="space-y-2 mb-4">
            <button
              onClick={() => handleDeletionTypeChange('card')}
              className="w-full px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded flex items-center gap-2"
            >
              <span>🗑️</span>
              Radera hela kontakten (permanent)
            </button>
          </div>

          {/* Cancel Button */}
          <div className="flex justify-end">
            <button
              onClick={() => setShowOptions(false)}
              className="px-3 py-1.5 rounded-md text-xs font-semibold bg-gray-200 hover:bg-gray-300 text-gray-700"
            >
              Avbryt
            </button>
          </div>
        </div>
      ) : showConfirmation ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="text-sm text-red-800 font-semibold mb-2 flex items-center gap-2">
            <span>⚠️</span>
            Bekräfta radering
          </div>
          <div className="text-xs text-red-700 mb-3">
            {getDeletionText()}
            <br />
            <strong>Denna åtgärd kan inte ångras.</strong>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleConfirmDeletion}
              disabled={busy}
              className="px-3 py-1.5 rounded-md text-xs font-semibold bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white"
            >
              {busy ? "Raderar..." : "Ja, radera"}
            </button>
            <button
              onClick={() => {
                setShowConfirmation(false);
                setDeletionType('');
              }}
              disabled={busy}
              className="px-3 py-1.5 rounded-md text-xs font-semibold bg-gray-200 hover:bg-gray-300 text-gray-700"
            >
              Avbryt
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/* ──────────────────────────────────────────────
   src/components/PassengerAdInboxCard.jsx
   بطاقة إعلان الراكب + قائمة الرسائل من السائقين
   مطابق تماماً لنظام DriverRideInboxCard
────────────────────────────────────────────── */
import React, { useState, useMemo, useCallback } from "react";
import PropTypes from "prop-types";
import { extractCity } from "../utils/address.js";
import SeatBookingInboxCard from "./inbox/SeatBookingInboxCard.jsx";
import { db } from "../firebase/firebase.js";
import { doc, runTransaction } from "firebase/firestore";

/**
 * PassengerAdInboxCard
 * يعرض إعلان الراكب مع جميع الرسائل من السائقين
 * 
 * @param {Object}   ad        إعلان الراكب
 * @param {Array}    unlocks   قائمة الـ contact_unlock من السائقين
 * @param {string}   viewerUid  معرّف المستخدم الحالي
 * @param {string}   viewerEmail  بريد المستخدم الحالي
 * @param {Function} onDelete  callback عند حذف الإعلان
 */
function PassengerAdInboxCard({ ad, unlocks = [], viewerUid, viewerEmail, onDelete }) {
  const [showAllDrivers, setShowAllDrivers] = useState(true);
  const [decisionBusy, setDecisionBusy] = useState(false);
  
  const stats = useMemo(() => {
    const total = unlocks.length;
    const hasUnread = unlocks.some(u => {
      const messages = Array.isArray(u.messages) ? u.messages : [];
      return messages.some(m => !m.read && m.senderUid !== viewerUid);
    });
    
    return { total, hasUnread };
  }, [unlocks, viewerUid]);

  // Pending unlocks (contact requests) for this ad
  const pendingUnlocks = useMemo(() => {
    try {
      const isPending = (u) => {
        const st = String(u.status || "").toLowerCase();
        return !(st.includes("approved") || st.includes("rejected"));
      };
      return (unlocks || []).filter(isPending).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    } catch { return []; }
  }, [unlocks]);

  const latestPending = pendingUnlocks[0] || null;

  const handleApprove = useCallback(async () => {
    if (!latestPending?.id || decisionBusy) return;
    setDecisionBusy(true);
    try {
      await runTransaction(db, async (tx) => {
        const ref = doc(db, 'bookings', latestPending.id);
        const snap = await tx.get(ref);
        if (!snap.exists()) return;
        tx.update(ref, { status: 'approved_by_passenger', approvedAt: Date.now() });
      });
    } catch (e) {
      console.error('Approve unlock error:', e);
    } finally {
      setDecisionBusy(false);
    }
  }, [latestPending?.id, decisionBusy]);

  const handleReject = useCallback(async () => {
    if (!latestPending?.id || decisionBusy) return;
    setDecisionBusy(true);
    try {
      await runTransaction(db, async (tx) => {
        const ref = doc(db, 'bookings', latestPending.id);
        const snap = await tx.get(ref);
        if (!snap.exists()) return;
        tx.update(ref, { status: 'rejected_by_passenger', rejectedAt: Date.now() });
      });
    } catch (e) {
      console.error('Reject unlock error:', e);
    } finally {
      setDecisionBusy(false);
    }
  }, [latestPending?.id, decisionBusy]);


  return (
    <article className="bg-white dark:bg-slate-800 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-slate-700 overflow-hidden">
      {/* Header with trip info */}
      <header className="bg-gradient-to-r from-emerald-600 via-emerald-700 to-emerald-800 p-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-white/5 backdrop-blur-sm"></div>
        <div className="absolute -top-8 -right-8 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
        
        <div className="relative z-10">
          {/* Trip route */}
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-bold text-white">
              {extractCity(ad.from || ad.origin)} → {extractCity(ad.to || ad.destination)}
            </h2>
            <button
              onClick={onDelete}
              className="bg-rose-600 hover:bg-rose-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shadow-sm flex items-center gap-1"
            >
              🗑️ Radera annons
            </button>
          </div>
          
          {/* Trip details */}
          <div className="flex items-center gap-4 text-white/90 text-sm">
            {ad.date && (
              <div className="flex items-center gap-1">
                <span>📅</span>
                <span>{ad.date}</span>
              </div>
            )}
            {ad.time && (
              <div className="flex items-center gap-1">
                <span>🕐</span>
                <span>{ad.time}</span>
              </div>
            )}
            {ad.count && (
              <div className="flex items-center gap-1">
                <span>👥</span>
                <span>{ad.count} {ad.count === 1 ? 'person' : 'personer'}</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Summary section */}
      <section className="p-3 border-b border-gray-100 dark:border-slate-700 bg-gradient-to-r from-gray-50 to-emerald-50 dark:from-slate-700 dark:to-slate-600">
        {ad.comment && (
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg text-sm">
            <div className="flex items-start gap-2">
              <span className="text-lg">💬</span>
              <div>
                <p className="font-semibold text-blue-900 dark:text-blue-200 mb-1">Din kommentar:</p>
                <p className="text-blue-800 dark:text-blue-300 whitespace-pre-wrap">{ad.comment}</p>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Related contact requests (single-layer cards; notification inside each card, then buttons, then chat) */}
      <section className="p-4">
        {stats.total === 0 ? (
          <div className="p-6 text-center text-gray-500 dark:text-gray-400">
            <div className="bg-gradient-to-br from-gray-50 to-blue-50 dark:from-slate-700 dark:to-slate-600 rounded-xl p-6 border border-gray-200 dark:border-slate-600">
              <p className="text-3xl mb-3 opacity-40">💬</p>
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Inga meddelanden ännu</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                När en förare kontaktar dig kommer deras meddelande att visas här
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {unlocks.map((unlock) => (
              <SeatBookingInboxCard
                key={unlock.id}
                booking={unlock}
                viewerUid={viewerUid}
                viewerEmail={viewerEmail}
                onCancel={() => {}}
              />
            ))}
          </div>
        )}
      </section>
    </article>
  );
}

PassengerAdInboxCard.propTypes = {
  ad:          PropTypes.object.isRequired,
  unlocks:     PropTypes.array,
  viewerUid:   PropTypes.string.isRequired,
  viewerEmail: PropTypes.string.isRequired,
  onDelete:    PropTypes.func.isRequired,
};

export default React.memo(PassengerAdInboxCard);

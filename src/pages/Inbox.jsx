// src/pages/Inbox.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  runTransaction,
  
} from "firebase/firestore";
import { db } from "../firebase/firebase.js";
import { useAuth } from "../context/AuthContext";
import { extractCity } from "../utils/address.js";
import PageMeta from "../components/PageMeta";
import useMinaResorData from "./MinaResor/useMinaResorData.js";
import DriverRideInboxCard from "../components/inbox/DriverRideInboxCard.jsx";
import SeatBookingInboxCard from "../components/inbox/SeatBookingInboxCard.jsx";

/* ───── Helpers ───── */
const iconClass = "inline-block w-5 h-5 mr-1";
const colors = {
  danger: "text-red-600",
  success: "text-green-600",
  info: "text-blue-600",
};
const fmt = (ts) => new Date(ts).toLocaleString();

/* ───── Snackbar ───── */
function Snackbar({ text, type = "info", clear }) {
  if (!text) return null;
  const base =
    "fixed bottom-8 left-1/2 -translate-x-1/2 px-6 py-3 rounded-xl shadow-lg font-semibold cursor-pointer z-50";
  const palette = {
    success: "bg-green-600 text-white",
    error: "bg-red-700 text-white",
    info: "bg-gray-900 text-white",
  };
  return (
    <div className={`${base} ${palette[type]}`} onClick={clear}>
      {text}
    </div>
  );
}

/* ───── Confirm Modal ───── */
function Confirm({ open, title, body, onOk, onCancel }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50 px-4">
      <div className="bg-white w-full max-w-sm rounded-xl shadow-xl p-6">
        <h2 className="font-bold text-lg mb-3">{title}</h2>
        <p className="mb-6 whitespace-pre-wrap">{body}</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded"
          >
            Avbryt
          </button>
          <button
            onClick={onOk}
            className="bg-red-700 hover:bg-red-800 px-4 py-2 rounded text-white"
          >
            Bekräfta
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Inbox() {
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);

  const [snack, setSnack] = useState({ text: "", type: "info" });
  const [toAction, setToAction] = useState(null); // { type:'rideDelete'|'bkd'|'bookingPassenger', data }
  const [tab, setTab] = useState("resor");

  // Initialize tab from query (?tab=resor|bokningar)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const t = params.get('tab');
      if (t === 'resor' || t === 'bokningar') setTab(t);
    } catch {}
  }, []);

  // Load My Rides data (driver rides + their bookings)
  const {
    driverRides,
    bookingsMap,
    seatBookings,
    user: ridesUser,
    deleteRide,
    cancelBookingByDriver,
    cancelSeatBooking,
    loading: ridesLoading,
    networkError: ridesNetworkError,
  } = useMinaResorData();

  /* ───── Set loading to false when rides loaded ───── */
  useEffect(() => {
    if (user && !ridesLoading) {
      setLoading(false);
    }
  }, [user, ridesLoading]);

  /* ───── Snackbar helpers ───── */
  const showSnack = (text, type = "info") => setSnack({ text, type });
  const clearSnack = () => setSnack({ text: "", type: "info" });


  // Derived counts (optional badges)
  const driverCount = driverRides?.length || 0;
  const bookingsCount = seatBookings?.length || 0;

  // New events highlighting (last 48h)
  const FORTY_EIGHT_HOURS = 48 * 60 * 60 * 1000;
  const nowTs = Date.now();
  const newDriverCountImbox = useMemo(() => {
    try {
      if (!bookingsMap) return 0;
      let sum = 0;
      Object.values(bookingsMap).forEach((arr) => {
        (arr || []).forEach((b) => {
          if (b?.status === 'requested' && (nowTs - (b.createdAt || 0)) < FORTY_EIGHT_HOURS) sum += 1;
        });
      });
      return sum;
    } catch { return 0; }
  }, [bookingsMap, nowTs]);
  const newPassengerCountImbox = useMemo(() => {
    try {
      return (seatBookings || []).filter(b => b?.status === 'requested' && (nowTs - (b.createdAt || 0)) < FORTY_EIGHT_HOURS).length;
    } catch { return 0; }
  }, [seatBookings, nowTs]);



  /* ───── UI: not logged / loading ───── */
  if (!user)
    return <div className="text-center py-12">Logga in för att se din inkorg.</div>;
  if (loading)
    return (
      <div className="text-center py-12 text-gray-500 animate-pulse">
        Laddar inkorgen…
      </div>
    );

  /* ───── Render ───── */
  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-6 py-6">
      <PageMeta
        title="Inkorg - VägVänner"
        description="Hantera dina resor och bokningar på VägVänner"
        noindex={true}
        canonical="https://vagvanner.se/inbox"
      />
      <Snackbar text={snack.text} type={snack.type} clear={clearSnack} />

      {/* Network error banner */}
      {ridesNetworkError && (
        <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center justify-between">
          <div className="mr-3">
            ⚠️ Nätverksfel: Vissa uppdateringar kunde inte hämtas. Försök igen.
          </div>
          <button
            onClick={() => { try { window.location.reload(); } catch {} }}
            className="px-3 py-1.5 rounded bg-rose-600 text-white text-xs font-semibold"
          >
            Uppdatera sidan
          </button>
        </div>
      )}

      <Confirm
        open={!!toAction}
        title={
          toAction?.type === 'rideDelete'
            ? 'Radera annons?'
            : toAction?.type === 'bkd' || toAction?.type === 'bookingPassenger'
            ? 'Avbryt bokning?'
            : 'Bekräfta?'
        }
        body={"Denna åtgärd kan inte ångras."}
        onCancel={() => setToAction(null)}
        onOk={async () => {
          try {
            if (toAction?.type === 'rideDelete') {
              await deleteRide(toAction.data);
            } else if (toAction?.type === 'bkd') {
              await cancelBookingByDriver(toAction.data);
            } else if (toAction?.type === 'bookingPassenger') {
              await cancelSeatBooking(toAction.data);
            }
          } finally {
            setToAction(null);
          }
        }}
      />

      {/* Clear Purpose Header */}
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-2">💬 Bokningsförfrågningar</h1>
        <p className="text-sm sm:text-base text-gray-600">Nya förfrågningar, meddelanden och aktiva resor</p>
        
        {/* Quick Status Overview */}
        <div className="mt-4 flex flex-wrap gap-2 text-xs sm:text-sm">
          <div className="flex items-center gap-2 bg-blue-50 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full border border-blue-200">
            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
            <span>Nya förfrågningar kräver svar</span>
          </div>
          <div className="flex items-center gap-2 bg-green-50 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full border border-green-200">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            <span>Efter betalning: kontaktinfo visas</span>
          </div>
        </div>
      </div>

      {/* ───── Tabs: Resor & Bokningar ───── */}
      <section className="mb-12">
        {/* Compact Mobile-Friendly Tabs */}
        <div className="mb-6">
          <div className="flex gap-2 w-full">
            <button
              className={`relative flex-1 p-3 sm:p-4 rounded-lg text-center transition-all duration-200 ${tab === 'resor' ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg' : 'bg-white border border-gray-300 hover:border-indigo-400 hover:shadow-sm'}`}
              onClick={() => setTab('resor')}
            >
              <div className="flex flex-col items-center gap-1">
                <div className="flex items-center justify-center gap-2">
                  <span className="text-base sm:text-lg">🚗</span>
                  <span className="font-semibold text-sm sm:text-base">Resor</span>
                  {newDriverCountImbox > 0 && (
                    <span className="bg-orange-500 text-white text-xs font-bold rounded-full h-5 min-w-[20px] px-1 flex items-center justify-center">
                      {newDriverCountImbox}
                    </span>
                  )}
                </div>
                {tab === 'resor' && (
                  <p className="text-xs text-white/80 leading-tight">
                    Förfrågningar från passagerare {driverCount > 0 ? `(${driverCount})` : ''}
                  </p>
                )}
              </div>
            </button>
            
            <button
              className={`relative flex-1 p-3 sm:p-4 rounded-lg text-center transition-all duration-200 ${tab === 'bokningar' ? 'bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg' : 'bg-white border border-gray-300 hover:border-green-400 hover:shadow-sm'}`}
              onClick={() => setTab('bokningar')}
            >
              <div className="flex flex-col items-center gap-1">
                <div className="flex items-center justify-center gap-2">
                  <span className="text-base sm:text-lg">🎫</span>
                  <span className="font-semibold text-sm sm:text-base">Bokningar</span>
                  {newPassengerCountImbox > 0 && (
                    <span className="bg-orange-500 text-white text-xs font-bold rounded-full h-5 min-w-[20px] px-1 flex items-center justify-center">
                      {newPassengerCountImbox}
                    </span>
                  )}
                </div>
                {tab === 'bokningar' && (
                  <p className="text-xs text-white/80 leading-tight">
                    Resor jag har bokat {bookingsCount > 0 ? `(${bookingsCount})` : ''}
                  </p>
                )}
              </div>
            </button>
          </div>
        </div>

        {tab === 'resor' && (
          <div>
            {ridesLoading ? (
              <div className="text-center py-8 text-gray-500">Laddar dina resor…</div>
            ) : (driverRides?.length || 0) === 0 ? (
              <div className="text-center py-12 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl border-2 border-dashed border-indigo-200">
                <div className="mb-4">
                  <span className="text-5xl block mb-2">🚗</span>
                  <div className="w-16 h-1 bg-indigo-300 mx-auto rounded-full"></div>
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Inga aktiva resor som förare</h3>
                <p className="text-gray-600 mb-4 max-w-md mx-auto">
                  När du skapar resor kommer förfrågningar från passagerare att visas här
                </p>
                <a 
                  href="/create-ride" 
                  className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
                >
                  <span>➕</span> Skapa din första resa
                </a>
              </div>
            ) : (
              <div className="space-y-6">
                {driverRides.map((ride, index) => {
                  // Professional alternating background colors for better visual distinction
                  const rideBackgroundVariants = [
                    'bg-gradient-to-br from-blue-50 via-blue-25 to-white border-blue-300 shadow-blue-100/50',
                    'bg-gradient-to-br from-emerald-50 via-emerald-25 to-white border-emerald-300 shadow-emerald-100/50',
                    'bg-gradient-to-br from-purple-50 via-purple-25 to-white border-purple-300 shadow-purple-100/50',
                    'bg-gradient-to-br from-rose-50 via-rose-25 to-white border-rose-300 shadow-rose-100/50',
                    'bg-gradient-to-br from-indigo-50 via-indigo-25 to-white border-indigo-300 shadow-indigo-100/50',
                    'bg-gradient-to-br from-teal-50 via-teal-25 to-white border-teal-300 shadow-teal-100/50',
                    'bg-gradient-to-br from-orange-50 via-orange-25 to-white border-orange-300 shadow-orange-100/50',
                    'bg-gradient-to-br from-cyan-50 via-cyan-25 to-white border-cyan-300 shadow-cyan-100/50'
                  ];
                  const backgroundClass = rideBackgroundVariants[index % rideBackgroundVariants.length];
                  
                  return (
                    <div key={ride.id} className={`rounded-2xl shadow-lg border-2 overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-[1.02] ${backgroundClass}`}>
                      <DriverRideInboxCard
                        ride={ride}
                        bookings={bookingsMap[ride.id] || []}
                        viewerUid={user.uid}
                        viewerEmail={user.email}
                        onDelete={() => setToAction({ type: 'rideDelete', data: ride })}
                        onCancelBooking={(b) => setToAction({ type: 'bkd', data: { ride, booking: b } })}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {tab === 'bokningar' && (
          <div>
            {ridesLoading ? (
              <div className="text-center py-8 text-gray-500">Laddar dina bokningar…</div>
            ) : (seatBookings?.length || 0) === 0 ? (
              <div className="text-center py-12 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border-2 border-dashed border-green-200">
                <div className="mb-4">
                  <span className="text-5xl block mb-2">🎫</span>
                  <div className="w-16 h-1 bg-green-300 mx-auto rounded-full"></div>
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Inga aktiva bokningar</h3>
                <p className="text-gray-600 mb-4 max-w-md mx-auto">
                  Dina bokningar hos andra förare kommer att visas här
                </p>
                <a 
                  href="/" 
                  className="inline-flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                >
                  <span>🔍</span> Hitta resor att boka
                </a>
              </div>
            ) : (
              <div className="grid gap-5">
                {seatBookings.map((b, index) => {
                  // Professional alternating background colors for better visual separation
                  const backgroundVariants = [
                    'bg-gradient-to-br from-slate-50 via-slate-25 to-white border-slate-300 shadow-slate-100/50',
                    'bg-gradient-to-br from-blue-50 via-blue-25 to-white border-blue-300 shadow-blue-100/50',
                    'bg-gradient-to-br from-green-50 via-green-25 to-white border-green-300 shadow-green-100/50',
                    'bg-gradient-to-br from-purple-50 via-purple-25 to-white border-purple-300 shadow-purple-100/50',
                    'bg-gradient-to-br from-pink-50 via-pink-25 to-white border-pink-300 shadow-pink-100/50',
                    'bg-gradient-to-br from-indigo-50 via-indigo-25 to-white border-indigo-300 shadow-indigo-100/50',
                    'bg-gradient-to-br from-teal-50 via-teal-25 to-white border-teal-300 shadow-teal-100/50',
                    'bg-gradient-to-br from-amber-50 via-amber-25 to-white border-amber-300 shadow-amber-100/50'
                  ];
                  const backgroundClass = backgroundVariants[index % backgroundVariants.length];
                  
                  return (
                    <div key={b.id} className={`rounded-2xl shadow-lg border-2 overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-[1.02] ${backgroundClass}`}>
                      <SeatBookingInboxCard
                        booking={b}
                        viewerUid={user.uid}
                        viewerEmail={user.email}
                        onCancel={() => setToAction({ type: 'bookingPassenger', data: b })}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </section>

      {/* ───── How It Works Section ───── */}
      <section className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200 mb-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-100 rounded-lg">
            <span className="text-2xl">💡</span>
          </div>
          <div>
            <h3 className="font-bold text-xl text-gray-800">Så fungerar bokningsprocessen</h3>
            <p className="text-sm text-gray-600">Steg-för-steg guide för förare och passagerare</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* För Förare */}
          <div className="bg-white rounded-lg p-5 border border-blue-200">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xl">🚗</span>
              <h4 className="font-semibold text-lg text-gray-800">Som Förare</h4>
            </div>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-1 rounded-full min-w-[24px] text-center">1</span>
                <p className="text-sm text-gray-700">Passagerare skickar <strong>bokningsförfrågan</strong></p>
              </div>
              <div className="flex items-start gap-3">
                <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-1 rounded-full min-w-[24px] text-center">2</span>
                <p className="text-sm text-gray-700">Du kan <strong>chatta</strong> för att ställa frågor</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-full min-w-[24px] text-center">3</span>
                <p className="text-sm text-gray-700">Efter <strong>betalning</strong> = kontaktinfo visas</p>
              </div>
            </div>
          </div>
          
          {/* För Passagerare */}
          <div className="bg-white rounded-lg p-5 border border-green-200">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xl">🎫</span>
              <h4 className="font-semibold text-lg text-gray-800">Som Passagerare</h4>
            </div>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-full min-w-[24px] text-center">1</span>
                <p className="text-sm text-gray-700">Skicka <strong>bokningsförfrågan</strong> till föraren</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-full min-w-[24px] text-center">2</span>
                <p className="text-sm text-gray-700">Chatta med föraren om nödvändigt</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded-full min-w-[24px] text-center">3</span>
                <p className="text-sm text-gray-700"><strong>Betala</strong> för att låsa upp kontaktinfo</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Key Point */}
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start gap-3">
            <span className="text-xl">⚡</span>
            <div>
              <h5 className="font-semibold text-gray-800 mb-1">Viktigt att veta:</h5>
              <p className="text-sm text-gray-700">
                Kontaktuppgifter (telefon, exakt adress) visas först efter att passageraren har betalat. 
                Innan dess kan ni bara chatta här i appen.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ───── Quick Links ───── */}
      <section className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-2xl">🚀</span>
          <h3 className="font-bold text-xl text-gray-800">Snabblänkar</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <a
            href="/mina-resor"
            className="flex items-center gap-3 p-4 bg-white rounded-lg border border-blue-200 hover:border-blue-400 hover:shadow-md transition-all duration-200 group"
          >
            <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
              <span className="text-lg">📋</span>
            </div>
            <div>
              <h4 className="font-semibold text-gray-800">Mina Resor</h4>
              <p className="text-sm text-gray-600">Se alla dina resor och bokningar</p>
            </div>
          </a>
          <a
            href="/"
            className="flex items-center gap-3 p-4 bg-white rounded-lg border border-green-200 hover:border-green-400 hover:shadow-md transition-all duration-200 group"
          >
            <div className="p-2 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
              <span className="text-lg">🔍</span>
            </div>
            <div>
              <h4 className="font-semibold text-gray-800">Hitta Resor</h4>
              <p className="text-sm text-gray-600">Sök efter nya resor att gå med på</p>
            </div>
          </a>
        </div>
      </section>
    </div>
  );
}

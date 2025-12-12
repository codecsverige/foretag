// src/pages/MyRides.jsx - Version optimisée pour hautes performances
import React, { useState, useMemo, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { COMMISSION } from "../../utils/booking.js";
import useMinaResorData from "./useMinaResorData.js";
import { useOptimizedCache } from "../../hooks/useOptimizedCache.js";
import HighPerformanceList, { useHighPerformanceList } from "../../components/HighPerformanceList.jsx";
import PageMeta from "../../components/PageMeta.jsx";
import { extractCity } from "../../utils/address.js";

import Snackbar from "../../components/Snackbar.jsx";
import ConfirmModal from "../../components/ConfirmModal.jsx";
import NetworkError from "../../components/NetworkError.jsx";
import MinaResorHeader from "./MinaResorHeader.jsx";
import MinaResorTabs from "./MinaResorTabs.jsx";
import MinaResorContent from "./MinaResorContent.jsx";
import MyRidesLoadingState from "../../components/MyRidesLoadingState.jsx";
import MyRidesNoAuth from "../../components/MyRidesNoAuth.jsx";
import MyRidesContentLoading from "../../components/MyRidesContentLoading.jsx";
import WelcomeNotification from "../../components/WelcomeNotification.jsx";
import { useWelcomeNotifications } from "../../hooks/useWelcomeNotifications.js";
import NotificationBadge from "../../components/ui/NotificationBadge.jsx";

export default function MinaResor() {
  const location = useLocation();
  const {
    // Data
    driverRides,
    passengerAds,
    bookingsMap,
    seatBookings,
    unlocks,
    unlocksPurchased,
    unlocksForMyAds,
    
    // State
    loading,
    networkError,
    authLoading,
    user,
    
    // Notifications
    newDriver,
    newBookings,
    newUnlocks,
    newDriverCount,
    newBookingsCount,
    newUnlocksCount,
    
    // Actions
    deleteRide,
    cancelSeatBooking,
    cancelBookingByDriver,
    loadData,
    markSeen
  } = useMinaResorData({ passengerOnly: true });

  const [snack, setSnack] = useState({ text: "", type: "info" });
  const [confirm, setConfirm] = useState(null);
  const [tab, setTab] = useState(() => {
    const DEFAULT_TAB = (true /* HIDE_RESOR */)
      ? ((true /* HIDE_BOKNINGAR */) ? "passenger" : "bookings")
      : "driver";
    return DEFAULT_TAB;
  });
  const HIDE_RESOR = true;
  const HIDE_BOKNINGAR = true;
  const [useHighPerformanceMode, setUseHighPerformanceMode] = useState(false);
  const [floater, setFloater] = useState({ show: false, message: "", count: 0, targetTab: "passenger" });
  const prevCountsRef = React.useRef({ driver: 0, bookings: 0, unlocks: 0 });

  // نظام الإشعارات الترحيبية (إضافي - لا يؤثر على النظام الحالي)
  const { welcomeNotification, showWelcome, dismissWelcome } = useWelcomeNotifications({
    newDriver,
    newBookings, 
    newUnlocks,
    newDriverCount,
    newBookingsCount,
    newUnlocksCount
  });

  // Hook pour la liste haute performance
  const {
    searchQuery,
    setSearchQuery,
    sortBy,
    sortFn,
    toggleSort
  } = useHighPerformanceList([], {
    defaultSort: "date",
    defaultOrder: "desc"
  });

  const notify = useCallback((t, ty = "info") => setSnack({ text: t, type: ty }), []);
  const clearMsg = useCallback(() => setSnack({ text: "", type: "info" }), []);

  // Détection automatique du mode haute performance
  const totalItems = useMemo(() => {
    return (driverRides?.length || 0) + 
           (passengerAds?.length || 0) + 
           (seatBookings?.length || 0) + 
           (unlocks?.length || 0);
  }, [driverRides, passengerAds, seatBookings, unlocks]);

  // Activer automatiquement le mode haute performance pour > 100 éléments
  React.useEffect(() => {
    setUseHighPerformanceMode(totalItems > 100);
  }, [totalItems]);

  // Flytande indikator vid nya händelser (utan att ändra andra sidor)
  React.useEffect(() => {
    const prev = prevCountsRef.current;
    const incUnlocks  = Math.max(0, (newUnlocksCount  || 0) - (prev.unlocks  || 0));
    const totalInc = incUnlocks;

    if (totalInc > 0) {
      const targetTab = "unlocks";
      const label = "Kontakter";
      const message = `Nya uppdateringar i ${label}`;
      setFloater({ show: true, message, count: totalInc, targetTab });
      const t = setTimeout(() => setFloater((f) => ({ ...f, show: false })), 5000);
      return () => clearTimeout(t);
    }
    // Uppdatera referens (ignore driver/bookings in passenger-only)
    prevCountsRef.current = {
      driver: 0,
      bookings: 0,
      unlocks: newUnlocksCount || 0,
    };
  }, [newUnlocksCount]);

  /* تمرير tab واختفاء الإشعارات */
  const setTabSeen = useCallback((t) => {
    // Guard hidden tabs: redirect to allowed ones without deleting code
    let next = t;
    if (HIDE_RESOR && t === "driver") next = "passenger";
    if (HIDE_BOKNINGAR && t === "bookings") next = "unlocks";
    setTab(next);
    markSeen(next);
  }, [markSeen]);

  // Honor ?tab= query param (e.g., /my-rides?tab=unlocks)
  React.useEffect(() => {
    try {
      const qp = new URLSearchParams(location.search);
      const t = (qp.get('tab') || '').toLowerCase();
      if (t && ["driver", "passenger", "bookings", "unlocks"].includes(t)) {
        setTabSeen(t);
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  // Handle unlock card deletion
  const handleUnlockDeleted = useCallback((bookingId) => {
    // This will be handled by the data hook through real-time listeners
    // The deleted booking will automatically disappear from the list
    console.log("Unlock deleted:", bookingId);
  }, []);

  const handleConfirm = useCallback(async () => {
    if (!confirm) return;

    let result;
    if (confirm.mode === "ride") {
      result = await deleteRide(confirm.payload);
    } else if (confirm.mode === "booking") {
      result = await cancelSeatBooking(confirm.payload);
    } else if (confirm.mode === "bkd") {
      result = await cancelBookingByDriver(confirm.payload);
    }

    if (result) {
      notify(result.message, result.success ? "success" : "error");
    }
    setConfirm(null);
  }, [confirm, deleteRide, cancelSeatBooking, cancelBookingByDriver, notify]);

  // Données pour la liste haute performance (passenger-only)
  const highPerformanceData = useMemo(() => {
    const toPassengerItem = (ad) => ({
      ...ad,
      type: "passenger",
      displayType: "Passagerarannons",
      from: extractCity(ad.from || ad.origin || ""),
      to: extractCity(ad.to || ad.destination || ""),
      date: ad.date || "",
      time: ad.time || ad.departureTime || ""
    });

    const toUnlockItem = (unlock) => ({
      ...unlock,
      type: "unlock",
      displayType: "Upplåst kontakt",
      from: extractCity(unlock.ride_origin || unlock.origin || ""),
      to: extractCity(unlock.ride_destination || unlock.destination || ""),
      date: unlock.ride_date || "",
      time: unlock.ride_time || ""
    });

    const toSeatBookingItem = (booking) => ({
      ...booking,
      type: "seat_booking",
      displayType: "Bokningsförfrågan",
      from: extractCity(booking.ride_origin || booking.origin || ""),
      to: extractCity(booking.ride_destination || booking.destination || ""),
      date: booking.ride_date || booking.date || "",
      time: booking.ride_time || booking.departureTime || ""
    });

    if (tab === "passenger" && Array.isArray(passengerAds)) {
      return passengerAds.map(toPassengerItem);
    }

    if (tab === "unlocks") {
      const a = Array.isArray(unlocksPurchased) ? unlocksPurchased.map(toUnlockItem) : [];
      const b = Array.isArray(seatBookings) ? seatBookings.map(toSeatBookingItem) : [];
      return [...a, ...b];
    }

    return [];
  }, [tab, passengerAds, unlocksPurchased, seatBookings]);

  // Render item pour la liste haute performance
  const renderHighPerformanceItem = useCallback((item, index) => {
    return (
      <div className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 border-b border-gray-100 dark:border-slate-700">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs bg-brand/10 text-brand px-2 py-1 rounded-full">
              {item.displayType}
            </span>
            {item.date && (
              <span className="text-xs text-gray-500">
                {item.date}
              </span>
            )}
          </div>
          <h3 className="font-medium text-gray-900 text-base sm:text-lg truncate">
            {item.from} → {item.to}
          </h3>
          {(item.date || item.time) && (
            <div className="text-xs text-gray-600 mt-0.5">
              {item.date && <span>📅 {item.date}</span>}
              {item.time && <span>{item.date ? ", " : ""}🕐 {item.time}</span>}
            </div>
          )}
          <p className="text-sm sm:text-[15px] text-gray-600 mt-1 line-clamp-2 sm:line-clamp-1">
            {item.userName || item.description || "Ingen beskrivning"}
          </p>
          {(item.costMode === 'fixed_price' && item.price) ? (
            <p className="text-sm sm:text-base font-medium text-brand mt-1">
              {item.price} kr
            </p>
          ) : (item.costMode === 'cost_share' && Number(item.approxPrice) > 0) ? (
            <p className="text-sm sm:text-base font-medium text-brand mt-1">
              ca {Number(item.approxPrice)} kr
            </p>
          ) : null}
        </div>
        <div className="flex items-center gap-2 sm:gap-3 mt-2 sm:mt-0"></div>
      </div>
    );
  }, [setConfirm]);

  /* ───── حالات التحميل / الدخول ───── */
  if (authLoading) return <MyRidesLoadingState />;
  if (!user) return <MyRidesNoAuth />;

  /* ───── UI ───── */
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/30 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 transition-all duration-700">
      <PageMeta
        title="Mina Resor - VägVänner"
        description="Hantera dina resor, bokningar och kontakter på VägVänner"
        noindex={true}
        canonical="https://vagvanner.se/mina-resor"
      />
      {/* Decorative background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>
      
      <div className="relative z-10 max-w-screen-2xl mx-auto px-3 sm:px-4 lg:px-6 py-5 sm:py-7">
        <Snackbar text={snack.text} type={snack.type} clear={clearMsg} />

        {/* Floating new-activity indicator */}
        {floater.show && (
          <div className="fixed top-20 right-4 z-50 cursor-pointer" onClick={() => { setTabSeen(floater.targetTab); setFloater((f) => ({ ...f, show: false })); }}>
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-3 rounded-lg shadow-lg border-0 flex items-center gap-3 max-w-sm">
              <span className="text-lg">🆕</span>
              <div className="flex-1">
                <p className="font-semibold text-sm">{floater.message}</p>
              </div>
              <span className="inline-flex items-center justify-center bg-white/20 rounded-full px-2 py-0.5 text-xs font-bold">{floater.count}</span>
            </div>
          </div>
        )}

        <ConfirmModal
          open={!!confirm}
          title={confirm?.mode === "ride" ? "Radera annons?" : "Avbryt bokning?"}
          body="Denna åtgärd kan inte ångras."
          onOk={handleConfirm}
          onCancel={() => setConfirm(null)}
        />

        {/* Header Section */}
        <MinaResorHeader
          newDriverCount={newDriverCount}
          newBookingsCount={newBookingsCount}
          newUnlocksCount={newUnlocksCount}
        />

        {/* Performance Info */}
        {totalItems > 50 && (
          <div className="mb-6 p-4 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 backdrop-blur-sm border border-blue-300/30 dark:border-blue-700/30 rounded-2xl shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl text-white shadow-md">
                  <span className="text-xl">🚀</span>
                </div>
                <div>
                  <div className="text-sm font-bold text-gray-900 dark:text-white">
                    Optimerat läge
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    {totalItems} objekt laddade
                  </div>
                </div>
                {useHighPerformanceMode && (
                  <span className="px-3 py-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-bold rounded-full shadow-md">
                    ⚡ TURBO
                  </span>
                )}
              </div>
              <button
                onClick={() => setUseHighPerformanceMode(!useHighPerformanceMode)}
                className="px-4 py-2 bg-white dark:bg-slate-700 text-sm font-medium text-gray-700 dark:text-gray-200 rounded-xl hover:shadow-md transition-all duration-200 border border-gray-200 dark:border-slate-600"
              >
                {useHighPerformanceMode ? "🎆 Standard vy" : "⚡ Turboläge"}
              </button>
            </div>
          </div>
        )}

        {/* Search and Sort (only in high performance mode) */}
        {useHighPerformanceMode && (
          <div className="mb-6 p-6 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-100 dark:border-slate-700">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Sök resor, platser, användare..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 font-medium"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => toggleSort("date")}
                  className={`px-5 py-3 text-sm font-semibold rounded-xl transition-all duration-200 transform hover:scale-105 ${
                    sortBy === "date" 
                      ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg" 
                      : "bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-200 hover:shadow-md"
                  }`}
                >
                  📅 Datum
                </button>
                <button
                  onClick={() => toggleSort("price")}
                  className={`px-5 py-3 text-sm font-semibold rounded-xl transition-all duration-200 transform hover:scale-105 ${
                    sortBy === "price" 
                      ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg" 
                      : "bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-200 hover:shadow-md"
                  }`}
                >
                  💰 Pris
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Network Error */}
        {networkError && (
          <div className="mb-4">
            <NetworkError 
              message="Problème de connexion réseau"
              onRetry={loadData}
            />
          </div>
        )}

        {/* Tabs */}
        <MinaResorTabs
          activeTab={tab}
          onTabChange={setTabSeen}
          newDriver={newDriver}
          newBookings={newBookings}
          newUnlocks={newUnlocks}
          newDriverCount={newDriverCount}
          newBookingsCount={newBookingsCount}
          newUnlocksCount={newUnlocksCount}
        />

        {/* Info banner för passagerarbokningar */}
        {tab === "bookings" && (
          <div className="mb-6 animate-fade-in-up">
            <div className="relative overflow-hidden bg-gradient-to-r from-blue-500 to-teal-500 rounded-2xl shadow-xl p-6">
              {/* Pattern overlay */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full filter blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-40 h-40 bg-white rounded-full filter blur-3xl"></div>
              </div>
              
              <div className="relative z-10 flex items-start gap-4">
                <div className="flex-shrink-0 p-3 bg-white/20 backdrop-blur rounded-xl">
                  <span className="text-2xl">🎫</span>
                </div>
                <div className="flex-1 text-white">
                  <h3 className="font-bold text-lg mb-2">Dina bokningar</h3>
                  <p className="text-white/90 text-sm leading-relaxed">
                    Här ser du de resor du har bokat hos andra förare. Du kan se status och avboka om det behövs.
                    <span className="block mt-2 text-white/80">📞 Tips: Vänta på att föraren kontaktar dig för bekräftelse!</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && !networkError && <MyRidesContentLoading />}

        {/* Content */}
        {!loading && !networkError && (
          <div className="animate-fade-in-up">
            {useHighPerformanceMode ? (
              <HighPerformanceList
                items={highPerformanceData}
                renderItem={renderHighPerformanceItem}
                containerHeight={600}
                searchQuery={searchQuery}
                sortFn={sortFn}
                className="bg-white/80 dark:bg-slate-800/80 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden"
                emptyMessage={`Inga ${tab === "passenger" ? "passagerarannonser" : "upplåsningar"} att visa`}
              />
            ) : (
                          <MinaResorContent
              activeTab={tab}
              user={user}
              driverRides={driverRides}
              passengerAds={passengerAds}
              seatBookings={seatBookings}
              unlocks={unlocks}
              unlocksPurchased={unlocksPurchased}
              unlocksForMyAds={unlocksForMyAds}
              bookingsMap={bookingsMap}
              onConfirm={setConfirm}
              newDriver={newDriver}
              newBookings={newBookings}
              newUnlocks={newUnlocks}
              newDriverCount={newDriverCount}
              newBookingsCount={newBookingsCount}
              newUnlocksCount={newUnlocksCount}
              onUnlockDeleted={handleUnlockDeleted}
            />
            )}
          </div>
        )}
      </div>

      {/* إشعار الترحيب - إضافي فقط */}
      <WelcomeNotification 
        notification={welcomeNotification}
        show={showWelcome}
        onDismiss={dismissWelcome}
      />
    </div>
  );
}


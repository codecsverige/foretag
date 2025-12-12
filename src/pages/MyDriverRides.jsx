import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import TabNav from "../components/ui/TabNav.jsx";
import DriverActiveRides from "../components/DriverActiveRides.jsx";
import DriverUnlockedRequests from "../components/DriverUnlockedRequests.jsx";
import useMinaResorData from "./MinaResor/useMinaResorData.js";
import DriverRideInboxCard from "../components/inbox/DriverRideInboxCard.jsx";
import PageMeta from "../components/PageMeta";

export default function MyDriverRides() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("rides");
  const [loading, setLoading] = useState(true);

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

  // New events highlighting (last 48h) - same logic as Inbox
  const FORTY_EIGHT_HOURS = 48 * 60 * 60 * 1000;
  const nowTs = Date.now();
  const newDriverCount = useMemo(() => {
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

  const tabs = [
    {
      id: "rides",
      label: "Mina resor",
      icon: "🚗",
      notificationCount: newDriverCount
    },
    {
      id: "unlocked",
      label: "Kontakter",
      icon: "🔓",
      notificationCount: 0
    }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case "rides":
        return renderDriverResorContent();
      case "unlocked":
        return <DriverUnlockedRequests />;
      default:
        return renderDriverResorContent();
    }
  };

  const renderDriverResorContent = () => {
    if (loading) {
      return (
        <div className="text-center py-12 text-gray-500 animate-pulse">
          Laddar dina resor…
        </div>
      );
    }

    const driverCount = driverRides?.length || 0;

    if (driverCount === 0) {
      return (
        <div className="text-center py-12 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl border-2 border-dashed border-indigo-200">
          <div className="mb-4">
            <span className="text-5xl block mb-2">🚗</span>
            <div className="w-16 h-1 bg-indigo-300 mx-auto rounded-full"></div>
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Inga aktiva resor som förare</h3>
          <p className="text-gray-600 mb-4 max-w-md mx-auto">
            När du skapar resor kommer förfrågningar från passagerare att visas här med notifikationer
          </p>
          <a 
            href="/create-ride" 
            className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
          >
            <span>➕</span> Skapa din första resa
          </a>
        </div>
      );
    }

    return (
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
                onDelete={() => deleteRide(ride)}
                onCancelBooking={(b) => cancelBookingByDriver({ ride, booking: b })}
              />
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <PageMeta
        title="Mina Förar-resor - VägVänner"
        description="Hantera dina resor som förare och se bokningsförfrågningar"
        noindex={true}
        canonical="https://vagvanner.se/my-driver-rides"
      />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            🚗 Mina Förar-resor
          </h1>
          <p className="text-gray-600 text-lg">
            Hantera dina resor som förare och svara på bokningsförfrågningar
          </p>
          
          {/* Quick Status Overview */}
          <div className="mt-4 flex flex-wrap gap-2 justify-center text-xs sm:text-sm">
            <div className="flex items-center gap-2 bg-blue-50 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full border border-blue-200">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              <span>Nya förfrågningar kräver svar</span>
            </div>
            <div className="flex items-center gap-2 bg-green-50 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full border border-green-200">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span>Godkända bokningar = chatt aktiverad</span>
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <TabNav 
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          className="mb-8"
        />

        {/* Tab Content */}
        <div className="transition-all duration-300 ease-in-out">
          {renderTabContent()}
        </div>

        {/* How It Works Section - only on rides tab */}
        {activeTab === "rides" && !loading && (driverRides?.length || 0) > 0 && (
          <section className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200 mt-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-100 rounded-lg">
                <span className="text-2xl">💡</span>
              </div>
              <div>
                <h3 className="font-bold text-xl text-gray-800">Så hanterar du bokningsförfrågningar</h3>
                <p className="text-sm text-gray-600">Enkelt flöde för varje förfrågan</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Steg 1 */}
              <div className="bg-white rounded-lg p-5 border border-blue-200">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xl">📬</span>
                  <h4 className="font-semibold text-lg text-gray-800">1. Ta emot förfrågan</h4>
                </div>
                <div className="space-y-3">
                  <p className="text-sm text-gray-700">Passagerare skickar <strong>bokningsförfrågan</strong> med meddelande</p>
                  <p className="text-sm text-gray-700">Du ser deras kontaktinfo och kan <strong>chatta</strong> för frågor</p>
                </div>
              </div>

              {/* Steg 2 */}
              <div className="bg-white rounded-lg p-5 border border-green-200">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xl">✅</span>
                  <h4 className="font-semibold text-lg text-gray-800">2. Godkänn eller avslå</h4>
                </div>
                <div className="space-y-3">
                  <p className="text-sm text-gray-700">Tryck <strong>"Godkänn"</strong> eller <strong>"Avslå"</strong> förfrågan</p>
                  <p className="text-sm text-gray-700">Passageraren får automatisk <strong>notifikation</strong> om ditt svar</p>
                </div>
              </div>
              
              {/* Steg 3 */}
              <div className="bg-white rounded-lg p-5 border border-purple-200">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xl">💬</span>
                  <h4 className="font-semibold text-lg text-gray-800">3. Planera resan</h4>
                </div>
                <div className="space-y-3">
                  <p className="text-sm text-gray-700">Efter godkännande kan ni <strong>chatta fritt</strong> för att planera</p>
                  <p className="text-sm text-gray-700">Dela telefonnummer vid behov för direkt kontakt</p>
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
                    VägVänner är en kommunikationsplattform. Vi hanterar inte betalningar - alla överenskommelser sker direkt mellan er.
                    Svara snabbt på förfrågningar för bästa upplevelse!
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

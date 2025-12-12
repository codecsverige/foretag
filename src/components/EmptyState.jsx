import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { HiChevronDown, HiChevronUp, HiPlus, HiMagnifyingGlass, HiBell } from "react-icons/hi2";
import { useAuth } from "../context/AuthContext.jsx";
import { createRideAlert } from "../services/alertService";

export default function EmptyState({ searchQuery, onSearchChange, currentFilters }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showTips, setShowTips] = useState(false);
  const [showPopularRoutes, setShowPopularRoutes] = useState(false);
  const [busy, setBusy] = useState(false);
  const [ok, setOk] = useState(false);
  const [err, setErr] = useState("");

  const popularRoutes = [
    { from: "Stockholm", to: "Göteborg", count: "15+ resor/vecka" },
    { from: "Malmö", to: "Stockholm", count: "12+ resor/vecka" },
    { from: "Uppsala", to: "Stockholm", count: "20+ resor/vecka" },
    { from: "Göteborg", to: "Malmö", count: "8+ resor/vecka" },
    { from: "Linköping", to: "Stockholm", count: "6+ resor/vecka" },
    { from: "Västerås", to: "Stockholm", count: "10+ resor/vecka" }
  ];

  const searchTips = [
    { icon: "🗓️", text: "Prova söka på olika datum - många resor planeras i förväg" },
    { icon: "🕐", text: "Flexibla tider ger fler träffar - prova ±2 timmar" },
    { icon: "📍", text: "Sök på närliggande städer - Stockholm, Solna, Sundbyberg" },
    { icon: "🔄", text: "Kolla både 'Erbjuder' och 'Söker' - ibland hittar du oväntat" }
  ];

  const handleRouteClick = (from, to) => {
    if (onSearchChange) {
      onSearchChange(`${from} ${to}`);
    }
  };

  const handleNotify = async () => {
    setErr("");
    if (!user) {
      window.location.href = "/google-auth?return=" + encodeURIComponent(window.location.pathname + window.location.search);
      return;
    }
    try {
      setBusy(true);
      await createRideAlert({
        userId: user.uid,
        userEmail: user.email || "",
        originCity: currentFilters?.from || "",
        destinationCity: currentFilters?.to || "",
        preferredDate: currentFilters?.date || "",
        preferredTime: (currentFilters?.timeFrom && currentFilters?.timeTo) ? "" : (currentFilters?.time || ""),
        preferredTimeFrom: currentFilters?.timeFrom || "",
        preferredTimeTo: currentFilters?.timeTo || "",
      });
      setOk(true);
    } catch (e) {
      setErr(e?.message || "Ett fel inträffade. Försök igen.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="text-center py-12 px-4">
      {/* Main message */}
      <div className="mb-8">
        <div className="text-6xl mb-4">🔍</div>
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
          {searchQuery ? "Inga resor hittades" : "Redo att hitta din nästa resa?"}
        </h2>
        <p className="text-gray-600 text-lg max-w-md mx-auto">
          {searchQuery
            ? "Prova att ändra sökkriterier eller skapa en bevakning."
            : "Många resor skapas varje vecka – hitta din resa eller skapa en bevakning."
          }
        </p>
      </div>

      {/* Quick actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
        <button
          onClick={() => navigate("/create-ride")}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl"
        >
          <HiPlus className="w-5 h-5" />
          Skapa egen resa
        </button>
        
        <button
          onClick={() => document.querySelector('.search-bar input')?.focus()}
          className="border-2 border-gray-300 hover:border-blue-600 text-gray-700 hover:text-blue-600 px-6 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all duration-200"
        >
          <HiMagnifyingGlass className="w-5 h-5" />
          Ändra sökning
        </button>

        <button
          onClick={handleNotify}
          disabled={ok || busy}
          className={`px-6 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all duration-200 ${ok ? 'bg-emerald-600 text-white' : 'bg-gray-900 text-white hover:bg-black'} disabled:opacity-60`}
        >
          <HiBell className="w-5 h-5" />
{ok ? '✅ Bevakning aktiv' : (busy ? 'Skapar bevakning…' : '🔔 Skapa bevakning')}
        </button>
      </div>

      {/* Popular routes - collapsible */}
      <div className="mb-6">
        <button
          onClick={() => setShowPopularRoutes(!showPopularRoutes)}
          className="flex items-center justify-center gap-2 mx-auto text-blue-600 hover:text-blue-700 font-semibold transition-colors"
        >
          <span>Populära rutter</span>
          {showPopularRoutes ? (
            <HiChevronUp className="w-5 h-5" />
          ) : (
            <HiChevronDown className="w-5 h-5" />
          )}
        </button>
        
        {showPopularRoutes && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto">
            {popularRoutes.map((route, index) => (
              <button
                key={index}
                onClick={() => handleRouteClick(route.from, route.to)}
                className="bg-gray-50 hover:bg-blue-50 border hover:border-blue-200 rounded-lg p-3 text-left transition-all duration-200"
              >
                <div className="font-semibold text-gray-900">
                  {route.from} → {route.to}
                </div>
                <div className="text-sm text-gray-500">{route.count}</div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Search tips - collapsible */}
      {searchQuery && (
        <div className="max-w-lg mx-auto">
          <button
            onClick={() => setShowTips(!showTips)}
            className="flex items-center justify-center gap-2 mx-auto text-gray-600 hover:text-gray-800 font-medium transition-colors"
          >
            <span>💡 Tips för bättre sökresultat</span>
            {showTips ? (
              <HiChevronUp className="w-4 h-4" />
            ) : (
              <HiChevronDown className="w-4 h-4" />
            )}
          </button>
          
          {showTips && (
            <div className="mt-4 space-y-3">
              {searchTips.map((tip, index) => (
                <div key={index} className="flex items-start gap-3 text-left bg-blue-50 rounded-lg p-3">
                  <span className="text-xl">{tip.icon}</span>
                  <span className="text-sm text-gray-700">{tip.text}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Success story - compact */}
      <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-4 max-w-md mx-auto">
        <div className="text-sm text-green-800">
          <span className="font-semibold">💚 Anna från Stockholm:</span>
          <br />
          "Sparade 2000 kr/månad på resor till jobbet!"
        </div>
      </div>
    </div>
  );
}
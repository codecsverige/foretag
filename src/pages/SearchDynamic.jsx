import React, { useState, useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useNotification } from "../context/NotificationContext.jsx";
import PageMeta from "../components/PageMeta.jsx";
import SEOSection from "../components/SEOSection.jsx";
import HeroSection from "../components/HeroSection.jsx";
import TrustSection from "../components/TrustSection.jsx";
import QuickTips from "../components/QuickTips.jsx";
import RideFilters from "../components/rides/RideFilters";
import RideGrid    from "../components/rides/RideGrid";
import { collection, getDocs, query, orderBy, limit, doc, getDoc } from "firebase/firestore";
import { db, onForegroundFcm } from "../firebase/firebase.js";
import { HiBell } from "react-icons/hi2";
import { createRideAlert, listActiveAlerts, deactivateAlert } from "../services/alertService.js";
import CreateAlertDialog from "../components/alerts/CreateAlertDialog.jsx";
import TransportTypeTabs from "../components/TransportTypeTabs.jsx";

export default function SearchDynamic() {
  const { id } = useParams(); // Get ride ID from URL if present
  const location = useLocation();
  const { user } = useAuth(); // للتحقق من حالة تسجيل الدخول
  const { notify } = useNotification(); // للإشعارات
  const [filters, setFilters] = useState({
    from: "",
    to: "",
    date: "",
    time: "",
    timeFrom: "",
    timeTo: "",
    text: "",
    role: "",
    sort: "tidigast"
  });
  const [ridesForAuto, setAuto] = useState([]);
  const [hasRides, setHasRides] = useState(true); // État pour indiquer s'il y a des trajets
  const [directRideId, setDirectRideId] = useState(null);
  const [heroHidden, setHeroHidden] = useState(false); // للتحكم في إظهار/إخفاء Hero
  const [alertBusy, setAlertBusy] = useState(false);
  const [alertOk, setAlertOk] = useState(false);
  const [alertErr, setAlertErr] = useState("");
  const [alertDlgOpen, setAlertDlgOpen] = useState(false);
  const [myAlerts, setMyAlerts] = useState([]);
  // FCM handled in App.js
  const [draftFrom, setDraftFrom] = useState("");
  const [draftTo, setDraftTo] = useState("");
  const [draftDate, setDraftDate] = useState("");
  const [draftTimeFrom, setDraftTimeFrom] = useState("");
  const [draftTimeTo, setDraftTimeTo] = useState("");
  const [draftGlobal, setDraftGlobal] = useState(false);
  const [draftErr, setDraftErr] = useState("");

  // Hämta data för autokomplettering av filter (optimerad för bättre prestanda)
  useEffect(() => {
    let ignore = false;
    (async () => {
      // Fetch a smaller slice to reduce initial reads
      const q = query(collection(db, "rides"), orderBy("createdAt", "desc"), limit(24));
      const snap = await getDocs(q);
      if (!ignore) setAuto(snap.docs.map(d => d.data()));
    })();
    return () => { ignore = true; };
  }, []);

  // Prefill filters from URL query parameters (?from=Stockholm&to=Göteborg&q=...)
  useEffect(() => {
    try {
      const params = new URLSearchParams(location.search);
      const from = params.get("from") || "";
      const to = params.get("to") || "";
      const q = params.get("q") || "";
      const date = params.get("date") || "";
      const role = params.get("role") || "";
      if (from || to || q || date || role) {
        setFilters(prev => ({
          ...prev,
          from,
          to,
          text: q,
          date,
          role
        }));
      }
    } catch {}
    // only on mount or search change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  // Handle direct ride link
  useEffect(() => {
    if (id) {
      setDirectRideId(id);
    }
  }, [id]);

  // Load my active alerts and avoid leaking previous user's alerts
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Clear immediately on user change to prevent UI showing previous user's alerts
        setMyAlerts([]);
        if (!user) return;
        const items = await listActiveAlerts(user.uid);
        if (!cancelled) setMyAlerts(items);
      } catch (_) {}
    })();
    return () => { cancelled = true; };
  }, [user]);

  // FCM setup moved to App.js to prevent duplicate token requests and VAPID conflicts

  // Foreground push handler (optional toast)
  useEffect(() => {
    const off = onForegroundFcm?.((p) => {
      if (!p || !p.notification) return;
      try {
        const title = p.notification.title || 'VägVänner';
        const body = p.notification.body || '';
        // Lightweight in-app toast via alert for now
        // eslint-disable-next-line no-alert
        alert(`${title}\n${body}`);
      } catch {}
    });
    return () => { try { off && off(); } catch {} };
  }, []);

  // Callback pour recevoir l'état des trajets
  const handleRidesChange = (ridesAvailable) => {
    setHasRides(ridesAvailable);
  };

  // Determine if an alert matching current filters already exists (keeps button green after refresh)
  const alertActiveForFilters = useMemo(() => {
    if (!user || !myAlerts || myAlerts.length === 0) return false;
    const norm = (s="") => String(s || "").trim().toLowerCase();
    const fFrom = norm(filters.from);
    const fTo = norm(filters.to);
    const fDate = norm(filters.date);
    return myAlerts.some(a => {
      if (!a?.active) return false;
      if (a.scope === 'global') return true;
      const aFrom = norm(a.originCity);
      const aTo = norm(a.destinationCity);
      const aDate = norm(a.preferredDate);
      if (aFrom && fFrom && aFrom !== fFrom) return false;
      if (aTo && fTo && aTo !== fTo) return false;
      if (aDate && fDate && aDate !== fDate) return false;
      // time window matching skipped for UI indicator; server handles matching
      return true;
    });
  }, [user, myAlerts, filters.from, filters.to, filters.date]);

  // Callback لتحديث البحث من EmptyState
  const handleSearchChange = (newSearchText) => {
    setFilters(prev => ({ ...prev, text: newSearchText }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 dark:from-slate-900 dark:to-slate-800">
      <PageMeta
        title="VägVänner - Samåkning & Skjuts i Sverige | Billigare än kollektivtrafik"
        description="Hitta samåkning mellan svenska städer. Ekonomiskt smart alternativ till dyra biljetter. Över 50 000 genomförda resor. Säkert och miljövänligt."
        canonical="https://vagvanner.se/"
      />
      
      {/* Hero Section - يظهر فقط للزوار غير المسجلين وبدون فلاتر نشطة */}
      {!user && !heroHidden && !filters.from && !filters.to && !filters.text && !filters.role && (
        <HeroSection onActionClick={() => setHeroHidden(true)} />
      )}
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Transport Type Tabs */}
        <div className="mb-6 flex justify-center">
          <TransportTypeTabs currentType="car" />
        </div>
        
        <div className="mb-6">
          <RideFilters filters={filters} setFilters={setFilters} allRides={ridesForAuto} />
        </div>
        
        

        {/* Alert Creation Section */}
        <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-700 border-2 border-blue-200 dark:border-blue-700 rounded-2xl p-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex-1">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
                <HiBell className="w-5 h-5 text-blue-600" />
                Hittar du inte din resa?
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-300">
                Skapa bevakning = få push-notiser och e-post när någon lägger upp din rutt.
              </p>
            </div>
            <button
              onClick={async () => {
                setAlertErr("");
                setDraftFrom(filters.from || "");
                setDraftTo(filters.to || "");
                setDraftDate(filters.date || "");
                setDraftTimeFrom(filters.timeFrom || "");
                setDraftTimeTo(filters.timeTo || "");
                setDraftGlobal(!filters.from && !filters.to);
                setAlertDlgOpen(true);
              }}
              disabled={alertBusy}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all duration-200 whitespace-nowrap ${
                alertOk || alertActiveForFilters 
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white'
              } disabled:opacity-60 disabled:cursor-not-allowed`}
            >
              <HiBell className="w-4 h-4" />
{(alertOk || alertActiveForFilters) ? '✅ Bevakning aktiv' : (alertBusy ? 'Skapar bevakning…' : '🔔 Skapa bevakning')}
            </button>
          </div>

          {/* Active alerts list */}
          {user && myAlerts.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 text-xs mt-4 pt-4 border-t border-blue-200 dark:border-blue-700">
              <span className="text-gray-600 dark:text-gray-300 font-medium">Aktiva bevakningar:</span>
              {myAlerts.map(a => (
                <span key={a.id} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-100 dark:bg-blue-900 border border-blue-300 dark:border-blue-600 text-blue-800 dark:text-blue-200">
                  <span className="font-medium">🔔 {a.scope === 'global' ? 'Alla resor' : `${a.originCity||''}→${a.destinationCity||''}`}</span>
                  <button 
                    onClick={async () => {
                      try {
                        await deactivateAlert(a.id);
                        setMyAlerts(prev => prev.filter(x => x.id !== a.id));
                      } catch (_) {}
                    }} 
                    className="ml-1 text-blue-700 dark:text-blue-300 hover:text-blue-900 dark:hover:text-blue-100 font-bold"
                    aria-label="Ta bort bevakning"
                  >✕</button>
                </span>
              ))}
            </div>
          )}
        </div>
        {alertErr && (
          <div className="mb-4 text-xs text-rose-600">{alertErr}</div>
        )}
        <CreateAlertDialog
          open={alertDlgOpen}
          fromValue={draftFrom}
          toValue={draftTo}
          dateValue={draftDate}
          timeFromValue={draftTimeFrom}
          timeToValue={draftTimeTo}
          busy={alertBusy}
          error={draftErr}
          onChange={({ key, value }) => {
            if (key === 'from') setDraftFrom(value);
            else if (key === 'to') setDraftTo(value);
            else if (key === 'date') setDraftDate(value);
            else if (key === 'timeFrom') setDraftTimeFrom(value);
            else if (key === 'timeTo') setDraftTimeTo(value);
            else if (key === 'global') setDraftGlobal(!!value);
          }}
          onClose={() => { if (!alertBusy) { setAlertDlgOpen(false); setDraftErr(""); } }}
          onSubmit={async () => {
            setDraftErr("");
            const fromTrim = (draftFrom || "").trim();
            const toTrim = (draftTo || "").trim();
            // Allow global (no from/to/date/time) if user checked global
            const isGlobal = draftGlobal || (!fromTrim && !toTrim && !draftDate && !draftTimeFrom && !draftTimeTo);
            if (!isGlobal && (!fromTrim || !toTrim)) { setDraftErr("Ange start och destination eller markera 'Alla resor'."); return; }
            if (!user) {
              try { sessionStorage.setItem('redirectPath', window.location.pathname + window.location.search); } catch {}
              window.location.href = "/google-auth";
              return;
            }
            try {
              setAlertBusy(true);
              await createRideAlert({
                userId: user.uid,
                userEmail: user.email || "",
                originCity: isGlobal ? "" : fromTrim,
                destinationCity: isGlobal ? "" : toTrim,
                preferredDate: isGlobal ? "" : (draftDate || ""),
                preferredTime: (draftTimeFrom && draftTimeTo) ? "" : "",
                preferredTimeFrom: isGlobal ? "" : (draftTimeFrom || ""),
                preferredTimeTo: isGlobal ? "" : (draftTimeTo || ""),
              });
              setAlertDlgOpen(false);
              setAlertOk(true);
              if (!isGlobal) {
                setFilters(prev => ({ ...prev, from: fromTrim, to: toTrim, date: draftDate, timeFrom: draftTimeFrom, timeTo: draftTimeTo }));
              }
              try { const items = await listActiveAlerts(user.uid); setMyAlerts(items); } catch {}
              
              // Show success message
              notify({
                type: "success",
                message: `✅ Bevakning sparad! Du får push-notiser och e-post när någon lägger upp ${isGlobal ? 'nya resor' : `${fromTrim}→${toTrim}`}`,
                duration: 5000
              });
              
              // Send push notification about alert creation
              try {
                const { sendNotification } = await import("../services/notificationService.js");
                await sendNotification(
                  user.email || "",
                  "🔔 Bevakning aktiverad!",
                  isGlobal 
                    ? "Du får push-notiser och e-post när nya resor läggs upp på VägVänner"
                    : `Du får push-notiser och e-post för resor ${fromTrim} → ${toTrim}. Vi meddelar dig direkt när någon lägger upp en matchande resa!`,
                  user.displayName || "Användare",
                  "success"
                );
              } catch (err) {
                console.error("Failed to send notification:", err);
              }
              
              setTimeout(() => setAlertOk(false), 2500);
            } catch (e) {
              setDraftErr(e?.message || "Kunde inte skapa bevakning. Kontrollera din internetanslutning och försök igen.");
              notify({
                type: "error",
                message: "❌ " + (e?.message || "Kunde inte skapa bevakning.")
              });
            } finally {
              setAlertBusy(false);
            }
          }}
        />
        <RideGrid 
          filters={filters} 
          onRidesChange={handleRidesChange} 
          directRideId={directRideId}
          onSearchChange={handleSearchChange}
        />
      </div>
      
      {/* Trust Section - يظهر فقط للزوار غير المسجلين وبدون فلاتر نشطة */}
      {!user && !filters.from && !filters.to && !filters.text && !filters.role && hasRides && (
        <TrustSection />
      )}
      
      {/* Section SEO avec information sur la présence de trajets */}
      <SEOSection hasRides={hasRides} />
      
      {/* Quick Tips للمستخدمين الجدد */}
      <QuickTips />
    </div>
  );
}

import React, { useState, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import PageMeta from "../components/PageMeta.jsx";
import SEOSection from "../components/SEOSection.jsx";
import HeroSection from "../components/HeroSection.jsx";
import TrustSection from "../components/TrustSection.jsx";
import QuickTips from "../components/QuickTips.jsx";
import RideFilters from "../components/rides/RideFilters";
import RideGrid    from "../components/rides/RideGrid";
import { collection, getDocs, query, orderBy, limit, doc, getDoc } from "firebase/firestore";
import { db, requestFcmPermissionAndToken, onForegroundFcm } from "../firebase/firebase.js";
import { saveFcmTokenForEmail } from "../services/fcmService.js";
import { HiBell } from "react-icons/hi2";
import { createRideAlert, listActiveAlerts, deactivateAlert } from "../services/alertService.js";
import CreateAlertDialog from "../components/alerts/CreateAlertDialog.jsx";
import TransportTypeTabs from "../components/TransportTypeTabs.jsx";

export default function SearchDynamic() {
  const { id } = useParams(); // Get ride ID from URL if present
  const { user } = useAuth(); // للتحقق من حالة تسجيل الدخول
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
  const [pushReady, setPushReady] = useState(false);
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

  // Handle direct ride link
  useEffect(() => {
    if (id) {
      setDirectRideId(id);
    }
  }, [id]);

  // Load my active alerts
  useEffect(() => {
    (async () => {
      try {
        if (!user) { setMyAlerts([]); return; }
        const items = await listActiveAlerts(user.uid);
        setMyAlerts(items);
      } catch (_) {}
    })();
  }, [user]);

  // Ask for push permission once and store token in user profile (best-effort)
  useEffect(() => {
    (async () => {
      try {
        if (!user) return;
        const vapid = process.env.REACT_APP_FIREBASE_VAPID_KEY || "YSxCSvgVK0PugZ6IcNsIMcQaRG-85fnAUdd_1bfrxGo";
        const token = await requestFcmPermissionAndToken(vapid);
        if (token) {
          console.log('FCM token', token.slice(0,12) + '…');
          // Persist token by email for server-side push routing
          try { await saveFcmTokenForEmail(user.email || '', token, { uid: user.uid || '' }); setPushReady(true); } catch {}
        }
      } catch (_) {}
    })();
  }, [user]);

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
        description="Hitta samåkning mellan svenska städer. Ekonomiskt smart alternativ till dyra biljetter. Över 50 000 genomförda resor. Gratis, säkert och miljövänligt."
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
        
        
        
        <div className="flex items-center justify-between mb-4">
          {/* Active alerts list */}
          {user && myAlerts.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {myAlerts.map(a => (
                <span key={a.id} className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700">
                  <span>🔔 {a.scope === 'global' ? 'Alla resor' : `${a.originCity||''}→${a.destinationCity||''}`}</span>
                  <button onClick={async () => {
                    try {
                      await deactivateAlert(a.id);
                      setMyAlerts(prev => prev.filter(x => x.id !== a.id));
                    } catch (_) {}
                  }} className="ml-1 text-amber-800 hover:text-amber-900">✕</button>
                </span>
              ))}
            </div>
          )}
          <button
            onClick={async () => {
              setAlertErr("");
              if (!user) {
                try { sessionStorage.setItem('redirectPath', window.location.pathname + window.location.search); } catch {}
                window.location.href = "/google-auth";
                return;
              }
              if (!(filters.from && filters.to)) {
                setDraftFrom(filters.from || "");
                setDraftTo(filters.to || "");
                setDraftDate(filters.date || "");
                setDraftTimeFrom(filters.timeFrom || "");
                setDraftTimeTo(filters.timeTo || "");
                setDraftGlobal(!filters.from && !filters.to && !filters.date && !filters.timeFrom && !filters.timeTo);
                setAlertDlgOpen(true);
                return;
              }
              try {
                setAlertBusy(true);
                await createRideAlert({
                  userId: user.uid,
                  userEmail: user.email || "",
                  originCity: (filters.from || "").trim(),
                  destinationCity: (filters.to || "").trim(),
                  preferredDate: filters.date || "",
                  preferredTime: (filters.timeFrom && filters.timeTo) ? "" : (filters.time || ""),
                  preferredTimeFrom: filters.timeFrom || "",
                  preferredTimeTo: filters.timeTo || "",
                });
                setAlertOk(true);
                // Refresh list
                try { const items = await listActiveAlerts(user.uid); setMyAlerts(items); } catch {}
                setTimeout(() => setAlertOk(false), 2500);
              } catch (e) {
                setAlertErr(e?.message || "Kunde inte skapa bevakning. Ange start och destination.");
              } finally {
                setAlertBusy(false);
              }
            }}
            disabled={alertBusy}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold ${alertOk || alertActiveForFilters ? 'bg-emerald-600 text-white' : 'bg-gray-900 text-white hover:bg-black'} disabled:opacity-60`}
          >
            <HiBell className="w-4 h-4" />
            {(alertOk || alertActiveForFilters) ? 'Bevakning aktiv' : (alertBusy ? 'Skapar…' : 'Skapa bevakning')}
          </button>
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
              setTimeout(() => setAlertOk(false), 2500);
            } catch (e) {
              setDraftErr(e?.message || "Kunde inte skapa bevakning.");
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


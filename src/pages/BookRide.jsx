import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation, Link } from "react-router-dom";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  runTransaction,
} from "firebase/firestore";
import { db } from "../firebase/firebase.js";
import { useAuth } from "../context/AuthContext";
import { useNotification } from "../context/NotificationContext";
import { Helmet } from "react-helmet-async";
import Snackbar from "../components/ui/Snackbar";
// إزالة InfoRow غير المستخدم - استبدل بتصميم محسن
import TextInput from "../components/forms/TextInput";
// Message input removed: using a fixed Swedish template
import { sendNotification, sendNewBookingNotification } from "../services/notificationService";
import { extractCity } from "../utils/address";
import { trackBookingSent } from "../services/analytics";

export default function BookRide() {
  const { rideId } = useParams();
  const location = useLocation();
  
  const navigate = useNavigate();
  const { user, authLoading } = useAuth();

  const [ride, setRide] = useState(() => {
    // Fast path: if we navigated with state, use it
    const stateRide = location && location.state && location.state.ride;
    return stateRide || null;
  });
  const [loading, setLoading] = useState(true);
  const [flash, setFlash] = useState({ type: "info", text: "" });
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [existingBookingId, setExistingBookingId] = useState(null);

  const [name, setName] = useState(user?.displayName || "");
  const [email, setEmail] = useState("");
  // Fixed message flow (no manual message editing)
  const sendEmail = false;
  const [submittedData, setSubmittedData] = useState(null);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showLegalText, setShowLegalText] = useState(false);

  function escapeHtml(s) {
    try {
      return String(s)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
    } catch (_) {
      return "";
    }
  }

  useEffect(() => {
    if (authLoading) return;
    // If ride already provided via navigation state, skip fetch
    if (ride) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const snap = await getDoc(doc(db, "rides", rideId));
        if (!snap.exists()) {
          setFlash({ type: "error", text: "Resan hittades inte." });
          setLoading(false);
          return;
        }
        setRide({ id: snap.id, ...snap.data() });
        setLoading(false);
      } catch (err) {
        console.error("Error loading ride:", err);
        setFlash({ type: "error", text: "Ett fel uppstod vid hämtning av resan." });
        setLoading(false);
      }
    })();
  }, [authLoading, rideId, ride]);

  // Detect existing booking by same user for this ride (prevent duplicates)
  useEffect(() => {
    if (authLoading) return;
    if (!user || !ride) return;
    let alive = true;
    (async () => {
      try {
        const q = query(
          collection(db, "bookings"),
          where("rideId", "==", rideId),
          where("userId", "==", user.uid),
          where("bookingType", "==", "seat_booking")
        );
        const snap = await getDocs(q);
        if (!alive) return;
        if (!snap.empty) {
          setExistingBookingId(snap.docs[0].id);
        }
      } catch (e) {
        // ignore — do not block UI on query fail
      }
    })();
    return () => { alive = false; };
  }, [authLoading, user, ride, rideId]);

  if (authLoading || loading) return <p className="p-10 text-center">Laddar …</p>;
  if (!ride) return <p className="p-10 text-center text-rose-600">{flash.text}</p>;

  const effectivePhone = user.phoneNumber || "";
  const phoneOk = effectivePhone.replace(/\D/g, "").length >= 6;
  const emailOk = true; // email delivery disabled for now
  const fromCity = extractCity(ride.origin);
  const toCity = extractCity(ride.destination);
  const templateMessage = `Hej! Jag hoppas att vi kan dela kostnaderna för denna resa tillsammans.

🚗 Resa: ${fromCity} till ${toCity}
📅 Datum: ${ride.date} kl. ${ride.departureTime}
📱 Mitt telefonnummer: ${effectivePhone}

Vänligen kontakta mig så kan vi planera resan tillsammans!

Med vänliga hälsningar`;
  const commentOk = templateMessage.trim().length > 0;
  const canSend = phoneOk && commentOk && emailOk && acceptTerms && !busy;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canSend) return;
    // Gate at submission: require verified phone
    if (!user.phoneNumber) {
      const current = location.pathname + location.search;
      const resumeUrl = current.includes('?') ? `${current}&resume=book-ride` : `${current}?resume=book-ride`;
      navigate(`/verify-phone?return=${encodeURIComponent(resumeUrl)}`);
      return;
    }
    setBusy(true);

    // document-id unique pour éviter les doublons
    const bookingDocId = `seat_${rideId}_${user.uid}_${Date.now()}`;

    try {
      await runTransaction(db, async (tx) => {
        const ref = doc(db, "bookings", bookingDocId);
        const snap = await tx.get(ref);
        if (snap.exists()) {
          throw new Error("Du har redan skickat en förfrågan.");
        }

        tx.set(ref, {
          bookingType: "seat_booking",
          rideRole: ride.role,
          rideId,
          ride_origin: ride.origin,
          ride_destination: ride.destination,
          ride_date: ride.date,
          ride_time: ride.departureTime,
          userId: user.uid,
          counterpartyId: ride.userId,
          passengerName: name.trim() || "Passagerare",
          passengerEmail: (user.email || ""),
          passengerPhone: effectivePhone,
          passengerComment: templateMessage,
          driverName: ride.driverName || "Förare",
          driverEmail: ride.driverEmail,
          driverPhone: ride.driverPhone || "",
          seats: 1,
          price: ride.price,
          commission: 0,
          status: "requested",
          createdAt: Date.now(),
          // keep chat empty at creation; notification shown in banner instead
          messages: []
        });
      });

      // Email sending removed; rely on in-app notifications only

      // إرسال إشعار للسائق
      try {
        const rideData = {
          origin: extractCity(ride.origin),
          destination: extractCity(ride.destination),
          date: ride.date,
          departureTime: ride.departureTime
        };
        
        await sendNewBookingNotification(
          (ride.driverEmail || '').trim().toLowerCase(),
          ride.driverName || "Förare",
          rideData,
          name.trim() || "Passagerare"
        );
      } catch (notificationError) {
        console.error("Notification error details:", notificationError);
        // Continuer le processus même si l'envoi de notifications échoue
      }

      // Sauvegarder les données soumises pour l'affichage de confirmation
      setSubmittedData({
        name: name.trim(),
        phone: effectivePhone,
        email: sendEmail ? email.trim() : "",
        comment: templateMessage,
        ride: {
          origin: ride.origin,
          destination: ride.destination,
          date: ride.date,
          time: ride.departureTime
        }
      });

      // Spåra bokning i Analytics
      trackBookingSent(rideId, ride.price || 0);

      setSent(true);

      // Do not notify the booking sender to avoid redundant push

      // لا نوجه المستخدم مباشرة، بل نعرض صفحة التأكيد أولاً
      // navigate("/inbox?tab=bokningar", { replace: true });
    } catch (err) {
      setFlash({ type: "error", text: err.message || "Fel vid bokning." });
    }
    setBusy(false);
  }

  return (
    <div className="max-w-2xl mx-auto my-12 bg-white rounded-2xl shadow-xl p-6 sm:p-8 border border-gray-100">
      <Helmet>
        <title>Skicka förfrågan | VägVänner</title>
      </Helmet>

      <Snackbar
        text={flash.text}
        type={flash.type}
        onClear={() => setFlash({ text: "", type: "info" })}
      />

      {existingBookingId ? (
        <div className="space-y-6">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
            <h3 className="text-amber-800 font-bold mb-1">⚠️ Du har redan kontaktat denna förare!</h3>
            <p className="text-sm text-amber-800">Du kan bara kontakta en gång per annons.</p>
            <a
              href="/inbox?tab=bokningar"
              className="mt-3 inline-block text-blue-700 hover:underline font-semibold"
            >
              Visa konversation →
            </a>
          </div>
        </div>
      ) : !sent ? (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-600 text-white shadow">1. Uppgifter</div>
            <div className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">2. Bekräftelse</div>
          </div>
          {/* Header with icon */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 rounded-2xl mb-4 shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Skicka bokningsförfrågan
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Fyll i dina kontaktuppgifter så att föraren kan nå dig. All information behandlas säkert enligt GDPR.
            </p>
          </div>

          {/* Trip Information Card */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6 mb-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg">
                <span className="text-white text-sm">🗺️</span>
              </div>
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Din resa
              </span>
            </h2>
            
            <div className="space-y-4">
              {/* Route */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Från</div>
                      <div className="font-semibold text-gray-900 dark:text-white truncate max-w-[220px]">
                        {extractCity(ride.origin)}
                      </div>
                    </div>
                  </div>
                  <div className="text-gray-400">→</div>
                  <div className="flex items-center gap-3">
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide text-right">Till</div>
                      <div className="font-semibold text-gray-900 dark:text-white text-right truncate max-w-[220px]">
                        {extractCity(ride.destination)}
                      </div>
                    </div>
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  </div>
                </div>
              </div>
              
              {/* Date and Price */}
          <div className="grid grid-cols-2 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
                  <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Datum & Tid</div>
                  <div className="font-semibold text-gray-900 dark:text-white">{ride.date}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">kl. {ride.departureTime}</div>
                </div>
            {/* Pris hidden temporarily */}
              </div>
            </div>
          </div>

          {/* Contact Information Section */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-5">
            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-3 mb-1">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center shadow-lg">
                <span className="text-white text-sm">👤</span>
              </div>
              <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                Dina kontaktuppgifter
              </span>
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 ml-11">Så att föraren kan nå dig</p>

            <div className="space-y-2">
              <TextInput label="Namn" value={name} onChange={setName} required />
            </div>

            {/* Telefon */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-gray-700 dark:text-gray-300 font-medium flex items-center gap-1">
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  Telefon
                  <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => navigate(`/verify-phone?rideId=${rideId}`)}
                  className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium transition-all duration-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 px-2 py-1 rounded-lg"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  {phoneOk ? 'Hantera verifiering' : 'Verifiera nummer'}
                </button>
              </div>
              <div className={`rounded-lg px-4 py-3 border transition-all duration-200 ${
                phoneOk 
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700' 
                  : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700'
              }`}>
                <div className="flex items-center justify-between">
                  <span className={`font-semibold ${
                    phoneOk 
                      ? 'text-green-800 dark:text-green-200' 
                      : 'text-gray-900 dark:text-white'
                  }`}>
                    {phoneOk ? 'Telefon verifierad' : 'Telefon ej verifierad'}
                  </span>
                </div>
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400 italic space-y-1">
                {phoneOk ? (
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 border-l-4 border-green-500">
                    <p className="text-green-700 dark:text-green-300">
                      📱 <strong>Telefon verifierad!</strong> Du kan nu skicka meddelanden i appen.
                    </p>
                  </div>
                ) : (
                  <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3 border-l-4 border-amber-500">
                    <p className="text-amber-700 dark:text-amber-300">
                      📱 <strong>Verifiering krävs:</strong> Verifiera ditt telefonnummer för att kunna skicka meddelanden.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Email section hidden temporarily */}
          </div>

          {/* Meddelandeförhandsvisning – mer framhävd */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Detta skickas till föraren
              </h3>
            </div>

            <div className="rounded-2xl p-4 bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-700 shadow-lg">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">👁️</span>
                <h4 className="font-semibold text-blue-900 dark:text-blue-300">Förhandsvisning — skickas exakt så här</h4>
              </div>
              <div className="bg-white dark:bg-gray-800 border-2 border-blue-200 dark:border-blue-700 rounded-xl p-4 ring-2 ring-blue-500/10">
                <div className="text-[15px] text-gray-900 dark:text-gray-100 whitespace-pre-wrap leading-relaxed font-medium">
                  {templateMessage}
                </div>
              </div>
              <p className="mt-3 text-xs text-gray-600 dark:text-gray-400">
                Ditt verifierade telefonnummer bifogas. Behöver du uppdatera det? Välj "Hantera verifiering" ovan.
              </p>
            </div>
          </div>

          {/* Legal Consent Section */}
          <div className="bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="space-y-4">
              {/* Terms Checkbox */}
              <label className="flex items-start cursor-pointer group">
                <input
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  className="mt-1 h-5 w-5 text-blue-600 focus:ring-blue-500 rounded border-gray-300"
                  required
                />
                <span className="ml-3 text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-100">
                  Jag godkänner{" "}
                  <Link to="/anvandningsvillkor" target="_blank" className="text-blue-600 hover:text-blue-700 underline font-medium">
                    användarvillkoren
                  </Link>
                  {" "}och{" "}
                  <Link to="/integritetspolicy" target="_blank" className="text-blue-600 hover:text-blue-700 underline font-medium">
                    integritetspolicyn
                  </Link>
                  <span className="text-rose-500 ml-1">*</span>
                </span>
              </label>

              {/* Collapsible Legal Text */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                <button
                  type="button"
                  onClick={() => setShowLegalText(!showLegalText)}
                  className="flex items-center justify-between w-full text-left group"
                >
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-200">
                    ⚖️ Viktig juridisk information om din bokning
                  </span>
                  <svg 
                    className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${showLegalText ? 'rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {showLegalText && (
                  <div className="mt-3 space-y-4 text-xs text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 rounded-lg p-5 border border-gray-200 dark:border-gray-700 shadow-sm">
                    
                    {/* Informationsdelning */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border-l-4 border-blue-500">
                      <h4 className="font-bold text-blue-800 dark:text-blue-300 mb-2 flex items-center gap-1">
                        🔄 Informationsdelning
                      </h4>
                      <p className="text-blue-700 dark:text-blue-200">
                        <strong>Vad vi delar:</strong> Ditt namn, telefonnummer och meddelande delas med föraren.<br/>
                        <strong>Varför:</strong> För att föraren ska kunna kontakta dig och genomföra resan.<br/>
                        <strong>E-post:</strong> Delas endast om du aktiverar e-postbekräftelse.
                      </p>
                    </div>

                    {/* Datahantering */}
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 border-l-4 border-green-500">
                      <h4 className="font-bold text-green-800 dark:text-green-300 mb-2 flex items-center gap-1">
                        🔒 Datahantering & GDPR
                      </h4>
                      <p className="text-green-700 dark:text-green-200">
                        <strong>Säkerhet:</strong> All information behandlas enligt GDPR och svensk dataskyddslag.<br/>
                        <strong>Lagring:</strong> Data sparas säkert och raderas enligt våra riktlinjer.<br/>
                        <strong>Rättigheter:</strong> Du har rätt att begära utdrag, rättelse eller radering av dina uppgifter.
                      </p>
                    </div>

                    {/* Avtalsförhållande */}
                    <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3 border-l-4 border-amber-500">
                      <h4 className="font-bold text-amber-800 dark:text-amber-300 mb-2 flex items-center gap-1">
                        🤝 Avtalsförhållande
                      </h4>
                      <p className="text-amber-700 dark:text-amber-200">
                        <strong>Direkt avtal:</strong> Din bokning skapar ett avtal direkt mellan dig och föraren.<br/>
                        <strong>VägVänners roll:</strong> Vi är endast en förmedlingsplattform, inte part i avtalet.<br/>
                        <strong>Ansvar:</strong> Varje part ansvarar för att följa överenskommelse och svensk lag.
                      </p>
                    </div>

                    {/* Payment section hidden temporarily */}

                    {/* Ansvarsbegränsning */}
                    <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 border-l-4 border-red-500">
                      <h4 className="font-bold text-red-800 dark:text-red-300 mb-2 flex items-center gap-1">
                        ⚠️ Ansvarsbegränsning
                      </h4>
                      <p className="text-red-700 dark:text-red-200">
                        <strong>Plattformens ansvar:</strong> VägVänner ansvarar inte för resans genomförande, säkerhet eller tvister.<br/>
                        <strong>Försäkring:</strong> Kontrollera att förarens fordonsförsäkring täcker passagerare.<br/>
                        <strong>Säkerhet:</strong> Använd sunt förnuft och lita på din känsla vid alla resor.
                      </p>
                    </div>

                    {/* Avbokning */}
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 border-l-4 border-gray-500">
                      <h4 className="font-bold text-gray-800 dark:text-gray-300 mb-2 flex items-center gap-1">
                        ❌ Avbokning & Ändringar
                      </h4>
                      <p className="text-gray-700 dark:text-gray-200">
                        <strong>Avbokningsregler:</strong> Bestäms i överenskommelse mellan dig och föraren.<br/>
                        <strong>Kommunikation:</strong> Meddela ändringar i god tid via telefon eller e-post.<br/>
                        <strong>Tvister:</strong> Löses mellan parterna, VägVänner medlar inte i konflikter.
                      </p>
                    </div>

                    <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                      <p className="text-gray-500 dark:text-gray-500 text-center">
                        📋 Läs fullständiga villkor:{" "}
                        <Link to="/anvandningsvillkor" target="_blank" className="text-blue-600 hover:text-blue-700 underline font-medium">
                          Användarvillkor
                        </Link>
                        {" "} | {" "}
                        <Link to="/integritetspolicy" target="_blank" className="text-blue-600 hover:text-blue-700 underline font-medium">
                          Integritetspolicy
                        </Link>
                      </p>
                    </div>
                  </div>
                )}
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-3 border border-blue-200 dark:border-blue-700">
                <p className="text-xs text-blue-800 dark:text-blue-200 text-center">
                  🔒 <strong>Integritetsskydd:</strong> Genom att skicka förfrågan godkänner du våra{" "}
                  <Link to="/anvandningsvillkor" target="_blank" className="text-blue-600 dark:text-blue-400 hover:underline font-semibold">
                    användarvillkor
                  </Link>
                  {" "}och{" "}
                  <Link to="/integritetspolicy" target="_blank" className="text-blue-600 dark:text-blue-400 hover:underline font-semibold">
                    integritetspolicy
                  </Link>
                  . Dina uppgifter behandlas säkert enligt GDPR.
                </p>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="space-y-3">
            <button
              type="submit"
              disabled={!canSend}
              className={`w-full py-4 px-6 rounded-xl font-bold text-white transition-all duration-300 transform relative overflow-hidden
                ${canSend 
                  ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 hover:scale-[1.02] shadow-xl hover:shadow-2xl' 
                  : 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed'
                }
                ${canSend ? 'animate-pulse-slow' : ''}
              `}
            >
              {busy ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Skickar...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  <span className="text-lg">Skicka min bokningsförfrågan 🚀</span>
                </span>
              )}
            </button>
            
            {!canSend && (
              <div className="bg-rose-50 dark:bg-rose-900/30 rounded-lg p-3 border border-rose-200 dark:border-rose-700">
                <p className="text-xs text-center text-rose-800 dark:text-rose-200">
                  <span className="font-semibold">⚠️ Kontrollera följande:</span><br/>
                  {!phoneOk && "• Telefonnummer krävs för kontakt"}
                  {!phoneOk && (!emailOk && sendEmail || !acceptTerms) && <br/>}
                  {!emailOk && sendEmail && "• Giltig e-postadress krävs för bekräftelse"}
                  {!emailOk && sendEmail && !acceptTerms && <br/>}
                  {!acceptTerms && "• Du måste godkänna användarvillkor och integritetspolicy"}
                </p>
              </div>
            )}
          </div>
        </form>
      ) : (
        <div className="space-y-6">
          {/* Success Animation */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full mb-4 shadow-lg animate-bounce">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-600 text-white shadow">1. Uppgifter</div>
              <div className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-600 text-white shadow">2. Klart</div>
            </div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-2">
              Bokningsförfrågan skickad! 🎉
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              Din förfrågan har skickats framgångsrikt till föraren och du kommer få svar inom 24-48 timmar
            </p>
          </div>

          {/* Booking Summary Card */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Bokningsdetaljer
            </h3>
            
            <div className="space-y-3">
              {/* Route */}
              <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{extractCity(submittedData?.ride?.origin || ride.origin)}</span>
                </div>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{extractCity(submittedData?.ride?.destination || ride.destination)}</span>
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                </div>
              </div>
              
              {/* Date & Time */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{submittedData?.ride?.date || ride.date}</span>
                    <span className="text-sm text-gray-500 ml-2">kl. {submittedData?.ride?.time || ride.departureTime}</span>
                  </div>
                </div>
              </div>
              
              {/* Contact Info */}
              {submittedData && (
                <div className="bg-white dark:bg-gray-800 rounded-lg p-3 space-y-2">
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="text-sm text-gray-700 dark:text-gray-300">{submittedData.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span className="text-sm text-gray-700 dark:text-gray-300">{submittedData.phone}</span>
                  </div>
                  {submittedData.email && (
                    <div className="flex items-center gap-3">
                      <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span className="text-sm text-gray-700 dark:text-gray-300">{submittedData.email}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* What's Next Section */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl p-6 border border-amber-200 dark:border-amber-800 shadow-sm">
            <h3 className="font-bold text-amber-900 dark:text-amber-200 mb-4 flex items-center gap-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Vad händer nu? Nästa steg
            </h3>
            
            <div className="space-y-4">
              {/* Immediate next steps */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-amber-100 dark:border-amber-700">
                <h4 className="font-semibold text-amber-800 dark:text-amber-300 mb-2 flex items-center gap-2">
                  📞 Kontakt från föraren
                </h4>
                <ul className="space-y-1 text-sm text-amber-700 dark:text-amber-200">
                  <li>• Föraren granskar din förfrågan och kontaktar dig via telefon</li>
                  <li>• Förväntat svar inom 24-48 timmar</li>
                  <li>• Vid behov kontaktas du även via e-post (om aktiverat)</li>
                </ul>
              </div>

              {/* Planning details */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-amber-100 dark:border-amber-700">
                <h4 className="font-semibold text-amber-800 dark:text-amber-300 mb-2 flex items-center gap-2">
                  🗺️ Planering av resan
                </h4>
                <ul className="space-y-1 text-sm text-amber-700 dark:text-amber-200">
                  <li>• Bestäm exakt avhämtningstid och plats</li>
                  {/* Payment step hidden temporarily */}
                  <li>• Diskutera eventuella stopp eller omvägar</li>
                </ul>
              </div>

              {/* Legal reminder */}
              <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
                <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-2 flex items-center gap-2">
                  ⚖️ Viktigt att komma ihåg
                </h4>
                <ul className="space-y-1 text-sm text-blue-700 dark:text-blue-200">
                  <li>• Alla överenskommelser sker direkt mellan dig och föraren</li>
                  {/* Payment mention hidden temporarily */}
                  <li>• Följ svensk lag gällande kostnadsdelning vid samåkning</li>
                </ul>
              </div>

              {/* Email confirmation hidden temporarily */}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => navigate("/inbox?tab=bokningar")}
              className="w-full py-4 px-6 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-xl shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
            >
              <span className="flex items-center justify-center gap-3">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 009.586 13H7" />
                </svg>
                <span className="text-lg">Se min bokning 📬</span>
              </span>
            </button>
            <button
              type="button"
              onClick={() => navigate("/inbox?tab=resor")}
              className="w-full py-3 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg transition-all duration-200 transform hover:scale-[1.02]"
            >
              <span className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Alla mina resor 🚗
              </span>
            </button>
            
            <button
              type="button"
              onClick={() => navigate("/")}
              className="w-full py-3 px-6 bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 hover:text-blue-700 dark:hover:text-blue-300 font-semibold rounded-xl border-2 border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200"
            >
              <span className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Till startsidan 🏠
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

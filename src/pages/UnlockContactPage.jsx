// src/pages/UnlockContactPage.jsx
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  doc,
  getDoc,
  
  runTransaction,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../firebase/firebase.js";
import { Helmet } from "react-helmet-async";

import Snackbar             from "../components/ui/Snackbar";
import Badge                from "../components/Badge";
import ReportDialog         from "../components/ReportDialog";
import PayPalSimple         from "../components/PayPalSimple";
import PayPalTest           from "../components/PayPalTest";
import SeatBookingInboxCard from "../components/inbox/SeatBookingInboxCard";
import { ENV_CONFIG }       from "../config/env";
import { extractCity }      from "../utils/address";
import { sendUnlockNotification } from "../services/notificationService";
import { normalizeSwedishPhone } from "../utils/phone";
import { submitUnlockReport } from "../services/reportService";
import { useAuth }          from "../context/AuthContext";
import { usePaymentError }  from "../hooks/usePaymentError";
import { COMMISSION }       from "../utils/booking";
import { trackContactUnlocked, trackPaymentAuthorized } from "../services/analytics";

// Commission is centralized in utils/booking.js
const WINDOW_MS  = 48 * 60 * 60 * 1000;  // 48h

export default function UnlockContactPage() {
  const { bookingId } = useParams();
  
  const nav           = useNavigate();
  const { user }      = useAuth();

  const [booking, setBooking] = useState(null);
  const [ride,    setRide]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy,    setBusy]    = useState(false);
  const [error,   setError]   = useState("");

  const [share,           setShare]       = useState("both"); // both | phone | email | none
  const [waiver, setWaiver] = useState(false);
  const [phone, setPhone]               = useState("");
  const [emailField, setEmailField]     = useState("");
  const [rapportOpen,     setRapportOpen] = useState(false);
  const [rapportBusy,     setRapportBusy] = useState(false);
  const [rapportDone,     setRapportDone] = useState(false);

  // Hidden developer sandbox unlock (5-clicks)
  const [sandboxClicks, setSandboxClicks] = useState(0);
  const [sandboxVisible, setSandboxVisible] = useState(false);
  const [sandboxTimer, setSandboxTimer] = useState(null);

  const handleSecretClick = useCallback(() => {
    if (process.env.NODE_ENV !== 'development') return;
    setSandboxClicks((prev) => {
      const next = prev + 1;
      if (next === 1 && !sandboxTimer) {
        const t = setTimeout(() => {
          setSandboxClicks(0);
          setSandboxTimer(null);
        }, 2500);
        setSandboxTimer(t);
      }
      if (next >= 5) {
        setSandboxVisible(true);
        if (sandboxTimer) {
          clearTimeout(sandboxTimer);
          setSandboxTimer(null);
        }
        return 0;
      }
      return next;
    });
  }, [sandboxTimer]);

  // Hook de gestion des erreurs de paiement
  const { 
    paymentError, 
    handlePayPalError, 
    handleTransactionError, 
    handleNotificationError, 
    clearError 
  } = usePaymentError();

  // تحسين تحميل البيانات - إضافة دعم للبيانات المحفوظة
  useEffect(() => {
    const loadBookingData = async () => {
      try {
        setLoading(true);
        setError("");

        // محاولة استرجاع البيانات من sessionStorage أولاً
        const storedData = sessionStorage.getItem('unlockData');
        let initialData = null;
        
        if (storedData) {
          try {
            initialData = JSON.parse(storedData);
            // التحقق من أن البيانات تتطابق مع bookingId الحالي
            if (initialData.bookingId === bookingId) {
              // إنشاء كائن booking مؤقت من البيانات المخزنة
              const tempBooking = {
                id: initialData.bookingId,
                rideId: initialData.rideId,
                passengerName: initialData.passengerName,
                passengerEmail: initialData.passengerEmail,
                passengerPhone: initialData.passengerPhone,
                seats: initialData.seats,
                ride_origin: initialData.ride_origin,
                ride_destination: initialData.ride_destination,
                ride_date: initialData.ride_date,
                ride_time: initialData.ride_time,
                bookingType: "seat_booking",
                status: "requested",
                createdAt: Date.now(),
                userId: user?.uid || "",
                counterpartyId: user?.uid || "",
                commission: initialData.commission || COMMISSION
              };
              
              setBooking(tempBooking);
              setLoading(false);
              
              // تنظيف البيانات المخزنة
              sessionStorage.removeItem('unlockData');
              return;
            }
          } catch (parseError) {
            console.error('Error parsing stored data:', parseError);
          }
        }

        // إذا لم تكن هناك بيانات مخزنة أو كانت غير صحيحة، استخدم الطريقة الأصلية
    const bkRef = doc(db, "bookings", bookingId);
    const unsub = onSnapshot(
      bkRef,
      async (snap) => {
        if (!snap.exists()) {
          setError("Bokningen hittades inte.");
          setLoading(false);
          return;
        }
        const data = { id: snap.id, ...snap.data() };
        setBooking(data);

        if (data.rideId) {
              try {
          const rSnap = await getDoc(doc(db, "rides", data.rideId));
          if (rSnap.exists()) {
            setRide({ id: rSnap.id, ...rSnap.data() });
                }
              } catch (rideError) {
                console.error('Error loading ride data:', rideError);
                // لا نوقف التحميل إذا فشل تحميل بيانات الرحلة
          }
        }
        setLoading(false);
      },
      (err) => {
            console.error('Booking subscription error:', err);
            setError(err.message || "Fel vid hämtning av bokning.");
            setLoading(false);
          }
        );
        
        return unsub;
      } catch (error) {
        console.error('Error in loadBookingData:', error);
        setError("Ett oväntat fel uppstod.");
        setLoading(false);
      }
    };

    loadBookingData();
  }, [db, bookingId, user?.uid]);

  useEffect(() => {
    if (booking) {
      setPhone(booking.driverPhone || user?.phoneNumber || "");
      setEmailField(booking.driverEmail || user?.email || "");
    }
  }, [booking, user]);

  // تحويل الطوابع الزمنية وحساب الحالة
  const { isUnlocked, reportEnds } = useMemo(() => {
    if (!booking) return { isUnlocked: false, reportEnds: 0 };

    const st  = (booking.status || "").toLowerCase();
    const pst = (booking.paypal?.status || "").toLowerCase();
    // IMPORTANT: voided betyder pengarna släpptes -> inte upplåst
    const unlockedStates = ["authorized", "captured", "paid"]; 
    const isUnlocked = unlockedStates.includes(st) || unlockedStates.includes(pst);

    const toMs = (ts) =>
      typeof ts === "number"
        ? ts
        : ts?.toMillis?.() || 0;

    const opened = toMs(booking.contactUnlockedAt) || toMs(booking.paidAt) || toMs(booking.createdAt);
    const ends   = toMs(booking.reportWindowEndsAt) || (opened + WINDOW_MS);

    return { isUnlocked, reportEnds: ends };
  }, [booking]);

  /* Live preview of information that will be shared based on `share` */
  const sharePreview = useMemo(() => {
    if (!booking) return { email: "", phone: "" };
    const phoneVal = phone;
    const emailVal = emailField;

    switch (share) {
      case "both":
        return { email: emailVal, phone: phoneVal };
      case "phone":
        return { email: "", phone: phoneVal };
      case "email":
        return { email: emailVal, phone: "" };
      default:
        return { email: "", phone: "" };
    }
  }, [share, booking, phone, emailField]);

  const viewerUid            = user?.uid || null;
  const viewerIsBuyer        = booking && viewerUid === booking.userId;
  const viewerIsCounterparty = booking && viewerUid === booking.counterpartyId;

  // حساب بيانات الاتصال المعروضة - محسن
  const contact = useMemo(() => {
    if (!booking) return { label: "Kontakt", name: "", email: "", phone: "" };

    const pName  = booking.passengerName  || booking.passengerFullName  || "";
    const pEmail = booking.passengerEmail || booking.counterpartyEmail || "";
    const pPhone = booking.passengerPhone || booking.counterpartyPhone || "";
    const dName  = booking.driverNameShared  || booking.driverName  || "";
    const dEmail = booking.driverEmailShared || booking.driverEmail || "";
    const dPhone = booking.driverPhoneShared || booking.driverPhone || "";

    if (booking.bookingType === "seat_booking" && viewerIsCounterparty) {
      return { label: "Passagerarens uppgifter", name: pName, email: pEmail, phone: pPhone };
    }
    if (booking.bookingType === "contact_unlock") {
      if (viewerIsBuyer) {
        return {
          label: "Passagerarens uppgifter",
          name:  ride?.passengerName  || pName,
          email: ride?.passengerEmail || pEmail,
          phone: ride?.passengerPhone || pPhone,
        };
      }
      if (viewerIsCounterparty) {
        const shared = !!dEmail || !!dPhone;
        return {
          label: shared ? "Förarens uppgifter" : "Föraren kontaktar dig",
          name:  dName,
          email: dEmail,
          phone: dPhone,
        };
      }
    }
    return { label: "Kontakt", name: pName || dName, email: pEmail || dEmail, phone: pPhone || dPhone };
  }, [booking, ride, viewerIsBuyer, viewerIsCounterparty]);

  const canReport = isUnlocked && !booking?.reported && reportEnds > Date.now();

  // معالجة الدفع محسنة - إضافة معالجة أفضل للأخطاء
  const handleApprove = useCallback(
    async (order) => {
      setBusy(true);
      setError("");
      clearError();
      
      try {
        let auth, payer;
        const now = Date.now();
        
        // Extraire les données de la commande PayPal
        if (process.env.NODE_ENV === "development") {
          // Mode développement - utiliser capture
          auth = order.purchase_units[0].payments.captures?.[0] || order.purchase_units[0].payments.authorizations?.[0];
          payer = order.payer;
        } else {
          // Mode production - utiliser authorize
          auth = order.purchase_units[0].payments.authorizations[0];
          payer = order.payer;
        }

        // Validate required share fields before transaction
        let phoneToShare = "";
        if (share === "both" || share === "phone") {
          const raw = phone?.toString().trim() || "";
          if (!raw) throw new Error("Ange ett telefonnummer att dela.");
          try {
            const norm = normalizeSwedishPhone(raw);
            if (!norm.ok) throw new Error(norm.error || "Ogiltigt telefonnummer");
            phoneToShare = norm.e164;
          } catch (e) {
            throw new Error(e?.message || "Ogiltigt telefonnummer");
          }
        }

        await runTransaction(db, async (tx) => {
          const bkRef = doc(db, "bookings", booking.id);
          const rideRef = booking.rideId ? doc(db, "rides", booking.rideId) : null;

          const [bkSnap, rideSnap] = await Promise.all([
            tx.get(bkRef),
            rideRef ? tx.get(rideRef) : Promise.resolve(null),
          ]);
          
          if (!bkSnap.exists()) {
            throw new Error("Bokningen saknas eller har raderats.");
          }

          // التحقق من أن الحجز لم يتم فتحه بالفعل
          const currentStatus = bkSnap.data().status;
          if (["authorized", "captured", "paid"].includes(currentStatus)) {
            throw new Error("Kontakten är redan upplåst.");
          }

          const paypalStatus = process.env.NODE_ENV === "development" ? "CAPTURED" : "AUTHORIZED";
          const bookingStatus = process.env.NODE_ENV === "development" ? "captured" : "authorized";

          // Préparer les données de partage des contacts
          // const driverPhone = booking.driverPhone || "";  // Commenté - non utilisé actuellement
          // const driverEmail = booking.driverEmail || "";  // Commenté - non utilisé actuellement
          
          // Déterminer quels contacts partager selon le mode sélectionné
          let driverPhoneShared = "";
          let driverEmailShared = "";
          
          if (share === "both") {
            driverPhoneShared = phoneToShare;
            driverEmailShared = emailField;
          } else if (share === "phone") {
            driverPhoneShared = phoneToShare;
            driverEmailShared = "";
          } else if (share === "email") {
            driverPhoneShared = "";
            driverEmailShared = emailField;
          } else {
            // share === "none" - ne partager rien
            driverPhoneShared = "";
            driverEmailShared = "";
          }

          tx.update(bkRef, {
            status:             bookingStatus,
            contactUnlockedAt:  now,
            reportWindowEndsAt: now + WINDOW_MS,
            driverShareMode:    share,
            driverPhoneShared:  driverPhoneShared,
            driverEmailShared:  driverEmailShared,
            commission:         COMMISSION,
            paypal: {
              status:           paypalStatus,
              authorizationId:  auth.id,
              amount:           Number(auth.amount.value),
              currency:         auth.amount.currency_code,
              payer: {
                payerId: payer.payer_id,
                name:    `${payer.name.given_name} ${payer.name.surname}`,
                email:   payer.email_address,
                country: payer.address.country_code,
              },
              purchaseUnits: order.purchase_units,
            },
            // Keep chat untouched here; do not insert system rows into chat
            messages: (Array.isArray(bkSnap.data().messages) ? bkSnap.data().messages : []).slice(-300),
            sys: { ...(bkSnap.data().sys || {}), authorizeMsgSentAt: now }
          });

          if (booking.bookingType === "seat_booking" && rideSnap?.exists()) {
            tx.update(rideRef, { bookingType: "contact_unlock" });
          }
        });

        // إرسال إشعار للراكب - محسن
        try {
          const notificationResult = await sendUnlockNotification(booking, share);
          if (!notificationResult.success) {
            const notificationError = handleNotificationError(notificationResult.error);
            console.warn('Notification warning:', notificationError.message);
          }
        } catch (notificationError) {
          const error = handleNotificationError(notificationError);
          console.warn('Notification error:', error.message);
        }

        // Uppdatera lokal status
        const bookingStatus = process.env.NODE_ENV === "development" ? "captured" : "authorized";
        const paypalStatus = process.env.NODE_ENV === "development" ? "CAPTURED" : "AUTHORIZED";
        
        // Spåra betalning i Analytics
        trackContactUnlocked(COMMISSION);
        trackPaymentAuthorized(COMMISSION);
        
        setBooking(prev => ({
          ...prev,
          status: bookingStatus,
          contactUnlockedAt: now,
          reportWindowEndsAt: now + WINDOW_MS,
          driverShareMode: share,
          driverPhoneShared: (share === "both" || share === "phone") ? phoneToShare : "",
          driverEmailShared: (share === "both" || share === "email") ? emailField : "",
          paypal: {
            status: paypalStatus,
            authorizationId: auth.id,
            amount: Number(auth.amount.value),
            currency: auth.amount.currency_code,
            payer: {
              payerId: payer.payer_id,
              name: `${payer.name.given_name} ${payer.name.surname}`,
              email: payer.email_address,
              country: payer.address.country_code,
            }
          }
        }));

      } catch (e) {
        console.error('Payment error:', e);
        
        // Utiliser le système de gestion d'erreurs approprié
        if (e.message?.includes('PAYER_ACTION_REQUIRED') || e.message?.includes('INSTRUMENT_DECLINED')) {
          const paypalError = handlePayPalError(e);
          setError(paypalError.message);
        } else if (e.message?.includes('permission-denied') || e.message?.includes('unavailable')) {
          const transactionError = handleTransactionError(e);
          setError(transactionError.message);
        } else {
          setError(e.message || "Betalningen misslyckades. Försök igen.");
        }
      } finally {
        setBusy(false);
      }
    },
    [db, booking, share, handlePayPalError, handleTransactionError, handleNotificationError, clearError, phone, emailField]
  );

  // تحسين عرض حالة التحميل
  if (loading) {
    return (
      <div className="max-w-lg mx-auto my-12 bg-white rounded-2xl shadow-lg p-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Laddar bokningsdata...</p>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="max-w-lg mx-auto my-12 bg-white rounded-2xl shadow-lg p-6">
        <div className="text-center py-8">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-red-600 mb-2">Bokning hittades inte</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => nav("/my-rides")}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Tillbaka till Mina resor
          </button>
        </div>
      </div>
    );
  }

  if (isUnlocked) {
    return (
      <div className="max-w-2xl mx-auto my-12 bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
        <Helmet><title>Kommunikation | VägVänner</title></Helmet>
        <Snackbar text={error || paymentError?.message} type="error" onClear={() => { setError(""); clearError(); }} />

        <h2 className="text-2xl text-blue-700 dark:text-blue-300 font-bold text-center mb-4 flex items-center justify-center gap-2">
          <span>💬</span>
          <span>Chatta med resenären</span>
        </h2>

        {/* HIDDEN: Old contact display - frozen for rollback */}
        {false && (
          <div className="bg-green-50 rounded-lg p-4 text-sm space-y-1 mb-4">
            <p className="font-semibold">{contact.label}:</p>
            {contact.name  && <p>👤 {contact.name}</p>}
            {contact.email && <p>📧 {contact.email}</p>}
            {contact.phone && <p>📞 {contact.phone}</p>}
            {!contact.email && !contact.phone && (
              <p>Inga uppgifter delades. Kontakta via appen.</p>
            )}
          </div>
        )}

        {/* NEW: Actual chat interface */}
        <div className="mb-6">
          <SeatBookingInboxCard
            booking={booking}
            viewerUid={viewerUid}
            viewerEmail={user?.email || ""}
            onCancel={() => nav('/inbox?tab=bokningar')}
          />
        </div>

        {/* HIDDEN: Old report button - frozen for rollback */}
        {false && canReport && (
          <button
            onClick={() => setRapportOpen(true)}
            className="mt-4 w-full text-xs text-rose-700 underline"
          >
            Rapportera problem inom 48 timmar
          </button>
        )}
        {!canReport && booking?.reported && (
          <p className="mt-4 text-xs text-rose-700 text-center">Rapport inskickad.</p>
        )}
        {!canReport && !booking?.reported && reportEnds <= Date.now() && (
          <p className="mt-4 text-xs text-gray-500 text-center">Rapportperioden har gått ut.</p>
        )}

        {(() => {
          const bookingType = String(booking?.bookingType || '').toLowerCase();
          let dest = '/inbox?tab=resor';
          let label = 'Till Förare (Resor)';
          
          // For seat_booking: passenger goes to bokningar
          if (bookingType === 'seat_booking') {
            dest = '/inbox?tab=bokningar';
            label = 'Till Passagerare (Bokningar)';
          }
          
          // For contact_unlock: driver (buyer) goes to bokningar to see unlocked info
          if (bookingType === 'contact_unlock' && viewerIsBuyer) {
            dest = '/inbox?tab=bokningar';
            label = 'Till upplåsta kontakter';
          }
          
          return (
            <button
              onClick={() => nav(dest)}
              className="mt-6 w-full bg-brand text-white py-2 rounded-lg"
            >
              {label}
            </button>
          );
        })()}

        <ReportDialog
          open={rapportOpen}
          busy={rapportBusy}
          onClose={() => setRapportOpen(false)}
          onSubmit={async ({ reason, message }) => {
            setRapportBusy(true);
            try {
              await submitUnlockReport({
                bookingId: booking.id,
                rideId:    booking.rideId,
                reporterId: user?.uid || booking.userId,
                reporterEmail: user?.email || "",
                reporterName:  user?.displayName || "",
                reason,
                message,
              });
              setRapportDone(true);
              setBooking((b) => ({ ...b, reported: true }));
            } catch (e) {
              setError(e.message || "Kunde inte skicka rapport.");
            } finally {
              setRapportBusy(false);
            }
          }}
        />
        {rapportDone && (
          <p className="mt-2 text-xs text-emerald-700 text-center">Tack! Rapporten är skickad.</p>
        )}
      </div>
    );
  }

  // NEW: Chat-only interface (no payment)
  return (
    <div className="max-w-2xl mx-auto my-12 bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6">
      <Helmet><title>Chatta med resenären | VägVänner</title></Helmet>
      <Snackbar text={error || paymentError?.message} type="error" onClear={() => { setError(""); clearError(); }} />

      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2 flex items-center justify-center gap-2">
          <span>💬</span>
          <span>Chatta med resenären</span>
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Kommunicera direkt med resenären via chatten nedan.
        </p>
      </div>

      {/* HIDDEN: Old payment header - frozen for rollback */}
      {false && (
        <h1 className="text-2xl font-bold text-center text-brand mb-5" onClick={handleSecretClick} title="">
          Lås upp kontakt – {COMMISSION} kr
        </h1>
      )}

      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 mb-6 border border-blue-200 dark:border-blue-700">
        <div className="font-bold text-gray-800 dark:text-gray-200 mb-2">
          {extractCity(booking.ride_origin)} → {extractCity(booking.ride_destination)}
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400">{booking.ride_date} kl.&nbsp;{booking.ride_time}</div>
        <div className="mt-2">
          <Badge color="yellow">💺 {booking.seats} plats{booking.seats > 1 ? 'er' : ''}</Badge>
        </div>
      </div>

      {/* NEW: Chat interface */}
      <div className="mb-6">
        <SeatBookingInboxCard
          booking={booking}
          viewerUid={viewerUid}
          viewerEmail={user?.email || ""}
          onCancel={() => nav('/inbox?tab=bokningar')}
        />
      </div>

      <button
        onClick={() => nav('/inbox?tab=bokningar')}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-3 font-semibold transition-colors"
      >
        Tillbaka till Inbox
      </button>

      {/* HIDDEN: Old payment form - frozen for rollback */}
      {false && (
        <fieldset className="border rounded-lg p-4 mb-5">
        <legend className="font-semibold text-sm mb-3">Dela med passageraren</legend>
        {[ 
          { id: "both",  label: "📧 + 📞  Både e-post & telefon" },
          { id: "phone", label: "📞  Endast telefon" },
          { id: "email", label: "📧  Endast e-post" },
          { id: "none",  label: "🚫  Dela inget – jag kontaktar passageraren själv" },
        ].map((opt) => (
          <label key={opt.id} className="flex items-center mb-2 text-sm">
            <input
              type="radio"
              name="share"
              value={opt.id}
              checked={share === opt.id}
              onChange={() => setShare(opt.id)}
              className="mr-2 accent-brand"
              disabled={busy}
            />
            {opt.label}
          </label>
        ))}
        {/* explanatory hints */}
        {share === "none" && (
          <p className="text-xs text-amber-600 mt-2">
            Passageraren får inga uppgifter. Du får kontakta hen via appen.
          </p>
        )}

        {/* Live preview box */}
        {share !== "none" && (
          <div className="mt-3 p-3 bg-gradient-to-r from-emerald-50 to-green-50 rounded-lg text-xs text-emerald-800">
            <p className="font-semibold mb-1 flex items-center gap-1"><span>👤</span>Det här delas när du betalar:</p>
            <ul className="list-disc list-inside space-y-0.5">
              {sharePreview.phone && <li>📞 Telefon: <span className="font-mono">{sharePreview.phone}</span></li>}
              {sharePreview.email && <li>📧 E-post: <span className="font-mono break-all">{sharePreview.email}</span></li>}
              {!sharePreview.phone && !sharePreview.email && (
                <li className="text-amber-700">Ingen kontaktuppgift – du kontaktar passageraren manuellt</li>
              )}
            </ul>
          </div>
        )}

        {/* Editable contact inputs */}
        {(share === "both" || share === "phone") && (
          <div className="mt-3">
            <label className="block text-xs font-semibold mb-1">Telefonnummer att dela</label>
            <input
              type="tel"
              value={phone}
              onChange={(e)=>setPhone(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600/50"
            />
          </div>
        )}

        {(share === "both" || share === "email") && (
          <div className="mt-3">
            <label className="block text-xs font-semibold mb-1">E-post att dela</label>
            <input
              type="email"
              value={emailField}
              onChange={(e)=>setEmailField(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600/50"
            />
          </div>
        )}

        {/* Consumer law: digital service immediate performance waiver */}
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
          Genom att fortsätta köpet samtycker du till omedelbart utförande av den digitala tjänsten (upplåsning av kontaktuppgifter) och att ångerrätten upphör när tjänsten påbörjas.
          <label className="block mt-2">
            <input type="checkbox" checked={waiver} onChange={(e)=>setWaiver(e.target.checked)} className="mr-2" />
            Jag samtycker till omedelbart utförande och förstår att ångerrätten upphör.
          </label>
        </div>

        {(() => {
          const needsPhone = share === "both" || share === "phone";
          const phoneOk = needsPhone ? Boolean((phone || "").toString().trim()) : true;
          const needsEmail = share === "both" || share === "email";
          const emailOk = needsEmail ? Boolean((emailField || "").toString().trim()) : true;
          const disabled = busy || !waiver || !phoneOk || !emailOk;
          return (
            <PayPalSimple
              amount={COMMISSION}
              onSuccess={handleApprove}
              onError={(e) => {
            console.error('PayPal error:', e);
            const paypalError = handlePayPalError(e);
            setError(paypalError.message);
          }}
              onCancel={() => {
            setError('Betalningen avbröts.');
          }}
              disabled={disabled}
            />
          );
        })()}
      </fieldset>
      )}

      {/* HIDDEN: Old sandbox test - frozen for rollback */}
      {false && sandboxVisible && (
        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-amber-800 font-semibold text-sm">🧪 Sandbox Test</span>
            <div className="flex items-center gap-3">
              <button
                className="text-xs text-amber-700 underline"
                onClick={() => { try { localStorage.setItem('vv_paypal_mode', 'prod'); window.location.reload(); } catch {} }}
              >Use PROD</button>
              <button
                className="text-xs text-amber-700 underline"
                onClick={() => setSandboxVisible(false)}
              >Stäng</button>
            </div>
          </div>
          <div className="text-xs text-amber-700 mb-2">Detta är ett dolt testläge. Växla mellan Sandbox och Prod direkt:</div>
          <QuickModeToggle />
          <div className="mt-3">
            <PayPalTest />
          </div>
        </div>
      )}

      {/* HIDDEN: Old cancel button - frozen for rollback */}
      {false && (
        <>
          <button
            onClick={() => nav(-1)}
            className="mt-4 w-full text-xs text-gray-500 underline"
            disabled={busy}
          >
            Avbryt och gå tillbaka
          </button>
        </>
      )}
    </div>
  );
}

function QuickModeToggle() {
  const [mode, setMode] = React.useState('prod');

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem('vv_paypal_mode');
      if (raw === 'sandbox' || raw === 'prod') setMode(raw);
    } catch {}
  }, []);

  const useSandbox = () => { try { localStorage.setItem('vv_paypal_mode', 'sandbox'); window.location.reload(); } catch {} };
  const useProd = () => { try { localStorage.setItem('vv_paypal_mode', 'prod'); window.location.reload(); } catch {} };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={useSandbox}
        className={`text-xs px-3 py-1 rounded ${mode === 'sandbox' ? 'bg-amber-600 text-white' : 'bg-white border border-amber-300 text-amber-700'}`}
      >Use SANDBOX</button>
      <button
        onClick={useProd}
        className={`text-xs px-3 py-1 rounded ${mode === 'prod' ? 'bg-emerald-600 text-white' : 'bg-white border border-emerald-300 text-emerald-700'}`}
      >Use PROD</button>
    </div>
  );
}

/* ────────────────────────────────────────────────
   src/pages/BookRidePassanger.jsx
   Driver unlocks a passenger ad (contact_unlock purchase flow)
   • Loads ride
   • Checks if current user already unlocked -> redirect /unlock/:bookingId
   • PayPal authorize -> create booking (status=authorized, paypal.status=AUTHORIZED)
   • Update ride to mark unlocked (bookingType="contact_unlock", contactUnlocked*)
   • Notify passenger
   • Redirect /unlock/:bookingId   (canonical display happens there)
   • No local unlocked UI (prevents "showing my own info" bug)
──────────────────────────────────────────────── */
import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Navigate, useLocation } from "react-router-dom";
import {
  doc,
  getDoc,
  runTransaction,
  collection,
  query,
  where,
  getDocs,
  addDoc
} from "firebase/firestore";
import { db } from "../firebase/firebase.js";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { Helmet } from "react-helmet-async";

import { useAuth } from "../context/AuthContext";
import { extractCity } from "../utils/address";
import Snackbar from "../components/Snackbar";
import { sendNotification } from "../services/notificationService";
import { COMMISSION } from "../utils/booking";
import { getPayPalConfig } from "../config/env";

const BOOKING_TYPE = "contact_unlock";
const REPORT_WINDOW_MS = 48 * 60 * 60 * 1000; // 48h report window

export default function BookRidePassanger() {
  const { rideId } = useParams();
  const nav = useNavigate();
  const location = useLocation();
  const { user, authLoading } = useAuth();
  const cfg = getPayPalConfig();
  

  /* ride + existing booking */
  const [ride, setRide] = useState(() => {
    const stateRide = location && location.state && location.state.ride;
    return stateRide || null;
  });
  const [loading, setLoading] = useState(true);
  const [flash, setFlash] = useState({ type: "", message: "" });
  const [busy, setBusy] = useState(false);

  /* sharing & legal */
  const [sharePhone, setSharePhone] = useState(false);
  const [shareEmail, setShareEmail] = useState(false);
  const [waiver, setWaiver] = useState(false);
  const [manualPhone, setManualPhone] = useState("");
  const [message, setMessage] = useState("");

  /* if already unlocked, we redirect */
  const [existingBookingId, setExistingBookingId] = useState(null);

  /* guards: must be logged; phone is gated at action (PayPal approve or before) */
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      nav(
        `/google-auth?return=${encodeURIComponent(window.location.pathname)}`,
        { replace: true }
      );
      return;
    }
  }, [authLoading, user, nav]);

  /* load ride + detect existing unlock by this user */
  useEffect(() => {
    if (!user) return;
    let alive = true;
    (async () => {
      try {
        let rideData = ride;
        if (!rideData) {
          const snap = await getDoc(doc(db, "rides", rideId));
          if (!snap.exists()) {
            if (alive) setFlash({ type: "error", message: "Annonsen hittades inte." });
            return;
          }
          rideData = { id: snap.id, ...snap.data() };
        }
        if (!alive) return;
        setRide(rideData);
        // Message is fixed now; preview generated dynamically below
        try {} catch {}

        // existing contact_unlock by this user?
        const unlockQ = query(
          collection(db, "bookings"),
          where("rideId", "==", rideId),
          where("userId", "==", user.uid),
          where("bookingType", "==", BOOKING_TYPE)
        );
        const res = await getDocs(unlockQ);
        if (!alive) return;
        if (!res.empty) {
          setExistingBookingId(res.docs[0].id);
        }
      } catch (err) {
        if (alive) setFlash({ type: "error", message: err.message });
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [db, rideId, user, ride]);

  /* Note: if already unlocked, we disable the button but stay on page */

  /* loading & error states */
  if (authLoading || loading) {
    return <p className="p-10 text-center">Laddar …</p>;
  }
  if (!ride) {
    return (
      <p className="p-10 text-center text-red-600">{flash.message || "Fel."}</p>
    );
  }
  if (ride.userId === user.uid) {
    return (
      <p className="p-10 text-center text-yellow-600">
        Detta är din egen annons.
      </p>
    );
  }

  /* Fixed Swedish message preview (non-editable, same design as driver page) */
  const fromCity = extractCity(ride.origin);
  const toCity = extractCity(ride.destination);
  const effectivePhone = user?.phoneNumber || "";
  const templateMessage = `Hej! Jag hoppas att vi kan dela kostnaderna för denna resa tillsammans.\n\n` +
    `🚗 Resa: ${fromCity} till ${toCity}\n` +
    `📅 Datum: ${ride.date} kl. ${ride.departureTime}\n` +
    `${effectivePhone ? `📱 Mitt telefonnummer: ${effectivePhone}\n\n` : "\n"}` +
    `Vänligen kontakta mig så kan vi planera resan tillsammans!\n\n` +
    `Med vänliga hälsningar`;

  /* Send message -> create booking + add message + notify -> redirect /my-rides?tab=unlocks */
  async function handleSendMessage() {
    if (!templateMessage.trim()) return;
    setBusy(true);
    try {
      const now = Date.now();
      const reportWindowEndsAt = now + REPORT_WINDOW_MS;

      /* create booking in transaction */
      let newBookingId = null;
      await runTransaction(db, async (tx) => {
        const bookingRef = doc(collection(db, "bookings"));
        newBookingId = bookingRef.id;

        const passengerName = ride.fullName || ride.passengerName || ride.driverName || "";
        const passengerEmail = ride.email || ride.passengerEmail || ride.driverEmail || "";
        const passengerPhone = ride.phone || ride.passengerPhone || ride.driverPhone || "";

        const unlockerEmail = user.email || "";
        const unlockerPhone = user.phoneNumber || manualPhone || "";

        const driverPhoneShared = sharePhone ? (unlockerPhone || "") : "";
        const driverEmailShared = shareEmail ? (unlockerEmail || "") : "";

        // First message (fixed template)
        const firstMessage = {
          id: `${now}-${Math.random().toString(36).slice(2, 8)}`,
          senderUid: user.uid,
          senderEmail: "",
          text: templateMessage,
          createdAt: now,
          read: false,
        };

        tx.set(bookingRef, {
          bookingType: BOOKING_TYPE,
          rideId: ride.id,
          rideRole: "passenger",
          userId: user.uid,
          counterpartyId: ride.userId,

          unlockerEmail,
          unlockerPhone,

          driverShareMode: (sharePhone && shareEmail) ? "both" : (sharePhone ? "phone" : (shareEmail ? "email" : "none")),
          driverPhoneShared,
          driverEmailShared,

          passengerName,
          passengerEmail,
          passengerPhone,

          ride_origin: ride.origin,
          ride_destination: ride.destination,
          ride_date: ride.date,
          ride_time: ride.departureTime,

          seats: 0,
          price: 0,
          commission: 0,

          status: "authorized",
          contactUnlockedBy: user.uid,
          contactUnlockedAt: now,
          paidAt: now,
          reportWindowEndsAt,

          messages: [firstMessage],

          createdAt: now,
        });

        tx.update(doc(db, "rides", ride.id), {
          bookingType: BOOKING_TYPE,
          contactUnlockedBy: user.uid,
          contactUnlockedAt: now,
        });
      });

      /* Email removed; use in-app notifications only */

      /* notify passenger */
      await sendNotification(
        ride.email || ride.passengerEmail || "",
        "Ny förare vill kontakta dig",
        `En förare har skickat dig ett meddelande om din resa.\n\n` +
        `📍 ${extractCity(ride.origin)} → ${extractCity(ride.destination)}\n` +
        `📅 ${ride.date} kl. ${ride.departureTime}\n\n` +
        `💬 Meddelande: "${templateMessage}"\n\n` +
        `Svara via Mina Resor → Söka resor i VägVänner.`,
        ride.fullName || ride.passengerName || "",
        "info"
      );

      /* Redirect to my-rides unlocks tab */
      nav("/my-rides?tab=unlocks", { replace: true });
    } catch (err) {
      console.error("handleSendMessage error:", err);
      setFlash({ type: "error", message: err.message || "Kunde inte skicka meddelande." });
      setBusy(false);
    }
  }

  /* OLD PayPal approve function (hidden, kept for rollback) */
  async function onApprove(_, actions) {

    setBusy(true);
    try {
      const details = await actions.order.authorize();
      const auth = details.purchase_units[0].payments.authorizations[0];
      const payer = details.payer;
      const now = Date.now();
      const reportWindowEndsAt = now + REPORT_WINDOW_MS;

      /* create booking in transaction */
      let newBookingId = null;
      await runTransaction(db, async (tx) => {
        const bookingRef = doc(collection(db, "bookings"));
        newBookingId = bookingRef.id; // capture id for redirect

        // passenger info (from ride)
        const passengerName =
          ride.fullName || ride.passengerName || ride.driverName || "";
        const passengerEmail =
          ride.email || ride.passengerEmail || ride.driverEmail || "";
        const passengerPhone =
          ride.phone || ride.passengerPhone || ride.driverPhone || "";

        // driver (unlocker) info (from current user)
        const unlockerEmail = user.email || "";
        const unlockerPhone = user.phoneNumber || manualPhone || "";

        // Require phone input only when user opted to share phone and has no verified phone
        if (sharePhone && !unlockerPhone) {
          throw new Error("Ange ett telefonnummer att dela.");
        }

        // what does driver choose to share? (optional)
        const driverPhoneShared = sharePhone ? (unlockerPhone || "") : "";
        const driverEmailShared = shareEmail ? (unlockerEmail || "") : "";

        tx.set(bookingRef, {
          bookingType: BOOKING_TYPE,
          rideId: ride.id,
          rideRole: "passenger", // we are unlocking a passenger ad
          userId: user.uid, // dpaying driver
          counterpartyId: ride.userId, // passenger ad owner

          // unlocker (driver)
          unlockerEmail,
          unlockerPhone,

          // what driver chose to share with passenger
          driverShareMode: (sharePhone && shareEmail) ? "both" : (sharePhone ? "phone" : (shareEmail ? "email" : "none")),
          driverPhoneShared,
          driverEmailShared,

          // passenger (ad owner)
          passengerName,
          passengerEmail,
          passengerPhone,

          // ride summary
          ride_origin: ride.origin,
          ride_destination: ride.destination,
          ride_date: ride.date,
          ride_time: ride.departureTime,

          // financial
          seats: 0,
          price: 0,
          commission: COMMISSION,

          // payment + status
          status: "authorized",
          contactUnlockedBy: user.uid,
          contactUnlockedAt: now,
          paidAt: now, // legacy compat
          reportWindowEndsAt,

          paypal: {
            status: "AUTHORIZED",
            authorizationId: auth.id,
            amount: Number(auth.amount.value),
            currency: auth.amount.currency_code,
            payer: {
              payerId: payer.payer_id,
              name: `${payer.name.given_name} ${payer.name.surname}`,
              email: payer.email_address,
              country: payer.address.country_code,
            },
            purchaseUnits: details.purchase_units,
          },

          messages: [], // IMPORTANT: compatibility with chat system

          createdAt: now,
        });

        /* update passenger ride to mark unlocked (no archive) */
        tx.update(doc(db, "rides", ride.id), {
          bookingType: BOOKING_TYPE,
          contactUnlockedBy: user.uid,
          contactUnlockedAt: now,
        });
      });

      /* Email removed; use in-app notifications only */

      /* notify passenger ad owner about unlock */
      await sendNotification(
        ride.email || ride.passengerEmail || "",
        "Kontakt upplåst för din annons",
        `En förare har låst upp dina kontaktuppgifter för resan.\n\n` +
        `📍 ${extractCity(ride.origin)} → ${extractCity(ride.destination)}\n` +
        `📅 ${ride.date} kl. ${ride.departureTime}\n\n` +
        `💳 Avgift: ${COMMISSION} kr (reserverad upp till 48h)\n` +
        `💬 Du kan även chatta med föraren via Mina Resor → Söka resor\n` +
        `Du kan svara via Inkorgen i VägVänner.`,
        ride.fullName || ride.passengerName || "",
        "info"
      );

      /* add notification to unlocker */
      await sendNotification(
        user.email,
        "💰 Betalning mottagen!",
        `Du har genomfört en betalning på ${COMMISSION} kr för kontaktuppgifter.\n\n` +
        `📍 Resa: ${extractCity(ride.origin)} → ${extractCity(ride.destination)}\n` +
        `📅 Datum: ${ride.date} kl. ${ride.departureTime}\n\n` +
        `✅ Passagerarens kontaktuppgifter är nu tillgängliga\n` +
        `💬 Du kan även chatta med passageraren via Mina Resor → Upplåsta\n` +
        `⏱️ Du har 48 timmar att rapportera eventuella problem\n\n` +
        `🚗 Lycka till med resan!`,
        user.displayName || "Driver",
        "success"
      );

      /* go to canonical unlock display */
      try {
        // Persist local-only flag so the ride remains visible with a hint in search
        const key = `ride_unlock_shared_${ride.id}`;
        const payload = {
          mode: (sharePhone && shareEmail) ? "both" : (sharePhone ? "phone" : (shareEmail ? "email" : "none")),
          phone: sharePhone ? (user.phoneNumber || manualPhone || "") : "",
          email: shareEmail ? (user.email || "") : "",
          ts: Date.now()
        };
        sessionStorage.setItem(key, JSON.stringify(payload));
      } catch {}
      nav(`/unlock/${newBookingId}`, { replace: true });
    } catch (err) {
      console.error("BookRidePassanger onApprove error:", err);
      setFlash({ type: "error", message: err.message || "Betalningen misslyckades." });
      setBusy(false);
    }
  }

  return (
    <div className="max-w-md mx-auto my-12 bg-white rounded-xl shadow-lg p-8">
      <Helmet>
        <title>Lås kontakt | VägVänner</title>
      </Helmet>

      <Snackbar
        text={flash.message}
        type={flash.type}
        onClear={() => setFlash({ type: "", message: "" })}
      />

      <h1 className="text-2xl font-bold text-center mb-6 text-brand">
        Kontakta passageraren 💬
      </h1>

      {/* ride summary */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6 text-sm shadow-sm">
        <div className="font-semibold">
          {extractCity(ride.origin)} → {extractCity(ride.destination)}
        </div>
        <div>
          {ride.date} kl.&nbsp;
          {ride.departureTime}
        </div>
      </div>


      {/* Sharing options - HIDDEN (frozen payment system) */}
      {false && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <span className="text-blue-600">🔒</span>
            Dela dina uppgifter (valfritt)
          </h3>

          {/* Phone (optional) */}
          <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={sharePhone}
                onChange={(e) => setSharePhone(e.target.checked)}
                className="accent-brand"
              />
              <span className="font-medium text-blue-800">📞 Telefonnummer (valfritt)</span>
            </label>
            <div className="text-xs text-blue-700 ml-6 mt-1">
              Om valt: passageraren ser ditt nummer efter betalning för enklare kontakt.
            </div>
            {/* If user has no verified phone and chose to share phone, allow manual input */}
            {sharePhone && !user?.phoneNumber && (
              <div className="mt-2 ml-6">
                <label className="block text-xs font-semibold mb-1">Ange telefonnummer att dela</label>
                <input
                  type="tel"
                  value={manualPhone}
                  onChange={(e)=>setManualPhone(e.target.value)}
                  placeholder="07xx-xx xx xx"
                  className="w-full px-3 py-2 text-xs border border-blue-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600/50"
                />
                <p className="text-[11px] text-blue-600 mt-1">Detta sparas endast i bokningen som delas med passageraren.</p>
              </div>
            )}
          </div>

          {/* Email (optional) */}
          <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={shareEmail}
                onChange={(e) => setShareEmail(e.target.checked)}
                className="accent-brand"
              />
              <span className="font-medium text-green-800">📧 E‑postadress (valfritt)</span>
            </label>
            <div className="text-xs text-green-700 ml-6 mt-1">
              Om valt: passageraren ser din e‑post efter betalning.
            </div>
          </div>

          {/* Consumer law: immediate performance waiver (required) */}
          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
            Denna tjänst levereras omedelbart (upplåsning av kontaktuppgifter). Ångerrätten upphör när tjänsten börjar.
            <label className="block mt-2">
              <input type="checkbox" checked={waiver} onChange={(e)=>setWaiver(e.target.checked)} className="mr-2" />
              Jag samtycker till omedelbart utförande och att ångerrätten upphör.
            </label>
          </div>
        </div>
      )}


      {/* Already booked message */}
      {existingBookingId && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-300 rounded-lg text-sm text-yellow-800">
          <strong>⚠️ Du har redan kontaktat denna passagerare!</strong>
          <p className="mt-1">Du kan bara kontakta en gång per annons.</p>
          <a 
            href={`/my-rides?tab=unlocks`}
            className="mt-2 inline-block text-blue-600 underline font-medium"
          >
            Visa konversation →
          </a>
        </div>
      )}

      {/* Fixed message preview (non-editable) */}
      <div className="space-y-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg">👁️</span>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Förhandsvisning av meddelande
            </h3>
          </div>
          <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
            <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
              {templateMessage}
            </div>
          </div>
        </div>

        <button
          onClick={handleSendMessage}
          disabled={busy || existingBookingId}
          className={`w-full py-4 px-6 rounded-xl font-bold text-white transition-all duration-300 transform ${
            busy || existingBookingId
              ? 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 hover:scale-[1.02] shadow-lg'
          }`}
        >
          {busy ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
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
              Skicka meddelande 🚀
            </span>
          )}
        </button>
      </div>

      {/* Hidden PayPal (kept for easy rollback) */}
      {false && (
        <PayPalScriptProvider
          options={{
            "client-id": cfg.clientId,
            intent: cfg.intent,
            currency: cfg.currency,
          }}
        >
          <PayPalButtons
            style={{ layout: "vertical", shape: "rect" }}
            disabled={busy || !waiver || existingBookingId}
            createOrder={(d, a) =>
              a.order.create({
                purchase_units: [{ amount: { value: String(COMMISSION) } }],
              })
            }
            onApprove={onApprove}
            onError={(e) =>
              setFlash({ type: "error", message: e.message || "Betalningen misslyckades." })
            }
          />
        </PayPalScriptProvider>
      )}

      {/* Legal links */}
      <div className="mt-4 text-[12px] text-gray-600 leading-relaxed">
        VägVänner är en förmedlingsplattform. Vi är inte part i avtal mellan användare och hanterar inte betalningar för själva resan. Alla överenskommelser ska följa svensk lag.
        {" "}
        Genom att fortsätta accepterar du våra
        {" "}
        <a href="/anvandningsvillkor" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Användningsvillkor</a>,
        {" "}
        <a href="/integritetspolicy" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Integritetspolicy</a>
        {" "}och
        {" "}
        <a href="/cookiepolicy" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Cookiepolicy</a>.
      </div>

      <button
        type="button"
        onClick={() => nav(-1)}
        className="mt-4 w-full text-xs text-gray-500 underline"
        disabled={busy}
      >
        Avbryt och gå tillbaka
      </button>
    </div>
  );
}

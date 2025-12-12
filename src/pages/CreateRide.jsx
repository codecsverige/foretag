// ───────────── src/pages/CreateRide.jsx ─────────────
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { collection, addDoc, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase/firebase.js";
import { useAuth } from "../context/AuthContext.jsx";
// import PageMeta from "../components/PageMeta.jsx"; // غير مستخدم
import VerifiedPhoneField from "../components/VerifiedPhoneField.jsx";
import { Helmet } from "react-helmet-async";
import PageMeta from "../components/PageMeta.jsx";
import { buildSamakningSummary, getWeekdayOptions } from "../utils/rideSummary";
import { sanitizeInput } from "../utils/security";
import { containsProfanity } from "../utils/profanity";
import { secureSession } from "../utils/security";
import { extractCity } from "../utils/address";
import { 
  FaMapMarkerAlt, 
  FaCalendarAlt, 
  FaClock, 
  FaUsers, 
  FaCar, 
  FaUser, 
  FaPhone, 
  FaShieldAlt,
  FaInfoCircle,
  FaArrowLeft,
  FaCheck
} from "react-icons/fa";
// Prisförslag borttaget enligt الطلب
import { trackRideCreated } from "../services/analytics";

// Temporarily disable förare ride creation so only passenger postings appear
const DRIVER_CREATION_ENABLED = false;

/* Lightweight tag input for city/stops lists */
function TagInput({ value, onChange, placeholder }) {
  const [text, setText] = useState("");
  const list = Array.isArray(value) ? value : [];

  const normalize = (s) => String(s || "").trim().replace(/\s+/g, " ");
  const add = (raw) => {
    const token = normalize(raw);
    if (!token) return;
    const next = Array.from(new Set([...list, token])).slice(0, 8);
    onChange(next);
    setText("");
  };
  const remove = (idx) => {
    const next = list.filter((_, i) => i !== idx);
    onChange(next);
  };
  const onKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      add(text);
    } else if (e.key === "Backspace" && !text && list.length > 0) {
      // quick remove last
      remove(list.length - 1);
    }
  };
  return (
    <div className="w-full">
      <div className="flex flex-wrap gap-2 mb-2">
        {list.map((t, i) => (
          <span key={`${t}-${i}`} className="inline-flex items-center gap-2 px-2 py-1 rounded-full bg-gray-100 text-gray-800 text-xs border border-gray-200">
            {t}
            <button type="button" aria-label="remove" onClick={() => remove(i)} className="text-gray-500 hover:text-gray-800">✕</button>
          </span>
        ))}
      </div>
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-blue-500"
      />
      <p className="text-[11px] text-gray-500 mt-1">Tryck Enter eller kommatecken för att lägga till.</p>
    </div>
  );
}

/* Snackbar amélioré */
function Snackbar({ msg, type = "info", clear }) {
  if (!msg) return null;
  const palette = {
    success: "bg-gradient-to-r from-green-500 to-emerald-600",
    error: "bg-gradient-to-r from-red-500 to-rose-600",
    info: "bg-gradient-to-r from-blue-500 to-indigo-600"
  };
  return (
    <div
      className={`${palette[type]} fixed bottom-8 left-1/2 -translate-x-1/2 z-50 px-8 py-4 text-white rounded-2xl shadow-2xl backdrop-blur-sm border border-white/20`}
      role="status"
      aria-live="polite"
      aria-atomic="true"
      onClick={clear}
    >
      <div className="flex items-center gap-3">
        <FaCheck className="w-5 h-5" />
        <span className="font-medium">{msg}</span>
      </div>
    </div>
  );
}

export default function CreateRide() {
  /* أساسيات */
  const nav = useNavigate();
  const { state, search } = useLocation();
  const { user, authLoading } = useAuth();

  /* لا نمنع المستخدم مبكرًا؛ سنطالب بالتحقق عند الإرسال فقط */

  /* استيت */
  const [flash, setFlash] = useState({ msg: "", type: "info" });
  const [fieldErrors, setFieldErrors] = useState({});
  const [role, setRole] = useState("");
  // Förenklad UI: inga extra/kollektioner eller gömda juridiska paneler
  const [insuranceConfirmed, setInsuranceConfirmed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showTripTypes, setShowTripTypes] = useState(false);
  const [showExtraPreferences, setShowExtraPreferences] = useState(false);
  const [showDriverPreferences, setShowDriverPreferences] = useState(false);
  const [showVehicleInfo, setShowVehicleInfo] = useState(false);
  const [showAdvancedFields, setShowAdvancedFields] = useState(false);

  /* بيانات النموذج */
  const [ride, setRide] = useState({
    origin: state?.from || "",
    originDescription: state?.fromDesc || "",
    destination: state?.to || "",
    destinationDescription: state?.toDesc || "",
    tripType: "", // نوع الرحلة للpassenger
    recurrence: "en gång",
    weekdays: [],
    date: "",
    departureTime: "",
    preferredTime: "",
    timeFlexMinutes: 0,
    roundTrip: false,
    returnDate: "",
    returnTime: "",
    count: 1,
    costMode: "cost_share", // cost_share | by_agreement | fixed_price
    price: "",
    approxPrice: "",
    phone: user?.phoneNumber || "",
    // email no longer asked here; will be taken from auth
    email: user?.email || "",
    carBrand: "",
    carModel: "",
    licensePlate: "",
    luggageSpace: "",
    smokingAllowed: "no",
    musicPreference: "",
    notes: "",
    // إضافات للpassenger
    baggage: "", // نوع الأمتعة
    petsAllowed: "", // الحيوانات الأليفة
    accessibilityNeeds: "", // احتياجات خاصة
    genderPreference: "", // تفضيل جنس السائق
    conversationLevel: "", // مستوى المحادثة
    // إضافات للförare
    passengerPreference: "", // نوع الركاب المفضل
    routeFlexibility: "", // مرونة المسار
    pickupFlexibility: "", // مرونة نقطة التقاط
    driverExperience: "", // خبرة السائق
    carComfort: "", // راحة السيارة
    specialServices: "" // خدمات خاصة
    ,
    // Avancerade fält för bättre beskrivning (inga kartor/polyline)
    eventName: "",
    eventPlace: "",
    timeSlot: "", // early_morning | morning | afternoon | evening | night
    altOrigins: [], // ["Uddevalla","Göteborg"]
    altDestinations: [], // ["Eskilstuna","Flen","Nyköping"]
    stops: [] // ["Uppsala","Enköping"]
  });

  // Local date/time helpers for min constraints
  const now = new Date();
  const localIsoDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString()
    .split("T")[0];
  const pad2 = (n) => String(n).padStart(2, "0");
  const minTimeToday = `${pad2(now.getHours())}:${pad2(now.getMinutes())}`;

  // Autosave draft locally and restore if available
  useEffect(() => {
    const draft = secureSession.get('draft_create_ride');
    if (draft && !state?.from && !state?.to) {
      setRide((r) => ({ ...r, ...draft }));
      setFlash({ msg: "Utkast återställd", type: "info" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    secureSession.set('draft_create_ride', ride, 120); // 2 hours
  }, [ride]);

  // When auth user updates (after verification), auto-fill phone if empty in draft
  useEffect(() => {
    if (!user) return;
    setRide((prev) => {
      if (!prev.phone && user.phoneNumber) {
        return { ...prev, phone: user.phoneNumber };
      }
      return prev;
    });
  }, [user]);

  /* ───── حراسات ملاحة داخل useEffect بدلاً من render ───── */
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      nav("/google-auth", { replace: true });
      return;
    }
    // If returning from phone verification with a draft, do not force select-location
    const params = new URLSearchParams(search || "");
    const isResume = !!params.get("resume");
    const draft = secureSession.get('draft_create_ride');
    const hasDraftRoute = draft && (draft.origin || draft.destination);
    if (!state?.from || !state?.to) {
      if (isResume || hasDraftRoute) return; // allow resuming create form
      nav("/select-location", { replace: true });
    }
  }, [authLoading, user, state, nav, search]);

  /* handleChange */
  const onInput = (e) => {
    const { name, value, type } = e.target;
    let v = type === "number" ? (value === "" ? "" : Number(value)) : value;
    if (name === "email") v = sanitizeInput(v, "email");
    if (name === "notes") v = sanitizeInput(v, "message");
    if (name === "origin" || name === "destination" || name.endsWith("Description")) v = sanitizeInput(v, "city");
    if (name === "timeFlexMinutes") v = Number(v) || 0;
    if (name === "approxPrice") v = v.replace?.(/[^0-9]/g, '') || v; // keep digits only in text input
    setRide((r) => ({ ...r, [name]: v }));
    setFieldErrors((prev) => ({ ...prev, [name]: "" }));
  };

  // Prisförslag borttaget: لا نحسب تقديرات السعر هنا

  /* validate */
  const validate = () => {
    const errs = {};
    console.log("🔍 Validating ride data:", { 
      origin: ride.origin, 
      destination: ride.destination, 
      date: ride.date, 
      departureTime: ride.departureTime,
      recurrence: ride.recurrence,
      weekdays: ride.weekdays,
      tripType: ride.tripType,
      role: role
    });
    
    // Basic validations with clear messages
    if (!ride.origin || ride.origin.trim().length < 2) {
      errs.origin = "Ange startpunkt (minst 2 tecken).";
      console.log("❌ Origin error:", ride.origin);
    }
    if (!ride.destination || ride.destination.trim().length < 2) {
      errs.destination = "Ange destination (minst 2 tecken).";
      console.log("❌ Destination error:", ride.destination);
    }
    if (!ride.date) {
      errs.date = "Ange datum för resan.";
      console.log("❌ Date error:", ride.date);
    }
    if (!ride.departureTime) {
      errs.departureTime = "Ange tid för resan.";
      console.log("❌ Time error:", ride.departureTime);
    }
    
    // Date and time validation
    try {
      if (ride.date && ride.departureTime) {
        const rideDateTime = new Date(`${ride.date}T${ride.departureTime}`);
        const now = new Date();
        if (rideDateTime < now) {
          errs.departureTime = "Tiden kan inte vara i det förflutna.";
        }
      }
    } catch {
      errs.departureTime = "Ogiltig tid. Kontrollera formatet.";
    }
    
    // Recurrence validation (only for förare - passagerare doesn't have weekday selector)
    if (role === "förare" && ride.recurrence === "dagligen") {
      console.log("🔍 Checking weekdays for recurring trip:", ride.weekdays);
      if (!ride.weekdays || ride.weekdays.length === 0) {
        errs.weekdays = "För återkommande resor: Välj minst en veckodag.";
        console.log("❌ Weekdays error: No weekdays selected for recurring trip");
      }
    }
    
    // Time flexibility validation
    if (ride.timeFlexMinutes < 0 || ride.timeFlexMinutes > 120) {
      errs.timeFlexMinutes = "Tidsmarginal kan vara 0-120 minuter.";
    }
    
    // Role-specific validations
    if (role === "förare") {
      if (!(Number(ride.count) >= 1)) errs.count = "Minst en plats krävs för förare.";
      if (ride.costMode === "fixed_price") {
        const p = Number(ride.price);
        if (!Number.isFinite(p) || p < 0) errs.price = "Pris kan inte vara negativt.";
      }
      if (!insuranceConfirmed) errs.terms = "Du måste godkänna villkoren för att publicera.";
    }
    
    // Contact validation
    const effectivePhone = user?.phoneNumber || ride.phone;
    if (!effectivePhone || String(effectivePhone).trim().replace(/\D/g, '').length < 6) {
      errs.phone = "Giltigt telefonnummer krävs (minst 6 siffror).";
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ride.email)) {
      errs.email = "Ange en giltig e-postadress.";
    }
    
    // Trip type validation for passengers
    if (role === "passagerare") {
    if (!ride.tripType) {
      errs.tripType = "Välj typ av resa för bättre matchning.";
    }
    }
    
    // Round trip validation
    if (ride.roundTrip) {
      if (!ride.returnTime) errs.returnTime = "Ange returtid för tur-retur-resor.";
      if (ride.recurrence === "en gång" && ride.returnDate && ride.date) {
        const dep = new Date(`${ride.date}T${ride.departureTime || '00:00'}`);
        const ret = new Date(`${ride.returnDate}T${ride.returnTime || '00:00'}`);
        if (ret < dep) errs.returnTime = "Returen måste vara efter utresan.";
      }
    }
    
    // Profanity check
    if (containsProfanity(ride.notes)) errs.notes = "Ta bort olämpliga ord i kommentarer.";
    
    // Additional field validations to prevent Firestore errors
    if (ride.weekdays && !Array.isArray(ride.weekdays)) {
      console.log("❌ Weekdays is not array:", ride.weekdays);
      errs.weekdays = "Veckodagar har ogiltigt format.";
    }
    
    if (ride.timeFlexMinutes && isNaN(Number(ride.timeFlexMinutes))) {
      console.log("❌ TimeFlexMinutes is not number:", ride.timeFlexMinutes);
      errs.timeFlexMinutes = "Tidsmarginal måste vara ett nummer.";
    }
    
    if (role === "förare" && ride.count && isNaN(Number(ride.count))) {
      console.log("❌ Count is not number:", ride.count);
      errs.count = "Antal platser måste vara ett nummer.";
    }
    
    console.log("🔍 Final validation errors:", errs);
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  /* submit */
  const onSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return; // prevent double submit
    // Removed phone verification gate at creation: allow publishing without verified phone
    const ok = validate();
    console.log("🔍 Validation result:", ok, "Errors:", fieldErrors);
    
    if (!ok) {
      // Show specific error message based on which field failed
      const errorFields = Object.keys(fieldErrors);
      let errorMsg = "Vänligen korrigera följande fel:";
      
      console.log("❌ Validation failed. Error fields:", errorFields);
      
      if (errorFields.includes('departureTime')) {
        errorMsg = `⏰ TIDSPROBLEM: ${fieldErrors.departureTime}`;
      } else if (errorFields.includes('weekdays')) {
        errorMsg = `📅 VECKODAGSPROBLEM: ${fieldErrors.weekdays}`;
      } else if (errorFields.includes('tripType')) {
        errorMsg = `🎯 RESETYP SAKNAS: ${fieldErrors.tripType}`;
      } else if (errorFields.includes('date')) {
        errorMsg = `📅 DATUMPROBLEM: ${fieldErrors.date}`;
      } else if (errorFields.includes('origin') || errorFields.includes('destination')) {
        errorMsg = `📍 PLATSPROBLEM: Kontrollera start- och slutpunkt.`;
      } else {
        errorMsg = `❌ ${errorFields.length} FEL HITTADES: ${errorFields.join(', ')}`;
      }
      
      setFlash({ msg: errorMsg, type: "error" });
      
      // Keep error message longer for user to read
      setTimeout(() => {
        if (flash.type === "error") {
          setFlash({ msg: "", type: "info" });
        }
      }, 8000);
      
      // Auto-scroll to first error field
      setTimeout(() => {
        const firstErrorField = document.querySelector(`[name="${errorFields[0]}"]`) || 
                               document.querySelector('.border-red-400') ||
                               document.querySelector('[class*="border-red"]');
        if (firstErrorField) {
          console.log("📍 Scrolling to error field:", errorFields[0]);
          firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
          if (firstErrorField.focus) firstErrorField.focus();
        } else {
          console.log("❌ Could not find error field for:", errorFields[0]);
        }
      }, 100);
      
      return;
    }
    
    console.log("✅ Validation passed! Proceeding with submission...");
    
    // KRITISK VARNING: Daglig samåkning (yrkesmässig trafik risk)
    if (role === "förare" && ride.recurrence === "dagligen" && ride.costMode === "cost_share") {
      const confirmed = window.confirm(
        "⚠️ VIKTIG JURIDISK VARNING\n\n" +
        "Du skapar en DAGLIG samåkning med kostnadsdelning.\n\n" +
        "Enligt svensk lag kan regelbunden daglig samåkning betraktas som " +
        "yrkesmässig trafik (även vid kostnadsdelning) och kräva tillstånd från Transportstyrelsen.\n\n" +
        "KONTROLLERA:\n" +
        "✓ Din försäkring täcker regelbunden samåkning\n" +
        "✓ Du har kontaktat Transportstyrelsen vid behov\n" +
        "✓ Du deklarerar till Skatteverket om nödvändigt\n\n" +
        "VägVänner tar INGET ansvar för juridiska konsekvenser.\n\n" +
        "Vill du fortsätta publicera denna dagliga resa?"
      );
      
      if (!confirmed) {
        setFlash({ msg: "Publicering avbruten. Ändra till 'Engångsresa' eller kontakta Transportstyrelsen först.", type: "info" });
        return;
      }
    }
    
    // Smart advisory based on trip type
    try {
      if (ride.date && ride.departureTime) {
        const depMs = new Date(`${ride.date}T${ride.departureTime || '00:00'}`).getTime();
        const diffHours = (depMs - Date.now()) / 36e5;
        
        // Different logic for different trip types
        if (role === "passagerare" && ride.tripType) {
          if (ride.tripType === "urgent" && diffHours > 24) {
            setFlash({ msg: "💡 För akuta resor: Överväg att kontakta förare direkt via telefon för snabbare svar.", type: "info" });
          } else if (["work", "study"].includes(ride.tripType) && diffHours < 48) {
            setFlash({ msg: "💡 För regelbundna resor (arbete/studier): Publicera gärna 2-3 dagar i förväg för bästa matchning.", type: "info" });
          } else if (ride.tripType === "leisure" && diffHours < 12) {
            setFlash({ msg: "💡 För fritidsresor: Mer tid = fler alternativ. Förare planerar ofta i förväg.", type: "info" });
          }
        } else if (diffHours < 24) {
          setFlash({ msg: "💡 Tips: Resor publicerade 24-72h i förväg får vanligtvis fler svar.", type: "info" });
        }
        
        // Clear flash after 4 seconds
        setTimeout(() => setFlash({ msg: "", type: "info" }), 4000);
      }
    } catch {}

    setIsSubmitting(true);
    try {
      // Enforce publish quota: drivers max 3, passengers max 1 (active listings)
      const roleMax = role === "förare" ? 3 : 1;
      const q = query(collection(db, "rides"), where("userId", "==", user.uid), where("role", "==", role));
      const existing = await getDocs(q);
      const active = existing.docs.filter(d => {
        const r = d.data() || {};
        return r.archived !== true && r.status !== "deleted" && r.status !== "cancelled";
      });
      if (active.length >= roleMax) {
        setFlash({ msg: role === "förare" ? "Du har nått gränsen (3) för aktiva annonser." : "Du har redan en aktiv passagerarförfrågan.", type: "error" });
        setIsSubmitting(false);
        return;
      }

      // Final sanitize payload
      // Sanitize avancerade fält
      const sanitizeStringArray = (arr) => {
        try {
          const list = Array.isArray(arr) ? arr : [];
          const clean = list
            .map((s) => sanitizeInput(String(s || ""), 'city'))
            .map((s) => s.trim())
            .filter((s) => s.length > 0);
          // unique
          return Array.from(new Set(clean));
        } catch { return []; }
      };
      const allowedTimeSlots = new Set(["early_morning","morning","afternoon","evening","night",""]);

      const basePayload = {
        ...ride,
        // Always use verified phone from auth for publishing
        phone: sanitizeInput(user?.phoneNumber || '', 'phone'),
        driverPhone: sanitizeInput(user?.phoneNumber || '', 'phone'),
        origin: sanitizeInput(ride.origin, 'city'),
        originDescription: sanitizeInput(ride.originDescription, 'city'),
        destination: sanitizeInput(ride.destination, 'city'),
        destinationDescription: sanitizeInput(ride.destinationDescription, 'city'),
        // Use auth email implicitly to avoid scaring users with an email field
        email: sanitizeInput(user?.email || '', 'email'),
        notes: sanitizeInput(ride.notes, 'message'),
        // Advanced description fields
        eventName: sanitizeInput(ride.eventName, 'message'),
        eventPlace: sanitizeInput(ride.eventPlace, 'city'),
        timeSlot: allowedTimeSlots.has(String(ride.timeSlot || "")) ? String(ride.timeSlot || "") : "",
        altOrigins: sanitizeStringArray(ride.altOrigins),
        altDestinations: sanitizeStringArray(ride.altDestinations),
        stops: sanitizeStringArray(ride.stops),
        role,
        userId: user.uid,
        driverName: user.displayName || "Förare",
        driverEmail: sanitizeInput(user?.email || '', 'email'),
        seatsAvailable: role === "förare" ? Number(ride.count) : 0,
        luggageSpace: Number(ride.luggageSpace) || 0,
        timeFlexMinutes: Number(ride.timeFlexMinutes) || 0,
        createdAt: new Date().toISOString()
      };
      // Cost fields for both driver and passenger
      basePayload.costMode = ride.costMode;
      if (ride.costMode === "cost_share") {
        const approx = Number(ride.approxPrice);
        basePayload.approxPrice = Number.isFinite(approx) && approx > 0 ? approx : 0;
        basePayload.price = 0;
      } else if (ride.costMode === "fixed_price") {
        basePayload.price = Number(ride.price) || 0;
        basePayload.approxPrice = 0;
      } else {
        basePayload.price = 0;
        basePayload.approxPrice = 0;
      }
      // Clean payload to avoid undefined/null/empty values that could cause Firestore errors
      const cleanPayload = {};
      Object.entries(basePayload).forEach(([key, value]) => {
        // Include all meaningful values, exclude only undefined, null, empty strings
        if (value !== undefined && value !== null) {
          // Convert arrays to proper format
          if (Array.isArray(value)) {
            if (value.length > 0) cleanPayload[key] = value;
          }
          // Include strings (even empty ones might be valid)
          else if (typeof value === 'string') {
            cleanPayload[key] = value.trim();
          }
          // Include numbers (including 0)
          else if (typeof value === 'number') {
            cleanPayload[key] = value;
          }
          // Include booleans
          else if (typeof value === 'boolean') {
            cleanPayload[key] = value;
          }
          // Include other valid types
          else {
            cleanPayload[key] = value;
          }
        }
      });
      
      // Ensure required fields for Firestore
      if (!cleanPayload.createdAt) {
        cleanPayload.createdAt = new Date().toISOString();
      }
      if (!cleanPayload.status) {
        cleanPayload.status = "active";
      }
      
      console.log("🚀 Saving ride with payload:", cleanPayload);
      
      const docRef = await addDoc(collection(db, "rides"), cleanPayload);
      
      console.log("✅ Ride saved successfully with ID:", docRef.id);
      
      // Spåra resa i Analytics
      trackRideCreated(cleanPayload.type || "offer", cleanPayload.price || 0);
      
      setFlash({ msg: "✅ Resa publicerad framgångsrikt!", type: "success" });
      
      // Optional sharing (non-blocking)
      try {
        const baseUrl = window.location.origin || 'https://vagvanner.se';
        const shareUrl = `${baseUrl}/ride/${docRef.id}`;
        const fromCity = ride.origin || 'Start';
        const toCity = ride.destination || 'Destination';
        if (navigator.share && typeof navigator.share === 'function') {
          await navigator.share({ title: `VägVänner – ${fromCity} → ${toCity}`, url: shareUrl });
        } else if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(shareUrl);
        }
      } catch (shareError) {
        console.log("📋 Share failed (non-critical):", shareError.message);
      }
      
      // Navigate to ride details with error handling
      try {
        console.log("🔄 Navigating to ride details:", `/ride/${docRef.id}`);
        nav(`/ride/${docRef.id}`, { replace: true });
      } catch (navError) {
        console.error("❌ Navigation error:", navError);
        // Fallback navigation
        window.location.href = `/ride/${docRef.id}`;
      }
      
    } catch (error) {
      console.error("❌ Detailed submission error:", {
        message: error.message,
        code: error.code,
        stack: error.stack,
        ride: ride,
        role: role
      });
      
      let errorMessage = "Något gick fel vid publicering.";
      
      if (error.code === 'permission-denied') {
        errorMessage = "Behörighet saknas. Kontrollera din inloggning.";
      } else if (error.code === 'unavailable') {
        errorMessage = "Tjänsten är tillfälligt otillgänglig. Försök igen om ett ögonblick.";
      } else if (error.message?.includes('quota')) {
        errorMessage = "För många förfrågningar. Vänta en stund och försök igen.";
      } else if (error.message?.includes('network')) {
        errorMessage = "Nätverksproblem. Kontrollera din internetanslutning.";
      } else if (error.message) {
        errorMessage = `Fel: ${error.message}`;
      }
      
      setFlash({ 
        msg: `${errorMessage} Om problemet kvarstår, kontakta support.`, 
        type: "error" 
      });
      
      // Keep error message longer for debugging
      setTimeout(() => {
        if (flash.type === "error") {
          setFlash({ msg: "", type: "info" });
        }
      }, 10000);
      
    } finally {
      setIsSubmitting(false);
    }
  };

  // Titel-förslag block borttagen enligt طلب المستخدم

  /* اختيار الدور أولاً */
  if (!role) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 p-4">
        <Helmet>
          <title>Skapa resa | VägVänner - Välj din roll</title>
        </Helmet>
        
        <div className="max-w-4xl mx-auto pt-12">
          {/* Header محسن */}
          <div className="text-center mb-12">
            <div className="inline-block bg-blue-600 text-white p-3 rounded-2xl mb-6">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.22.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5S16.67 13 17.5 13s1.5.67 1.5 1.5S18.33 16 17.5 16zM5 11l1.5-4.5h11L19 11H5z"/>
              </svg>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Skapa din resa
            </h1>
            <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
              Välj din roll för att komma igång med samåkning
            </p>
          </div>

            <div className={`grid gap-8 ${DRIVER_CREATION_ENABLED ? "md:grid-cols-2" : "max-w-2xl mx-auto"}`}>
              {DRIVER_CREATION_ENABLED && (
                /* Förare Card - محسن */
                <button
                  onClick={() => setRole("förare")}
                  className="group relative bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-blue-500 transform hover:-translate-y-2"
                >
                  <div className="text-center">
                    <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                      <FaCar className="w-12 h-12 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-3">Jag erbjuder resa</h2>
                    <p className="text-gray-600 mb-6 text-base">
                      Har du bil och vill dela resan? Tjäna pengar och träffa nya människor!
                    </p>
                    
                    <div className="bg-blue-50 rounded-xl p-4 mb-4">
                      <div className="text-2xl font-bold text-blue-600 mb-1">Upp till 2000 kr/mån</div>
                      <div className="text-sm text-blue-700">Extra inkomst genom samåkning</div>
                    </div>
                    
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center justify-center gap-2">
                        <FaCheck className="w-4 h-4 text-green-500" />
                        <span>Dela bränslekostnader</span>
                      </div>
                      <div className="flex items-center justify-center gap-2">
                        <FaCheck className="w-4 h-4 text-green-500" />
                        <span>Trevligare resor</span>
                      </div>
                    </div>
                  </div>
                </button>
              )}

            {/* Passagerare Card - محسن */}
            <button
              onClick={() => setRole("passagerare")}
              className="group relative bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-green-500 transform hover:-translate-y-2"
            >
              <div className="text-center">
                <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-green-700 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <FaUser className="w-12 h-12 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">👤 Jag söker resa</h2>
                <p className="text-gray-600 mb-6 text-base">
                  Behöver du skjuts? Hitta en bekväm och billig resa!
                </p>
                
                <div className="bg-green-50 rounded-xl p-4 mb-4">
                  <div className="text-2xl font-bold text-green-600 mb-1">Spara 70%</div>
                  <div className="text-sm text-green-700">Jämfört med tåg/flyg</div>
                </div>
                
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center justify-center gap-2">
                    <FaCheck className="w-4 h-4 text-green-500" />
                    <span>Billigare än kollektivtrafik</span>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <FaCheck className="w-4 h-4 text-green-500" />
                    <span>Bekvämt och flexibelt</span>
                  </div>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ——— واجهة الإدخال ——— */
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100">
      <PageMeta
        title={"Skapa " + (role === "förare" ? "samåkningserbjudande" : (role ? "reseförfrågan" : "resa")) + " | VägVänner"}
        description="Skapa en ny resa på VägVänner. Välj start och destination och publicera säkert."
        canonical="https://vagvanner.se/create-ride"
      />
      <Helmet>
        <title>Skapa {role === "förare" ? "samåkningserbjudande" : "reseförfrågan"} | VägVänner</title>
      </Helmet>

      <Snackbar
        msg={flash.msg}
        type={flash.type}
        clear={() => setFlash({ msg: "", type: "info" })}
      />

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header محسن */}
        <div className="mb-8">
          <button
            onClick={() => setRole("")}
            className="flex items-center gap-2 text-gray-600 hover:text-blue-600 mb-6 transition-colors font-medium"
          >
            <FaArrowLeft className="w-4 h-4" />
            <span>Tillbaka till rollval</span>
          </button>
          
          <div className="text-center bg-white rounded-2xl p-8 shadow-lg">
            <div className={`inline-block p-3 rounded-2xl mb-4 ${
              role === "förare" ? "bg-blue-600" : "bg-green-600"
            }`}>
              {role === "förare" ? (
                <FaCar className="w-8 h-8 text-white" />
              ) : (
                <FaUser className="w-8 h-8 text-white" />
              )}
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
              {role === "förare" ? "Erbjud samåkning" : "Sök samåkning"}
            </h1>
            {/* Intentionally minimal: ta bort النصوص الدعائية/الوصفية لإبقاء الصفحة رسمية وهادئة */}
          </div>
        </div>

        {/* Trust badges & marketing removed per request */}

        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          <form onSubmit={onSubmit} className="p-8">
            
            {/* Trip Type Section - för alla roller (förare & passagerare) */}
            {role && (
              <div className="mb-8">
                <button
                  type="button"
                  onClick={() => setShowTripTypes(!showTripTypes)}
                  className="w-full text-left flex items-center justify-between p-4 bg-emerald-50 hover:bg-emerald-100 rounded-xl border border-emerald-200 transition-colors mb-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
                      <FaInfoCircle className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">
                        {ride.tripType ? (
                          <>
                            {ride.tripType === "work" && "👔 Arbetsresa"}
                            {ride.tripType === "study" && "🎓 Studieresa"}
                            {ride.tripType === "medical" && "🏥 Vårdbesök"}
                            {ride.tripType === "urgent" && "⚡ Akut resa"}
                            {ride.tripType === "leisure" && "🛍️ Fritidsresa"}
                            {ride.tripType === "event" && "🎉 Event/Konsert"}
                            {ride.tripType === "airport" && "✈️ Flygplats"}
                            {ride.tripType === "other" && "📋 Annan resa"}
                          </>
                        ) : (
                          "Välj typ av resa (rekommenderas)"
                        )}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {ride.tripType ? "Klicka för att ändra" : "Hjälper oss att ge bättre förslag"}
                      </p>
                    </div>
                  </div>
                  <svg 
                    className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${showTripTypes ? 'rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {showTripTypes && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                    {[
                      // Arbete/Studier – يومي أو مرة واحدة + رجوع
                      { key: "work_daily", label: "👔 Arbete (dagligen)", desc: "Pendling – välj vardagar och tider" },
                      { key: "oneway_daily", label: "→ Arbete (enkel dagligen)", desc: "Utresa till jobbet dagligen" },
                      { key: "round_daily", label: "↔︎ Arbete (tur/retur dagligen)", desc: "Ut + retur samma dag" },
                      { key: "work_once", label: "➡️ Arbete (en gång)", desc: "Endast utresa till jobbet" },
                      { key: "round_once", label: "↔︎ Tur & retur (en gång)", desc: "Utresa + retur samma dag" },
                      { key: "study_daily", label: "🎓 Studier (dagligen)", desc: "Till skola/universitet – välj dagar" },
                      { key: "study_once", label: "➡️ Studier (en gång)", desc: "Endast utresa till studier" },

                      // رحلات أخرى
                      { key: "short_commute", label: "🚏 Kort pendling", desc: "Kort sträcka – arbetsdagar" },
                      { key: "long_trip", label: "🧳 Lång resa", desc: "Långdistans – flexibel" },
                      { key: "companion", label: "🤝 Resesällskap", desc: "Sällskap i bil/tåg" },
                      { key: "urgent", label: "⚡ Akut", desc: "Behöver åka snabbt" },
                      { key: "medical", label: "🏥 Vårdbesök", desc: "Exakt tid مهم" },
                      { key: "leisure", label: "🛍️ Fritid", desc: "Helg/Shopping" },
                      { key: "event", label: "🎉 Event/Konsert", desc: "Till evenemang" },
                      { key: "airport", label: "✈️ Flygplats", desc: "Till/från flygplats" },
                      { key: "other", label: "📋 Annat", desc: "Beskriv syfte" }
                    ].map((type) => (
                      <button
                        key={type.key}
                        type="button"
                        onClick={() => {
                          setRide(r => ({ 
                            ...r, 
                            tripType: type.key,
                            // منطق افتراضي قوي حسب السبب
                            recurrence: (
                              ["work_daily","study_daily","round_daily","oneway_daily","short_commute"].includes(type.key)
                            ) ? "dagligen" : "en gång",
                            roundTrip: (
                              ["round_daily","round_once"].includes(type.key)
                            ) ? true : (
                              ["oneway_daily","oneway_once","work_once","study_once"].includes(type.key) ? false : r.roundTrip
                            ),
                            timeFlexMinutes: (
                              ["medical","urgent"].includes(type.key)
                            ) ? 0 : (
                              ["work_daily","study_daily","short_commute","work_once","study_once"].includes(type.key)
                            ) ? 10 : (
                              ["leisure","long_trip","companion"].includes(type.key)
                            ) ? Math.max(30, Number(r.timeFlexMinutes) || 0) : (Number(r.timeFlexMinutes) || 0)
                          }));
                          setShowTripTypes(false);
                        }}
                        className={`p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                          ride.tripType === type.key
                            ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                            : "border-gray-200 bg-white hover:border-emerald-300 hover:bg-emerald-25"
                        }`}
                      >
                        <div className="font-semibold text-sm mb-1">{type.label}</div>
                        <div className="text-xs text-gray-600">{type.desc}</div>
                      </button>
                    ))}
                  </div>
                )}
                
                {ride.tripType && (
                  <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                    <p className="text-sm text-blue-800">
                      {(ride.tripType === "work_daily") && "💼 Arbete dagligen: Ange arbetstider och välj vardagar som passar (mån–fre)."}
                      {(ride.tripType === "study_daily") && "📚 Studier dagligen: Välj skoldagar och lektionstider för bättre matchning."}
                      {(ride.tripType === "round_daily") && "↔︎ Tur/retur dagligen: Ange tider för utresa och retur samma dag."}
                      {(ride.tripType === "oneway_daily") && "→ Enkel dagligen: Endast utresa, välj vardagar."}
                      {(ride.tripType === "long_trip") && "🧳 Lång resa: Beskriv datum och flexibilitet, gärna tidig publicering."}
                      {(ride.tripType === "companion") && "🤝 Resesällskap: Skriv om du kan dela kostnad eller فقط sällskap."}
                      {(ride.tripType === "short_commute") && "🚏 Kort pendling: Ange exakt tid för upphämtning och ankomst."}
                      {(ride.tripType === "oneway_once") && "➡️ Enkel (en gång): Endast utresa vid angiven tid."}
                      {(ride.tripType === "round_once") && "↔︎ Tur & retur (en gång): Ange retur efter utresan samma dag."}
                      {ride.tripType === "medical" && "🏥 Vårdbesök: Precisera tid - förseningar kan vara kritiska för ditt hälsovårdsbesök"}
                      {ride.tripType === "urgent" && "⚡ Akuta resor: Förare prioriterar snabba svar. Överväg även direktkontakt via telefon"}
                      {ride.tripType === "leisure" && "🎉 Fritidsresor: Mer flexibilitet ger fler alternativ - välj bredare tidsramar"}
                      {ride.tripType === "event" && "🎉 Event/Konsert: Ange eventtid och gärna returplaner om ni åker tillsammans"}
                      {ride.tripType === "airport" && "✈️ Flygplats: Ange ditt flygs avgångs-/ankomsttid så föraren vet hur brådskande det är"}
                      {ride.tripType === "other" && "📝 Beskriv din resa tydligt i anteckningar för att få bästa hjälp från förare"}
                    </p>
                  </div>
                )}
                
                {fieldErrors.tripType && (
                  <div className="mt-2 p-3 bg-red-50 rounded-lg border border-red-200">
                    <p className="text-sm text-red-700">❌ {fieldErrors.tripType}</p>
                  </div>
                )}
              </div>
            )}

            {/* Route Section */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                  <FaMapMarkerAlt className="w-5 h-5 text-white" />
                </div>
                Resrutt
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {["origin", "destination"].map((k, i) => (
                  <div key={k} className="relative">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      {i ? "Destination" : "Startpunkt"}
                    </label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                        <FaMapMarkerAlt className={`w-5 h-5 ${i ? 'text-green-500' : 'text-red-500'}`} />
                      </div>
                      <div className="pl-12 pr-4 py-4 bg-gray-50 rounded-xl border-2 border-gray-200 focus-within:border-blue-500 transition-colors">
                        <div className="font-medium text-gray-900 flex items-center justify-between gap-3">
                          <span>{ride[k]}</span>
                          <Link to="/select-location" className="text-xs text-blue-600 hover:text-blue-700 underline">Ändra</Link>
                        </div>
                        {ride[`${k}Description`] && (
                          <div className="text-sm text-gray-500 mt-1">
                            {ride[`${k}Description`]}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Date & Time Section */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                  <FaCalendarAlt className="w-5 h-5 text-white" />
                </div>
                Datum & Tid
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Upprepning</label>
                  <select
                    name="recurrence"
                    value={ride.recurrence}
                    onChange={onInput}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 transition-colors bg-white"
                  >
                    <option value="en gång">Engångsresa</option>
                    <option value="dagligen">Återkommande</option>
                  </select>
                  {role === "passagerare" && ride.tripType && ["work", "study"].includes(ride.tripType) && (
                    <p className="mt-1 text-xs text-amber-600">
                      💡 {ride.tripType === "work" ? "Arbetsresor" : "Studieresor"} är ofta återkommande - välj "Återkommande" för bästa resultat
                    </p>
                  )}
                </div>
                {ride.recurrence === "dagligen" && (
                  <div className="md:col-span-3">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Veckodagar</label>
                    <div className="flex flex-wrap gap-2">
                      {getWeekdayOptions().map((d) => {
                        const active = ride.weekdays.includes(d.key);
                        return (
                          <button
                            key={d.key}
                            type="button"
                            onClick={() =>
                              setRide((r) => {
                                const set = new Set(r.weekdays || []);
                                if (set.has(d.key)) set.delete(d.key); else set.add(d.key);
                                return { ...r, weekdays: Array.from(set) };
                              })
                            }
                            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition ${
                              active
                                ? "bg-emerald-600 text-white border-emerald-600"
                                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                            }`}
                          >
                            {d.short}
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Välj de dagar du pendlar.</p>
                  </div>
                )}
                
                {ride.recurrence === "en gång" && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      {role === "passagerare" && ride.tripType === "urgent" ? "Datum (eller så snart som möjligt)" : "Datum"}
                    </label>
                    <div className="relative">
                      <FaCalendarAlt className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="date"
                        name="date"
                        value={ride.date}
                        onChange={onInput}
                        min={localIsoDate}
                        className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl focus:border-blue-500 transition-colors ${fieldErrors.date ? 'border-red-400' : 'border-gray-200'}`}
                        required
                      />
                    </div>
                    {fieldErrors.date && <p className="mt-1 text-xs text-red-600">{fieldErrors.date}</p>}
                    {role === "passagerare" && ride.tripType === "urgent" && (
                      <p className="mt-1 text-xs text-orange-600">
                        ⚡ För akuta resor kan du också kontakta förare direkt via telefon
                      </p>
                    )}
                  </div>
                )}
                
                {ride.recurrence === "dagligen" && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Startdatum</label>
                    <div className="relative">
                      <FaCalendarAlt className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="date"
                        name="date"
                        value={ride.date}
                        onChange={onInput}
                        min={localIsoDate}
                        className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl focus:border-blue-500 transition-colors ${fieldErrors.date ? 'border-red-400' : 'border-gray-200'}`}
                        required
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      När vill du börja åka? (för återkommande resor)
                    </p>
                    {fieldErrors.date && <p className="mt-1 text-xs text-red-600">{fieldErrors.date}</p>}
                  </div>
                )}
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Tid</label>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="relative">
                      <FaClock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="time"
                        name="departureTime"
                        value={ride.departureTime}
                        onChange={onInput}
                        min={ride.date === localIsoDate ? minTimeToday : undefined}
                        className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl focus:border-blue-500 transition-colors ${fieldErrors.departureTime ? 'border-red-400' : 'border-gray-200'}`}
                        required
                      />
                    </div>
                    <div className="relative">
                      <select
                        name="timeFlexMinutes"
                        value={ride.timeFlexMinutes}
                        onChange={onInput}
                        className="w-full pl-3 pr-4 py-3 border-2 rounded-xl focus:border-blue-500 transition-colors"
                      >
                        {role === "passagerare" && ride.tripType ? (
                          // Smart options based on trip type
                          ride.tripType === "work" || ride.tripType === "medical" ? (
                            <>
                              <option value={0}>Exakt tid (±0 min)</option>
                              <option value={5}>Lite flexibilitet (±5 min)</option>
                              <option value={10}>Måttlig flexibilitet (±10 min)</option>
                            </>
                          ) : ride.tripType === "study" ? (
                            <>
                              <option value={0}>Exakt tid (±0 min)</option>
                              <option value={10}>Måttlig flexibilitet (±10 min)</option>
                              <option value={20}>God flexibilitet (±20 min)</option>
                            </>
                          ) : ride.tripType === "urgent" ? (
                            <>
                              <option value={0}>Så snabbt som möjligt (±0 min)</option>
                              <option value={5}>Liten marginal (±5 min)</option>
                            </>
                          ) : (
                            // leisure, other
                            <>
                              <option value={15}>Lite flexibilitet (±15 min)</option>
                              <option value={30}>God flexibilitet (±30 min)</option>
                              <option value={60}>Hög flexibilitet (±60 min)</option>
                              <option value={120}>Mycket flexibel (±2h)</option>
                            </>
                          )
                        ) : (
                          // Default options
                          <>
                            <option value={0}>Flex: ±0 min</option>
                            <option value={10}>Flex: ±10 min</option>
                            <option value={20}>Flex: ±20 min</option>
                            <option value={30}>Flex: ±30 min</option>
                            <option value={45}>Flex: ±45 min</option>
                            <option value={60}>Flex: ±60 min</option>
                          </>
                        )}
                      </select>
                    </div>
                  </div>
                  {/* Tips removed to reduce noise */}
                  {fieldErrors.timeFlexMinutes && <p className="mt-1 text-xs text-red-600">{fieldErrors.timeFlexMinutes}</p>}
                </div>

                {/* Flexibel tid hint */}
                <div className="md:col-span-4 text-[12px] text-gray-600">Flexibel tid betyder att avgången kan variera några minuter runt vald tid (t.ex. ±20–30 min), inte timmar.</div>

                {/* Tur & retur toggle */}
                <div className="md:col-span-4">
                  <label className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <input
                      type="checkbox"
                      checked={!!ride.roundTrip}
                      onChange={(e) =>
                        setRide((r) => ({
                          ...r,
                          roundTrip: e.target.checked,
                          // Pre-fill returnDate for engångsresa
                          returnDate:
                            e.target.checked && r.recurrence === "en gång"
                              ? (r.returnDate || r.date || "")
                              : r.returnDate
                        }))
                      }
                      className="accent-emerald-600"
                    />
                    Tur och retur
                  </label>
                </div>

                {/* Retur fields */}
                {ride.roundTrip && (
                  <div className="md:col-span-4 grid grid-cols-1 md:grid-cols-3 gap-6 bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                    {ride.recurrence === "en gång" && (
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Returdatum</label>
                        <div className="relative">
                          <FaCalendarAlt className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input
                            type="date"
                            name="returnDate"
                            value={ride.returnDate}
                            onChange={onInput}
                            className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-600 transition-colors"
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Lämna tomt för samma dag som utresan.</p>
                      </div>
                    )}
                    <div className={ride.recurrence === "en gång" ? "md:col-span-2" : "md:col-span-3"}>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Returtid</label>
                      <div className="relative">
                        <FaClock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="time"
                          name="returnTime"
                          value={ride.returnTime}
                          onChange={onInput}
                          className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl focus:border-emerald-600 transition-colors ${fieldErrors.returnTime ? 'border-red-400' : 'border-gray-200'}`}
                          required={ride.roundTrip}
                        />
                      </div>
                      {ride.recurrence === "dagligen" && (
                        <p className="text-xs text-gray-500 mt-2">För återkommande resor räcker det med returtid.</p>
                      )}
                      {fieldErrors.returnTime && <p className="mt-1 text-xs text-red-600">{fieldErrors.returnTime}</p>}
                    </div>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {role === "förare" ? "Lediga platser" : "Antal personer"}
                  </label>
                  <div className="relative">
                    <FaUsers className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="number"
                      name="count"
                      min={1}
                      value={ride.count}
                      onChange={onInput}
                      className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl focus:border-blue-500 transition-colors ${fieldErrors.count ? 'border-red-400' : 'border-gray-200'}`}
                      required
                    />
                  </div>
                  {fieldErrors.count && <p className="mt-1 text-xs text-red-600">{fieldErrors.count}</p>}
                </div>
              </div>
            </div>

            {/* Summary preview removed to keep page concise and professional */}

            {/* Titel-förslag borttagen */}

            {/* Contact Section */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                  <FaPhone className="w-5 h-5 text-white" />
                </div>
                Kontaktinformation
              </h2>
              
              <div className="space-y-6">
                {/* هاتف مؤكَّد: اعتمد حصرياً على رقم المستخدم الموثق */}
                <VerifiedPhoneField phone={user?.phoneNumber} returnTo="/create-ride" />

                {/* إخفاء حقل البريد: سنعتمد على user.email تلقائيًا */}
              </div>
            </div>

            {/* Avancerade fält (valfritt) */}
            <div className="mb-8">
              <button
                type="button"
                onClick={() => setShowAdvancedFields(v => !v)}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 border-gray-200 hover:border-blue-400 bg-white"
              >
                <span className="text-sm font-semibold text-gray-800">Avancerade fält (valfritt)</span>
                <span className="text-gray-500">{showAdvancedFields ? '▲' : '▼'}</span>
              </button>
              {showAdvancedFields && (
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Event/Place */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Evenemang/Plats (ex: Globen)</label>
                    <input
                      type="text"
                      name="eventName"
                      value={ride.eventName}
                      onChange={onInput}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500"
                      placeholder="Ex: Lady Gaga i Globen"
                    />
                    <input
                      type="text"
                      name="eventPlace"
                      value={ride.eventPlace}
                      onChange={onInput}
                      className="mt-3 w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500"
                      placeholder="Plats/stadsdel (ex: Globen, Stockholm)"
                    />
                  </div>

                  {/* Time slot */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Tidsfönster</label>
                    <select
                      name="timeSlot"
                      value={ride.timeSlot}
                      onChange={onInput}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500"
                    >
                      <option value="">Ingen (exakt tid ovan)</option>
                      <option value="early_morning">Tidigt (05:00–08:00)</option>
                      <option value="morning">Förmiddag (08:00–12:00)</option>
                      <option value="afternoon">Eftermiddag (12:00–17:00)</option>
                      <option value="evening">Kväll (17:00–21:00)</option>
                      <option value="night">Sen kväll/natt (21:00–02:00)</option>
                    </select>
                  </div>

                  {/* Alternative origins/destinations */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Alternativa startpunkter</label>
                    <TagInput
                      value={ride.altOrigins}
                      placeholder="Lägg till stad… (t.ex. Uddevalla, Göteborg)"
                      onChange={(list) => setRide(r => ({ ...r, altOrigins: list }))}
                    />
                    <p className="text-[12px] text-gray-500 mt-1">Visar flexibilitet likt inlägg في Facebook (t.ex. Uddevalla/Göteborg).</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Alternativa destinationer</label>
                    <TagInput
                      value={ride.altDestinations}
                      placeholder="Lägg till stad… (t.ex. Eskilstuna, Flen, Nyköping)"
                      onChange={(list) => setRide(r => ({ ...r, altDestinations: list }))}
                    />
                  </div>

                  {/* Suggested stops */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Möjliga stopp på vägen</label>
                    <TagInput
                      value={ride.stops}
                      placeholder="Lägg till stopp… (t.ex. Uppsala, Enköping)"
                      onChange={(list) => setRide(r => ({ ...r, stops: list }))}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Kostnad (förare & passagerare) - ENDAST ICKE-KOMMERSIELL */}
            {(role === "förare" || role === "passagerare") && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">💰 Ersättning</h2>
                
                {/* VIKTIGT MEDDELANDE */}
                <div className="mb-4 p-4 bg-red-50 border-2 border-red-200 rounded-xl">
                  <p className="text-red-800 font-semibold text-sm mb-2">⚠️ VIKTIGT - Endast icke-kommersiell samåkning tillåten</p>
                  <p className="text-red-700 text-xs">
                    VägVänner är en plattform för privat kostnadsdelning. Yrkesmässig persontransport 
                    (taxi, Uber-liknande verksamhet) är förbjuden och kan leda till böter.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <label className={`flex items-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all ${ride.costMode === 'free' ? 'border-green-500 bg-green-50 shadow-md' : 'border-gray-200 bg-white hover:border-green-300'}`}> 
                    <input type="radio" name="costMode" checked={ride.costMode === 'free'} onChange={() => setRide(r => ({ ...r, costMode: 'free', price: '' }))} className="accent-green-600" />
                    <div>
                      <div className="font-semibold text-gray-900">Ingen ersättning</div>
                      <div className="text-xs text-gray-600">Utan kostnad</div>
                    </div>
                  </label>
                  <label className={`flex items-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all ${ride.costMode === 'companionship' ? 'border-lime-500 bg-lime-50 shadow-md' : 'border-gray-200 bg-white hover:border-lime-300'}`}> 
                    <input type="radio" name="costMode" checked={ride.costMode === 'companionship'} onChange={() => setRide(r => ({ ...r, costMode: 'companionship', price: '' }))} className="accent-lime-600" />
                    <div>
                      <div className="font-semibold text-gray-900">🤝 Endast sällskap</div>
                      <div className="text-xs text-gray-600">Trevligt resesällskap</div>
                    </div>
                  </label>
                  <label className={`flex items-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all ${ride.costMode === 'cost_share' ? 'border-emerald-500 bg-emerald-50 shadow-md' : 'border-gray-200 bg-white hover:border-emerald-300'}`}> 
                    <input type="radio" name="costMode" checked={ride.costMode === 'cost_share'} onChange={() => setRide(r => ({ ...r, costMode: 'cost_share', price: '' }))} className="accent-emerald-600" />
                    <div>
                      <div className="font-semibold text-gray-900">⛽ Kostnadsdelning</div>
                      <div className="text-xs text-gray-600">Dela bensin & slitage</div>
                    </div>
                  </label>
                </div>

                {/* Prisförslag/guide borttagen enligt الطلب */}

                {/* Legal info per mode */}
                {ride.costMode === 'cost_share' && (
                  <div className="mt-4 p-4 rounded-xl border-2 border-emerald-200 bg-emerald-50">
                    <p className="text-emerald-900 font-semibold text-sm mb-2">✅ Kostnadsdelning - Laglig privat samåkning</p>
                    <ul className="text-xs text-emerald-800 space-y-1 list-disc pl-4">
                      <li>Dela endast faktiska kostnader (bensin, slitage, vägavgifter)</li>
                      <li>Inte skattepliktig inkomst (enligt Skatteverket)</li>
                      <li>VägVänner hanterar INTE betalningar - du tar betalt direkt av passagerare</li>
                      <li>Regelbunden daglig samåkning kan kräva tillstånd - kontakta Transportstyrelsen</li>
                    </ul>

                    {/* Approximate price input */}
                    <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Cirka pris (valfritt)</label>
                        <div className="relative">
                          <input
                            type="text"
                            name="approxPrice"
                            value={ride.approxPrice}
                            onChange={onInput}
                            placeholder="t.ex. 50"
                            className="w-full pl-10 pr-12 py-2 border-2 border-emerald-200 rounded-xl focus:border-emerald-500"
                          />
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">ca</span>
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">kr</span>
                        </div>
                        <p className="text-[11px] text-gray-500 mt-1">Ej bindande, endast uppskattning för delning av kostnader.</p>
                      </div>
                    </div>
                  </div>
                )}
                {(ride.costMode === 'free' || ride.costMode === 'companionship') && (
                  <div className="mt-4 p-4 rounded-xl border-2 border-green-200 bg-green-50">
                    <p className="text-green-900 font-semibold text-sm mb-1">✅ Ingen ersättning</p>
                    <p className="text-xs text-green-800">
                      VägVänner hanterar inte betalningar mellan parter.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Fordonsinformation & preferenser (endast förare) – kollapsbar */}
            {role === "förare" && (
              <div className="mb-8">
                <button
                  type="button"
                  onClick={() => setShowVehicleInfo(!showVehicleInfo)}
                  className="w-full text-left flex items-center justify-between p-4 bg-blue-50 hover:bg-blue-100 rounded-xl border border-blue-200 transition-colors mb-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                      <FaCar className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">Fordonsinformation & preferenser</h3>
                      <p className="text-sm text-gray-600">Valfritt</p>
                    </div>
                  </div>
                  <svg
                    className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${showVehicleInfo ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {showVehicleInfo && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Bilens märke</label>
                      <input
                        type="text"
                        name="carBrand"
                        value={ride.carBrand}
                        onChange={onInput}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 transition-colors"
                        placeholder="Ex: Volvo"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Bilmodell</label>
                      <input
                        type="text"
                        name="carModel"
                        value={ride.carModel}
                        onChange={onInput}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 transition-colors"
                        placeholder="Ex: XC60"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Registreringsnummer</label>
                      <input
                        type="text"
                        name="licensePlate"
                        value={ride.licensePlate}
                        onChange={onInput}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 transition-colors"
                        placeholder="Ex: ABC123"
                      />
                      <p className="text-xs text-gray-500 mt-1">Visas inte offentligt.</p>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Bagage (antal)</label>
                      <input
                        type="number"
                        name="luggageSpace"
                        min={0}
                        value={ride.luggageSpace}
                        onChange={onInput}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 transition-colors"
                        placeholder="0"
                      />
                      <p className="text-xs text-gray-500 mt-1">Ungefär hur många normalstora väskor ryms.</p>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Rökning</label>
                      <select
                        name="smokingAllowed"
                        value={ride.smokingAllowed}
                        onChange={onInput}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 transition-colors"
                      >
                        <option value="no">🚭 Rökning ej tillåten</option>
                        <option value="yes">🚬 Rökning tillåten</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Musikpreferens</label>
                      <input
                        type="text"
                        name="musicPreference"
                        value={ride.musicPreference}
                        onChange={onInput}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 transition-colors"
                        placeholder="Ex: Lugnt, radio, tystnad"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Driver Extra Preferences */}
            {role === "förare" && (
              <div className="mb-8">
                <button
                  type="button"
                  onClick={() => setShowDriverPreferences(!showDriverPreferences)}
                  className="w-full text-left flex items-center justify-between p-4 bg-blue-50 hover:bg-blue-100 rounded-xl border border-blue-200 transition-colors mb-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                      <FaCar className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">
                        Förarpreferenser (valfritt)
                      </h3>
                      <p className="text-sm text-gray-600">
                        Hjälper passagerare att förstå din körstil och preferenser
                      </p>
                    </div>
                  </div>
                  <svg 
                    className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${showDriverPreferences ? 'rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {showDriverPreferences && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
                    
                    {/* Passenger Type Preference */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Typ av passagerare</label>
                      <select
                        name="passengerPreference"
                        value={ride.passengerPreference}
                        onChange={onInput}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 transition-colors bg-white"
                      >
                        <option value="">Alla välkomna</option>
                        <option value="students">Föredrar studenter</option>
                        <option value="professionals">Föredrar yrkesverksamma</option>
                        <option value="seniors">Välkomnar äldre passagerare</option>
                        <option value="families">Familjevänlig</option>
                        <option value="women_only">Endast kvinnliga passagerare</option>
                      </select>
                    </div>

                    {/* Route Flexibility */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Ruttflexibilitet</label>
                      <select
                        name="routeFlexibility"
                        value={ride.routeFlexibility}
                        onChange={onInput}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 transition-colors bg-white"
                      >
                        <option value="">Standard rutt</option>
                        <option value="flexible">Kan köra omvägar</option>
                        <option value="direct_only">Endast direkt väg</option>
                        <option value="scenic">Föredrar naturskön rutt</option>
                        <option value="fastest">Alltid snabbaste vägen</option>
                      </select>
                    </div>

                    {/* Pickup Flexibility */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Upphämtning</label>
                      <select
                        name="pickupFlexibility"
                        value={ride.pickupFlexibility}
                        onChange={onInput}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 transition-colors bg-white"
                      >
                        <option value="">Standard upphämtning</option>
                        <option value="door_to_door">Dörr-till-dörr service</option>
                        <option value="central_pickup">Centrala platser endast</option>
                        <option value="flexible_pickup">Flexibel med platser</option>
                        <option value="no_detours">Inga omvägar för upphämtning</option>
                      </select>
                    </div>

                    {/* Driver Experience */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Körerfarenhet</label>
                      <select
                        name="driverExperience"
                        value={ride.driverExperience}
                        onChange={onInput}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 transition-colors bg-white"
                      >
                        <option value="">Välj erfarenhet</option>
                        <option value="beginner">Ny förare (1-3 år)</option>
                        <option value="experienced">Erfaren förare (3-10 år)</option>
                        <option value="professional">Professionell förare (10+ år)</option>
                        <option value="elderly_friendly">Van vid äldre passagerare</option>
                        <option value="student_friendly">Van vid studenter</option>
                      </select>
                    </div>

                    {/* Car Comfort */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Bilens komfort</label>
                      <select
                        name="carComfort"
                        value={ride.carComfort}
                        onChange={onInput}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 transition-colors bg-white"
                      >
                        <option value="">Standard komfort</option>
                        <option value="luxury">Lyxbil med extra komfort</option>
                        <option value="spacious">Rymlig bil med mycket plats</option>
                        <option value="economy">Ekonomisk bil - fokus på kostnad</option>
                        <option value="family_car">Familjebil med säkerhet i fokus</option>
                        <option value="sports_car">Sportbil - kul körupplevelse</option>
                      </select>
                    </div>

                    {/* Special Services */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Specialtjänster</label>
                      <select
                        name="specialServices"
                        value={ride.specialServices}
                        onChange={onInput}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 transition-colors bg-white"
                      >
                        <option value="">Inga specialtjänster</option>
                        <option value="luggage_help">Hjälper med bagage</option>
                        <option value="wheelchair_accessible">Rullstolsanpassad bil</option>
                        <option value="pet_friendly">Välkomnar husdjur</option>
                        <option value="child_seats">Barnstolar tillgängliga</option>
                        <option value="late_night">Kör sent på kvällen/natt</option>
                        <option value="early_morning">Tidig morgonstart</option>
                        <option value="airport_specialist">Specialist på flygplatstransport</option>
                      </select>
                    </div>
                    
                  </div>
                )}
              </div>
            )}

            {/* Extra Preferences for Passengers */}
            {role === "passagerare" && (
              <div className="mb-8">
                <button
                  type="button"
                  onClick={() => setShowExtraPreferences(!showExtraPreferences)}
                  className="w-full text-left flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-200 transition-colors mb-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-gray-500 to-gray-700 rounded-lg flex items-center justify-center">
                      <FaInfoCircle className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">
                        Ytterligare preferenser (valfritt)
                      </h3>
                      <p className="text-sm text-gray-600">
                        Hjälper förare att förstå dina behov bättre
                      </p>
                    </div>
                  </div>
                  <svg 
                    className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${showExtraPreferences ? 'rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {showExtraPreferences && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
                    
                    {/* Baggage */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Bagage/Väskor</label>
                      <select
                        name="baggage"
                        value={ride.baggage}
                        onChange={onInput}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 transition-colors bg-white"
                      >
                        <option value="">Välj bagagestorlek</option>
                        <option value="none">Ingen bagage</option>
                        <option value="small">Liten väska/ryggsäck</option>
                        <option value="medium">Medelstor resväska</option>
                        <option value="large">Stor resväska</option>
                        <option value="multiple">Flera väskor</option>
                      </select>
                    </div>

                    {/* Pets */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Husdjur</label>
                      <select
                        name="petsAllowed"
                        value={ride.petsAllowed}
                        onChange={onInput}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 transition-colors bg-white"
                      >
                        <option value="">Inga husdjur</option>
                        <option value="small_pet">Litet husdjur (katt/liten hund)</option>
                        <option value="medium_pet">Medelstor hund</option>
                        <option value="pet_friendly">Reser ofta med husdjur</option>
                      </select>
                    </div>

                    {/* Gender Preference */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Förarpreferens</label>
                      <select
                        name="genderPreference"
                        value={ride.genderPreference}
                        onChange={onInput}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 transition-colors bg-white"
                      >
                        <option value="">Ingen preferens</option>
                        <option value="female">Föredrar kvinnlig förare</option>
                        <option value="male">Föredrar manlig förare</option>
                      </select>
                    </div>

                    {/* Conversation Level */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Konversation</label>
                      <select
                        name="conversationLevel"
                        value={ride.conversationLevel}
                        onChange={onInput}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 transition-colors bg-white"
                      >
                        <option value="">Ingen preferens</option>
                        <option value="chatty">Gillar att prata under resan</option>
                        <option value="quiet">Föredrar tyst resa</option>
                        <option value="flexible">Anpassar mig efter föraren</option>
                      </select>
                    </div>

                    {/* Accessibility */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Tillgänglighet</label>
                      <select
                        name="accessibilityNeeds"
                        value={ride.accessibilityNeeds}
                        onChange={onInput}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 transition-colors bg-white"
                      >
                        <option value="">Inga särskilda behov</option>
                        <option value="wheelchair">Rullstolsanpassning behövs</option>
                        <option value="mobility_aid">Behöver hjälp med rörlighet</option>
                        <option value="hearing_impaired">Hörselnedsättning</option>
                        <option value="visual_impaired">Synnedsättning</option>
                        <option value="elderly_assistance">Äldre - behöver extra hjälp</option>
                      </select>
                    </div>
                    
                  </div>
                )}
              </div>
            )}

            {/* Notes Section (behåll كحقل دون رسائل ترويجية) */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-rose-600 rounded-lg flex items-center justify-center">
                  <FaInfoCircle className="w-5 h-5 text-white" />
                </div>
                Övriga kommentarer
              </h2>
              
              <textarea
                name="notes"
                rows={3}
                value={ride.notes}
                onChange={onInput}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 transition-colors resize-none"
                placeholder="Ex: Flexibel med tiden, kan ta med bagage, preferenser för musik eller konversation..."
              />
            </div>


            {/* Juridiska villkor (Sverige) – kort ومهني */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Juridiska villkor (Sverige)</h2>
              <div className="p-4 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-700 space-y-2">
                <ul className="list-disc pl-5 space-y-1">
                  <li>Tjänsten förmedlar kontakt mellan privatpersoner. Plattformen är inte transportör och ansvarar inte för resans utförande.</li>
                  <li>Samåkning är privat och icke‑kommersiell. Endast skäliga kostnader (t.ex. bränsle, vägavgifter, parkering) får delas. Inget vinstsyfte. Ingen yrkestrafik.</li>
                  <li>Föraren ansvarar för fordonets laglighet (trafikförsäkring, skatt, besiktning), efterlevnad av trafikregler och säker körning.</li>
                  <li>Säkerhet och uppförande: inga farliga ämnen/gods. Lagkrav för barnsäkerhet gäller. Alkoholfri och drogfri körning. Respektfullt bemötande och icke‑diskriminering.</li>
                  <li>Avbokningar och eventuell ersättning sker direkt mellan parterna. Plattformen hanterar inte betalningar.</li>
                  <li>Personuppgifter behandlas enligt integritetspolicyn. Endast nödvändig kontaktinformation delas.</li>
                  <li>Var och en ansvarar för eventuell skatterättslig hantering enligt gällande lag. Tjänsten avser kostnadsdelning.</li>
                </ul>
              </div>
              <label className="flex items-start gap-2 mt-4 cursor-pointer">
                <input
                  type="checkbox"
                  checked={insuranceConfirmed}
                  onChange={(e) => setInsuranceConfirmed(e.target.checked)}
                  className="mt-1 h-5 w-5 text-blue-600 focus:ring-blue-500 rounded border-gray-300"
                  required
                />
                <span className="text-sm text-gray-700">
                  Jag intygar att jag har läst och accepterar villkoren ovan samt
                  {" "}
                  <Link to="/anvandningsvillkor" target="_blank" className="text-blue-600 hover:text-blue-700 underline">användarvillkoren</Link>
                  {" "}och{" "}
                  <Link to="/integritetspolicy" target="_blank" className="text-blue-600 hover:text-blue-700 underline">integritetspolicyn</Link>.
                </span>
              </label>

              {/* Close legal brief container */}
            </div>

            {/* STARK JURIDISK BEKRÄFTELSE */}
            <div className="mb-8">
              <div className="p-6 bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-300 rounded-2xl">
                <h3 className="text-lg font-bold text-red-900 mb-4 flex items-center gap-2">
                  <span className="text-2xl">⚠️</span> Juridisk bekräftelse - Läs noga
                </h3>
                
                <div className="space-y-3 text-sm">
                  <label className="flex items-start gap-3 cursor-pointer p-3 bg-white rounded-lg border border-red-200 hover:bg-red-50 transition-colors">
                    <input
                      type="checkbox"
                      checked={insuranceConfirmed}
                      onChange={(e) => setInsuranceConfirmed(e.target.checked)}
                      className="mt-1 h-5 w-5 text-red-600 focus:ring-red-500 rounded border-gray-300"
                      required
                    />
                    <div className="text-gray-900">
                      <p className="font-semibold mb-2">Jag bekräftar att:</p>
                      <ul className="list-disc pl-5 space-y-1 text-xs text-gray-700">
                        <li>Jag har läst och godkänner <Link to="/anvandningsvillkor" target="_blank" className="text-blue-600 hover:text-blue-700 underline font-semibold">användningsvillkor</Link> och <Link to="/integritetspolicy" target="_blank" className="text-blue-600 hover:text-blue-700 underline font-semibold">integritetspolicy</Link></li>
                        <li><strong>Detta är INTE yrkesmässig trafik</strong> - jag bedriver inte taxi eller Uber-liknande verksamhet</li>
                        <li>Jag har giltigt körkort och trafikförsäkring som täcker samåkning {role === 'förare' ? '(jag har kontrollerat med mitt försäkringsbolag)' : ''}</li>
                        <li>Vid kostnadsdelning tar jag endast betalt för faktiska kostnader - inte för vinst</li>
                        <li>Jag förstår att VägVänner INTE ansvarar för resan, skador eller olyckor</li>
                        <li>Jag samtycker till e-postaviseringar om bokningar till {ride.email || 'angiven e-post'}</li>
                      </ul>
                    </div>
                  </label>
                </div>
                
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-300 rounded-lg">
                  <p className="text-xs text-yellow-900">
                    <strong>OBS:</strong> Regelbunden daglig samåkning (5+ dagar/vecka) kan kräva tillstånd 
                    från Transportstyrelsen även vid kostnadsdelning. Vid osäkerhet, kontakta 
                    <a href="https://www.transportstyrelsen.se" target="_blank" rel="noopener noreferrer" className="underline font-semibold"> Transportstyrelsen</a>.
                  </p>
                </div>
              </div>

            </div>

            {/* Action Buttons محسنة */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6">
              <button
                type="button"
                onClick={() => setRole("")}
                className="flex-1 px-8 py-4 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 flex items-center justify-center gap-2"
              >
                <FaArrowLeft className="w-4 h-4" />
                Tillbaka
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`flex-1 px-8 py-4 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${
                  role === "förare" 
                    ? "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                    : "bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                }`}
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Publicerar...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <FaCheck className="w-5 h-5" />
                    <span>Publicera {role === "förare" ? "erbjudande" : "förfrågan"}</span>
                  </div>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

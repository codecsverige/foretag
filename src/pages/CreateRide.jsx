// ───────────── src/pages/CreateRide.jsx ─────────────
// تم تحويله إلى صفحة إنشاء إعلان شركة (BokaNära)
import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { collection, addDoc, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase/firebase.js";
import { useAuth } from "../context/AuthContext.jsx";
import { Helmet } from "react-helmet-async";
import PageMeta from "../components/PageMeta.jsx";
import { sanitizeInput } from "../utils/security";
import { containsProfanity } from "../utils/profanity";
import { 
  FaBuilding,
  FaMapMarkerAlt, 
  FaClock, 
  FaPhone, 
  FaInfoCircle,
  FaArrowLeft,
  FaCheck,
  FaImage,
  FaTag,
  FaMoneyBillWave,
  FaCalendarAlt
} from "react-icons/fa";

/* Snackbar Component */
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

// قائمة الفئات المتاحة
const CATEGORIES = [
  { value: "", label: "Välj kategori..." },
  { value: "beauty", label: "💇 Skönhet & Frisör" },
  { value: "health", label: "🏥 Hälsa & Sjukvård" },
  { value: "home", label: "🏠 Hemservice" },
  { value: "auto", label: "🚗 Bil & Motor" },
  { value: "restaurant", label: "🍽️ Restaurang & Café" },
  { value: "fitness", label: "💪 Gym & Fitness" },
  { value: "education", label: "📚 Utbildning" },
  { value: "tech", label: "💻 IT & Teknik" },
  { value: "legal", label: "⚖️ Juridik" },
  { value: "finance", label: "💰 Ekonomi & Finans" },
  { value: "photo", label: "📷 Foto & Video" },
  { value: "events", label: "🎉 Event & Fest" },
  { value: "pets", label: "🐾 Djur & Husdjur" },
  { value: "cleaning", label: "🧹 Städning" },
  { value: "moving", label: "📦 Flytt & Transport" },
  { value: "other", label: "📋 Övrigt" }
];

// مدن السويد الرئيسية
const CITIES = [
  "Stockholm", "Göteborg", "Malmö", "Uppsala", "Västerås", 
  "Örebro", "Linköping", "Helsingborg", "Jönköping", "Norrköping",
  "Lund", "Umeå", "Gävle", "Borås", "Södertälje", "Eskilstuna",
  "Karlstad", "Täby", "Växjö", "Halmstad"
];

export default function CreateRide() {
  const nav = useNavigate();
  const { user, authLoading } = useAuth();

  const [flash, setFlash] = useState({ msg: "", type: "info" });
  const [fieldErrors, setFieldErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // بيانات الإعلان
  const [listing, setListing] = useState({
    // معلومات الشركة
    companyName: "",
    city: "",
    category: "",
    phone: user?.phoneNumber || "",
    email: user?.email || "",
    website: "",
    address: "",
    
    // معلومات الخدمة
    title: "",
    description: "",
    price: 300,
    durationMin: 30,
    currency: "SEK",
    imageUrl: "",
    
    // معلومات إضافية
    openingHours: "",
    specialOffer: "",
    tags: ""
  });

  // تحديث الهاتف والإيميل عند تسجيل الدخول
  useEffect(() => {
    if (!user) return;
    setListing((prev) => ({
      ...prev,
      phone: prev.phone || user.phoneNumber || "",
      email: prev.email || user.email || ""
    }));
  }, [user]);

  // توجيه للتسجيل إذا لم يكن مسجل
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      sessionStorage.setItem("redirectPath", "/create-ride");
      nav("/google-auth", { replace: true });
    }
  }, [authLoading, user, nav]);

  const onInput = (e) => {
    const { name, value, type } = e.target;
    let v = type === "number" ? (value === "" ? "" : Number(value)) : value;
    if (name === "email") v = sanitizeInput(v, "email");
    if (name === "description" || name === "specialOffer") v = sanitizeInput(v, "message");
    if (name === "companyName" || name === "title" || name === "city") v = sanitizeInput(v, "city");
    setListing((r) => ({ ...r, [name]: v }));
    setFieldErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    const errs = {};
    
    if (!listing.companyName || listing.companyName.trim().length < 2) {
      errs.companyName = "Ange företagsnamn (minst 2 tecken).";
    }
    if (!listing.city || listing.city.trim().length < 2) {
      errs.city = "Ange stad.";
    }
    if (!listing.category) {
      errs.category = "Välj en kategori.";
    }
    if (!listing.title || listing.title.trim().length < 3) {
      errs.title = "Ange tjänstens titel (minst 3 tecken).";
    }
    if (!listing.description || listing.description.trim().length < 10) {
      errs.description = "Ange en beskrivning (minst 10 tecken).";
    }
    if (listing.price < 0) {
      errs.price = "Priset kan inte vara negativt.";
    }
    if (listing.durationMin < 0) {
      errs.durationMin = "Tiden kan inte vara negativ.";
    }
    
    // التحقق من الهاتف
    const effectivePhone = user?.phoneNumber || listing.phone;
    if (!effectivePhone || String(effectivePhone).trim().replace(/\D/g, '').length < 6) {
      errs.phone = "Giltigt telefonnummer krävs (minst 6 siffror).";
    }
    
    // التحقق من البريد
    if (listing.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(listing.email)) {
      errs.email = "Ange en giltig e-postadress.";
    }
    
    // التحقق من الألفاظ النابية
    if (containsProfanity(listing.description)) {
      errs.description = "Ta bort olämpliga ord i beskrivningen.";
    }
    if (containsProfanity(listing.title)) {
      errs.title = "Ta bort olämpliga ord i titeln.";
    }
    
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    
    const ok = validate();
    if (!ok) {
      const errorFields = Object.keys(fieldErrors);
      setFlash({ 
        msg: `❌ Korrigera följande: ${errorFields.join(', ')}`, 
        type: "error" 
      });
      setTimeout(() => {
        const firstErrorField = document.querySelector(`[name="${errorFields[0]}"]`);
        if (firstErrorField) {
          firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
          firstErrorField.focus();
        }
      }, 100);
      return;
    }

    setIsSubmitting(true);
    try {
      // التحقق من عدد الإعلانات الحالية (حد أقصى 5)
      const q = query(collection(db, "listings"), where("createdBy", "==", user.uid));
      const existing = await getDocs(q);
      const active = existing.docs.filter(d => {
        const r = d.data() || {};
        return r.status !== "deleted" && r.status !== "cancelled";
      });
      if (active.length >= 5) {
        setFlash({ msg: "Du har nått gränsen (5) för aktiva annonser.", type: "error" });
        setIsSubmitting(false);
        return;
      }

      // إنشاء البيانات
      const payload = {
        // Owner
        createdBy: user.uid,
        createdAt: Date.now(),
        status: "active",

        // Company info
        companyName: listing.companyName.trim(),
        city: listing.city.trim(),
        category: listing.category,
        phone: sanitizeInput(user?.phoneNumber || listing.phone || '', 'phone'),
        email: sanitizeInput(listing.email || user?.email || '', 'email'),
        website: listing.website.trim(),
        address: listing.address.trim(),

        // Service info
        title: listing.title.trim(),
        description: listing.description.trim(),
        price: Number(listing.price) || 0,
        durationMin: Number(listing.durationMin) || 0,
        currency: listing.currency,
        imageUrl: listing.imageUrl.trim(),
        
        // Extra
        openingHours: listing.openingHours.trim(),
        specialOffer: listing.specialOffer.trim(),
        tags: listing.tags.trim(),
        
        // Owner display name
        ownerName: user.displayName || "Företag"
      };

      const docRef = await addDoc(collection(db, "listings"), payload);
      
      setFlash({ msg: "✅ Annons publicerad!", type: "success" });
      
      // الانتقال للصفحة الرئيسية
      setTimeout(() => {
        nav("/", { replace: true });
      }, 1500);
      
    } catch (error) {
      console.error("❌ Submission error:", error);
      setFlash({ 
        msg: `Fel: ${error.message || "Kunde inte publicera annonsen."}`, 
        type: "error" 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-gray-100">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Laddar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100">
      <PageMeta
        title="Skapa företagsannons | BokaNära"
        description="Skapa en annons för ditt företag och nå nya kunder."
        canonical="https://bokanara.se/create-ride"
      />
      <Helmet>
        <title>Skapa företagsannons | BokaNära</title>
      </Helmet>

      <Snackbar
        msg={flash.msg}
        type={flash.type}
        clear={() => setFlash({ msg: "", type: "info" })}
      />

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/"
            className="flex items-center gap-2 text-gray-600 hover:text-blue-600 mb-6 transition-colors font-medium"
          >
            <FaArrowLeft className="w-4 h-4" />
            <span>Tillbaka till startsidan</span>
          </Link>
          
          <div className="text-center bg-white rounded-2xl p-8 shadow-lg">
            <div className="inline-block bg-gradient-to-br from-blue-600 to-indigo-700 p-4 rounded-2xl mb-4">
              <FaBuilding className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
              Skapa företagsannons
            </h1>
            <p className="text-gray-600 text-lg">
              Publicera din tjänst och nå nya kunder i din stad
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          <form onSubmit={onSubmit} className="p-8">
            
            {/* معلومات الشركة */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                  <FaBuilding className="w-5 h-5 text-white" />
                </div>
                Företagsinformation
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Företagsnamn *
                  </label>
                  <input
                    type="text"
                    name="companyName"
                    value={listing.companyName}
                    onChange={onInput}
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:border-blue-500 transition-colors ${fieldErrors.companyName ? 'border-red-400' : 'border-gray-200'}`}
                    placeholder="t.ex. Salon Nora"
                    required
                  />
                  {fieldErrors.companyName && <p className="mt-1 text-xs text-red-600">{fieldErrors.companyName}</p>}
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Stad *
                  </label>
                  <div className="relative">
                    <FaMapMarkerAlt className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <select
                      name="city"
                      value={listing.city}
                      onChange={onInput}
                      className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl focus:border-blue-500 transition-colors bg-white ${fieldErrors.city ? 'border-red-400' : 'border-gray-200'}`}
                      required
                    >
                      <option value="">Välj stad...</option>
                      {CITIES.map(city => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                      <option value="other">Annan stad...</option>
                    </select>
                  </div>
                  {listing.city === "other" && (
                    <input
                      type="text"
                      name="city"
                      value=""
                      onChange={onInput}
                      className="mt-2 w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500"
                      placeholder="Skriv din stad..."
                    />
                  )}
                  {fieldErrors.city && <p className="mt-1 text-xs text-red-600">{fieldErrors.city}</p>}
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Kategori *
                  </label>
                  <div className="relative">
                    <FaTag className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <select
                      name="category"
                      value={listing.category}
                      onChange={onInput}
                      className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl focus:border-blue-500 transition-colors bg-white ${fieldErrors.category ? 'border-red-400' : 'border-gray-200'}`}
                      required
                    >
                      {CATEGORIES.map(cat => (
                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                      ))}
                    </select>
                  </div>
                  {fieldErrors.category && <p className="mt-1 text-xs text-red-600">{fieldErrors.category}</p>}
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Telefon *
                  </label>
                  <div className="relative">
                    <FaPhone className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="tel"
                      name="phone"
                      value={listing.phone}
                      onChange={onInput}
                      className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl focus:border-blue-500 transition-colors ${fieldErrors.phone ? 'border-red-400' : 'border-gray-200'}`}
                      placeholder="+46 70 123 45 67"
                      required
                    />
                  </div>
                  {fieldErrors.phone && <p className="mt-1 text-xs text-red-600">{fieldErrors.phone}</p>}
                </div>
              </div>
            </div>

            {/* معلومات الخدمة */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                  <FaInfoCircle className="w-5 h-5 text-white" />
                </div>
                Tjänsteinformation
              </h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Tjänstens titel *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={listing.title}
                    onChange={onInput}
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:border-blue-500 transition-colors ${fieldErrors.title ? 'border-red-400' : 'border-gray-200'}`}
                    placeholder="t.ex. Klippning + Styling"
                    required
                  />
                  {fieldErrors.title && <p className="mt-1 text-xs text-red-600">{fieldErrors.title}</p>}
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Beskrivning *
                  </label>
                  <textarea
                    name="description"
                    rows={4}
                    value={listing.description}
                    onChange={onInput}
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:border-blue-500 transition-colors resize-none ${fieldErrors.description ? 'border-red-400' : 'border-gray-200'}`}
                    placeholder="Beskriv din tjänst i detalj. Vad ingår? Varför ska kunden välja dig?"
                    required
                  />
                  {fieldErrors.description && <p className="mt-1 text-xs text-red-600">{fieldErrors.description}</p>}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Pris *
                    </label>
                    <div className="relative">
                      <FaMoneyBillWave className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="number"
                        name="price"
                        value={listing.price}
                        onChange={onInput}
                        className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl focus:border-blue-500 transition-colors ${fieldErrors.price ? 'border-red-400' : 'border-gray-200'}`}
                        min={0}
                        required
                      />
                    </div>
                    {fieldErrors.price && <p className="mt-1 text-xs text-red-600">{fieldErrors.price}</p>}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Tid (minuter)
                    </label>
                    <div className="relative">
                      <FaClock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="number"
                        name="durationMin"
                        value={listing.durationMin}
                        onChange={onInput}
                        className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 transition-colors"
                        min={0}
                        placeholder="30"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Valuta
                    </label>
                    <select
                      name="currency"
                      value={listing.currency}
                      onChange={onInput}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 transition-colors bg-white"
                    >
                      <option value="SEK">SEK (kr)</option>
                      <option value="EUR">EUR (€)</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Bild-URL (valfritt)
                  </label>
                  <div className="relative">
                    <FaImage className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="url"
                      name="imageUrl"
                      value={listing.imageUrl}
                      onChange={onInput}
                      className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 transition-colors"
                      placeholder="https://example.com/bild.jpg"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Lägg till en bild som representerar din tjänst</p>
                </div>
              </div>
            </div>

            {/* حقول إضافية */}
            <div className="mb-8">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="w-full text-left flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-200 transition-colors mb-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                    <FaCalendarAlt className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Ytterligare information (valfritt)</h3>
                    <p className="text-sm text-gray-600">Öppettider, adress, erbjudanden...</p>
                  </div>
                </div>
                <svg 
                  className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${showAdvanced ? 'rotate-180' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {showAdvanced && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">E-post</label>
                    <input
                      type="email"
                      name="email"
                      value={listing.email}
                      onChange={onInput}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 transition-colors"
                      placeholder="info@foretag.se"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Webbplats</label>
                    <input
                      type="url"
                      name="website"
                      value={listing.website}
                      onChange={onInput}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 transition-colors"
                      placeholder="https://www.foretag.se"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Adress</label>
                    <input
                      type="text"
                      name="address"
                      value={listing.address}
                      onChange={onInput}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 transition-colors"
                      placeholder="Storgatan 1, 111 22 Stockholm"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Öppettider</label>
                    <input
                      type="text"
                      name="openingHours"
                      value={listing.openingHours}
                      onChange={onInput}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 transition-colors"
                      placeholder="Mån-Fre 9-18, Lör 10-15"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Specialerbjudande</label>
                    <input
                      type="text"
                      name="specialOffer"
                      value={listing.specialOffer}
                      onChange={onInput}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 transition-colors"
                      placeholder="t.ex. 20% rabatt för nya kunder!"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Taggar (kommaseparerade)</label>
                    <input
                      type="text"
                      name="tags"
                      value={listing.tags}
                      onChange={onInput}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 transition-colors"
                      placeholder="t.ex. frisör, klippning, styling, hår"
                    />
                    <p className="text-xs text-gray-500 mt-1">Hjälper kunder att hitta din tjänst</p>
                  </div>
                </div>
              )}
            </div>

            {/* الشروط والأحكام */}
            <div className="mb-8 p-6 bg-blue-50 border-2 border-blue-200 rounded-2xl">
              <h3 className="text-lg font-bold text-blue-900 mb-3">📋 Villkor för publicering</h3>
              <ul className="text-sm text-blue-800 space-y-2 list-disc pl-5">
                <li>Annonsen måste vara korrekt och sanningsenlig</li>
                <li>Du ansvarar för att tjänsten levereras enligt beskrivningen</li>
                <li>Olämpligt innehåll kommer att tas bort</li>
                <li>Kontaktinformation visas för kunder som vill boka</li>
              </ul>
            </div>

            {/* أزرار الإرسال */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6">
              <Link
                to="/"
                className="flex-1 px-8 py-4 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 flex items-center justify-center gap-2"
              >
                <FaArrowLeft className="w-4 h-4" />
                Avbryt
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-indigo-800 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Publicerar...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <FaCheck className="w-5 h-5" />
                    <span>Publicera annons</span>
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

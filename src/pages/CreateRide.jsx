// ───────────── src/pages/CreateRide.jsx ─────────────
// تم تحويله لإنشاء إعلانات الشركات مع الحفاظ على نفس التدفق
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
  FaMoneyBillWave
} from "react-icons/fa";

/* Snackbar */
function Snackbar({ msg, type = "info", clear }) {
  if (!msg) return null;
  const palette = {
    success: "bg-gradient-to-r from-green-500 to-emerald-600",
    error: "bg-gradient-to-r from-red-500 to-rose-600",
    info: "bg-gradient-to-r from-blue-500 to-indigo-600"
  };
  return (
    <div
      className={`${palette[type]} fixed bottom-8 left-1/2 -translate-x-1/2 z-50 px-8 py-4 text-white rounded-2xl shadow-2xl`}
      onClick={clear}
    >
      <div className="flex items-center gap-3">
        <FaCheck className="w-5 h-5" />
        <span className="font-medium">{msg}</span>
      </div>
    </div>
  );
}

// الفئات المتاحة
const CATEGORIES = [
  { value: "beauty", label: "💇 Skönhet & Frisör" },
  { value: "health", label: "🏥 Hälsa & Sjukvård" },
  { value: "home", label: "🏠 Hemservice" },
  { value: "auto", label: "🚗 Bil & Motor" },
  { value: "restaurant", label: "🍽️ Restaurang & Café" },
  { value: "fitness", label: "💪 Gym & Fitness" },
  { value: "education", label: "📚 Utbildning" },
  { value: "cleaning", label: "🧹 Städning" },
  { value: "other", label: "📋 Övrigt" }
];

// المدن السويدية
const CITIES = [
  "Stockholm", "Göteborg", "Malmö", "Uppsala", "Västerås", 
  "Örebro", "Linköping", "Helsingborg", "Jönköping", "Norrköping",
  "Lund", "Umeå", "Gävle", "Borås", "Eskilstuna"
];

export default function CreateRide() {
  const nav = useNavigate();
  const { user, authLoading } = useAuth();

  const [flash, setFlash] = useState({ msg: "", type: "info" });
  const [fieldErrors, setFieldErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // بيانات الإعلان
  const [ad, setAd] = useState({
    companyName: "",
    city: "",
    category: "other",
    title: "",
    description: "",
    price: "",
    durationMin: 30,
    phone: user?.phoneNumber || "",
    imageUrl: ""
  });

  // تحديث الهاتف عند تسجيل الدخول
  useEffect(() => {
    if (user?.phoneNumber && !ad.phone) {
      setAd(prev => ({ ...prev, phone: user.phoneNumber }));
    }
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
    setAd(prev => ({ ...prev, [name]: v }));
    setFieldErrors(prev => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    const errs = {};
    if (!ad.companyName.trim() || ad.companyName.length < 2) {
      errs.companyName = "Ange företagsnamn.";
    }
    if (!ad.city.trim()) {
      errs.city = "Välj stad.";
    }
    if (!ad.title.trim() || ad.title.length < 3) {
      errs.title = "Ange titel för tjänsten.";
    }
    if (!ad.description.trim() || ad.description.length < 10) {
      errs.description = "Ange beskrivning (minst 10 tecken).";
    }
    if (containsProfanity(ad.description) || containsProfanity(ad.title)) {
      errs.description = "Ta bort olämpliga ord.";
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    
    if (!validate()) {
      setFlash({ msg: "Korrigera felen ovan.", type: "error" });
      return;
    }

    setIsSubmitting(true);
    try {
      // التحقق من عدد الإعلانات (حد أقصى 5)
      const q = query(collection(db, "rides"), where("userId", "==", user.uid));
      const existing = await getDocs(q);
      if (existing.size >= 5) {
        setFlash({ msg: "Du har nått gränsen för annonser.", type: "error" });
        setIsSubmitting(false);
        return;
      }

      // إنشاء البيانات - نستخدم بنية متوافقة مع rides + حقول الإعلان
      const payload = {
        // حقول rides الأساسية (للتوافق مع RideCard و RideDetails)
        userId: user.uid,
        createdAt: new Date().toISOString(),
        
        // نوع الإعلان - مهم للتمييز
        adType: "company",
        
        // حقول متوافقة مع rides (تُستخدم للعرض)
        origin: ad.city,  // المدينة
        destination: ad.category, // الفئة
        role: "företag", // دور الشركة
        
        // حقول الإعلان
        companyName: sanitizeInput(ad.companyName.trim(), 'city'),
        city: ad.city,
        category: ad.category,
        title: sanitizeInput(ad.title.trim(), 'message'),
        description: sanitizeInput(ad.description.trim(), 'message'),
        price: Number(ad.price) || 0,
        durationMin: Number(ad.durationMin) || 30,
        phone: sanitizeInput(ad.phone || user?.phoneNumber || '', 'phone'),
        driverPhone: sanitizeInput(ad.phone || user?.phoneNumber || '', 'phone'),
        email: user?.email || '',
        driverEmail: user?.email || '',
        imageUrl: ad.imageUrl.trim(),
        
        // حقول إضافية للعرض
        driverName: ad.companyName.trim(),
        notes: ad.description.trim(),
        costMode: "fixed_price",
        status: "active"
      };

      const docRef = await addDoc(collection(db, "rides"), payload);
      
      setFlash({ msg: "✅ Annons publicerad!", type: "success" });
      
      // الانتقال لصفحة التفاصيل (مثل الموقع القديم)
      setTimeout(() => {
        nav(`/ride/${docRef.id}`, { replace: true });
      }, 1000);
      
    } catch (error) {
      console.error("Error:", error);
      setFlash({ msg: `Fel: ${error.message}`, type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <PageMeta title="Skapa annons" description="Skapa en annons för ditt företag." />
      <Helmet><title>Skapa annons</title></Helmet>

      <Snackbar msg={flash.msg} type={flash.type} clear={() => setFlash({ msg: "", type: "info" })} />

      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <Link to="/" className="flex items-center gap-2 text-gray-600 hover:text-blue-600 mb-4">
            <FaArrowLeft className="w-4 h-4" />
            <span>Tillbaka</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Skapa företagsannons</h1>
          <p className="text-gray-600">Publicera din tjänst och nå nya kunder</p>
        </div>

        {/* Form */}
        <form onSubmit={onSubmit} className="bg-white rounded-xl shadow-sm border p-6 space-y-6">
          
          {/* اسم الشركة */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <FaBuilding className="inline w-4 h-4 mr-1" />
              Företagsnamn *
            </label>
            <input
              type="text"
              name="companyName"
              value={ad.companyName}
              onChange={onInput}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${fieldErrors.companyName ? 'border-red-400' : 'border-gray-200'}`}
              placeholder="t.ex. Salon Nora"
            />
            {fieldErrors.companyName && <p className="text-red-500 text-xs mt-1">{fieldErrors.companyName}</p>}
          </div>

          {/* المدينة والفئة */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <FaMapMarkerAlt className="inline w-4 h-4 mr-1" />
                Stad *
              </label>
              <select
                name="city"
                value={ad.city}
                onChange={onInput}
                className={`w-full px-4 py-2 border rounded-lg ${fieldErrors.city ? 'border-red-400' : 'border-gray-200'}`}
              >
                <option value="">Välj stad...</option>
                {CITIES.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
              {fieldErrors.city && <p className="text-red-500 text-xs mt-1">{fieldErrors.city}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <FaTag className="inline w-4 h-4 mr-1" />
                Kategori
              </label>
              <select
                name="category"
                value={ad.category}
                onChange={onInput}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* عنوان الخدمة */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tjänstens titel *
            </label>
            <input
              type="text"
              name="title"
              value={ad.title}
              onChange={onInput}
              className={`w-full px-4 py-2 border rounded-lg ${fieldErrors.title ? 'border-red-400' : 'border-gray-200'}`}
              placeholder="t.ex. Klippning + Styling"
            />
            {fieldErrors.title && <p className="text-red-500 text-xs mt-1">{fieldErrors.title}</p>}
          </div>

          {/* الوصف */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <FaInfoCircle className="inline w-4 h-4 mr-1" />
              Beskrivning *
            </label>
            <textarea
              name="description"
              value={ad.description}
              onChange={onInput}
              rows={4}
              className={`w-full px-4 py-2 border rounded-lg ${fieldErrors.description ? 'border-red-400' : 'border-gray-200'}`}
              placeholder="Beskriv din tjänst..."
            />
            {fieldErrors.description && <p className="text-red-500 text-xs mt-1">{fieldErrors.description}</p>}
          </div>

          {/* السعر والمدة */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <FaMoneyBillWave className="inline w-4 h-4 mr-1" />
                Pris (SEK)
              </label>
              <input
                type="number"
                name="price"
                value={ad.price}
                onChange={onInput}
                min={0}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                placeholder="300"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <FaClock className="inline w-4 h-4 mr-1" />
                Tid (min)
              </label>
              <input
                type="number"
                name="durationMin"
                value={ad.durationMin}
                onChange={onInput}
                min={0}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                placeholder="30"
              />
            </div>
          </div>

          {/* الهاتف */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <FaPhone className="inline w-4 h-4 mr-1" />
              Telefon
            </label>
            <input
              type="tel"
              name="phone"
              value={ad.phone}
              onChange={onInput}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg"
              placeholder="+46..."
            />
          </div>

          {/* رابط الصورة */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <FaImage className="inline w-4 h-4 mr-1" />
              Bild-URL (valfritt)
            </label>
            <input
              type="url"
              name="imageUrl"
              value={ad.imageUrl}
              onChange={onInput}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg"
              placeholder="https://..."
            />
          </div>

          {/* زر الإرسال */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? "Publicerar..." : "Publicera annons"}
          </button>
        </form>
      </div>
    </div>
  );
}

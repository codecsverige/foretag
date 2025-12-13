import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import PageMeta from "../components/PageMeta.jsx";
import SEOSection from "../components/SEOSection.jsx";
import HeroSection from "../components/HeroSection.jsx";
import TrustSection from "../components/TrustSection.jsx";
import QuickTips from "../components/QuickTips.jsx";
import { collection, getDocs, limit, orderBy, query, where } from "firebase/firestore";
import { db } from "../firebase/firebase.js";
import { 
  FaMapMarkerAlt, 
  FaClock, 
  FaPhone, 
  FaCalendarAlt,
  FaTag,
  FaStar,
  FaGlobe,
  FaPercent
} from "react-icons/fa";

// خريطة الفئات للعرض
const CATEGORY_MAP = {
  beauty: { label: "Skönhet & Frisör", emoji: "💇" },
  health: { label: "Hälsa & Sjukvård", emoji: "🏥" },
  home: { label: "Hemservice", emoji: "🏠" },
  auto: { label: "Bil & Motor", emoji: "🚗" },
  restaurant: { label: "Restaurang & Café", emoji: "🍽️" },
  fitness: { label: "Gym & Fitness", emoji: "💪" },
  education: { label: "Utbildning", emoji: "📚" },
  tech: { label: "IT & Teknik", emoji: "💻" },
  legal: { label: "Juridik", emoji: "⚖️" },
  finance: { label: "Ekonomi & Finans", emoji: "💰" },
  photo: { label: "Foto & Video", emoji: "📷" },
  events: { label: "Event & Fest", emoji: "🎉" },
  pets: { label: "Djur & Husdjur", emoji: "🐾" },
  cleaning: { label: "Städning", emoji: "🧹" },
  moving: { label: "Flytt & Transport", emoji: "📦" },
  other: { label: "Övrigt", emoji: "📋" }
};

function ListingCard({ item }) {
  const price = Number(item.price || 0);
  const durationMin = Number(item.durationMin || 0);
  const city = item.city || "";
  const title = item.title || "Annons";
  const companyName = item.companyName || "Företag";
  const category = item.category || "";
  const imageUrl = item.imageUrl || "";
  const description = item.description || "";
  const phone = item.phone || "";
  const specialOffer = item.specialOffer || "";
  const openingHours = item.openingHours || "";
  const website = item.website || "";
  
  // الحصول على معلومات الفئة
  const categoryInfo = CATEGORY_MAP[category] || { label: category || "Annons", emoji: "📋" };

  const handleBookClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    // في المستقبل سيتم توجيه المستخدم لصفحة الحجز
    // حالياً نفتح نافذة الاتصال
    if (phone) {
      window.location.href = `tel:${phone}`;
    } else {
      alert("Kontakta företaget för att boka tid.");
    }
  };

  return (
    <div className="group overflow-hidden rounded-2xl border border-gray-200 bg-white hover:shadow-xl transition-all duration-300 flex flex-col">
      {/* صورة الإعلان */}
      <div className="h-48 bg-gradient-to-br from-blue-50 to-emerald-50 relative overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-indigo-100">
            <div className="text-center p-4">
              <div className="text-4xl mb-2">{categoryInfo.emoji}</div>
              <div className="text-lg font-bold text-gray-700">{companyName}</div>
              <div className="text-sm text-gray-500 mt-1">{city || "Sverige"}</div>
            </div>
          </div>
        )}
        
        {/* شارة المدينة */}
        <div className="absolute top-3 left-3">
          <span className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-full bg-white/95 shadow-sm border border-gray-100 text-gray-800 font-medium">
            <FaMapMarkerAlt className="w-3 h-3 text-red-500" />
            {city || "Sverige"}
          </span>
        </div>
        
        {/* شارة العرض الخاص */}
        {specialOffer && (
          <div className="absolute top-3 right-3">
            <span className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-full bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold shadow-lg animate-pulse">
              <FaPercent className="w-3 h-3" />
              Erbjudande!
            </span>
          </div>
        )}
        
        {/* شارة الفئة */}
        <div className="absolute bottom-3 left-3">
          <span className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-full bg-blue-600 text-white font-medium shadow-sm">
            <span>{categoryInfo.emoji}</span>
            {categoryInfo.label}
          </span>
        </div>
      </div>

      {/* محتوى الكارت */}
      <div className="p-5 flex flex-col flex-grow">
        {/* اسم الشركة */}
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm text-gray-600 font-medium">{companyName}</span>
          {/* يمكن إضافة نجوم التقييم هنا لاحقاً */}
        </div>
        
        {/* عنوان الخدمة */}
        <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-700 transition-colors mb-2 line-clamp-2">
          {title}
        </h3>
        
        {/* الوصف */}
        {description && (
          <p className="text-sm text-gray-600 line-clamp-2 mb-3 flex-grow">
            {description}
          </p>
        )}
        
        {/* العرض الخاص */}
        {specialOffer && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-2 mb-3">
            <p className="text-xs text-orange-800 font-medium">
              🎁 {specialOffer}
            </p>
          </div>
        )}
        
        {/* معلومات السعر والوقت */}
        <div className="flex items-center gap-3 flex-wrap mb-4">
          <span className="inline-flex items-center gap-1 text-lg font-bold text-gray-900 bg-yellow-100 px-3 py-1 rounded-full">
            {price} {item.currency || "SEK"}
          </span>
          {durationMin > 0 && (
            <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700 border border-gray-200">
              <FaClock className="w-3 h-3 text-gray-500" />
              {durationMin} min
            </span>
          )}
        </div>
        
        {/* معلومات إضافية */}
        <div className="flex flex-wrap gap-2 mb-4 text-xs text-gray-500">
          {openingHours && (
            <span className="inline-flex items-center gap-1">
              <FaCalendarAlt className="w-3 h-3" />
              {openingHours}
            </span>
          )}
          {website && (
            <a 
              href={website} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700"
              onClick={(e) => e.stopPropagation()}
            >
              <FaGlobe className="w-3 h-3" />
              Webbplats
            </a>
          )}
        </div>
        
        {/* أزرار الإجراءات */}
        <div className="flex gap-2 mt-auto">
          <button
            onClick={handleBookClick}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-800 transition-all shadow-md hover:shadow-lg"
          >
            <FaCalendarAlt className="w-4 h-4" />
            Boka nu
          </button>
          {phone && (
            <a
              href={`tel:${phone}`}
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center justify-center px-4 py-3 border-2 border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all"
              title="Ring företaget"
            >
              <FaPhone className="w-4 h-4" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

// فلتر الفئات
function CategoryFilter({ selected, onChange }) {
  const categories = [
    { value: "", label: "Alla kategorier", emoji: "🔍" },
    ...Object.entries(CATEGORY_MAP).map(([value, { label, emoji }]) => ({
      value,
      label,
      emoji
    }))
  ];
  
  return (
    <div className="flex flex-wrap gap-2">
      {categories.slice(0, 8).map(cat => (
        <button
          key={cat.value}
          onClick={() => onChange(cat.value)}
          className={`inline-flex items-center gap-1 px-3 py-2 rounded-full text-sm font-medium transition-all ${
            selected === cat.value
              ? "bg-blue-600 text-white shadow-md"
              : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300"
          }`}
        >
          <span>{cat.emoji}</span>
          <span className="hidden sm:inline">{cat.label}</span>
        </button>
      ))}
    </div>
  );
}

export default function SearchDynamic() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [city, setCity] = useState("");
  const [text, setText] = useState("");
  const [category, setCategory] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setErr("");
      try {
        const base = collection(db, "listings");
        let constraints = [orderBy("createdAt", "desc"), limit(60)];
        
        // فلتر المدينة
        if (city.trim()) {
          constraints = [where("city", "==", city.trim()), ...constraints];
        }
        
        // فلتر الفئة
        if (category) {
          constraints = [where("category", "==", category), ...constraints];
        }
        
        const q = query(base, ...constraints);
        const snap = await getDocs(q);
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        if (alive) setItems(list);
      } catch (e) {
        if (alive) setErr(e?.message || "Kunde inte ladda annonser");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [city, category]);

  const filtered = useMemo(() => {
    const q = text.trim().toLowerCase();
    if (!q) return items;
    return items.filter((x) => {
      const hay = `${x.title || ""} ${x.companyName || ""} ${x.category || ""} ${x.description || ""} ${x.tags || ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [items, text]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <PageMeta title="BokaNära - Hitta och boka tjänster" description="Upptäck lokala företag och boka tjänster enkelt." />

        <HeroSection />

        {/* القسم الرئيسي */}
        <div className="mt-8">
          <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                🏢 Företagsannonser
              </h2>
              <p className="text-gray-600 mt-1">
                Hitta och boka tjänster från lokala företag
              </p>
            </div>
            <Link
              to="/create-ride"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-semibold hover:from-blue-700 hover:to-indigo-800 transition-all shadow-lg hover:shadow-xl"
            >
              <span className="text-lg">+</span>
              Skapa annons
            </Link>
          </div>

          {/* فلاتر البحث */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-gray-100">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FaMapMarkerAlt className="inline w-4 h-4 mr-1 text-red-500" />
                  Stad
                </label>
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                >
                  <option value="">Alla städer</option>
                  {["Stockholm", "Göteborg", "Malmö", "Uppsala", "Västerås", "Örebro", "Linköping", "Helsingborg", "Jönköping", "Norrköping"].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  🔍 Sök tjänst eller företag
                </label>
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="t.ex. frisör, massage, städning..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                />
              </div>
            </div>
            
            {/* فلتر الفئات */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FaTag className="inline w-4 h-4 mr-1 text-blue-500" />
                Kategori
              </label>
              <CategoryFilter selected={category} onChange={setCategory} />
            </div>
          </div>

          {/* حالة التحميل */}
          {loading && (
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">Laddar annonser...</p>
              </div>
            </div>
          )}

          {/* رسالة الخطأ */}
          {err && (
            <div className="p-6 rounded-2xl border-2 border-red-200 bg-red-50 text-red-700 mb-8">
              <p className="font-medium">❌ {err}</p>
            </div>
          )}

          {/* لا توجد نتائج */}
          {!loading && !err && filtered.length === 0 && (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Inga annonser hittades</h3>
              <p className="text-gray-600 mb-6">
                {text || city || category
                  ? "Prova att ändra dina sökfilter"
                  : "Var först med att skapa en annons!"}
              </p>
              <Link
                to="/create-ride"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-all"
              >
                Skapa annons
              </Link>
            </div>
          )}

          {/* شبكة الإعلانات */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((item) => (
              <ListingCard key={item.id} item={item} />
            ))}
          </div>

          {/* عدد النتائج */}
          {!loading && filtered.length > 0 && (
            <div className="text-center mt-8 text-gray-500">
              Visar {filtered.length} {filtered.length === 1 ? "annons" : "annonser"}
              {(city || category || text) && " (filtrerat)"}
            </div>
          )}
        </div>

        {/* أقسام إضافية */}
        <div className="mt-16">
          <SEOSection />
          <TrustSection />
          <QuickTips />
        </div>
      </div>
    </div>
  );
}

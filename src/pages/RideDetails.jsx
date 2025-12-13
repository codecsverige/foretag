import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase/firebase.js";
import { 
  HiArrowLeft, 
  HiShare,
  HiCalendar, 
  HiClock, 
  HiCurrencyDollar, 
  HiUser,
  HiShieldCheck 
} from "react-icons/hi";
import {
  FaSuitcase,
  FaSmoking,
  FaMusic,
  FaRegEdit,
  FaMoneyBillWave,
  FaMapMarkerAlt
} from "react-icons/fa";
import PageMeta from "../components/PageMeta";
import { Helmet } from "react-helmet-async";
import { useAuth } from "../context/AuthContext";
import { extractCity } from "../utils/address";
import { buildSamakningSummary, getWeekdayOptions } from "../utils/rideSummary";

export default function RideDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [ride, setRide] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Helpers to support SEO fallback for slug routes like "/ride/stockholm-goteborg"
  const normalize = (s = "") => String(s).toLowerCase().trim();
  const titleCase = (s = "") => s.length === 0 ? s : s.charAt(0).toUpperCase() + s.slice(1);
  const slugToPrettyCity = (slugCity = "") => {
    const m = normalize(slugCity)
      .replace(/\-/g, " ")
      .replace(/aa/g, "å")
      .replace(/ae/g, "ä")
      .replace(/oe/g, "ö")
      .replace(/a\u030a/g, "å")
      .replace(/a\u0308/g, "ä")
      .replace(/o\u0308/g, "ö");
    // Common Swedish transliterations
    const map = {
      goteborg: "Göteborg",
      gothenburg: "Göteborg",
      malmo: "Malmö",
      vasteras: "Västerås",
      orebro: "Örebro",
      ostersund: "Östersund",
      angelholm: "Ängelholm",
      jonkoping: "Jönköping",
      umea: "Umeå",
      lulea: "Luleå",
      gavle: "Gävle",
      vaxjo: "Växjö",
      norrkoping: "Norrköping",
      halsingborg: "Hälsingborg",
      helsingborg: "Helsingborg",
      skovde: "Skövde",
    };
    if (map[m]) return map[m];
    // Fallback: capitalize words
    return m.split(" ").map(titleCase).join(" ");
  };
  const parseSlugRoute = (slug = "") => {
    if (!slug) return null;
    const clean = slug.replace(/^demo-/, "");
    const parts = clean.split("-").filter(Boolean);
    if (parts.length < 2) return null;
    // Use the last two segments as cities to be forgiving: a-b, demo-a-b
    const toRaw = parts[parts.length - 1];
    const fromRaw = parts[parts.length - 2];
    return {
      fromCity: slugToPrettyCity(fromRaw),
      toCity: slugToPrettyCity(toRaw)
    };
  };
  const slugRoute = useMemo(() => parseSlugRoute(id || ""), [id]);

  useEffect(() => {
    const fetchRide = async () => {
      try {
        if (!id) {
          console.error("No ride ID provided");
          setLoading(false);
          return;
        }

        // Add timeout to prevent infinite loading
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Firestore timeout')), 8000)
        );
        
        const rideDoc = await Promise.race([
          getDoc(doc(db, "rides", id)), 
          timeoutPromise
        ]);
        if (rideDoc.exists()) {
          setRide({ id: rideDoc.id, ...rideDoc.data() });
        } else {
          console.log("Ride not found:", id);
          // Don't navigate away, just set loading to false to show 404 UI
          setRide(null);
        }
      } catch (error) {
        console.error("Error fetching ride:", error);
        // Don't show alert, just log error and show 404 UI
        setRide(null);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchRide();
    } else {
      setLoading(false);
    }
  }, [id]);

  // Format date and time
  const [dateStr, timeStr] = useMemo(() => {
    if (!ride || !ride.date) return ["", ""];
    try {
      const dt = new Date(`${ride.date}T${ride.departureTime}`);
      return [
        dt.toLocaleDateString("sv-SE", {
          weekday: "short",
          day: "numeric",
          month: "short"
        }),
        dt.toLocaleTimeString("sv-SE", {
          hour: "2-digit",
          minute: "2-digit"
        })
      ];
    } catch {
      return [ride.date, ride.departureTime];
    }
  }, [ride]);

  const weekdayShortMap = useMemo(() => {
    const entries = getWeekdayOptions().map(o => [o.key, o.short]);
    return new Map(entries);
  }, []);
  const recurrenceDaysLabel = useMemo(() => {
    if (!ride || ride.recurrence !== "dagligen") return "";
    const keys = Array.isArray(ride?.weekdays) ? ride.weekdays : [];
    const labels = keys.map(k => weekdayShortMap.get(k)).filter(Boolean);
    if (labels.length === 0) return "";
    if (labels.length === 1) return labels[0];
    if (labels.length === 2) return `${labels[0]} och ${labels[1]}`;
    return `${labels.slice(0, -1).join(", ")} och ${labels[labels.length - 1]}`;
  }, [ride, weekdayShortMap]);

  const isExpired = useMemo(() => {
    try {
      if (!ride || !ride.date) return false;
      const dep = new Date(`${ride.date}T${ride.departureTime || '00:00'}`);
      return Date.now() > dep.getTime();
    } catch {
      return false;
    }
  }, [ride]);

  const handleShare = async () => {
    try {
      // Kontrollera att ID och nödvändig data finns
      if (!id || !ride) {
        console.error("No ride ID or data available for sharing");
        alert("Kunde inte dela resan. Reseuppgifter saknas.");
        return;
      }

      // Bygg URL säkert
      const baseUrl = window.location.origin || 'https://vagvanner.se';
      const shareUrl = `${baseUrl}/ride/${id}`;
      
      const fromCity = ride ? (extractCity(ride.origin) || "Start") : "";
      const toCity = ride ? (extractCity(ride.destination) || "Destination") : "";
      const shareTitle = ride?.role === "förare" 
        ? `Samåkning: ${fromCity} → ${toCity}`
        : `Söker samåkning: ${fromCity} → ${toCity}`;
      
      console.log("Sharing URL:", shareUrl); // För felsökning
      
      // Försök använda Web Share API först
      if (navigator.share && typeof navigator.share === 'function') {
        await navigator.share({ title: `VägVänner – ${shareTitle}`, url: shareUrl });
        console.log("Share successful via Web Share API");
      } else {
        // Fallback: kopiera endast länken (bättre دعم للتعرّف على الرابط في تطبيقات الهاتف)
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(shareUrl);
          alert("Länk kopierad! Klistra in var du vill.");
        } else {
          alert(`Kopiera denna länk manuellt:\n${shareUrl}`);
        }
      }
    } catch (error) {
      console.error("Share failed:", error);
      const baseUrl = window.location.origin || 'https://vagvanner.se';
      const shareUrl = `${baseUrl}/ride/${id}`;
      alert(`Kunde inte dela automatiskt. Kopiera denna länk manuellt:\n${shareUrl}`);
    }
  };

  // Handle booking/unlock navigation
  const handleAction = () => {
    if (!ride) return;

    const target = (ride.role === "förare" || ride.type === "offer")
      ? `/book-ride/${ride.id}`
      : `/book-ride-passanger/${ride.id}`;

    // If not logged in, send to Google auth and come back to target after login
    if (!user) {
      try { sessionStorage.setItem('redirectPath', target); } catch (_) {}
      navigate('/google-auth');
      return;
    }

    navigate(target);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!ride) {
    // If URL is a route slug like "/ride/stockholm-goteborg", render an SEO landing with clear CTAs
    if (slugRoute?.fromCity && slugRoute?.toCity) {
      const { fromCity, toCity } = slugRoute;
      const canonical = `https://vagvanner.se/ride/${id}`;
      const title = `${fromCity} → ${toCity} samåkning – Hitta eller erbjud skjuts | VägVänner`;
      const desc = `Direktlösning för ${fromCity} till ${toCity}: sök samåkning nu eller erbjud plats i din bil. Perfekt när tåg/buss är dyra eller fulla – dela kostnaden och res smidigt.`;

      return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
          <PageMeta title={title} description={desc} canonical={canonical} />
          <Helmet>
            <meta property="og:image" content="https://vagvanner.se/og/vagvanner-og.jpg" />
            <script type="application/ld+json">
              {JSON.stringify({
                "@context": "https://schema.org",
                "@type": "Trip",
                name: `${fromCity} till ${toCity} Samåkning`,
                description: desc,
                itinerary: [
                  { "@type": "City", name: fromCity },
                  { "@type": "City", name: toCity }
                ],
                provider: { "@type": "Organization", name: "VägVänner" },
                url: canonical
              })}
            </script>
            <script type="application/ld+json">
              {JSON.stringify({
                "@context": "https://schema.org",
                "@type": "BreadcrumbList",
                itemListElement: [
                  { "@type": "ListItem", position: 1, name: "Hem", item: "https://vagvanner.se/" },
                  { "@type": "ListItem", position: 2, name: "Rutter", item: "https://vagvanner.se/select-location" },
                  { "@type": "ListItem", position: 3, name: `${fromCity} → ${toCity}`, item: canonical }
                ]
              })}
            </script>
          </Helmet>

          <div className="max-w-4xl mx-auto px-4 py-10">
            <div className="text-center mb-8">
              <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white">
                {fromCity} → {toCity} samåkning
              </h1>
              <p className="mt-3 text-gray-700 dark:text-gray-300 max-w-2xl mx-auto">
                Hitta resa nu eller erbjud skjuts. VägVänner kopplar förare och passagerare för att dela kostnader
                – perfekt vid brist på tåg/buss, sena tider eller brådskande resor.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
              <a
                href={`/?from=${encodeURIComponent(fromCity)}&to=${encodeURIComponent(toCity)}`}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-center"
              >
                Sök resor
              </a>
              <a
                href={`/create-ride?from=${encodeURIComponent(fromCity)}&to=${encodeURIComponent(toCity)}`}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gray-900 hover:bg-black text-white font-bold text-center"
              >
                Erbjud plats i min bil
              </a>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              {[{
                t: "Billigare och smidigare",
                p: "Dela kostnaden i stället för dyra biljetter. Res direkt utan byten."
              }, {
                t: "Flexibelt när det behövs",
                p: "Hitta skjuts även sena kvällar, tidiga morgnar eller när tågen är fulla."
              }, {
                t: "Säkert community",
                p: "Verifierade användare och tydliga regler för icke‑kommersiell samåkning."
              }].map((b) => (
                <div key={b.t} className="p-5 rounded-xl bg-white dark:bg-gray-800 border shadow-sm">
                  <div className="font-bold text-gray-900 dark:text-white">{b.t}</div>
                  <div className="mt-1 text-sm text-gray-600 dark:text-gray-300">{b.p}</div>
                </div>
              ))}
            </div>

            <div className="mt-10 text-center text-sm text-gray-600 dark:text-gray-400">
              Populära rutter: <a className="underline" href="/ride/stockholm-goteborg">Stockholm → Göteborg</a> ·
              <a className="underline ml-2" href="/ride/goteborg-stockholm">Göteborg → Stockholm</a> ·
              <a className="underline ml-2" href="/ride/malmo-stockholm">Malmö → Stockholm</a>
            </div>
          </div>
        </div>
      );
    }

    // Default: genuine 404 for non-slug IDs
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center space-y-4">
            <Helmet>
              <meta name="robots" content="noindex,follow" />
            </Helmet>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Resan hittades inte</h1>
            <p className="text-gray-600 dark:text-gray-400">Den här resan finns inte längre eller har tagits bort.</p>
            <div className="text-sm text-gray-500">
              <p>Populära rutter:</p>
              <p className="mt-1">
                <a href="/ride/stockholm-goteborg" className="underline">Stockholm → Göteborg</a> ·
                <a href="/ride/goteborg-stockholm" className="underline ml-2">Göteborg → Stockholm</a> ·
                <a href="/ride/malmo-stockholm" className="underline ml-2">Malmö → Stockholm</a>
              </p>
            </div>
            <button
              onClick={() => navigate("/")}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Tillbaka till startsidan
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Debug logging
  console.log("RideDetails Debug:", {
    rideId: ride.id,
    rideRole: ride.role,
    rideType: ride.type,
    adType: ride.adType,
    rideData: ride
  });

  // ========== عرض إعلان الشركة ==========
  if (ride.adType === "company") {
    const categoryMap = {
      beauty: { label: "Skönhet & Frisör", emoji: "💇" },
      health: { label: "Hälsa & Sjukvård", emoji: "🏥" },
      home: { label: "Hemservice", emoji: "🏠" },
      auto: { label: "Bil & Motor", emoji: "🚗" },
      restaurant: { label: "Restaurang & Café", emoji: "🍽️" },
      fitness: { label: "Gym & Fitness", emoji: "💪" },
      education: { label: "Utbildning", emoji: "📚" },
      cleaning: { label: "Städning", emoji: "🧹" },
      other: { label: "Övrigt", emoji: "📋" }
    };
    const catInfo = categoryMap[ride.category] || { label: "Tjänst", emoji: "📋" };
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <PageMeta
          title={`${ride.title || ride.companyName} - ${ride.city}`}
          description={ride.description || `${ride.companyName} i ${ride.city}`}
        />
        
        {/* Header */}
        <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-lg border-b">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
            <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
              <HiArrowLeft className="text-xl" />
              <span>Tillbaka</span>
            </button>
            <button
              onClick={() => {
                const url = `${window.location.origin}/ride/${id}`;
                if (navigator.share) {
                  navigator.share({ title: ride.companyName, text: ride.title, url });
                } else {
                  navigator.clipboard.writeText(url);
                  alert("Länk kopierad!");
                }
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <HiShare />
              <span>Dela</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            
            {/* صورة (إذا وجدت) */}
            {ride.imageUrl && (
              <div className="h-64 bg-gray-100">
                <img src={ride.imageUrl} alt={ride.title} className="w-full h-full object-cover" />
              </div>
            )}
            
            {/* معلومات الشركة */}
            <div className="p-6">
              {/* شارات */}
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium">
                  🏢 Företag
                </span>
                <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
                  {catInfo.emoji} {catInfo.label}
                </span>
                <span className="px-3 py-1 bg-red-50 text-red-600 rounded-full text-sm">
                  📍 {ride.city}
                </span>
              </div>
              
              {/* اسم الشركة */}
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {ride.companyName || ride.driverName}
              </h1>
              
              {/* عنوان الخدمة */}
              <h2 className="text-xl text-gray-700 mb-4">
                {ride.title}
              </h2>
              
              {/* السعر والمدة */}
              <div className="flex flex-wrap gap-4 mb-6">
                {ride.price > 0 && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-yellow-50 rounded-lg">
                    <HiCurrencyDollar className="text-yellow-600 text-xl" />
                    <span className="font-bold text-yellow-700">{ride.price} SEK</span>
                  </div>
                )}
                {ride.durationMin > 0 && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-lg">
                    <HiClock className="text-blue-600 text-xl" />
                    <span className="text-blue-700">{ride.durationMin} min</span>
                  </div>
                )}
              </div>
              
              {/* الوصف */}
              {ride.description && (
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-2">Beskrivning</h3>
                  <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                    {ride.description}
                  </p>
                </div>
              )}
              
              {/* معلومات الاتصال */}
              <div className="border-t pt-6">
                <h3 className="font-semibold text-gray-900 mb-4">Kontakt</h3>
                <div className="space-y-3">
                  {(ride.phone || ride.driverPhone) && (
                    <a
                      href={`tel:${ride.phone || ride.driverPhone}`}
                      className="flex items-center gap-3 p-4 bg-green-50 rounded-xl hover:bg-green-100 transition"
                    >
                      <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-lg">📞</span>
                      </div>
                      <div>
                        <div className="font-medium text-green-800">Ring direkt</div>
                        <div className="text-green-600 text-sm">{ride.phone || ride.driverPhone}</div>
                      </div>
                    </a>
                  )}
                  {(ride.email || ride.driverEmail) && (
                    <a
                      href={`mailto:${ride.email || ride.driverEmail}`}
                      className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition"
                    >
                      <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-lg">📧</span>
                      </div>
                      <div>
                        <div className="font-medium text-blue-800">Skicka e-post</div>
                        <div className="text-blue-600 text-sm">{ride.email || ride.driverEmail}</div>
                      </div>
                    </a>
                  )}
                </div>
              </div>
              
              {/* زر الحجز */}
              <div className="mt-6 pt-6 border-t">
                <a
                  href={`tel:${ride.phone || ride.driverPhone}`}
                  className="block w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-center font-bold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition shadow-lg"
                >
                  📞 Boka nu - Ring företaget
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  // ========== نهاية عرض إعلان الشركة ==========
  
  const fromCity = extractCity(ride.origin);
  const toCity = extractCity(ride.destination);
  const eventName = (ride.eventName || "").trim();
  const eventPlace = (ride.eventPlace || "").trim();
  const timeSlot = (ride.timeSlot || "").trim();
  const altOrigins = Array.isArray(ride.altOrigins) ? ride.altOrigins : [];
  const altDestinations = Array.isArray(ride.altDestinations) ? ride.altDestinations : [];
  const stops = Array.isArray(ride.stops) ? ride.stops : [];

  const isRoundTrip = Boolean(ride.roundTrip);
  const returnTime = ride.returnTime;
  const returnDate = ride.returnDate;

  // Dynamic summary based on role/type and count
  const isPassenger = ride.role === "passagerare" || ride.type === "request";
  const seatCount = ride.count || ride.availableSeats || ride.seats || 1;
  
  const summary = buildSamakningSummary(ride);

  // Role badge - check both role and type fields
  const isDriver = ride.role === "förare" || ride.type === "offer";
  
  const badgeLabel = isDriver
    ? "🚗 Förare – erbjuder samåkning"
    : "👤 Samåkare – söker platser";
  const badgeColor = isDriver
    ? "bg-blue-600 text-white" 
    : "bg-emerald-600 text-white";

  return (
    <>
      <PageMeta
        title={`${ride.role === "förare" ? "Samåkning från" : "Söker samåkning från"} ${fromCity} till ${toCity} - VägVänner`}
        description={`${ride.role === "förare" ? "Erbjuder samåkning" : "Söker samåkning"} från ${fromCity} till ${toCity} ${dateStr} - ${ride.costMode === 'fixed_price' && ride.price ? `${ride.price} kr / plats` : (ride.costMode === 'cost_share' && Number(ride.approxPrice) > 0 ? `ca ${Number(ride.approxPrice)} kr • Kostnadsdelning` : 'Kostnadsdelning')}`}
        canonical={`https://vagvanner.se/ride/${id}`}
      />
      <Helmet>
        <meta property="og:image" content="https://vagvanner.se/og/vagvanner-og.jpg" />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Trip",
            "name": `${fromCity} till ${toCity} Samåkning`,
            "description": summary || `${fromCity} → ${toCity}`,
            "itinerary": [
              { "@type": "City", "name": fromCity },
              { "@type": "City", "name": toCity }
            ],
            "offers": ride.price ? { "@type": "Offer", "priceCurrency": "SEK", "price": String(ride.price), "url": `https://vagvanner.se/ride/${id}` } : undefined,
            "startDate": ride.date || undefined,
            "provider": { "@type": "Organization", "name": "VägVänner" },
            "url": `https://vagvanner.se/ride/${id}`
          })}
        </script>
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
              { "@type": "ListItem", "position": 1, "name": "Hem", "item": "https://vagvanner.se/" },
              { "@type": "ListItem", "position": 2, "name": "Rutter", "item": "https://vagvanner.se/select-location" },
              { "@type": "ListItem", "position": 3, "name": `${fromCity} → ${toCity}`, "item": `https://vagvanner.se/ride/${id}` }
            ]
          })}
        </script>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <HiArrowLeft className="text-xl" />
                <span className="font-medium">Tillbaka</span>
              </button>
              
              <button
                onClick={handleShare}
                data-share-button
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <HiShare className="text-lg" />
                <span>Dela</span>
              </button>
            </div>
            {isExpired && (
              <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">
                Utgången resa
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
            {/* Type Badge and Title */}
            <div className="px-6 pt-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-4">
                <h1 className="text-2xl font-bold text-brand">Resedetaljer</h1>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold shadow-sm ${badgeColor}`}>
                  {badgeLabel}
                </span>
              </div>
              
              {/* Summary */}
              <div className="text-center italic text-gray-700 dark:text-gray-300 mb-4 text-sm">
                {summary}
              </div>
            </div>

            {/* Route Section */}
            <div className="px-6 py-6">
              <div className="bg-blue-50 dark:bg-slate-800/40 rounded-lg divide-y divide-gray-200 dark:divide-slate-700">
                
                {/* Route Direction Button */}
                <div className="px-4 py-3 bg-gray-100 dark:bg-slate-700 border-b border-gray-200 dark:border-slate-600">
                  <a 
                    href={`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(ride.origin)}&destination=${encodeURIComponent(ride.destination)}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    <span className="text-sm">🗺️</span>
                    <span className="text-sm font-medium">Visa rutt i Google Maps</span>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
                {/* From */}
                <div className="flex items-center gap-3 px-4 py-3">
                  <FaMapMarkerAlt className="w-6 h-6 text-red-500" />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-600 dark:text-gray-300 text-sm">Från</div>
                    <div className="font-medium text-gray-900 dark:text-slate-200">{fromCity}</div>
                    {ride.originDescription && (
                      <div className="text-sm text-gray-500 dark:text-gray-400 truncate">{ride.originDescription}</div>
                    )}
                    {altOrigins.length > 0 && (
                      <div className="mt-1 text-xs text-gray-600 dark:text-gray-400">Alt: {altOrigins.join(' / ')}</div>
                    )}
                  </div>
                </div>
                
                {/* To */}
                <div className="flex items-center gap-3 px-4 py-3">
                  <FaMapMarkerAlt className="w-6 h-6 text-green-500" />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-600 dark:text-gray-300 text-sm">Till</div>
                    <div className="font-medium text-gray-900 dark:text-slate-200">{toCity}</div>
                    {ride.destinationDescription && (
                      <div className="text-sm text-gray-500 dark:text-gray-400 truncate">{ride.destinationDescription}</div>
                    )}
                    {altDestinations.length > 0 && (
                      <div className="mt-1 text-xs text-gray-600 dark:text-gray-400">Alt: {altDestinations.join(' / ')}</div>
                    )}
                  </div>
                </div>

                {/* Event / Place */}
                {(eventName || eventPlace) && (
                  <div className="flex items-center gap-3 px-4 py-3">
                    <span className="text-2xl">🎤</span>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-600 dark:text-gray-300 text-sm">Evenemang</div>
                      <div className="font-medium text-gray-900 dark:text-slate-200">
                        {eventName} {eventPlace && (<span className="text-gray-600 dark:text-gray-400">({eventPlace})</span>)}
                      </div>
                    </div>
                  </div>
                )}

                {/* Time slot */}
                {timeSlot && (
                  <div className="flex items-center gap-3 px-4 py-3">
                    <span className="text-2xl">🕑</span>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-600 dark:text-gray-300 text-sm">Tidsfönster</div>
                      <div className="font-medium text-gray-900 dark:text-slate-200">
                        {timeSlot === 'early_morning' && 'Tidigt (05:00–08:00)'}
                        {timeSlot === 'morning' && 'Förmiddag (08:00–12:00)'}
                        {timeSlot === 'afternoon' && 'Eftermiddag (12:00–17:00)'}
                        {timeSlot === 'evening' && 'Kväll (17:00–21:00)'}
                        {timeSlot === 'night' && 'Sen kväll/natt (21:00–02:00)'}
                      </div>
                    </div>
                  </div>
                )}

                {/* Stops */}
                {stops.length > 0 && (
                  <div className="flex items-start gap-3 px-4 py-3">
                    <span className="text-2xl">🛑</span>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-600 dark:text-gray-300 text-sm">Möjliga stopp</div>
                      <div className="font-medium text-gray-900 dark:text-slate-200 text-sm">{stops.join(', ')}</div>
                    </div>
                  </div>
                )}
                
                {/* Trip Type - Only for passengers */}
                {ride.tripType && (ride.role === "passagerare" || ride.type === "request") && (
                  <div className="flex items-center gap-3 px-4 py-3">
                    <span className="text-xl">
                      {ride.tripType === "work_daily" && "👔"}
                      {ride.tripType === "study_daily" && "🎓"}
                      {ride.tripType === "round_daily" && "↔︎"}
                      {ride.tripType === "oneway_daily" && "→"}
                      {ride.tripType === "long_trip" && "🧳"}
                      {ride.tripType === "companion" && "🤝"}
                      {ride.tripType === "short_commute" && "🚏"}
                      {ride.tripType === "oneway_once" && "➡️"}
                      {ride.tripType === "round_once" && "↔︎"}
                      {ride.tripType === "medical" && "🏥"}
                      {ride.tripType === "urgent" && "⚡"}
                      {ride.tripType === "leisure" && "🛍️"}
                      {ride.tripType === "event" && "🎉"}
                      {ride.tripType === "airport" && "✈️"}
                      {ride.tripType === "other" && "📋"}
                    </span>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-600 dark:text-gray-300 text-sm">Typ av resa</div>
                      <div className="font-medium text-gray-900 dark:text-slate-200">
                        {ride.tripType === "work_daily" && "Arbete dagligen - Pendling till jobbet"}
                        {ride.tripType === "study_daily" && "Studier dagligen - Till skola/universitet"}
                        {ride.tripType === "round_daily" && "Tur/retur dagligen - Ut och retur samma dag"}
                        {ride.tripType === "oneway_daily" && "Enkel dagligen - Endast utresa"}
                        {ride.tripType === "long_trip" && "Lång resa - Långdistans, söker plats/sällskap"}
                        {ride.tripType === "companion" && "Resesällskap - Sällskap i bil/tåg"}
                        {ride.tripType === "short_commute" && "Kort pendling - Kort sträcka"}
                        {ride.tripType === "oneway_once" && "Enkel (en gång) - Endast utresa"}
                        {ride.tripType === "round_once" && "Tur & retur (en gång) - Samma dag"}
                        {ride.tripType === "medical" && "Vårdbesök - Läkar/tandläkarbesök"}
                        {ride.tripType === "urgent" && "Akut - Behöver åka snabbt"}
                        {ride.tripType === "leisure" && "Fritid - Shopping/nöje"}
                        {ride.tripType === "event" && "Event/Konsert - Till evenemang"}
                        {ride.tripType === "airport" && "Flygplats - Till/från flygplats"}
                        {ride.tripType === "other" && "Annat - Annan typ av resa"}
                      </div>
                    </div>
                  </div>
                )}

                {/* Schedule Section - Reorganized */}
                
                {/* Date and Recurrence */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-700 dark:to-slate-600 px-4 py-4 rounded-lg">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">📅</span>
                    <div className="flex-1">
                      <div className="font-bold text-gray-800 dark:text-gray-200 text-base mb-2">
                        {ride.recurrence === "dagligen" ? "Återkommande resa" : "Engångsresa"}
                      </div>
                      
                      {ride.recurrence === "dagligen" ? (
                        <div>
                          <div className="font-semibold text-gray-700 dark:text-gray-300 text-sm mb-1">Dagar</div>
                          <div className="flex flex-wrap gap-2 mb-2">
                            {ride.weekdays && ride.weekdays.map(day => (
                              <span key={day} className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-full text-sm font-medium">
                                {getWeekdayOptions().find(d => d.key === day)?.short || day}
                              </span>
                            ))}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            Startar: <span className="font-medium">{dateStr || ride.date}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="text-lg font-medium text-gray-900 dark:text-slate-200">
                          {dateStr || ride.date}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Time Section */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-slate-700 dark:to-slate-600 px-4 py-4 rounded-lg">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">⏰</span>
                    <div className="flex-1">
                      <div className="font-bold text-gray-800 dark:text-gray-200 text-base mb-2">Tider</div>
                      
                      <div className="space-y-2">
                        {/* Departure Time */}
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-semibold text-gray-700 dark:text-gray-300 text-sm">Avresa</div>
                            <div className="text-lg font-medium text-gray-900 dark:text-slate-200">
                              {timeStr || ride.departureTime}
                              {Number(ride.timeFlexMinutes) > 0 && (
                                <span className="ml-2 px-2 py-1 rounded-full bg-blue-100 dark:bg-slate-800 text-blue-700 dark:text-blue-300 text-xs font-medium">
                                  ±{ride.timeFlexMinutes} min
                                </span>
                              )}
                            </div>
                            {ride.preferredTime && ride.preferredTime !== ride.departureTime && (
                              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                Föredragen tid: {ride.preferredTime}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Return Time if exists */}
                        {isRoundTrip && returnTime && (
                          <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-slate-600">
                            <div>
                              <div className="font-semibold text-gray-700 dark:text-gray-300 text-sm">Retur</div>
                              <div className="text-lg font-medium text-gray-900 dark:text-slate-200">
                                {returnTime}
                                {returnDate && returnDate !== ride.date && (
                                  <span className="ml-2 text-sm text-gray-500">({returnDate})</span>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                
                {/* Seats/People */}
                <div className="flex items-center gap-3 px-4 py-3">
                  <FaSuitcase className="w-6 h-6 text-gray-500" />
                  <div className="flex-1">
                    <div className="font-semibold text-gray-600 dark:text-gray-300 text-sm">
                      {ride.role === "förare" ? "Platser" : "Personer"}
                    </div>
                    <div className="font-medium text-gray-900 dark:text-slate-200">{ride.count}</div>
                  </div>
                </div>
                
                {/* Kostnad */}
                <div className="flex items-center gap-3 px-4 py-3">
                  <FaMoneyBillWave className="w-6 h-6 text-yellow-600" />
                  <div className="flex-1">
                    <div className="font-semibold text-gray-600 dark:text-gray-300 text-sm">Kostnad</div>
                    <div className="font-medium text-gray-900 dark:text-slate-200">
                      {ride.costMode === 'fixed_price' && ride.price ? (
                        <>{ride.price} kr / plats</>
                      ) : ride.costMode === 'by_agreement' ? (
                        <>Enligt överenskommelse</>
                      ) : ride.costMode === 'free' ? (
                        <>Ingen ersättning</>
                      ) : ride.costMode === 'companionship' ? (
                        <>Endast sällskap</>
                      ) : (Number(ride.approxPrice) > 0) ? (
                        <>ca {Number(ride.approxPrice)} kr • Kostnadsdelning</>
                      ) : (
                        <>Kostnadsdelning</>
                      )}
                    </div>
                  </div>
                {/* Cost legal note */}
                <div className="px-4 pb-3 text-[12px] text-gray-600 dark:text-gray-300">
                  {ride.costMode === 'fixed_price' ? (
                    <>Belopp avser kostnadsdelning. Kommersiell passagerartransport utan tillstånd är förbjuden. Plattformen hanterar inte betalningar.</>
                  ) : (
                    <>Icke‑kommersiell samåkning. Plattformen hanterar inte betalningar.</>
                  )}
                </div>
                </div>
                
                {/* Smoking */}
                {ride.smokingAllowed && (
                  <div className="flex items-center gap-3 px-4 py-3">
                    <FaSmoking className={`w-6 h-6 ${ride.smokingAllowed === "yes" ? "text-green-600" : "text-red-600"}`} />
                    <div className="flex-1">
                      <div className="font-semibold text-gray-600 dark:text-gray-300 text-sm">Rökning</div>
                      <div className="font-medium text-gray-900 dark:text-slate-200">
                        {ride.smokingAllowed === "yes" ? "Tillåten" : "Ej tillåten"}
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Music */}
                {ride.musicPreference && (
                  <div className="flex items-center gap-3 px-4 py-3">
                    <FaMusic className="w-6 h-6 text-blue-400" />
                    <div className="flex-1">
                      <div className="font-semibold text-gray-600 dark:text-gray-300 text-sm">Musik</div>
                      <div className="font-medium text-gray-900 dark:text-slate-200">{ride.musicPreference}</div>
                    </div>
                  </div>
                )}
                
                {/* Luggage */}
                {(ride.luggageSpace !== undefined && ride.luggageSpace !== null) && (
                  <div className="flex items-center gap-3 px-4 py-3">
                    <FaSuitcase className="w-6 h-6 text-gray-600" />
                    <div className="flex-1">
                      <div className="font-semibold text-gray-600 dark:text-gray-300 text-sm">Bagage</div>
                      <div className="font-medium text-gray-900 dark:text-slate-200">{ride.luggageSpace} st</div>
                    </div>
                  </div>
                )}

                {/* Car info (for driver) */}
                {(ride.carBrand || ride.licensePlate) && ride.role === "förare" && (
                  <div className="flex items-center gap-3 px-4 py-3">
                    <span className="text-2xl">🚗</span>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-600 dark:text-gray-300 text-sm">Bil</div>
                      <div className="font-medium text-gray-900 dark:text-slate-200">
                        {ride.carBrand && `${ride.carBrand} ${ride.carModel || ""}`.trim()}
                        {ride.carBrand && ride.licensePlate && <br />}
                        {ride.licensePlate && (
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            Reg: {ride.licensePlate}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Driver Preferences */}
                {ride.role === "förare" && (ride.passengerPreference || ride.routeFlexibility || ride.pickupFlexibility || ride.driverExperience || ride.carComfort || ride.specialServices) && (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 px-4 py-4 rounded-lg">
                    <div className="font-bold text-gray-800 dark:text-gray-200 text-base mb-3 flex items-center gap-2">
                      <span className="text-lg">🚗</span>
                      <span>Förarens preferenser & service</span>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      {ride.passengerPreference && (
                        <div className="flex items-center gap-2">
                          <span className="text-base">👥</span>
                          <span className="font-medium text-gray-700 dark:text-gray-300">Passagerartyp:</span>
                          <span className="text-gray-600 dark:text-gray-400">
                            {ride.passengerPreference === "students" && "Föredrar studenter"}
                            {ride.passengerPreference === "professionals" && "Föredrar yrkesverksamma"}
                            {ride.passengerPreference === "seniors" && "Välkomnar äldre passagerare"}
                            {ride.passengerPreference === "families" && "Familjevänlig"}
                            {ride.passengerPreference === "women_only" && "Endast kvinnliga passagerare"}
                          </span>
                        </div>
                      )}
                      
                      {ride.routeFlexibility && (
                        <div className="flex items-center gap-2">
                          <span className="text-base">🛣️</span>
                          <span className="font-medium text-gray-700 dark:text-gray-300">Rutt:</span>
                          <span className="text-gray-600 dark:text-gray-400">
                            {ride.routeFlexibility === "flexible" && "Kan köra omvägar"}
                            {ride.routeFlexibility === "direct_only" && "Endast direkt väg"}
                            {ride.routeFlexibility === "scenic" && "Föredrar naturskön rutt"}
                            {ride.routeFlexibility === "fastest" && "Alltid snabbaste vägen"}
                          </span>
                        </div>
                      )}
                      
                      {ride.pickupFlexibility && (
                        <div className="flex items-center gap-2">
                          <span className="text-base">📍</span>
                          <span className="font-medium text-gray-700 dark:text-gray-300">Upphämtning:</span>
                          <span className="text-gray-600 dark:text-gray-400">
                            {ride.pickupFlexibility === "door_to_door" && "Dörr-till-dörr service"}
                            {ride.pickupFlexibility === "central_pickup" && "Centrala platser endast"}
                            {ride.pickupFlexibility === "flexible_pickup" && "Flexibel med platser"}
                            {ride.pickupFlexibility === "no_detours" && "Inga omvägar för upphämtning"}
                          </span>
                        </div>
                      )}
                      
                      {ride.driverExperience && (
                        <div className="flex items-center gap-2">
                          <span className="text-base">🏆</span>
                          <span className="font-medium text-gray-700 dark:text-gray-300">Erfarenhet:</span>
                          <span className="text-gray-600 dark:text-gray-400">
                            {ride.driverExperience === "beginner" && "Ny förare (1-3 år)"}
                            {ride.driverExperience === "experienced" && "Erfaren förare (3-10 år)"}
                            {ride.driverExperience === "professional" && "Professionell förare (10+ år)"}
                            {ride.driverExperience === "elderly_friendly" && "Van vid äldre passagerare"}
                            {ride.driverExperience === "student_friendly" && "Van vid studenter"}
                          </span>
                        </div>
                      )}
                      
                      {ride.carComfort && (
                        <div className="flex items-center gap-2">
                          <span className="text-base">✨</span>
                          <span className="font-medium text-gray-700 dark:text-gray-300">Komfort:</span>
                          <span className="text-gray-600 dark:text-gray-400">
                            {ride.carComfort === "luxury" && "Lyxbil med extra komfort"}
                            {ride.carComfort === "spacious" && "Rymlig bil med mycket plats"}
                            {ride.carComfort === "economy" && "Ekonomisk bil - fokus på kostnad"}
                            {ride.carComfort === "family_car" && "Familjebil med säkerhet i fokus"}
                            {ride.carComfort === "sports_car" && "Sportbil - kul körupplevelse"}
                          </span>
                        </div>
                      )}
                      
                      {ride.specialServices && (
                        <div className="flex items-center gap-2">
                          <span className="text-base">🎁</span>
                          <span className="font-medium text-gray-700 dark:text-gray-300">Specialtjänster:</span>
                          <span className="text-gray-600 dark:text-gray-400">
                            {ride.specialServices === "luggage_help" && "Hjälper med bagage"}
                            {ride.specialServices === "wheelchair_accessible" && "Rullstolsanpassad bil"}
                            {ride.specialServices === "pet_friendly" && "Välkomnar husdjur"}
                            {ride.specialServices === "child_seats" && "Barnstolar tillgängliga"}
                            {ride.specialServices === "late_night" && "Kör sent på kvällen/natt"}
                            {ride.specialServices === "early_morning" && "Tidig morgonstart"}
                            {ride.specialServices === "airport_specialist" && "Specialist på flygplatstransport"}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                
                {/* Passenger Preferences */}
                {(ride.role === "passagerare" || ride.type === "request") && (ride.baggage || ride.petsAllowed || ride.genderPreference || ride.conversationLevel || ride.accessibilityNeeds) && (
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 px-4 py-4 rounded-lg">
                    <div className="font-bold text-gray-800 dark:text-gray-200 text-base mb-3 flex items-center gap-2">
                      <span className="text-lg">👤</span>
                      <span>Passagerarens preferenser</span>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      {ride.baggage && (
                        <div className="flex items-center gap-2">
                          <span className="text-base">🧳</span>
                          <span className="font-medium text-gray-700 dark:text-gray-300">Bagage:</span>
                          <span className="text-gray-600 dark:text-gray-400">
                            {ride.baggage === "none" && "Ingen bagage"}
                            {ride.baggage === "small" && "Liten väska/ryggsäck"}
                            {ride.baggage === "medium" && "Medelstor resväska"}
                            {ride.baggage === "large" && "Stor resväska"}
                            {ride.baggage === "multiple" && "Flera väskor"}
                          </span>
                        </div>
                      )}
                      
                      {ride.petsAllowed && (
                        <div className="flex items-center gap-2">
                          <span className="text-base">🐕</span>
                          <span className="font-medium text-gray-700 dark:text-gray-300">Husdjur:</span>
                          <span className="text-gray-600 dark:text-gray-400">
                            {ride.petsAllowed === "small_pet" && "Litet husdjur (katt/liten hund)"}
                            {ride.petsAllowed === "medium_pet" && "Medelstor hund"}
                            {ride.petsAllowed === "pet_friendly" && "Reser ofta med husdjur"}
                          </span>
                        </div>
                      )}
                      
                      {ride.genderPreference && (
                        <div className="flex items-center gap-2">
                          <span className="text-base">👥</span>
                          <span className="font-medium text-gray-700 dark:text-gray-300">Förarpreferens:</span>
                          <span className="text-gray-600 dark:text-gray-400">
                            {ride.genderPreference === "female" && "Föredrar kvinnlig förare"}
                            {ride.genderPreference === "male" && "Föredrar manlig förare"}
                          </span>
                        </div>
                      )}
                      
                      {ride.conversationLevel && (
                        <div className="flex items-center gap-2">
                          <span className="text-base">💬</span>
                          <span className="font-medium text-gray-700 dark:text-gray-300">Konversation:</span>
                          <span className="text-gray-600 dark:text-gray-400">
                            {ride.conversationLevel === "chatty" && "Gillar att prata under resan"}
                            {ride.conversationLevel === "quiet" && "Föredrar tyst resa"}
                            {ride.conversationLevel === "flexible" && "Anpassar sig efter föraren"}
                          </span>
                        </div>
                      )}
                      
                      {ride.accessibilityNeeds && (
                        <div className="flex items-center gap-2">
                          <span className="text-base">♿</span>
                          <span className="font-medium text-gray-700 dark:text-gray-300">Tillgänglighet:</span>
                          <span className="text-gray-600 dark:text-gray-400">
                            {ride.accessibilityNeeds === "wheelchair" && "Rullstolsanpassning behövs"}
                            {ride.accessibilityNeeds === "mobility_aid" && "Behöver hjälp med rörlighet"}
                            {ride.accessibilityNeeds === "hearing_impaired" && "Hörselnedsättning"}
                            {ride.accessibilityNeeds === "visual_impaired" && "Synnedsättning"}
                            {ride.accessibilityNeeds === "elderly_assistance" && "Äldre - behöver extra hjälp"}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Notes */}
                {ride.notes && (
                  <div className="flex items-center gap-3 px-4 py-3">
                    <FaRegEdit className="w-6 h-6 text-gray-400" />
                    <div className="flex-1">
                      <div className="font-semibold text-gray-600 dark:text-gray-300 text-sm">Övrigt</div>
                      <div className="font-medium text-gray-900 dark:text-slate-200">{ride.notes}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Action Button - PROMINENT AND CLEAR */}
            <div className="px-6 py-6 border-t-2 border-gray-200 dark:border-gray-700 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900/50 dark:to-gray-800">
              <div className="flex flex-col items-center gap-4">
                {(ride.role === "förare" || ride.type === "offer") ? (
                  <button
                    onClick={handleAction}
                    className="w-full max-w-sm px-8 py-4 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold rounded-full transition-all transform hover:scale-[1.02] text-xl shadow-lg animate-pulse"
                    disabled={isExpired}
                  >
                    {isExpired ? 'Resan har passerat' : (ride.costMode === 'free' || ride.costMode === 'companionship') ? 'Följ med' : 'Skicka förfrågan'}
                  </button>
                ) : (
                  <button
                    onClick={handleAction}
                    className="w-full max-w-sm px-8 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold rounded-full transition-all transform hover:scale-[1.02] text-xl shadow-lg animate-pulse"
                  >
                    💬 Kontakta passageraren
                  </button>
                )}
                {(ride.role === "passagerare" || ride.type === "request") && (
                  <p className="text-xs text-gray-500 text-center max-w-sm">
                    Skicka ett meddelande till passageraren. Chatta och dela kontaktuppgifter när ni känner er bekväma.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Trust Badges + maps links */}
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-full shadow-md">
              <HiShieldCheck className="text-green-600 text-xl" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Säker resa</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-full shadow-md">
              <span className="text-yellow-500 text-xl">⭐</span>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Pålitliga användare</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-full shadow-md">
              <span className="text-blue-600 text-xl">📧</span>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Support 24/7</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
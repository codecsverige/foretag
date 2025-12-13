// src/components/rides/RideCard.jsx
// معدّل ليدعم كلاً من الرحلات وإعلانات الشركات

import React, { useCallback, useMemo } from "react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import { HiShare } from "react-icons/hi";
import { FaLock, FaMapMarkerAlt, FaFlag, FaBuilding, FaClock, FaPhone } from "react-icons/fa";
import { extractCity } from "../../utils/address";
import { MiniStarRating } from "../SimpleStarRating";
import { buildSamakningSummary } from "../../utils/rideSummary";

// خريطة الفئات
const CATEGORY_MAP = {
  beauty: { label: "Skönhet", emoji: "💇" },
  health: { label: "Hälsa", emoji: "🏥" },
  home: { label: "Hemservice", emoji: "🏠" },
  auto: { label: "Bil & Motor", emoji: "🚗" },
  restaurant: { label: "Restaurang", emoji: "🍽️" },
  fitness: { label: "Fitness", emoji: "💪" },
  education: { label: "Utbildning", emoji: "📚" },
  cleaning: { label: "Städning", emoji: "🧹" },
  other: { label: "Övrigt", emoji: "📋" }
};

function RideCard({ ride, bookedSeats }) {
  const navigate = useNavigate();
  
  // التحقق من نوع الإعلان
  const isCompanyAd = ride.adType === "company";
  
  // عدد المقاعد الأصلي ثابت
  const count = ride.count || 0;

  // لا نعتبر إعلان الراكب ممتلئاً تلقائياً؛ نظهر شارة unlock بدلاً من الإخفاء
  const isFull = false;

  // فحص انتهاء الرحلة (لا ينطبق على إعلانات الشركات)
  const isExpired = useMemo(() => {
    if (isCompanyAd) return false; // إعلانات الشركات لا تنتهي بنفس الطريقة
    try {
      const tz = 'Europe/Stockholm';
      const nowDate = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
      const nowTime = new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour12: false, hour: '2-digit', minute: '2-digit' }).format(new Date());
      const d = String(ride.date || '').slice(0,10);
      const t = String(ride.departureTime || '00:00').slice(0,5);
      if (!d) return false;
      if (d < nowDate) return true;
      if (d > nowDate) return false;
      return t <= nowTime;
    } catch {
      return false;
    }
  }, [ride.date, ride.departureTime, isCompanyAd]);

  const handleCardClick = useCallback((e) => {
    e.preventDefault();
    if (!isFull && !isExpired) {
      navigate(`/ride/${ride.id}`, { state: { ride } });
    }
  }, [isFull, isExpired, navigate, ride]);
  
  // تنسيق التاريخ والوقت (للرحلات فقط)
  const [dateStr, timeStr] = useMemo(() => {
    if (isCompanyAd) return ['', ''];
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
  }, [ride.date, ride.departureTime, isCompanyAd]);

  // Nice date label
  const niceDateStr = useMemo(() => {
    if (isCompanyAd) return '';
    try {
      const tz = 'Europe/Stockholm';
      const today = new Date();
      const fmtYmd = (d) => new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
      const todayYmd = fmtYmd(today);
      const rideYmd = String(ride.date || '').slice(0, 10);
      if (rideYmd === todayYmd) return 'Idag';
      const tmr = new Date(today.getTime());
      tmr.setDate(tmr.getDate() + 1);
      const tmrYmd = fmtYmd(tmr);
      if (rideYmd === tmrYmd) return 'Imorgon';
      const dt = new Date(`${ride.date}T${ride.departureTime || '00:00'}`);
      return dt.toLocaleDateString('sv-SE', { weekday: 'short', day: 'numeric', month: 'short' });
    } catch {
      return dateStr;
    }
  }, [ride.date, ride.departureTime, dateStr, isCompanyAd]);

  // Dynamisk, alltid inkluderar "samåkning"
  const userMessage = isCompanyAd ? ride.description : buildSamakningSummary(ride);

  // TripType chip (for passenger cards)
  const tripTypeChip = (() => {
    if (isCompanyAd) return null;
    const t = ride.tripType;
    if (!t) return null;
    const map = {
      work_daily: { label: "Arbete dagligen", emoji: "👔" },
      study_daily:{ label: "Studier dagligen", emoji: "🎓" },
      round_daily:{ label: "Tur/retur dagligen", emoji: "↔︎" },
      oneway_daily:{ label: "Enkel dagligen", emoji: "→" },
      long_trip:  { label: "Lång resa", emoji: "🧳" },
      companion:  { label: "Resesällskap", emoji: "🤝" },
      short_commute:{ label: "Kort pendling", emoji: "🚏" },
      oneway_once:{ label: "Enkel (en gång)", emoji: "➡️" },
      round_once: { label: "Tur & retur (en gång)", emoji: "↔︎" },
      urgent:     { label: "Akut", emoji: "⚡" },
      medical:    { label: "Vårdbesök", emoji: "🏥" },
      leisure:    { label: "Fritid", emoji: "🛍️" },
    };
    const m = map[t];
    if (!m) return null;
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-[10px] font-medium rounded-full">
        <span>{m.emoji}</span> {m.label}
      </span>
    );
  })();

  // بادج السعر
  const priceBadge = (() => {
    if (isCompanyAd) {
      const p = Number(ride.price) || 0;
      return (
        <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">
          {p > 0 ? `${p} SEK` : 'Kontakta'}
        </span>
      );
    }
    const mode = ride.costMode || (ride.price ? 'fixed_price' : 'cost_share');
    let label = 'Kostnadsdelning';
    if (mode === 'fixed_price') label = ride.price ? `${ride.price} kr` : 'Kostnad';
    else if (mode === 'by_agreement') label = 'Enligt överenskommelse';
    else if (mode === 'free') label = 'Ingen ersättning';
    else if (mode === 'companionship') label = 'Endast sällskap';
    else if (mode === 'cost_share' && Number(ride.approxPrice) > 0) label = `ca ${Number(ride.approxPrice)} kr`;
    const isFree = label === 'Ingen ersättning';
    const baseCls = isFree
      ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-sm animate-pulse'
      : 'bg-yellow-100 text-yellow-700';
    return (
      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${baseCls}`}>
        {label}
      </span>
    );
  })();

  // زر مشاركة
  const handleShare = e => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/ride/${ride.id}`;
    if (navigator.share) {
      navigator.share({
        title: isCompanyAd ? ride.companyName : "VägVänner Samåkning",
        text: isCompanyAd 
          ? `${ride.title} - ${ride.companyName} i ${ride.city}`
          : ride.role === "passagerare"
            ? `Jag söker samåkning från ${extractCity(ride.origin)} till ${extractCity(ride.destination)}.`
            : `Jag erbjuder samåkning från ${extractCity(ride.origin)} till ${extractCity(ride.destination)}.`,
        url
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url);
      alert("Länk kopierad!");
    }
  };

  // زر الإبلاغ
  const handleReport = e => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/report/${ride.id}`);
  };

  // بادج الدور
  const badge = isCompanyAd ? (
    <span className="inline-block bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full text-[11px] font-medium">
      🏢 Företag
    </span>
  ) : ride.role === "passagerare" ? (
    <span className="inline-block bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-[11px] font-medium">
      👤 Söker samåkning
    </span>
  ) : (
    <span className="inline-block bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-[11px] font-medium">
      🚗 Erbjuder samåkning
    </span>
  );

  // الحصول على معلومات الفئة
  const categoryInfo = isCompanyAd ? (CATEGORY_MAP[ride.category] || { label: "Tjänst", emoji: "📋" }) : null;

  // ========== عرض إعلان الشركة ==========
  if (isCompanyAd) {
    return (
      <a
        href={`/ride/${ride.id}`}
        onClick={handleCardClick}
        className="relative flex flex-col justify-between bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-xl shadow hover:shadow-lg transition-all duration-200 p-4 w-full max-w-sm mx-auto cursor-pointer no-underline text-inherit"
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-2">
            {badge}
            <span className="inline-block bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-[10px]">
              {categoryInfo.emoji} {categoryInfo.label}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button type="button" onClick={handleShare} className="p-1 rounded-full hover:bg-gray-100">
              <HiShare className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>

        {/* اسم الشركة */}
        <div className="flex items-center gap-2 mb-1">
          <FaBuilding className="text-indigo-500 w-4 h-4" />
          <span className="font-bold text-gray-900 dark:text-gray-100 text-base truncate">
            {ride.companyName || ride.driverName || "Företag"}
          </span>
        </div>

        {/* عنوان الخدمة */}
        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-2 line-clamp-2">
          {ride.title || "Tjänst"}
        </h3>

        {/* الوصف */}
        {ride.description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
            {ride.description}
          </p>
        )}

        {/* المدينة والمدة */}
        <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 mb-3">
          <span className="inline-flex items-center gap-1">
            <FaMapMarkerAlt className="w-3 h-3 text-red-400" />
            {ride.city || ride.origin}
          </span>
          {ride.durationMin > 0 && (
            <span className="inline-flex items-center gap-1">
              <FaClock className="w-3 h-3 text-blue-400" />
              {ride.durationMin} min
            </span>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-100">
          <button
            className="inline-flex items-center gap-1 px-4 py-2 text-sm font-semibold rounded-full text-white bg-blue-600 hover:bg-blue-700 transition"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              navigate(`/ride/${ride.id}`, { state: { ride } });
            }}
          >
            Visa mer
          </button>
          <div>{priceBadge}</div>
        </div>
      </a>
    );
  }

  // ========== عرض الرحلة (الكود الأصلي) ==========
  return (
    <>
      <a
        href={`/ride/${ride.id}`}
        onClick={handleCardClick}
        onMouseEnter={() => { try { import("../../pages/RideDetails.jsx"); } catch {} }}
        tabIndex={0}
        className={`relative flex flex-col justify-between bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-xl shadow hover:shadow-lg transition-all duration-200 p-4 w-full max-w-sm mx-auto cursor-pointer block no-underline text-inherit focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-800`}
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-2">
            {badge}
          </div>
          <div className="flex items-center gap-2">
            {ride.userId && (
              <MiniStarRating userId={ride.userId} />
            )}
            
            <div className="flex items-center gap-1 ml-auto">
              <button
                type="button"
                onClick={handleShare}
                className="p-1 rounded-full hover:bg-brand/10 transition"
                title="Dela resa"
                aria-label="Dela resa"
                tabIndex={-1}
              >
                <HiShare className="w-5 h-5 text-gray-500" />
              </button>
              <button
                type="button"
                onClick={handleReport}
                className="p-1 rounded-full hover:bg-red-100 transition"
                title="Rapportera annons"
                aria-label="Rapportera annons"
                tabIndex={-1}
              >
                <FaFlag className="w-4 h-4 text-gray-400 hover:text-red-500" />
              </button>
            </div>
          </div>
        </div>

        {/* Expired badge if needed */}
        {isExpired && (
          <div className="mb-2">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-200 text-gray-700 text-[10px] font-medium rounded-full">
              ⏳ Avslutad
            </span>
          </div>
        )}

        {/* From → To */}
        <div className="flex items-center gap-1 mb-1 text-base font-bold text-gray-800 dark:text-gray-100">
          <FaMapMarkerAlt className="text-red-500" />
          <span className="truncate">{extractCity(ride.origin)}</span>
          <span className="mx-1">→</span>
          <FaMapMarkerAlt className="text-green-500" />
          <span className="truncate">{extractCity(ride.destination)}</span>
        </div>

        {/* User Message - Enhanced */}
        {userMessage && (
          <div className="bg-gray-50 dark:bg-slate-800/50 rounded-lg p-3 my-3 border-l-4 border-gray-400 dark:border-gray-600">
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              {userMessage}
            </p>
          </div>
        )}

        {/* Schema chips: trip type, frequency and round-trip */}
        {(tripTypeChip || ride.recurrence === "dagligen" || ride.roundTrip) && (
          <div className="flex flex-wrap gap-2 mb-2">
            {tripTypeChip}
            {ride.recurrence === "dagligen" && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-[10px] font-medium rounded-full">
                🔁 Återkommande
              </span>
            )}
            {ride.roundTrip && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-[10px] font-medium rounded-full">
                ↔︎ Tur & retur{ride.returnTime ? `, kl ${ride.returnTime}` : ""}
              </span>
            )}
          </div>
        )}

        {/* Datum & tid (+ return if exists) */}
        <div className="flex flex-wrap items-center gap-1 text-[11px] text-gray-600 dark:text-gray-400 mb-3">
          <span>📅 {niceDateStr}</span>
          <span>•</span>
          <span>⏰ {timeStr}</span>
          {Boolean(ride.roundTrip) && (ride.returnTime) && (
            <>
              <span>•</span>
              <span>↩︎ {ride.returnTime}</span>
            </>
          )}
        </div>

        {/* Extra Info */}
        {(ride.luggageSpace > 0 || ride.smokingAllowed || ride.musicPreference) && (
          <div className="flex flex-wrap gap-2 mb-2">
            {ride.luggageSpace > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-[10px] font-medium rounded-full">
                🧳 Bagageutrymme
              </span>
            )}
            {ride.smokingAllowed === "no" && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-[10px] font-medium rounded-full">
                🚭 Rökfritt
              </span>
            )}
            {ride.musicPreference && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-[10px] font-medium rounded-full">
                🎵 {ride.musicPreference}
              </span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center">
          <div className="ml-auto flex items-center gap-2">
            <button
            disabled={isFull || isExpired}
            className={`inline-flex items-center gap-1 px-3 py-1 text-[12px] font-semibold rounded-full text-white transition ${
              (isFull || isExpired)
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-brand hover:bg-brand-dark"
            }`}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              if (isFull || isExpired) return;
              if (ride.role === "passagerare") {
                navigate(`/book-ride-passanger/${ride.id}`, { state: { ride } });
              } else {
                navigate(`/book-ride/${ride.id}`, { state: { ride } });
              }
            }}
          >
            {isExpired ? (
              <>Ej tillgänglig</>
            ) : ride.role === "passagerare" ? (
              <>
                <FaLock className="w-4 h-4 text-white" /> Kontakta
              </>
            ) : ride.costMode === 'free' || ride.costMode === 'companionship' ? (
              <>Följ med</>
            ) : (
              <>Skicka förfrågan</>
            )}
            </button>
            <div>{priceBadge}</div>
          </div>
        </div>
      </a>
    </>
  );
}

RideCard.propTypes = {
  ride: PropTypes.object.isRequired,
  bookedSeats: PropTypes.number
};

RideCard.defaultProps = {
  bookedSeats: 0
};

export default React.memo(RideCard);

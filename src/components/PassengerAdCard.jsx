/* ──────────────────────────────────────────────
   src/components/PassengerAdCard.jsx
   بطاقة إعلان الراكب (Passenger Ad)
────────────────────────────────────────────── */
import React from "react";
import PropTypes from "prop-types";
import { extractCity } from "../utils/address";
import { buildSamakningSummary } from "../utils/rideSummary";

/* ألوان الخلفية والعناوين حسب حالة الإعلان */
const HEADER_STYLES = {
  published: {
    gradient: "from-emerald-600 via-emerald-700 to-emerald-800",
    pill:     { color: "yellow", label: "⏳ Publicerad" },
    tag:      "text-emerald-300",
  },
  unlocked: {
    gradient: "from-emerald-600 via-emerald-700 to-emerald-800",
    pill:     { color: "emerald", label: "✅ Upplåst" },
    tag:      "text-emerald-300",
  },
};

/**
 * PassengerAdCard
 *
 * @param {Object}   ad        كائن الإعلان
 * @param {Function} onDelete  استدعاء عند رغبة المستخدم في الحذف
 * @param {number}   unlocksCount  عدد الـ unlocks (للعرض فقط)
 */
function PassengerAdCard({ ad, onDelete, unlocksCount = 0 }) {
  const hasUnlocks = unlocksCount > 0;
  const style      = hasUnlocks ? HEADER_STYLES.unlocked : HEADER_STYLES.published;

  return (
    <article className="bg-white dark:bg-slate-800 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-slate-700 overflow-hidden group">
      {/* Elegant Header */}
      <header className={`bg-gradient-to-r ${style.gradient} p-4 relative overflow-hidden`}>
        {/* Decorative elements */}
        <div className="absolute inset-0 bg-white/5 backdrop-blur-sm"></div>
        <div className="absolute -top-8 -right-8 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
        
        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
            {/* Route and Info */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                  <span className="text-xl">🧍‍♂️</span>
                </div>
                <h2 className="text-xl font-bold text-white">
                  {extractCity(ad.origin)}
                  <span className="mx-2 text-white/60">→</span>
                  {extractCity(ad.destination)}
                </h2>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-md rounded-lg px-3 py-1.5 text-sm text-white">
                  <span>📅</span> {ad.date}
                </span>
                <span className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-md rounded-lg px-3 py-1.5 text-sm text-white">
                  <span>🕐</span> {ad.departureTime}
                </span>
                <span className="inline-flex items-center gap-1.5 bg-yellow-400/20 backdrop-blur-md rounded-lg px-3 py-1.5 text-sm text-yellow-100 font-medium">
                  {style.pill.label}
                </span>
              </div>
            </div>
            
            {/* Price Badge */}
            <div className="bg-white/20 backdrop-blur-md rounded-xl px-4 py-2 text-center">
              <p className="text-2xl font-bold text-white">
                {(ad.costMode === 'fixed_price' && ad.price) ? `${ad.price} kr` : (ad.costMode === 'cost_share' && Number(ad.approxPrice) > 0) ? `ca ${Number(ad.approxPrice)} kr` : 'Flex'}
              </p>
              <span className="text-xs text-white/80">{ad.costMode === 'cost_share' ? 'kostnadsdelning' : 'per plats'}</span>
            </div>
          </div>
        </div>
      </header>
      {/* Stats */}
      <section className="p-2 border-b border-gray-100">
        <div className="grid grid-cols-2 gap-1 text-center text-xs">
          <Stat value={ad.seats || 1}      label="Platser söks" color="blue" />
          <Stat value={(ad.costMode === 'fixed_price' && ad.price) ? ad.price : (ad.costMode === 'cost_share' && Number(ad.approxPrice) > 0) ? `ca ${Number(ad.approxPrice)}` : 'Flex'} label="Pris (kr)"    color="green"/>
        </div>
      </section>
      {/* Details */}
      <section className="p-2 space-y-1">
        {/* Dynamic samåkning summary */}
        <div className="p-2 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] italic">
          {buildSamakningSummary(ad)}
        </div>
        {/* حالة الإعلان */}
        <StatusBox unlocked={hasUnlocks} unlocksCount={unlocksCount} />
        {/* تعليق الراكب */}
        {ad.comment && (
          <InfoBox title="Din kommentar:" icon="💬">
            <p className="text-xs text-gray-600 whitespace-pre-wrap">{ad.comment}</p>
          </InfoBox>
        )}
        {/* معلومات الخصوصية */}
        <InfoBox title="Säkerhet & Sekretess:" icon="🔒" color="blue">
          <p className="text-xs text-blue-600">
            Dina kontaktuppgifter delas inte automatiskt. Du väljer själv när du vill dela dem i chatten.
          </p>
        </InfoBox>
        
        {/* Scroll down message if has unlocks */}
        {hasUnlocks && (
          <div className="mt-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-xl">
            <div className="flex items-center gap-2">
              <span className="text-2xl">👇</span>
              <div>
                <p className="font-bold text-blue-900">
                  {unlocksCount} {unlocksCount === 1 ? 'förare har' : 'förare har'} skickat meddelanden
                </p>
                <p className="text-xs text-blue-700">
                  Scrolla ner för att se alla konversationer
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* زر الحذف */}
        <footer className="pt-2 text-right">
            <button
              onClick={onDelete}
            className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-xs font-semibold transition-colors shadow-sm flex items-center gap-1"
            >
              🗑️ Radera annons
            </button>
        </footer>
      </section>
    </article>
  );
}

/* ────────── Sub-components ────────── */

const Stat = React.memo(({ value, label, color }) => (
  <div>
    <p className={`text-lg font-bold text-${color}-600`}>{value}</p>
    <p className="text-gray-600 text-xs">{label}</p>
  </div>
));

const StatusBox = ({ unlocked, unlocksCount = 0 }) => {
  const cfg = unlocked
    ? {
        bg: "bg-emerald-50 border-emerald-200",
        icon: "💬",
        title: `${unlocksCount} ${unlocksCount === 1 ? 'förare' : 'förare'} har kontaktat dig`,
        textColor: "text-emerald-600",
      }
    : {
        bg: "bg-blue-50 border-blue-200",
        icon: "👀",
        title: "Publicerad",
        textColor: "text-blue-600",
      };

  return (
    <div className={`p-3 rounded-lg border ${cfg.bg}`}>
      <div className="flex items-center gap-2 mb-1">
        <span className={`text-sm ${cfg.textColor}`}>{cfg.icon}</span>
        <span className={`font-semibold text-sm ${cfg.textColor.replace("600", "700")}`}>
          {cfg.title}
        </span>
      </div>
      <p className={`text-xs ${cfg.textColor}`}>
        {unlocked
          ? "Chatta med förare nedan. Dela kontaktuppgifter när du vill."
          : "Din annons är synlig. Meddelanden visas här."}
      </p>
    </div>
  );
};

const InfoBox = ({ title, icon, children, color = "gray" }) => {
  const palette = {
    blue:   { bg: "bg-blue-50",   border: "border-blue-200",   iconColor: "text-blue-500",   titleColor: "text-blue-700"   },
    gray:   { bg: "bg-gray-50",   border: "border-gray-200",   iconColor: "text-gray-500",   titleColor: "text-gray-700"   },
  }[color];

  return (
    <div className={`p-3 rounded-lg border ${palette.bg} ${palette.border}`}>
      <div className="flex items-start gap-2">
        <span className={`${palette.iconColor} text-sm`}>{icon}</span>
        <div className="space-y-1">
          {title && <p className={`font-medium text-sm ${palette.titleColor}`}>{title}</p>}
          {children}
        </div>
      </div>
    </div>
  );
};

/* ────────── PropTypes ────────── */
Stat.propTypes = {
  value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  label: PropTypes.string.isRequired,
  color: PropTypes.string.isRequired,
};

StatusBox.propTypes = {
  unlocked: PropTypes.bool.isRequired,
  unlocksCount: PropTypes.number,
};

InfoBox.propTypes = {
  title:    PropTypes.string,
  icon:     PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  color:    PropTypes.oneOf(["gray", "blue"]),
};

PassengerAdCard.propTypes = {
  ad:       PropTypes.object.isRequired,
  onDelete: PropTypes.func.isRequired,
  unlocks:  PropTypes.array,
};

export default React.memo(PassengerAdCard);

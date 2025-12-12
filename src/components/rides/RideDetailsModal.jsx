// src/components/rides/RideDetailsModal.jsx

import React, { useEffect, useMemo } from "react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import {
  FaSuitcase,
  FaSmoking,
  FaMusic,
  FaRegEdit,
  FaMoneyBillWave,
  FaMapMarkerAlt
} from "react-icons/fa";
import { extractCity } from "../../utils/address";
import { buildSamakningSummary, getWeekdayOptions } from "../../utils/rideSummary";

export default function RideDetailsModal({ ride, onClose }) {
  const navigate = useNavigate();

  // إغلاق بالـ Escape
  useEffect(() => {
    const handler = e => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  // تنسيق التاريخ والوقت
  const [dateStr, timeStr] = useMemo(() => {
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
  }, [ride.date, ride.departureTime]);

  // Sammanfattning som inkluderar återkommande och retur
  const summary = buildSamakningSummary(ride);

  const weekdayShortMap = useMemo(() => {
    const entries = getWeekdayOptions().map(o => [o.key, o.short]);
    return new Map(entries);
  }, []);
  const recurrenceDaysLabel = useMemo(() => {
    if (ride.recurrence !== "dagligen") return "";
    const keys = Array.isArray(ride.weekdays) ? ride.weekdays : [];
    const labels = keys.map(k => weekdayShortMap.get(k)).filter(Boolean);
    if (labels.length === 0) return "";
    if (labels.length === 1) return labels[0];
    if (labels.length === 2) return `${labels[0]} och ${labels[1]}`;
    return `${labels.slice(0, -1).join(", ")} och ${labels[labels.length - 1]}`;
  }, [ride.recurrence, ride.weekdays, weekdayShortMap]);

  // بادج الدور
  const badgeLabel =
    ride.role === "förare"
      ? "🚗 Förare – erbjuder samåkning"
      : "👤 Samåkare – söker platser";
  const badgeColor =
    ride.role === "förare" ? "bg-blue-600 text-white" : "bg-emerald-600 text-white";

  // زر الإجراء
  const main =
    ride.role === "förare"
      ? {
          text: "Boka plats",
          path: `/book-ride/${ride.id}`,
          bg: "bg-green-600 hover:bg-green-700"
        }
      : {
          text: "Lås kontakt",
          path: `/book-ride-passanger/${ride.id}`,
          bg: "bg-orange-500 hover:bg-orange-600"
        };

  // كل الخانات إن توفرت
  const rows = [
    // الموقع
    {
      icon: <FaMapMarkerAlt className="w-6 h-6 text-red-500" />,
      label: "Från",
      value: extractCity(ride.origin)
    },
    {
      icon: <FaMapMarkerAlt className="w-6 h-6 text-green-500" />,
      label: "Till",
      value: extractCity(ride.destination)
    },
    // التاريخ والوقت
    {
      icon: <span className="text-xl">📅</span>,
      label: "Datum",
      value: dateStr || "–"
    },
    {
      icon: <span className="text-xl">⏰</span>,
      label: "Tid",
      value: timeStr || "–"
    },
    ride.recurrence === "dagligen" && {
      icon: <span className="text-xl">🔁</span>,
      label: "Upprepning",
      value: `Återkommande${recurrenceDaysLabel ? ` (${recurrenceDaysLabel})` : ""}`
    },
    ride.roundTrip && {
      icon: <span className="text-xl">↔︎</span>,
      label: "Retur",
      value: `${ride.returnDate && ride.returnDate !== ride.date ? `${new Date(`${ride.returnDate}T${ride.returnTime || "00:00"}`).toLocaleDateString("sv-SE", { weekday: "short", day: "numeric", month: "short" })}, ` : ""}${ride.returnTime ? `kl ${ride.returnTime}` : "Tid ej angiven"}`
    },
    // العدد
    {
      icon: <FaSuitcase className="w-6 h-6 text-gray-500" />,
      label: ride.role === "förare" ? "Platser" : "Personer",
      value: ride.count
    },
    // السعر (إن وجد للسائق)
    ride.role === "förare" &&
      ride.price && {
        icon: <FaMoneyBillWave className="w-6 h-6 text-yellow-600" />,
        label: "Pris",
        value: `${ride.price} kr`
      },
    // رخصة التدخين
    ride.smokingAllowed && {
      icon: (
        <FaSmoking
          className={`w-6 h-6 ${
            ride.smokingAllowed === "yes" ? "text-green-600" : "text-red-600"
          }`}
        />
      ),
      label: "Rökning",
      value: ride.smokingAllowed === "yes" ? "Tillåten" : "Ej tillåten"
    },
    // تفضيل الموسيقى
    ride.musicPreference && {
      icon: <FaMusic className="w-6 h-6 text-blue-400" />,
      label: "Musik",
      value: ride.musicPreference
    },
    // معلومات السيارة (للداريفر)
    ride.carBrand &&
      ride.role === "förare" && {
        icon: <span className="text-2xl">🚗</span>,
        label: "Bil",
        value: `${ride.carBrand} ${ride.carModel || ""}`
      },
    ride.licensePlate &&
      ride.role === "förare" && {
        icon: <span className="text-2xl">🔢</span>,
        label: "Reg.nr",
        value: ride.licensePlate
      },
    // الملاحظات
    ride.notes && {
      icon: <FaRegEdit className="w-6 h-6 text-gray-400" />,
      label: "Övrigt",
      value: ride.notes
    }
  ]
    // احتفظ فقط بالعناصر التي تملك قيمة موجودة
    .filter(Boolean);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md sm:max-w-lg p-6 max-h-[90vh] overflow-auto border border-gray-200 dark:border-slate-700">
        {/* زر الإغلاق */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-2xl text-gray-400 hover:text-brand transition"
          aria-label="Stäng"
        >
          &times;
        </button>

        {/* العنوان والبادج */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 mb-4">
          <h2 className="text-2xl font-bold text-brand">Resedetaljer</h2>
          <span className={`px-3 py-1 rounded-full text-sm font-semibold shadow-sm ${badgeColor}`}>
            {badgeLabel}
          </span>
        </div>

        {/* الملخص */}
        <div className="text-center italic text-gray-700 dark:text-gray-300 mb-4 text-sm">
          {summary}
        </div>

        {/* عرض كل الخانات */}
        <section className="bg-blue-50 dark:bg-slate-800/40 rounded-lg divide-y divide-gray-200 dark:divide-slate-700 mb-6">
          {rows.map((r, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-2 text-sm">
              <span className="mt-1 text-lg">{r.icon}</span>
              <div className="flex-1">
                <div className="font-semibold text-gray-600 dark:text-gray-300">{r.label}</div>
                <div className="font-medium text-gray-900 dark:text-slate-200">{r.value}</div>
              </div>
            </div>
          ))}
        </section>

        {/* زر الإجراء وتنبيه الركاب */}
        <div className="flex flex-col items-center gap-3">
          <button
            onClick={() => navigate(main.path)}
            className={`${main.bg} text-white px-6 py-2 rounded-full font-semibold w-full max-w-xs transition text-lg`}
          >
            {main.text}
          </button>
          {ride.role === "passagerare" && (
            <p className="text-xs text-gray-500 text-center">
              Lås upp kontaktuppgifter för att få förarens mail & telefon. Ansvar för resa och betalning ligger hos användarna.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

RideDetailsModal.propTypes = {
  ride: PropTypes.object.isRequired,
  onClose: PropTypes.func.isRequired
};

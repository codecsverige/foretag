import React from "react";
import PropTypes from "prop-types";
import { HiMoon, HiSun, HiPlus } from "react-icons/hi2";
import { useNavigate } from "react-router-dom";
import SearchBar from "./SearchBar";
import FilterChip from "./FilterChip";
import { getCitySuggestions } from "../../utils/citySearch";

/**
 * RideFilters – شريط الفلاتر المتقدم لتطبيق samåkning
 */
export default function RideFilters({ filters, setFilters }) {
  const navigate = useNavigate();
  const [showAdvanced, setShowAdvanced] = React.useState(false);
  const [fromInput, setFromInput] = React.useState(filters.from || "");
  const [toInput, setToInput] = React.useState(filters.to || "");
  const [fromSug, setFromSug] = React.useState([]);
  const [toSug, setToSug] = React.useState([]);
  const [showFromSug, setShowFromSug] = React.useState(false);
  const [showToSug, setShowToSug] = React.useState(false);
  const fromRef = React.useRef(null);
  const toRef = React.useRef(null);
  const fromSugRef = React.useRef(null);
  const toSugRef = React.useRef(null);
  
  // تفعيل الوضع الليلي
  const toggleDark = () => {
    const cls = document.documentElement.classList;
    cls.toggle("dark");
    localStorage.theme = cls.contains("dark") ? "dark" : "light";
  };
  // تحديث قيمة في الفلاتر
  const set = (k, v) => setFilters(prev => ({ ...prev, [k]: v }));
  const clear = k => setFilters(prev => ({ ...prev, [k]: "" }));
  const resetAll = () =>
    setFilters({ from: "", to: "", date: "", timeFrom: "", timeTo: "", text: "", role: "", sort: "tidigast" });

  // Sync inputs when filters change externally
  React.useEffect(() => { setFromInput(filters.from || ""); }, [filters.from]);
  React.useEffect(() => { setToInput(filters.to || ""); }, [filters.to]);

  // Debounced suggestions for From/To
  React.useEffect(() => {
    const h = setTimeout(async () => {
      if ((fromInput || "").trim().length >= 2) {
        try { const s = await getCitySuggestions(fromInput); setFromSug(s); } catch {}
      } else setFromSug([]);
    }, 180);
    return () => clearTimeout(h);
  }, [fromInput]);
  React.useEffect(() => {
    const h = setTimeout(async () => {
      if ((toInput || "").trim().length >= 2) {
        try { const s = await getCitySuggestions(toInput); setToSug(s); } catch {}
      } else setToSug([]);
    }, 180);
    return () => clearTimeout(h);
  }, [toInput]);

  const pickFrom = (label) => {
    setFromInput(label);
    set("from", label);
    setShowFromSug(false);
  };
  const pickTo = (label) => {
    setToInput(label);
    set("to", label);
    setShowToSug(false);
  };
  const swapFromTo = () => {
    const a = fromInput;
    const b = toInput;
    setFromInput(b);
    setToInput(a);
    set("from", b);
    set("to", a);
  };
  const handleBlurFrom = () => {
    setTimeout(() => {
      if (!fromSugRef.current?.contains(document.activeElement)) setShowFromSug(false);
    }, 120);
  };
  const handleBlurTo = () => {
    setTimeout(() => {
      if (!toSugRef.current?.contains(document.activeElement)) setShowToSug(false);
    }, 120);
  };

  // الفلاتر المفعلة كشيبس
  const chips = [
    filters.role && {
      key: "role",
      label:
        filters.role === "förare"
          ? "Jag samåker – erbjuder plats"
          : "Jag vill samåka – söker plats"
    },
    filters.date && { key: "date", label: filters.date },
    (filters.timeFrom && filters.timeTo) && { key: "timeFrom", label: `${filters.timeFrom}–${filters.timeTo}` },
    filters.text && { key: "text", label: `”${filters.text}”` }
  ].filter(Boolean);

  return (
    <header className="sticky top-0 z-40 bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border-b border-gray-200 dark:border-slate-800 shadow-sm">
      <div className="max-w-7xl mx-auto flex flex-col gap-3 p-2.5 sm:p-3">

        {/* بحث نصي مركزي */}
        <SearchBar
          value={filters.text}
          onChange={(v) => {
            set("text", v);
            try {
              const s = String(v || '');
              const seps = ["→","->"," till "," to "," - "];
              for (const sep of seps) {
                if (s.includes(sep)) {
                  const parts = s.split(sep);
                  const a = (parts[0] || '').trim();
                  const b = (parts[1] || '').trim();
                  if (a && b) { set("from", a); set("to", b); }
                  break;
                }
              }
            } catch {}
          }}
          placeholder="Sök efter stad, rutt (t.ex. Stockholm → Göteborg)…"
        />

        {/* Essential filters – always visible */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[11px] mt-1">
          {/* Alla */}
          <label className="flex items-center gap-1 font-semibold">
            <input
              type="radio"
              checked={!filters.role}
              onChange={() => set("role", "")}
              className="accent-brand"
            />
            Alla
          </label>
          {/* Förare */}
          <label className="flex items-center gap-1 font-semibold">
            <input
              type="radio"
              checked={filters.role === "förare"}
              onChange={() => set("role", "förare")}
              className="accent-brand"
            />
            🚗 Jag erbjuder samåkning
          </label>
          {/* Passagerare */}
          <label className="flex items-center gap-1 font-semibold">
            <input
              type="radio"
              checked={filters.role === "passagerare"}
              onChange={() => set("role", "passagerare")}
              className="accent-brand"
            />
            👤 Jag söker samåkning
          </label>

          {/* Datum */}
          <div className="relative">
            <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">📅</span>
            <input
              type="date"
              value={filters.date}
              onChange={e => set("date", e.target.value)}
              className="h-8 border border-gray-200 dark:border-slate-700 rounded pl-7 pr-2 text-xs dark:bg-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand/30"
              aria-label="Datum"
            />
          </div>

          {/* Skapa resa */}
          <button
            onClick={() => navigate("/create-ride")}
            className="bg-brand hover:bg-brand-dark text-white px-4 py-2 rounded-full font-semibold text-xs flex items-center gap-2 shadow-sm hover:shadow-md transition-all duration-200"
          >
            <HiPlus className="w-4 h-4" />
            Skapa resa
          </button>

          {/* Dag-/nattläge */}
          <div className="ml-auto flex gap-1">
            <button
              aria-label="Växla dag-/nattläge"
              type="button"
              className="p-1 rounded hover:bg-yellow-100 dark:hover:bg-slate-800"
              onClick={toggleDark}
            >
              <HiSun className="w-4 h-4 dark:hidden text-yellow-500" />
              <HiMoon className="w-4 h-4 hidden dark:block text-slate-200" />
            </button>
          </div>
        </div>

        {/* Toggle advanced filters under essentials */}
        <div className="flex items-center justify-end -mt-1">
          <button type="button" onClick={() => setShowAdvanced(v => !v)} className="text-[11px] text-gray-600 dark:text-gray-300 underline">
            {showAdvanced ? 'Dölj filter' : 'Visa filter'}
          </button>
        </div>

        {/* From / To with smart suggestions */}
        {showAdvanced && (
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-2 sm:gap-3">
          <div className="relative">
            <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-sm">📍</span>
            <input
              ref={fromRef}
              value={fromInput}
              onChange={e => setFromInput(e.target.value)}
              onFocus={() => setShowFromSug(true)}
              onBlur={handleBlurFrom}
              placeholder="Från (stad/gata)"
              className="w-full h-9 border border-gray-200 dark:border-slate-700 rounded-xl pl-8 pr-3 text-sm dark:bg-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand/30"
            />
            {showFromSug && fromSug.length > 0 && (
              <div ref={fromSugRef} className="absolute z-50 mt-1 left-0 right-0 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl shadow-xl max-h-72 overflow-y-auto">
                {fromSug.map((s, i) => (
                  <button key={i} onClick={() => pickFrom(s.label || s.city || "")} className="w-full text-left px-3 py-2 hover:bg-blue-50 dark:hover:bg-slate-800">
                    {(s.label || s.city || "").slice(0, 120)}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button onClick={swapFromTo} className="px-2.5 h-9 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-sm font-semibold hover:bg-gray-100 dark:hover:bg-slate-700" aria-label="Växla från och till">⇄</button>
          <div className="relative">
            <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-sm">📍</span>
            <input
              ref={toRef}
              value={toInput}
              onChange={e => setToInput(e.target.value)}
              onFocus={() => setShowToSug(true)}
              onBlur={handleBlurTo}
              placeholder="Till (stad/gata)"
              className="w-full h-9 border border-gray-200 dark:border-slate-700 rounded-xl pl-8 pr-3 text-sm dark:bg-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand/30"
            />
            {showToSug && toSug.length > 0 && (
              <div ref={toSugRef} className="absolute z-50 mt-1 left-0 right-0 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl shadow-xl max-h-72 overflow-y-auto">
                {toSug.map((s, i) => (
                  <button key={i} onClick={() => pickTo(s.label || s.city || "")} className="w-full text-left px-3 py-2 hover:bg-blue-50 dark:hover:bg-slate-800">
                    {(s.label || s.city || "").slice(0, 120)}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        )}

        {/* Time filters - only when advanced is shown */}
        {showAdvanced && (
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[11px] mt-1">
          {/* وقت الرحلة */}
          <div className="flex items-center gap-1">
            <div className="relative">
              <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">⏰</span>
              <input
                type="time"
                value={filters.timeFrom || ""}
                onChange={e => set("timeFrom", e.target.value)}
                className="h-8 border border-gray-200 dark:border-slate-700 rounded pl-7 pr-2 text-xs dark:bg-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand/30"
                aria-label="Starttid"
              />
            </div>
            <span className="text-gray-500">–</span>
            <div className="relative">
              <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">⏰</span>
              <input
                type="time"
                value={filters.timeTo || ""}
                onChange={e => set("timeTo", e.target.value)}
                className="h-8 border border-gray-200 dark:border-slate-700 rounded pl-7 pr-2 text-xs dark:bg-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand/30"
                aria-label="Sluttid"
              />
            </div>
          </div>
        </div>
        )}

        {/* الفلاتر المفعلة */}
        {chips.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            {chips.map(c => (
              <FilterChip
                key={c.key}
                label={c.label}
                onRemove={() => clear(c.key)}
              />
            ))}
            <button
              onClick={resetAll}
              className="text-xs underline text-brand ml-2"
            >
              Rensa alla
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

RideFilters.propTypes = {
  filters: PropTypes.object.isRequired,
  setFilters: PropTypes.func.isRequired
};

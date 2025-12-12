import React, {
  useRef, useState, useMemo, useCallback, useEffect
} from "react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import { HiArrowUpRight } from "react-icons/hi2";

import usePaginatedRides from "../../hooks/usePaginatedRides";
import useBookedSeats    from "../../hooks/useBookedSeats";
import RideCard          from "./RideCard";
import { RideGridSkeleton } from "../SkeletonLoader";
import EmptyState from "../EmptyState";
import { extractCity }   from "../../utils/address";
import { where as fwWhere } from "firebase/firestore";

/* ـــــــــــــــــــــــــــــــــــــــــــــــــــــــــــــــــ */
const mapRole = raw => {
  if (!raw) return "";
  const r = raw.toLowerCase();
  if (r.startsWith("fö") || r.startsWith("dri")) return "förare";
  if (r.startsWith("pass"))                return "passagerare";
  return r;
};
/* ـــــــــــــــــــــــــــــــــــــــــــــــــــــــــــــــــ */

export default function RideGrid({ filters, onRidesChange, directRideId, onSearchChange }) {
  // Server-side conditions: keep minimal to avoid excluding old documents (no status/role filters)
  const conditions = useMemo(() => {
    const c = [];
    if (filters.date) c.push(fwWhere('date', '==', String(filters.date)));
    if (filters.roundTripOnly) c.push(fwWhere('roundTrip', '==', true));
    return c;
  }, [filters.date, filters.roundTripOnly]);

  const orderByField = filters.date ? 'createdAt' : 'createdAt';
  const orderDir = 'desc';
  const cacheKey = useMemo(() => {
    const parts = [filters.from||'', filters.to||'', filters.date||'', filters.role||''];
    return `grid_${parts.join('|').toLowerCase()}`;
  }, [filters.from, filters.to, filters.date, filters.role]);
  const { rides, loading, eof, fetchPage, reset } = usePaginatedRides({ conditions, orderByField, orderDir, pageSize: 24, cacheKey });
  const navigate = useNavigate();
  const [modalOpenForId, setModalOpenForId] = useState(null);

  /* ‑‑‑ تأكّد من إعادة الضبط عند تغيّر الفلاتر (إعادة جلب من الصفحة الأولى) ‑‑‑ */
  useEffect(() => { reset(); }, [filters, reset]);

  /* ‑‑‑ Handle direct ride link ‑‑‑ */
  useEffect(() => {
    if (directRideId) {
      setModalOpenForId(directRideId);
    }
  }, [directRideId]);

  const { role: fRole, date: fDate, time: fTime, text: fText, roundTripOnly: fRoundTripOnly, recurrence: fRecurrence, sort: fSort = "tidigast", timeFlex: fTimeFlex = 0 } = filters;

  /* ‑‑‑ قائمة الرحلات المرشَّحة + ترتيب بالملاءمة ‑‑‑ */
  const shownRides = useMemo(() => {
    const isExpiredLocal = (r) => {
      try {
        const tz = 'Europe/Stockholm';
        const nowDate = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
        const nowTime = new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour12: false, hour: '2-digit', minute: '2-digit' }).format(new Date());
        const d = String(r.date || '').slice(0,10);
        const t = String(r.departureTime || '00:00').slice(0,5);
        if (!d) return false;
        if (d < nowDate) return true;
        if (d > nowDate) return false;
        return t <= nowTime;
      } catch { return false; }
    };

    const filtered = rides.filter(r => {
      // لا نخفي الإعلانات المنتهية؛ ستظهر مع وسم في البطاقة
      // لا تُخفِ إعلانات الراكب حتى لو كانت contact_unlock (اعرض شارة لاحقاً)

      if (fRole && mapRole(r.role) !== fRole)                     return false;
      if (fDate && r.date !== fDate)                             return false;
      if (fTime && !(r.departureTime || "").startsWith(fTime))   return false;
      if (fRoundTripOnly && !r.roundTrip)                         return false;
      if (fRecurrence && (r.recurrence || "") !== fRecurrence)   return false;

      if (fText) {
        const haystack = `${r.origin || ""} ${r.destination || ""} ${r.notes || ""}`.toLowerCase();
        if (!haystack.includes((fText || "").toLowerCase()))     return false;
      }
      // Stronger city filter when from/to set (match using extractCity)
      if (filters.from) {
        const fo = normalize(extractCity(r.origin || ""));
        if (!fo.includes(normalize(filters.from))) return false;
      }
      if (filters.to) {
        const td = normalize(extractCity(r.destination || ""));
        if (!td.includes(normalize(filters.to))) return false;
      }
      // Do not hide older rides; show everything and mark expired elsewhere
      return true;
    });

    const normalize = (s) => (s || "").toLowerCase();
    const parseTime = (t) => {
      if (!t) return null;
      const [hh, mm] = String(t).split(":").map(Number);
      if (Number.isFinite(hh) && Number.isFinite(mm)) return hh * 60 + mm;
      return null;
    };

    const q = normalize(fText);
    const qFromTo = (() => {
      if (!q) return { from: "", to: "" };
      const seps = ["→", "->", " till ", "-", " to "];
      for (const s of seps) {
        if (q.includes(s)) {
          const [a, b] = q.split(s);
          return { from: a.trim(), to: (b || "").trim() };
        }
      }
      return { from: "", to: "" };
    })();

    const now = Date.now();
    const fTimeMin = parseTime(fTime);
    const flex = Math.max(0, Number(fTimeFlex) || 0);

    const scoreRide = (r) => {
      let score = 0;
      const orig = extractCity(r.origin || "");
      const dest = extractCity(r.destination || "");
      const nOrig = normalize(orig);
      const nDest = normalize(dest);
      const notes = normalize(r.notes || "");

      // نص البحث: مكافأة لذكر المدن
      if (q) {
        const hasOrig = q.includes(nOrig) || (qFromTo.from && nOrig.includes(qFromTo.from));
        const hasDest = q.includes(nDest) || (qFromTo.to && nDest.includes(qFromTo.to));
        if (hasOrig && hasDest) score += 1200;
        else if (hasOrig)       score += 500;
        else if (hasDest)       score += 500;
        if (notes && notes.includes(q)) score += 150;
      }

      // تقارب الوقت إذا تم تحديده
      if (fTimeMin != null) {
        const rideMin = parseTime(r.departureTime);
        if (rideMin != null) {
          const diff = Math.abs(rideMin - fTimeMin);
          const within = diff <= flex;
          score += within ? 400 : Math.max(0, 300 - diff);
        }
      }

      // القرب الزمني (قريب قادم أولاً) عندما لا يوجد تاريخ محدد
      if (!fDate && r.date) {
        try {
          const dt = new Date(`${r.date}T${r.departureTime || "00:00"}`).getTime();
          const deltaHours = (dt - now) / 36e5; // بالساعات
          // مكافأة معتدلة للرحلات القادمة خلال 0..72 ساعة
          if (deltaHours >= 0) score += Math.max(0, 200 - Math.min(200, Math.abs(deltaHours - 24)) * 2);
        } catch {}
      }

      // رحلات السائقين لها أفضلية طفيفة لأنها قابلة للحجز فورًا
      if (mapRole(r.role) === "förare") score += 50;

      return score;
    };

    // Inject a lightweight hint into ride object if unlock-shared flag exists (UI-only)
    const withHints = filtered.map((r) => {
      try {
        const raw = sessionStorage.getItem(`ride_unlock_shared_${r.id}`);
        if (!raw) return r;
        const info = JSON.parse(raw);
        return { ...r, _unlockShared: info };
      } catch { return r; }
    });

    // Helper: non-expired first
    const expiredOrder = (a, b) => {
      const ea = isExpiredLocal(a);
      const eb = isExpiredLocal(b);
      if (ea !== eb) return ea ? 1 : -1; // expired last
      return 0;
    };

    let sorted = withHints.slice();
    if (fSort === "tidigast") {
      sorted.sort((a, b) => {
        const eo = expiredOrder(a, b);
        if (eo !== 0) return eo;
        const ta = new Date(`${a.date}T${a.departureTime || "00:00"}`).getTime();
        const tb = new Date(`${b.date}T${b.departureTime || "00:00"}`).getTime();
        return (ta || 0) - (tb || 0);
      });
    } else if (fSort === "billigast") {
      sorted.sort((a, b) => {
        const eo = expiredOrder(a, b);
        if (eo !== 0) return eo;
        return (Number(a.price) || 0) - (Number(b.price) || 0);
      });
    } else {
      sorted.sort((a, b) => {
        const eo = expiredOrder(a, b);
        if (eo !== 0) return eo;
        const sa = scoreRide(a);
        const sb = scoreRide(b);
        if (sb !== sa) return sb - sa;
        const ta = new Date(`${a.date}T${a.departureTime || "00:00"}`).getTime();
        const tb = new Date(`${b.date}T${b.departureTime || "00:00"}`).getTime();
        return (ta || 0) - (tb || 0);
      });
    }

    return sorted;
  }, [rides, fRole, fDate, fTime, fText, fRoundTripOnly, fRecurrence, fSort, fTimeFlex]);

  // Informer le parent du nombre de trajets
  useEffect(() => {
    if (onRidesChange) {
      onRidesChange(shownRides.length > 0);
    }
  }, [shownRides.length, onRidesChange]);

  /* ‑‑‑ lazy‑load (Infinite Scroll) ‑‑‑ */
  const sentinel = useRef(null);
  useEffect(() => {
    if (!sentinel.current) return;
    const io = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting && !loading && !eof) fetchPage(); },
      { rootMargin: "600px" }
    );
    io.observe(sentinel.current);
    return () => io.disconnect();
  }, [fetchPage, loading, eof]);

  /* ‑‑‑ راقِب العناصر لتحديد أيّها ظاهر من أجل جلب عدد المقاعد فقط لها ‑‑‑ */
  const [visible, setVisible] = useState([]);
  const visObserver = useRef(null);

  if (!visObserver.current) {
    visObserver.current = new IntersectionObserver(
      entries => {
        setVisible(prev => {
          const setIds = new Set(prev);
          entries.forEach(ent => {
            const id = ent.target.dataset.id;
            if (ent.isIntersecting) setIds.add(id); else setIds.delete(id);
          });
          return [...setIds];
        });
      },
      { rootMargin: "400px" }
    );
  }

  const observeCard = useCallback(el => {
    if (!el) return;
    visObserver.current.observe(el);
    // Ne pas retourner de fonction ici
  }, []);

  const seatsMap = useBookedSeats(visible);

  /* ‑‑‑ حالات التحميل / لا نتائج ‑‑‑ */
  if (shownRides.length === 0 && loading) {
    return <RideGridSkeleton count={6} />;
  }
  if (shownRides.length === 0) {
    const searchQuery = filters.text || (filters.from && filters.to ? `${filters.from} ${filters.to}` : '');
    return <EmptyState searchQuery={searchQuery} onSearchChange={onSearchChange} currentFilters={filters} />;
  }

  return (
    <>
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {shownRides.map(r => (
          <div
            key={r.id}
            data-id={r.id}
            ref={observeCard}
            className="w-full flex justify-center"
          >
            <RideCard ride={r} bookedSeats={seatsMap[r.id] || 0} />
          </div>
        ))}
      </div>

      <div ref={sentinel} className="h-1" />

      {loading && (
        <p className="text-center text-gray-500 py-4 text-sm">
          🔄 Hämtar fler samåkningar…
        </p>
      )}
    </>
  );
}

RideGrid.propTypes = {
  filters: PropTypes.shape({
    role: PropTypes.string,
    date: PropTypes.string,
    time: PropTypes.string,
    text: PropTypes.string
  }),
  onRidesChange: PropTypes.func
};
RideGrid.defaultProps = { filters: {} };

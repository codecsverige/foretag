import { useState, useEffect, useCallback, useRef } from "react";
import { db } from "../firebase/firebase.js";
import {
  collection,
  query,
  orderBy,
  limit,
  startAfter,
  getDocs,
  onSnapshot,
  where
} from "firebase/firestore";

const DEFAULT_PAGE_SIZE = 24;

/* ـــــــــــــــــــــــــــــــــــــــــــــــــــــــــــــــــ */
export default function usePaginatedRides({ conditions = [], orderByField = "createdAt", orderDir = "desc", pageSize = DEFAULT_PAGE_SIZE, cacheKey } = {}) {

  const [rides,  setRides]  = useState([]);
  const [last,   setLast]   = useState(null);
  const [loading,setLoading]= useState(true);
  const [eof,    setEof]    = useState(false);

  const fetching = useRef(false);
  const cachePrimed = useRef(false);

  /* ‑‑‑ باني الاستعلام (قابل لإعادة الاستخدام) ‑‑‑ */
  const buildQuery = () => {
    let q = query(
      collection(db, "rides"),
      ...conditions,
      orderBy(orderByField, orderDir),
      limit(pageSize)
    );
    if (last) q = query(q, startAfter(last));
    return q;
  };

  /* ‑‑‑ جلب صفحة واحدة ‑‑‑ */
  const fetchPage = useCallback(async () => {
    if (eof || fetching.current) return;
    setLoading(true);
    fetching.current = true;

    try {
      // Add network timeout and limited retries with backoff
      const tryFetch = async (attempt = 1) => {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 9000);
        try {
          const snap = await getDocs(buildQuery());
          clearTimeout(timeout);
          return snap;
        } catch (err) {
          clearTimeout(timeout);
          if (attempt < 2) {
            // brief backoff then retry once
            await new Promise(r => setTimeout(r, 600 * attempt));
            return tryFetch(attempt + 1);
          }
          throw err;
        }
      };

      const snap = await tryFetch();
      const rows = snap.docs.map(d => ({ id: d.id, ...d.data() }));

      setRides(prev => {
        const seen = new Set(prev.map(r => r.id));
        return [...prev, ...rows.filter(r => !seen.has(r.id))];
      });

      setLast(snap.docs[snap.docs.length - 1] || null);
      if (snap.size < pageSize) setEof(true);
      // Save first page to cache for faster next mount
      try {
        if (cacheKey && !last) {
          localStorage.setItem(`rides_cache_${cacheKey}`, JSON.stringify({ data: rows, ts: Date.now() }));
        }
      } catch {}
    } catch (err) {
      console.error("🔥 Error fetching paginated rides:", err?.message || err);
    } finally {
      setLoading(false);
      fetching.current = false;
    }
  }, [last, eof, conditions, buildQuery]);

  /* ‑‑‑ إعادة ضبط الذاكرة عند تغيّر الشروط (أو عند طلب صريح) ‑‑‑ */
  const reset = useCallback(() => {
    setRides([]);
    setLast(null);
    setEof(false);
    setLoading(true);
  }, []);

  /* ‑‑‑ حمِّل الصفحة الأولى ‑‑‑ */
  useEffect(() => { fetchPage(); }, [fetchPage]);

  /* ‑‑‑ إظهار نتائج من cache فوراً لتحسين سرعة الظهور ‑‑‑ */
  useEffect(() => {
    if (!cacheKey || cachePrimed.current) return;
    try {
      const raw = localStorage.getItem(`rides_cache_${cacheKey}`);
      if (!raw) return;
      const { data, ts } = JSON.parse(raw);
      if (!Array.isArray(data)) return;
      const TTL = 3 * 60 * 1000; // 3 min
      if (Date.now() - (ts || 0) > TTL) return;
      setRides(data);
      setLoading(false);
      cachePrimed.current = true;
    } catch {}
  }, [cacheKey]);

  /* ‑‑‑ أعد التحميل تلقائيًا بعد reset ‑‑‑ */
  useEffect(() => { if (loading && rides.length === 0) fetchPage(); }, [loading, rides.length, fetchPage]);

  /* ‑‑‑ تحديث فوري للجديد فقط: استمع لما بعد أحدث عنصر لديك ‑‑‑ */
  useEffect(() => {
    if (rides.length === 0) return; // انتظر الصفحة الأولى
    const top = rides[0]?.createdAt;
    if (!top) return;

    const qNew = query(
      collection(db, "rides"),
      ...conditions,
      orderBy("createdAt", "asc"),
      where("createdAt", ">", top),
      limit(Math.min(20, pageSize || DEFAULT_PAGE_SIZE))
    );

    const unsubscribe = onSnapshot(qNew, (snapshot) => {
      const adds = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      if (adds.length === 0) return;

      setRides(prev => {
        const existing = new Set(prev.map(r => r.id));
        const uniqueAdds = adds.filter(r => !existing.has(r.id));
        if (uniqueAdds.length === 0) return prev;
        // نحافظ على ترتيب desc عبر عكس المجموعة الصاعدة
        return [...uniqueAdds.reverse(), ...prev];
      });

      setLoading(false);

      // update cache head
      try {
        if (cacheKey) {
          const existing = Array.isArray(rides) ? rides : [];
          const existingIds = new Set(existing.map(r => r.id));
          const uniqueAdds = adds.filter(r => !existingIds.has(r.id));
          const head = [...uniqueAdds.reverse(), ...existing].slice(0, pageSize);
          localStorage.setItem(`rides_cache_${cacheKey}`, JSON.stringify({ data: head, ts: Date.now() }));
        }
      } catch {}
    }, (err) => {
      console.warn("Realtime rides listener error:", err);
    });

    return () => unsubscribe();
  }, [conditions, rides, pageSize]);

  return { rides, loading, eof, fetchPage, reset };
}

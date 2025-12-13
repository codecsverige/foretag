import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { collection, getDocs, limit, orderBy, query } from "firebase/firestore";
import { db } from "../../firebase/firebase.js";

function norm(v) {
  return String(v || "").trim().toLowerCase();
}

function ListingCard({ item }) {
  const title = item?.title || "Annons";
  const company = item?.companyName || item?.businessName || "";
  const city = item?.city || "";
  const category = item?.category || "";
  const price = item?.price;
  const currency = item?.currency || "SEK";
  const durationMin = item?.durationMin;
  const imageUrl = item?.imageUrl || "";

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm hover:shadow-md transition overflow-hidden">
      {imageUrl ? (
        <div className="h-40 w-full bg-gray-100 dark:bg-slate-700 overflow-hidden">
          {/* eslint-disable-next-line jsx-a11y/img-redundant-alt */}
          <img src={imageUrl} alt={title} className="h-full w-full object-cover" loading="lazy" />
        </div>
      ) : (
        <div className="h-40 w-full bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-700 dark:to-slate-600" />
      )}

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-sm font-extrabold text-gray-900 dark:text-white truncate">{title}</h3>
            {company ? <p className="text-xs text-gray-600 dark:text-gray-300 truncate">{company}</p> : null}
          </div>
          {typeof price === "number" || norm(price) ? (
            <div className="text-right shrink-0">
              <div className="text-sm font-extrabold text-gray-900 dark:text-white">
                {price} {currency}
              </div>
              {durationMin ? <div className="text-xs text-gray-600 dark:text-gray-300">{durationMin} min</div> : null}
            </div>
          ) : null}
        </div>

        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          {city ? (
            <span className="px-2 py-1 rounded-full bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-200">
              {city}
            </span>
          ) : null}
          {category ? (
            <span className="px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
              {category}
            </span>
          ) : null}
        </div>

        {item?.description ? (
          <p className="mt-3 text-xs text-gray-600 dark:text-gray-300 line-clamp-2">{item.description}</p>
        ) : null}

        <div className="mt-4">
          <Link
            to="/create-ride"
            className="inline-flex items-center justify-center w-full px-3 py-2 rounded-xl bg-gray-900 text-white text-xs font-bold hover:bg-gray-800 transition"
          >
            Skapa annons
          </Link>
        </div>
      </div>
    </div>
  );
}

// Signature kept compatible with existing SearchDynamic props.
export default function ListingGrid({ filters, onRidesChange }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setErr("");
      try {
        // Keep query simple: avoid composite index requirements.
        const q = query(collection(db, "listings"), orderBy("createdAt", "desc"), limit(60));
        const snap = await getDocs(q);
        if (!alive) return;
        const next = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setItems(next);
        try {
          onRidesChange && onRidesChange(next.length > 0);
        } catch {}
      } catch (e) {
        if (!alive) return;
        setErr(e?.message || "Kunde inte hämta annonser.");
        try {
          onRidesChange && onRidesChange(false);
        } catch {}
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [onRidesChange]);

  const filtered = useMemo(() => {
    const text = norm(filters?.text);
    const cityCandidate = norm(filters?.from || filters?.to);

    return items.filter((it) => {
      if (cityCandidate) {
        const itCity = norm(it?.city);
        if (!itCity.includes(cityCandidate)) return false;
      }

      if (text) {
        const hay = norm(
          [it?.title, it?.companyName, it?.businessName, it?.category, it?.city, it?.description]
            .filter(Boolean)
            .join(" ")
        );
        if (!hay.includes(text)) return false;
      }

      return true;
    });
  }, [filters?.from, filters?.to, filters?.text, items]);

  if (loading) {
    return <div className="py-10 text-center text-sm text-gray-600 dark:text-gray-300">Laddar annonser…</div>;
  }

  if (err) {
    return <div className="py-10 text-center text-sm text-rose-600">{err}</div>;
  }

  if (filtered.length === 0) {
    return (
      <div className="py-10 text-center">
        <div className="text-sm font-bold text-gray-900 dark:text-white">Inga annonser hittades</div>
        <div className="mt-1 text-xs text-gray-600 dark:text-gray-300">Skapa en annons för att testa flödet.</div>
        <div className="mt-4">
          <Link
            to="/create-ride"
            className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-gray-900 text-white text-sm font-bold hover:bg-gray-800 transition"
          >
            Skapa annons
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {filtered.map((it) => (
        <ListingCard key={it.id} item={it} />
      ))}
    </div>
  );
}


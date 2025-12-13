import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { collection, getDocs, limit, orderBy, query, where } from "firebase/firestore";
import { db } from "../firebase/firebase.js";
import PageMeta from "../components/PageMeta.jsx";

function ListingCard({ item }) {
  const price = Number(item.price || 0);
  const durationMin = Number(item.durationMin || 0);
  const city = item.city || "";
  const title = item.title || item.serviceName || "Tjänst";
  const businessName = item.businessName || "Företag";
  const imageUrl = item.imageUrl || "";
  const href = item.businessId ? `/business/${item.businessId}` : "/businesses";

  return (
    <Link
      to={href}
      className="group overflow-hidden rounded-2xl border border-gray-200 bg-white hover:shadow-lg transition"
    >
      <div className="h-40 bg-gradient-to-br from-blue-50 to-emerald-50 relative">
        {imageUrl ? (
          // eslint-disable-next-line jsx-a11y/img-redundant-alt
          <img src={imageUrl} alt={title} className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center">
              <div className="text-sm font-semibold text-gray-700">{businessName}</div>
              <div className="text-xs text-gray-500 mt-1">{city || "Sverige"}</div>
            </div>
          </div>
        )}
        <div className="absolute top-3 left-3">
          <span className="text-xs px-2 py-1 rounded-full bg-white/90 border border-gray-200 text-gray-800">
            {city || "Sverige"}
          </span>
        </div>
      </div>

      <div className="p-4">
        <div className="text-sm text-gray-600">{businessName}</div>
        <div className="mt-1 text-lg font-extrabold text-gray-900 group-hover:text-blue-700 transition">
          {title}
        </div>

        <div className="mt-2 flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-gray-900">
            {price} {item.currency || "SEK"}
          </span>
          {durationMin ? (
            <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700 border border-gray-200">
              {durationMin} min
            </span>
          ) : null}
          <span className="text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
            Boka
          </span>
        </div>

        {item.description ? (
          <p className="mt-3 text-sm text-gray-600 line-clamp-2">{item.description}</p>
        ) : (
          <p className="mt-3 text-sm text-gray-500 line-clamp-2">
            Tryck för att se tider och boka direkt.
          </p>
        )}
      </div>
    </Link>
  );
}

export default function Listings() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [city, setCity] = useState("");
  const [text, setText] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        // Keep query simple for MVP (optional city filter)
        const base = collection(db, "listings");
        const q = city.trim()
          ? query(base, where("city", "==", city.trim()), orderBy("createdAt", "desc"), limit(60))
          : query(base, orderBy("createdAt", "desc"), limit(60));
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
  }, [city]);

  const filtered = useMemo(() => {
    const q = text.trim().toLowerCase();
    if (!q) return items;
    return items.filter((x) => {
      const hay = `${x.title || ""} ${x.businessName || ""} ${x.serviceName || ""} ${x.category || ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [items, text]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <PageMeta title="Annonser – BokaNära" description="Hitta tjänster och boka direkt." />

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">Tjänster nära dig</h1>
          <p className="text-gray-600 mt-1">Professionella annonser som går att boka direkt.</p>
        </div>
        <Link
          to="/create-listing"
          className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-gray-900 text-white font-semibold hover:bg-gray-800 transition"
        >
          Skapa annons
        </Link>
      </div>

      <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="md:col-span-1">
          <label className="block text-sm font-medium text-gray-700">Stad (valfritt)</label>
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="t.ex. Stockholm"
            className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700">Sök</label>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Sök tjänst eller företag…"
            className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200"
          />
        </div>
      </div>

      {loading ? <div className="mt-6 text-gray-600">Laddar…</div> : null}
      {err ? <div className="mt-6 p-4 rounded-xl border border-red-200 bg-red-50 text-red-700">{err}</div> : null}

      {!loading && !err && filtered.length === 0 ? (
        <div className="mt-6 p-4 rounded-xl border border-gray-200 bg-white text-gray-700">
          Inga annonser ännu. Skapa din första annons för att testa flödet.
        </div>
      ) : null}

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((item) => (
          <ListingCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}


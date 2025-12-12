import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { collection, getDocs, limit, orderBy, query } from "firebase/firestore";
import { db } from "../firebase/firebase.js";
import PageMeta from "../components/PageMeta.jsx";

export default function Businesses() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const q = query(collection(db, "businesses"), orderBy("createdAt", "desc"), limit(50));
        const snap = await getDocs(q);
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        if (alive) setItems(list);
      } catch (e) {
        if (alive) setErr(e?.message || "Failed to load businesses");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const title = useMemo(() => "Företag – BokaNära", []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <PageMeta title={title} description="Hitta företag och boka tjänster nära dig." />

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">Företag</h1>
          <p className="text-gray-600 mt-1">Välj ett företag och boka en tid.</p>
        </div>
        <Link
          to="/business-dashboard"
          className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
        >
          Företagsdashboard
        </Link>
      </div>

      {loading ? (
        <div className="mt-6 text-gray-600">Laddar…</div>
      ) : err ? (
        <div className="mt-6 p-4 rounded-xl border border-red-200 bg-red-50 text-red-700">{err}</div>
      ) : items.length === 0 ? (
        <div className="mt-6 p-4 rounded-xl border border-gray-200 bg-white text-gray-700">
          Inga företag ännu. Gå till dashboard och skapa ditt första företag.
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((b) => (
            <Link
              key={b.id}
              to={`/business/${b.id}`}
              className="group p-5 rounded-2xl border border-gray-200 bg-white hover:shadow-md transition"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-lg font-bold text-gray-900 group-hover:text-blue-700 transition">
                    {b.name || "Företag"}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">{b.city || "Sverige"}</div>
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                  Boka
                </span>
              </div>
              {b.category ? <div className="mt-3 text-sm text-gray-700">{b.category}</div> : null}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}


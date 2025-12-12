import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  Timestamp,
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import { db } from "../firebase/firebase.js";
import { useAuth } from "../context/AuthContext.jsx";
import PageMeta from "../components/PageMeta.jsx";

function toDateInputValue(d) {
  // datetime-local expects local time without seconds
  const pad = (n) => String(n).padStart(2, "0");
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mi = pad(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

export default function BusinessDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [business, setBusiness] = useState(null);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [startAtLocal, setStartAtLocal] = useState(() => toDateInputValue(new Date(Date.now() + 2 * 60 * 60 * 1000)));
  const [saving, setSaving] = useState(false);
  const [confirmation, setConfirmation] = useState(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const bSnap = await getDoc(doc(db, "businesses", id));
        if (!bSnap.exists()) throw new Error("Företaget hittades inte");
        const b = { id: bSnap.id, ...bSnap.data() };

        const sQ = query(
          collection(db, "services"),
          where("businessId", "==", id),
          orderBy("createdAt", "desc")
        );
        const sSnap = await getDocs(sQ);
        const sList = sSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

        if (!alive) return;
        setBusiness(b);
        setServices(sList);
        if (sList.length && !selectedServiceId) setSelectedServiceId(sList[0].id);
        setCustomerPhone(user?.phoneNumber || "");
      } catch (e) {
        if (alive) setErr(e?.message || "Failed to load business");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const selectedService = useMemo(
    () => services.find((s) => s.id === selectedServiceId) || null,
    [services, selectedServiceId]
  );

  const pageTitle = useMemo(() => {
    const n = business?.name || "Företag";
    return `${n} – BokaNära`;
  }, [business?.name]);

  const handleBook = async (e) => {
    e.preventDefault();
    setConfirmation(null);

    if (!selectedService) {
      setErr("Välj en tjänst");
      return;
    }

    if (!user) {
      sessionStorage.setItem("redirectPath", `/business/${id}`);
      navigate("/google-auth");
      return;
    }

    const dt = new Date(startAtLocal);
    if (Number.isNaN(dt.getTime())) {
      setErr("Välj giltigt datum och tid");
      return;
    }

    const durationMin = Number(selectedService.durationMin || 0);
    const end = new Date(dt.getTime() + Math.max(5, durationMin) * 60 * 1000);

    setSaving(true);
    setErr(null);
    try {
      const payload = {
        businessId: id,
        serviceId: selectedService.id,
        userId: user.uid,
        userEmail: user.email || "",
        userName: user.displayName || "",
        userPhone: customerPhone || user.phoneNumber || "",
        status: "confirmed",
        startAt: Timestamp.fromDate(dt),
        endAt: Timestamp.fromDate(end),
        createdAt: Date.now(),
      };
      const ref = await addDoc(collection(db, "appointments"), payload);
      setConfirmation({ id: ref.id, startAt: dt, endAt: end });
    } catch (e2) {
      setErr(e2?.message || "Kunde inte skapa bokning");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="text-gray-600">Laddar…</div>
      </div>
    );
  }

  if (err && !business) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="p-4 rounded-xl border border-red-200 bg-red-50 text-red-700">{err}</div>
        <div className="mt-4">
          <Link to="/businesses" className="text-blue-700 hover:underline">
            ← Tillbaka till företag
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <PageMeta title={pageTitle} description={`Boka en tid hos ${business?.name || "företaget"}.`} />

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="text-sm text-gray-500">
            <Link to="/businesses" className="hover:underline">
              Företag
            </Link>{" "}
            / <span className="text-gray-700">{business?.name || "Företag"}</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 mt-1">{business?.name || "Företag"}</h1>
          <p className="text-gray-600 mt-1">{business?.city || "Sverige"}</p>
        </div>
        <Link
          to="/business-dashboard"
          className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-gray-900 text-white font-semibold hover:bg-gray-800 transition"
        >
          Dashboard
        </Link>
      </div>

      {err ? <div className="mt-4 p-4 rounded-xl border border-red-200 bg-red-50 text-red-700">{err}</div> : null}

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <div className="p-5 rounded-2xl border border-gray-200 bg-white">
            <h2 className="text-lg font-bold text-gray-900">Tjänster</h2>
            {services.length === 0 ? (
              <div className="mt-3 text-gray-600">Inga tjänster ännu.</div>
            ) : (
              <div className="mt-3 space-y-3">
                {services.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSelectedServiceId(s.id)}
                    className={`w-full text-left p-4 rounded-xl border transition ${
                      selectedServiceId === s.id
                        ? "border-blue-300 bg-blue-50"
                        : "border-gray-200 bg-white hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold text-gray-900">{s.name || "Tjänst"}</div>
                        <div className="text-sm text-gray-600 mt-1">
                          {Number(s.durationMin || 0)} min • {Number(s.price || 0)} {s.currency || "SEK"}
                        </div>
                      </div>
                      <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700 border border-gray-200">
                        Välj
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-1">
          <form onSubmit={handleBook} className="p-5 rounded-2xl border border-gray-200 bg-white">
            <h2 className="text-lg font-bold text-gray-900">Boka</h2>
            <p className="text-sm text-gray-600 mt-1">Välj tid och bekräfta bokningen.</p>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700">Tid</label>
              <input
                type="datetime-local"
                value={startAtLocal}
                onChange={(e) => setStartAtLocal(e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-600/30"
                required
              />
              <p className="text-[11px] text-gray-500 mt-1">Du kan skriva tid manuellt i MVP.</p>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700">Telefon (för SMS)</label>
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="+46…"
                className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-600/30"
              />
            </div>

            <button
              type="submit"
              disabled={saving || services.length === 0}
              className="mt-5 w-full px-4 py-2.5 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition"
            >
              {user ? (saving ? "Bokar…" : "Bekräfta bokning") : "Logga in för att boka"}
            </button>

            {confirmation ? (
              <div className="mt-4 p-3 rounded-xl border border-green-200 bg-green-50 text-green-800 text-sm">
                <div className="font-semibold">Bokning skapad!</div>
                <div className="mt-1">
                  ID: <span className="font-mono text-xs">{confirmation.id}</span>
                </div>
              </div>
            ) : null}
          </form>
        </div>
      </div>
    </div>
  );
}


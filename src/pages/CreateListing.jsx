import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { db } from "../firebase/firebase.js";
import { useAuth } from "../context/AuthContext.jsx";
import PageMeta from "../components/PageMeta.jsx";

export default function CreateListing() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [businesses, setBusinesses] = useState([]);
  const [services, setServices] = useState([]);

  const [businessId, setBusinessId] = useState("");
  const [serviceId, setServiceId] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [city, setCity] = useState("");
  const [category, setCategory] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [price, setPrice] = useState(0);
  const [durationMin, setDurationMin] = useState(30);
  const [currency, setCurrency] = useState("SEK");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);
  const [okId, setOkId] = useState(null);

  const pageTitle = useMemo(() => "Skapa annons – BokaNära", []);

  useEffect(() => {
    if (!user) return;
    let alive = true;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const mQ = query(collection(db, "businessMemberships"), where("uid", "==", user.uid), limit(20));
        const mSnap = await getDocs(mQ);
        const businessIds = mSnap.docs.map((d) => d.data()?.businessId).filter(Boolean);

        const bList = [];
        for (const bid of businessIds) {
          try {
            const bSnap = await getDoc(doc(db, "businesses", bid));
            if (bSnap.exists()) bList.push({ id: bSnap.id, ...bSnap.data() });
          } catch {}
        }

        if (!alive) return;
        setBusinesses(bList);
        if (bList.length) {
          setBusinessId(bList[0].id);
          setCity(bList[0].city || "");
          setCategory(bList[0].category || "");
        }
      } catch (e) {
        if (alive) setErr(e?.message || "Kunde inte ladda företag");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [user]);

  useEffect(() => {
    if (!user || !businessId) return;
    let alive = true;
    (async () => {
      try {
        const sQ = query(
          collection(db, "services"),
          where("businessId", "==", businessId),
          orderBy("createdAt", "desc"),
          limit(50)
        );
        const snap = await getDocs(sQ);
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        if (!alive) return;
        setServices(list);
        if (list.length) {
          setServiceId(list[0].id);
          setTitle((t) => t || list[0].name || "");
          setPrice(Number(list[0].price || 0));
          setDurationMin(Number(list[0].durationMin || 30));
          setCurrency(list[0].currency || "SEK");
        } else {
          setServiceId("");
        }
      } catch (e) {
        if (alive) setErr(e?.message || "Kunde inte ladda tjänster");
      }
    })();
    return () => {
      alive = false;
    };
  }, [user, businessId]);

  const selectedBusiness = useMemo(
    () => businesses.find((b) => b.id === businessId) || null,
    [businesses, businessId]
  );
  const selectedService = useMemo(
    () => services.find((s) => s.id === serviceId) || null,
    [services, serviceId]
  );

  const handleLogin = () => {
    sessionStorage.setItem("redirectPath", "/create-listing");
    navigate("/google-auth");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setOkId(null);
    setErr(null);

    if (!user) return;
    if (!businessId) return setErr("Välj företag");
    if (!serviceId) return setErr("Välj tjänst (lägg till i dashboard först)");
    if (!title.trim()) return setErr("Skriv en titel");
    if (!city.trim()) return setErr("Skriv stad");

    setSaving(true);
    try {
      const payload = {
        businessId,
        businessName: selectedBusiness?.name || "",
        serviceId,
        serviceName: selectedService?.name || "",
        title: title.trim(),
        description: description.trim(),
        city: city.trim(),
        category: category.trim(),
        imageUrl: imageUrl.trim(),
        price: Number(price) || 0,
        durationMin: Number(durationMin) || 0,
        currency: currency || "SEK",
        createdAt: Date.now(),
        createdBy: user.uid,
        status: "active",
      };

      const ref = await addDoc(collection(db, "listings"), payload);
      setOkId(ref.id);
    } catch (e2) {
      setErr(e2?.message || "Kunde inte skapa annons");
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-6">
        <PageMeta title={pageTitle} description="Skapa en professionell annons som går att boka direkt." />
        <div className="p-5 rounded-2xl border border-gray-200 bg-white">
          <h1 className="text-2xl font-extrabold text-gray-900">Skapa annons</h1>
          <p className="text-gray-600 mt-2">Logga in för att skapa annonser.</p>
          <button
            onClick={handleLogin}
            className="mt-4 px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700"
          >
            Logga in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <PageMeta title={pageTitle} description="Skapa en professionell annons som går att boka direkt." />

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">Skapa annons</h1>
          <p className="text-gray-600 mt-1">Gör en attraktiv annons som leder till bokningar.</p>
        </div>
        <div className="flex gap-2">
          <Link to="/listings" className="px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50">
            Visa annonser
          </Link>
          <Link to="/business-dashboard" className="px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50">
            Dashboard
          </Link>
        </div>
      </div>

      {err ? <div className="mt-4 p-4 rounded-xl border border-red-200 bg-red-50 text-red-700">{err}</div> : null}
      {okId ? (
        <div className="mt-4 p-4 rounded-xl border border-green-200 bg-green-50 text-green-800">
          Annons skapad! ID: <span className="font-mono text-xs">{okId}</span>.{" "}
          <Link to="/listings" className="underline font-semibold">
            Se den här
          </Link>
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="mt-6 p-5 rounded-2xl border border-gray-200 bg-white space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Företag</label>
          {loading ? (
            <div className="mt-1 text-gray-600">Laddar…</div>
          ) : businesses.length === 0 ? (
            <div className="mt-1 text-gray-700">
              Du har inget företag. Skapa ett i <Link to="/business-dashboard" className="underline">dashboard</Link>.
            </div>
          ) : (
            <select
              value={businessId}
              onChange={(e) => {
                const v = e.target.value;
                setBusinessId(v);
                const b = businesses.find((x) => x.id === v);
                if (b) {
                  setCity(b.city || "");
                  setCategory(b.category || "");
                }
              }}
              className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200"
            >
              {businesses.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.city})
                </option>
              ))}
            </select>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Tjänst</label>
          {services.length === 0 ? (
            <div className="mt-1 text-gray-700">
              Inga tjänster ännu. Lägg till i <Link to="/business-dashboard" className="underline">dashboard</Link>.
            </div>
          ) : (
            <select
              value={serviceId}
              onChange={(e) => {
                const v = e.target.value;
                setServiceId(v);
                const s = services.find((x) => x.id === v);
                if (s) {
                  setTitle((t) => t || s.name || "");
                  setPrice(Number(s.price || 0));
                  setDurationMin(Number(s.durationMin || 0));
                  setCurrency(s.currency || "SEK");
                }
              }}
              className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200"
            >
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} • {s.durationMin} min • {s.price} {s.currency || "SEK"}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">Stad</label>
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200"
              placeholder="t.ex. Stockholm"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Kategori (valfritt)</label>
            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200"
              placeholder="t.ex. Beauty"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Titel</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200"
            placeholder="t.ex. Klippning + Styling"
            required
          />
          <p className="text-[11px] text-gray-500 mt-1">Bra titel = högre konvertering.</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Beskrivning</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200 min-h-[110px]"
            placeholder="Skriv kort vad som ingår, vem tjänsten passar för, och varför kunden ska välja er."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">Pris</label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200"
              min={0}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Duration (min)</label>
            <input
              type="number"
              value={durationMin}
              onChange={(e) => setDurationMin(e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200"
              min={0}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Valuta</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200"
            >
              <option value="SEK">SEK</option>
              <option value="EUR">EUR</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Bild (URL, valfritt)</label>
          <input
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200"
            placeholder="https://…"
          />
        </div>

        <button
          type="submit"
          disabled={saving || businesses.length === 0 || services.length === 0}
          className="w-full px-4 py-2.5 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition"
        >
          {saving ? "Skapar…" : "Publicera annons"}
        </button>
      </form>
    </div>
  );
}


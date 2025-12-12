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
  setDoc,
  where,
} from "firebase/firestore";
import { db } from "../firebase/firebase.js";
import { useAuth } from "../context/AuthContext.jsx";
import PageMeta from "../components/PageMeta.jsx";

function asDate(v) {
  if (!v) return null;
  if (typeof v === "number") return new Date(v);
  if (v.toDate) return v.toDate();
  if (v.toMillis) return new Date(v.toMillis());
  return null;
}

export default function BusinessDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [businesses, setBusinesses] = useState([]);
  const [activeBusinessId, setActiveBusinessId] = useState("");
  const [appointments, setAppointments] = useState([]);
  const [services, setServices] = useState([]);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  const [creatingBiz, setCreatingBiz] = useState(false);
  const [bizName, setBizName] = useState("");
  const [bizCity, setBizCity] = useState("");
  const [bizCategory, setBizCategory] = useState("");

  const [creatingService, setCreatingService] = useState(false);
  const [serviceName, setServiceName] = useState("");
  const [serviceDurationMin, setServiceDurationMin] = useState(30);
  const [servicePrice, setServicePrice] = useState(300);

  const pageTitle = useMemo(() => "Företagsdashboard – BokaNära", []);

  useEffect(() => {
    if (!user) return;
    let alive = true;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const mQ = query(collection(db, "businessMemberships"), where("uid", "==", user.uid), limit(20));
        const mSnap = await getDocs(mQ);
        const mList = mSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

        // Resolve businesses
        const bList = [];
        for (const m of mList) {
          if (!m.businessId) continue;
          try {
            const bSnap = await getDoc(doc(db, "businesses", m.businessId));
            if (bSnap.exists()) bList.push({ id: bSnap.id, ...bSnap.data(), role: m.role || "staff" });
          } catch {}
        }

        if (!alive) return;
        setBusinesses(bList);
        if (!activeBusinessId && bList.length) setActiveBusinessId(bList[0].id);
      } catch (e) {
        if (alive) setErr(e?.message || "Kunde inte ladda dashboard");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]);

  useEffect(() => {
    if (!user || !activeBusinessId) return;
    let alive = true;
    (async () => {
      try {
        // Upcoming appointments for this business
        const aQ = query(
          collection(db, "appointments"),
          where("businessId", "==", activeBusinessId),
          orderBy("startAt", "asc"),
          limit(50)
        );
        const aSnap = await getDocs(aQ);
        const list = aSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

        const sQ = query(
          collection(db, "services"),
          where("businessId", "==", activeBusinessId),
          orderBy("createdAt", "desc"),
          limit(50)
        );
        const sSnap = await getDocs(sQ);
        const sList = sSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

        if (!alive) return;
        setAppointments(list);
        setServices(sList);
      } catch (e) {
        if (alive) setErr(e?.message || "Kunde inte ladda företagets data");
      }
    })();
    return () => {
      alive = false;
    };
  }, [user, activeBusinessId]);

  const activeBusiness = useMemo(
    () => businesses.find((b) => b.id === activeBusinessId) || null,
    [businesses, activeBusinessId]
  );

  const handleLogin = () => {
    sessionStorage.setItem("redirectPath", "/business-dashboard");
    navigate("/google-auth");
  };

  const createBusiness = async (e) => {
    e.preventDefault();
    if (!user) return;
    setCreatingBiz(true);
    setErr(null);
    try {
      const payload = {
        name: bizName.trim(),
        city: bizCity.trim(),
        category: bizCategory.trim(),
        ownerUid: user.uid,
        createdAt: Date.now(),
      };
      if (!payload.name || !payload.city) throw new Error("Fyll i namn och stad");

      const ref = await addDoc(collection(db, "businesses"), payload);
      const membershipRef = doc(db, "businessMemberships", `${ref.id}_${user.uid}`);
      await setDoc(
        membershipRef,
        { businessId: ref.id, uid: user.uid, role: "owner", createdAt: Date.now() },
        { merge: true }
      );

      // Refresh list quickly (append)
      const newBiz = { id: ref.id, ...payload, role: "owner" };
      setBusinesses((prev) => [newBiz, ...prev]);
      setActiveBusinessId(ref.id);
      setBizName("");
      setBizCity("");
      setBizCategory("");
    } catch (e2) {
      setErr(e2?.message || "Kunde inte skapa företag");
    } finally {
      setCreatingBiz(false);
    }
  };

  const createService = async (e) => {
    e.preventDefault();
    if (!user || !activeBusinessId) return;
    setCreatingService(true);
    setErr(null);
    try {
      const payload = {
        businessId: activeBusinessId,
        name: serviceName.trim(),
        durationMin: Number(serviceDurationMin) || 30,
        price: Number(servicePrice) || 0,
        currency: "SEK",
        createdAt: Date.now(),
      };
      if (!payload.name) throw new Error("Fyll i tjänstens namn");
      const ref = await addDoc(collection(db, "services"), payload);
      setServices((prev) => [{ id: ref.id, ...payload }, ...prev]);
      setServiceName("");
    } catch (e2) {
      setErr(e2?.message || "Kunde inte skapa tjänst");
    } finally {
      setCreatingService(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <PageMeta title={pageTitle} description="Hantera företag, tjänster och bokningar." />

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">Företagsdashboard</h1>
          <p className="text-gray-600 mt-1">Skapa företag, lägg till tjänster och se bokningar.</p>
        </div>
        <div className="flex gap-2">
          <Link to="/businesses" className="px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50">
            Visa företag
          </Link>
          {!user ? (
            <button onClick={handleLogin} className="px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700">
              Logga in
            </button>
          ) : null}
        </div>
      </div>

      {!user ? (
        <div className="mt-6 p-4 rounded-xl border border-gray-200 bg-white text-gray-700">
          Logga in för att hantera företag.
        </div>
      ) : null}

      {err ? <div className="mt-4 p-4 rounded-xl border border-red-200 bg-red-50 text-red-700">{err}</div> : null}

      {user ? (
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-1 space-y-4">
            <div className="p-5 rounded-2xl border border-gray-200 bg-white">
              <h2 className="text-lg font-bold text-gray-900">Mina företag</h2>
              {loading ? (
                <div className="mt-3 text-gray-600">Laddar…</div>
              ) : businesses.length === 0 ? (
                <div className="mt-3 text-gray-600">Du har inga företag ännu.</div>
              ) : (
                <div className="mt-3 space-y-2">
                  {businesses.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setActiveBusinessId(b.id)}
                      className={`w-full text-left p-3 rounded-xl border transition ${
                        activeBusinessId === b.id ? "border-blue-300 bg-blue-50" : "border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      <div className="font-semibold text-gray-900">{b.name || "Företag"}</div>
                      <div className="text-xs text-gray-600 mt-0.5">{b.city || ""} • {b.role || "staff"}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="p-5 rounded-2xl border border-gray-200 bg-white">
              <h2 className="text-lg font-bold text-gray-900">Skapa företag</h2>
              <form onSubmit={createBusiness} className="mt-3 space-y-3">
                <input
                  value={bizName}
                  onChange={(e) => setBizName(e.target.value)}
                  placeholder="Företagsnamn"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200"
                />
                <input
                  value={bizCity}
                  onChange={(e) => setBizCity(e.target.value)}
                  placeholder="Stad"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200"
                />
                <input
                  value={bizCategory}
                  onChange={(e) => setBizCategory(e.target.value)}
                  placeholder="Kategori (valfritt)"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200"
                />
                <button
                  type="submit"
                  disabled={creatingBiz}
                  className="w-full px-4 py-2.5 rounded-xl bg-gray-900 text-white font-semibold hover:bg-gray-800 disabled:opacity-60"
                >
                  {creatingBiz ? "Skapar…" : "Skapa"}
                </button>
              </form>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <div className="p-5 rounded-2xl border border-gray-200 bg-white">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Tjänster</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {activeBusiness ? (
                      <>
                        Aktivt företag: <span className="font-semibold">{activeBusiness.name}</span>
                      </>
                    ) : (
                      "Välj ett företag."
                    )}
                  </p>
                </div>
                {activeBusiness ? (
                  <Link
                    to={`/business/${activeBusiness.id}`}
                    className="px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50"
                  >
                    Öppna företagssida
                  </Link>
                ) : null}
              </div>

              {!activeBusiness ? (
                <div className="mt-4 text-gray-600">Skapa eller välj ett företag.</div>
              ) : (
                <>
                  <form onSubmit={createService} className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-2">
                    <input
                      value={serviceName}
                      onChange={(e) => setServiceName(e.target.value)}
                      placeholder="Tjänst (t.ex. Klippning)"
                      className="md:col-span-2 px-3 py-2 rounded-xl border border-gray-200"
                    />
                    <input
                      type="number"
                      value={serviceDurationMin}
                      onChange={(e) => setServiceDurationMin(e.target.value)}
                      placeholder="Min"
                      className="px-3 py-2 rounded-xl border border-gray-200"
                      min={5}
                    />
                    <input
                      type="number"
                      value={servicePrice}
                      onChange={(e) => setServicePrice(e.target.value)}
                      placeholder="Pris"
                      className="px-3 py-2 rounded-xl border border-gray-200"
                      min={0}
                    />
                    <div className="md:col-span-4">
                      <button
                        type="submit"
                        disabled={creatingService}
                        className="w-full px-4 py-2.5 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-60"
                      >
                        {creatingService ? "Lägger till…" : "Lägg till tjänst"}
                      </button>
                    </div>
                  </form>

                  <div className="mt-4 space-y-2">
                    {services.length === 0 ? (
                      <div className="text-gray-600">Inga tjänster ännu.</div>
                    ) : (
                      services.map((s) => (
                        <div key={s.id} className="p-3 rounded-xl border border-gray-200">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="font-semibold text-gray-900">{s.name}</div>
                              <div className="text-sm text-gray-600 mt-0.5">
                                {Number(s.durationMin || 0)} min • {Number(s.price || 0)} {s.currency || "SEK"}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="p-5 rounded-2xl border border-gray-200 bg-white">
              <h2 className="text-lg font-bold text-gray-900">Bokningar</h2>
              {!activeBusiness ? (
                <div className="mt-3 text-gray-600">Välj ett företag för att se bokningar.</div>
              ) : appointments.length === 0 ? (
                <div className="mt-3 text-gray-600">Inga bokningar ännu.</div>
              ) : (
                <div className="mt-3 space-y-2">
                  {appointments.map((a) => {
                    const start = asDate(a.startAt);
                    const end = asDate(a.endAt);
                    return (
                      <div key={a.id} className="p-3 rounded-xl border border-gray-200">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="font-semibold text-gray-900">
                              {start ? start.toLocaleString() : "Tid"} {end ? `– ${end.toLocaleTimeString()}` : ""}
                            </div>
                            <div className="text-sm text-gray-600 mt-1">
                              Kund: {a.userName || a.userEmail || a.userId}
                            </div>
                            {a.userPhone ? <div className="text-sm text-gray-600">Tel: {a.userPhone}</div> : null}
                          </div>
                          <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700 border border-gray-200">
                            {String(a.status || "pending")}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}


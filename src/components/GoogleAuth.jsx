import React, { useEffect, useMemo, useState } from "react";
import { GoogleAuthProvider, signInAnonymously, signInWithPopup } from "firebase/auth";
import { useNavigate, useLocation } from "react-router-dom";
import { auth } from "../firebase/firebase.js";

const GoogleAuth = () => {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = useMemo(() => new URLSearchParams(location.search).get("return") || "/", [location.search]);
  const bypassEnabled = String(process.env.REACT_APP_AUTH_BYPASS || "") === "1";

  // If bypass is enabled, don't block on Google popup: sign in anonymously and continue.
  useEffect(() => {
    if (!bypassEnabled) return;
    let alive = true;
    (async () => {
      setLoading(true);
      setErr("");
      try {
        await signInAnonymously(auth);
        if (!alive) return;
        navigate(returnTo, { replace: true });
      } catch (e) {
        console.error(e);
        if (!alive) return;
        setErr(e?.message || "Kunde inte logga in (anonymous).");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [bypassEnabled, navigate, returnTo]);

  const login = async () => {
    setLoading(true);
    setErr("");
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
      navigate(returnTo, { replace: true });
    } catch (e) {
      console.error(e);
      setErr(e?.message || "Kunde inte logga in, försök igen.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl p-8 space-y-6">
        <h1 className="text-2xl font-extrabold text-center text-gray-800">
          Logga in för att fortsätta
        </h1>

        {bypassEnabled ? (
          <div className="text-sm text-center text-gray-700 bg-blue-50 border border-blue-200 px-4 py-3 rounded-lg">
            Tillfälligt läge aktivt: loggar in automatiskt…
          </div>
        ) : null}

        <button
          onClick={login}
          disabled={loading || bypassEnabled}
          className="w-full flex items-center justify-center gap-3 border border-gray-300 rounded-xl py-3 hover:bg-gray-100 transition disabled:opacity-50"
        >
          {/* Google icon built with Tailwind */}
          <div className="w-5 h-5 relative">
            <div className="absolute w-2.5 h-2.5 bg-[#EA4335] rounded top-0 left-0"></div>
            <div className="absolute w-2.5 h-2.5 bg-[#FBBC04] rounded top-0 right-0"></div>
            <div className="absolute w-2.5 h-2.5 bg-[#34A853] rounded bottom-0 left-0"></div>
            <div className="absolute w-2.5 h-2.5 bg-[#4285F4] rounded bottom-0 right-0"></div>
          </div>

          <span className="text-sm font-medium text-gray-700">
            {loading ? "Loggar in..." : bypassEnabled ? "Google login inaktiverad (bypass)" : "Logga in med Google"}
          </span>
        </button>

        {err && (
          <div className="text-sm text-center text-red-600 bg-red-50 border border-red-200 px-4 py-2 rounded-lg">
            {err}
          </div>
        )}

        <p className="text-xs text-center text-gray-500">
          Vi använder ditt Google-konto för att autentisera dig på ett säkert sätt.
        </p>
      </div>
    </div>
  );
};

export default GoogleAuth;

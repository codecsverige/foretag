import React, { useEffect, useState } from "react";

const KEY = "vv_cookie_consent_v1";

export default function CookieBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      const v = localStorage.getItem(KEY);
      if (!v) setShow(true);
    } catch {}
  }, []);

  if (!show) return null;

  return (
    <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-50 max-w-xl w-[92%] bg-white shadow-lg border rounded-xl p-4 text-sm">
      <div className="flex items-start gap-3">
        <span className="text-lg">🍪</span>
        <div className="flex-1 text-gray-700">
          Vi använder endast nödvändiga cookies för att driva tjänsten. Läs mer i vår {" "}
          <a href="/cookiepolicy" className="text-blue-600 underline">Cookie policy</a>.
        </div>
        <button
          onClick={() => { try { localStorage.setItem(KEY, "ok"); } catch {}; setShow(false); }}
          className="ml-2 px-3 py-1.5 bg-brand text-white rounded-lg text-xs font-semibold"
        >OK</button>
      </div>
    </div>
  );
}


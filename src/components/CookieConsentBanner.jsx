// src/components/CookieConsentBanner.jsx
import React, { useEffect, useState } from "react";

export default function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("cookieConsent")) {
      setVisible(true);
    }
  }, []);

  const accept = () => {
    localStorage.setItem("cookieConsent", "true");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t shadow-lg px-4 py-4 flex flex-col md:flex-row md:items-center md:justify-between">
      <div className="text-sm text-gray-800">
        Vi använder endast nödvändiga cookies (inga analys- eller marknadsföringscookies).
        Läs mer i vår {" "}
        <a href="/cookiepolicy" className="underline text-brand" target="_blank" rel="noopener noreferrer">cookiepolicy</a> {" "}
        och {" "}
        <a href="/integritetspolicy" className="underline text-brand" target="_blank" rel="noopener noreferrer">sekretesspolicy</a>.
      </div>
      <button
        className="mt-3 md:mt-0 md:ml-6 bg-brand hover:bg-brand-dark text-white rounded-lg px-6 py-2 font-semibold shadow transition"
        onClick={accept}
      >
        OK
      </button>
    </div>
  );
}

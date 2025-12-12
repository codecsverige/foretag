// src/components/VerifiedPhoneField.jsx
import React from "react";
import { useNavigate, useLocation } from "react-router-dom";

export default function VerifiedPhoneField({ phone, returnTo }) {
  const navigate = useNavigate();
  const { pathname, search } = useLocation();

  const handleVerify = () => {
    const base = returnTo || (pathname + search);
    const target = base.includes('?') ? `${base}&resume=1` : `${base}?resume=1`;
    navigate(`/verify-phone?return=${encodeURIComponent(target)}`, { replace: true });
  };

  return (
    <div>
      <label className="text-sm font-medium mb-1 block">
        Telefonnummer
      </label>
      {phone ? (
        <div className="px-3 py-2 bg-green-50 text-green-700 rounded">
          {phone} ✔ Verifierat
        </div>
      ) : (
        <button
          type="button"
          onClick={handleVerify}
          className="text-brand underline text-sm"
        >
          Verifiera telefonnummer
        </button>
      )}
    </div>
  );
}

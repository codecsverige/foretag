import React, { useEffect, useRef, useState } from "react";
import { getAuth, linkWithPhoneNumber } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { useNavigate, useLocation } from "react-router-dom";
import { db } from "../firebase/firebase.js";
import { useNotification } from "../context/NotificationContext.jsx";
import { normalizeSwedishPhone } from "../utils/phone";
import { canAttemptVerification, recordVerificationAttempt, resetVerificationCooldown } from "../utils/attemptLimiter";
import { canSendPhoneOtpServer } from "../services/otpService";
import { createInvisibleRecaptcha, clearRecaptcha } from "../utils/recaptcha";

export default function PhoneVerificationPage() {
  const auth = getAuth();
  const user = auth.currentUser;
  const { notify } = useNotification();
  const navigate = useNavigate();
  const { search, pathname } = useLocation();

  const [phone, setPhone] = useState(user?.phoneNumber || "");
  const [code, setCode] = useState("");
  const [step, setStep] = useState("phone"); // phone | code
  const [busy, setBusy] = useState(false);
  const [confirmation, setConfirmation] = useState(null);
  const recaptchaVerifier = useRef(null);

  // 🛑 Obliger Google login
  useEffect(() => {
    const hasGoogle = user?.providerData.some(p => p.providerId === "google.com");
    if (!user || !hasGoogle) {
      const ret = pathname + search;
      navigate(`/google-auth?return=${encodeURIComponent(ret)}`, { replace: true });
    }
  }, [user, navigate, pathname, search]);

  // ✅ reCAPTCHA invisible (unified)
  useEffect(() => {
    if (recaptchaVerifier.current) return;
    recaptchaVerifier.current = createInvisibleRecaptcha(auth, 'recaptcha-container');
    return () => {
      clearRecaptcha(recaptchaVerifier.current);
      recaptchaVerifier.current = null;
    };
  }, [auth]);

  // 🔐 Envoi du code
  const sendCode = async () => {
    const norm = normalizeSwedishPhone(phone);
    if (!norm.ok) {
      notify({ type: "error", message: norm.error || "Ogiltigt svenskt nummer (+46)" });
      return;
    }
    // Server-side preflight (fail-open) + client limiter
    const server = await canSendPhoneOtpServer();
    const quota = canAttemptVerification(user);
    if (!server.ok) {
      if (server.reason === 'cooldown') {
        const secs = Math.ceil((server.waitMs || 0) / 1000);
        notify({ type: "error", message: `Försök igen om ${secs}s` });
        return;
      }
      if (server.reason === 'daily_limit') {
        notify({ type: "error", message: `Du har nått dagens gräns (${server.limit || 5}) försök` });
        return;
      }
    }
    if (!quota.ok) {
      if (quota.reason === 'cooldown') {
        const secs = Math.ceil((quota.waitMs || 0) / 1000);
        notify({ type: "error", message: `Försök igen om ${secs}s` });
      } else if (quota.reason === 'daily_limit') {
        notify({ type: "error", message: `Du har nått dagens gräns (${quota.limit}) försök` });
      }
      return;
    }

    setBusy(true);
    try {
      recordVerificationAttempt(user);
      const res = await linkWithPhoneNumber(user, norm.e164, recaptchaVerifier.current);
      setConfirmation(res);
      setStep("code");
      notify({ type: "info", message: "Kod skickades till numret." });
    } catch (err) {
      console.error(err);
      resetVerificationCooldown(user);
      notify({ type: "error", message: err?.message || "Kunde inte skicka kod" });
      clearRecaptcha(recaptchaVerifier.current);
      recaptchaVerifier.current = createInvisibleRecaptcha(auth, 'recaptcha-container');
    }
    setBusy(false);
  };

  // ✅ Confirmation du code + redirection
  const confirmCode = async () => {
    if (!code.trim()) {
      notify({ type: "error", message: "Ange koden." });
      return;
    }
    setBusy(true);
    try {
      const userCredential = await confirmation.confirm(code.trim());
      const { uid, phoneNumber } = userCredential.user;

      // Mise à jour Firestore (always verified true)
      await setDoc(doc(db, "users", uid), { phone: phoneNumber, phoneVerified: true, updatedAt: Date.now() }, { merge: true });

      try { await auth.currentUser?.reload?.(); } catch {}
      notify({ type: "success", message: "Telefonnumret är verifierat!" });
    } catch (err) {
      if (err.code === "auth/provider-already-linked") {
        // still ensure Firestore is consistent
        try {
          await setDoc(doc(db, "users", user.uid), { phone: user.phoneNumber, phoneVerified: true, updatedAt: Date.now() }, { merge: true });
        } catch {}
        notify({ type: "success", message: "Numret är redan kopplat." });
      } else {
        console.error(err);
        notify({ type: "error", message: "Fel kod, försök igen." });
        setBusy(false);
        return;
      }
    }

    // ✅ Redirection forcée (fiable 100%)
    setTimeout(() => {
      const ret = new URLSearchParams(search).get("return") || "/";
      window.location.href = ret;
    }, 400);

    setBusy(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-50 p-4">
      <div className="w-full max-w-md">
        {/* Trust Badges */}
        <div className="flex justify-center items-center gap-4 mb-6">
          <div className="flex items-center gap-2 text-gray-600">
            <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium">SSL-krypterad</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium">GDPR-säkrad</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
          {/* Header with trust icon */}
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-green-500 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Säker verifiering av telefonnummer
            </h1>
            <p className="text-gray-600">
              För din trygghet och säkerhet
            </p>
          </div>

          {step === "phone" && (
            <>
              {/* Why verification section */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  Varför behöver vi verifiera ditt nummer?
                </h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Förhindrar bedrägerier och falska konton</li>
                  <li>• Möjliggör säker kommunikation mellan resenärer</li>
                  <li>• Hjälper förlorade användare återfå tillgång</li>
                  <li>• Krävs enligt svensk lag för samåkningstjänster</li>
                </ul>
              </div>

              {/* Phone input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mobilnummer (svenskt)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                    </svg>
                  </div>
                  <input
                    type="tel"
                    className="pl-10 pr-3 py-3 border-2 border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="+46 70 123 45 67"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={busy}
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Vi accepterar endast svenska mobilnummer
                </p>
              </div>

              {/* Legal text */}
              <div className="bg-gray-50 rounded-lg p-4 text-xs text-gray-600 space-y-2">
                <p>
                  <strong>Dataskydd:</strong> Ditt telefonnummer lagras säkert enligt GDPR och används endast för verifiering och nödvändig kommunikation relaterad till samåkning.
                </p>
                <p>
                  <strong>Samtycke:</strong> Genom att klicka "Skicka verifieringskod" godkänner du våra <a href="/terms" className="text-blue-600 hover:underline">användarvillkor</a> och <a href="/privacy" className="text-blue-600 hover:underline">integritetspolicy</a>.
                </p>
              </div>

              {/* Send button */}
              <button
                onClick={sendCode}
                disabled={busy}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {busy ? (
                  <>
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                    </svg>
                    Skickar säkert...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    Skicka verifieringskod
                  </>
                )}
              </button>

              {/* Security badges */}
              <div className="flex items-center justify-center gap-6 pt-2">
                <img src="/assets/firebase-auth.png" alt="Firebase Auth" className="h-8 opacity-60" />
                <img src="/assets/google-secure.png" alt="Google Secure" className="h-8 opacity-60" />
              </div>
            </>
          )}

          {step === "code" && (
            <>
              {/* Success message */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <h3 className="font-semibold text-green-900">Kod skickad!</h3>
                    <p className="text-sm text-green-800 mt-1">
                      En 6-siffrig verifieringskod har skickats till {phone}
                    </p>
                  </div>
                </div>
              </div>

              {/* Code input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ange verifieringskod
                </label>
                <input
                  type="text"
                  className="text-center text-2xl tracking-[0.5em] font-mono border-2 border-gray-300 rounded-lg w-full py-3 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                  placeholder="000000"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ''))}
                  maxLength={6}
                  disabled={busy}
                />
                <p className="mt-2 text-xs text-gray-500 text-center">
                  Koden är giltig i 10 minuter
                </p>
              </div>

              {/* Security notice */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-xs text-amber-800">
                  <strong>Säkerhetstips:</strong> Dela aldrig denna kod med någon. VägVänner personal kommer aldrig att be dig om verifieringskoden.
                </p>
              </div>

              {/* Verify button */}
              <button
                onClick={confirmCode}
                disabled={busy || code.length !== 6}
                className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {busy ? (
                  <>
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                    </svg>
                    Verifierar säkert...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Verifiera nummer
                  </>
                )}
              </button>

              {/* Back link */}
              <button
                onClick={() => setStep("phone")}
                className="w-full text-gray-600 hover:text-gray-800 text-sm font-medium py-2"
              >
                Fel nummer? Gå tillbaka
              </button>
            </>
          )}

          {/* 📌 Invisible reCAPTCHA container */}
          <div id="recaptcha-container" />
        </div>

        {/* Footer trust text */}
        <div className="text-center mt-6 text-sm text-gray-600">
          <p className="flex items-center justify-center gap-2">
            <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            Din integritet är vår prioritet
          </p>
          <p className="mt-1 text-xs">
            Läs mer om hur vi skyddar dina uppgifter i vår <a href="/privacy" className="text-blue-600 hover:underline">integritetspolicy</a>
          </p>
        </div>
      </div>
    </div>
  );
}

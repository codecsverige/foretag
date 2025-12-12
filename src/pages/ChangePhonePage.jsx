// src/pages/ChangePhonePage.jsx – Version corrigée
import React, { useEffect, useRef, useState } from "react";
import { getAuth, PhoneAuthProvider, updatePhoneNumber } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import { useNavigate, useLocation } from "react-router-dom";
import { db } from "../firebase/firebase.js";
import { useAuth } from "../context/AuthContext.jsx";
import { FaPhone, FaArrowLeft, FaCheckCircle, FaExclamationTriangle } from "react-icons/fa";
import { normalizeSwedishPhone } from "../utils/phone";
import { canAttemptVerification, recordVerificationAttempt, resetVerificationCooldown } from "../utils/attemptLimiter";
import { createInvisibleRecaptcha, clearRecaptcha } from "../utils/recaptcha";
import { canSendPhoneOtpServer } from "../services/otpService";

export default function ChangePhonePage() {
  const { user } = useAuth();
  const auth = getAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState("phone"); // phone | code
  const [loading, setLoading] = useState(false);
  const [verificationId, setVerificationId] = useState("");
  const [error, setError] = useState("");
  const recaptchaVerifier = useRef(null);

  // Retour au profil
  const returnPath = location.state?.returnPath || "/user-profile";

  // ✅ Setup reCAPTCHA (unified)
  useEffect(() => {
    if (user && !recaptchaVerifier.current) {
      try {
        recaptchaVerifier.current = createInvisibleRecaptcha(auth, 'recaptcha-container', {
          onExpired: () => setError("reCAPTCHA har gått ut. Försök igen."),
        });
      } catch (error) {
        console.error("Error setting up reCAPTCHA:", error);
        setError("Kunde inte ladda säkerhetsverifiering. Ladda om sidan.");
      }
    }
    return () => {
      clearRecaptcha(recaptchaVerifier.current);
      recaptchaVerifier.current = null;
    };
  }, [auth, user]);

  // 🔐 Envoi du code
  const sendCode = async () => {
    const norm = normalizeSwedishPhone(phone);
    if (!norm.ok) {
      setError(norm.error || "Endast svenska nummer (+46) accepteras");
      return;
    }
    // Server-side preflight + client limiter
    const server = await canSendPhoneOtpServer();
    const quota = canAttemptVerification(user);
    if (!server.ok) {
      if (server.reason === 'cooldown') {
        const secs = Math.ceil((server.waitMs || 0) / 1000);
        setError(`Försök igen om ${secs}s`);
        return;
      } else {
        setError(`Du har nått dagens gräns (${server.limit || 5}) försök`);
        return;
      }
    }
    if (!quota.ok) {
      if (quota.reason === 'cooldown') {
        const secs = Math.ceil((quota.waitMs || 0) / 1000);
        setError(`Försök igen om ${secs}s`);
      } else {
        setError(`Du har nått dagens gräns (${quota.limit}) försök`);
      }
      return;
    }

    setLoading(true);
    setError("");

    try {
      recordVerificationAttempt(user);
      const provider = new PhoneAuthProvider(auth);
      const verificationId = await provider.verifyPhoneNumber(
        norm.e164,
        recaptchaVerifier.current
      );
      setVerificationId(verificationId);
      setStep("code");
      setError("");
    } catch (err) {
      console.error("Error sending verification code:", err);
      resetVerificationCooldown(user);
      clearRecaptcha(recaptchaVerifier.current);
      recaptchaVerifier.current = createInvisibleRecaptcha(auth, 'recaptcha-container');
      if (err.code === "auth/phone-number-already-in-use") {
        setError("Detta telefonnummer används redan av ett annat konto.");
      } else if (err.code === "auth/invalid-phone-number") {
        setError("Ogiltigt telefonnummer. Kontrollera formatet.");
      } else if (err.code === "auth/too-many-requests") {
        setError("För många försök. Vänta en stund innan du försöker igen.");
      } else {
        setError("Kunde inte skicka kod. Kontrollera numret och försök igen.");
      }
    } finally {
      setLoading(false);
    }
  };

  // ✅ Confirmation du code + mise à jour
  const confirmCode = async () => {
    if (!code.trim() || code.length !== 6) {
      setError("Ange en giltig 6-siffrig kod.");
      return;
    }
    
    setLoading(true);
    setError("");
    
    try {
      // Create credential
      const credential = PhoneAuthProvider.credential(verificationId, code.trim());
      
      // Update phone number
      await updatePhoneNumber(auth.currentUser, credential);
      
      // Update Firestore
      await updateDoc(doc(db, "users", user.uid), { 
        phone: normalizeSwedishPhone(phone).e164 || phone,
        phoneVerified: true,
        updatedAt: Date.now()
      });

      // Ensure auth state reflects new phone immediately
      try { await auth.currentUser?.reload?.(); } catch {}

      // Retour au profil avec message de succès
      navigate(returnPath, { 
        state: { 
          message: "Telefonnummer ändrat och verifierat framgångsrikt!", 
          messageType: "success" 
        } 
      });
    } catch (err) {
      console.error("Error verifying code:", err);
      
      if (err.code === "auth/invalid-verification-code") {
        setError("Fel kod. Kontrollera och försök igen.");
      } else if (err.code === "auth/code-expired") {
        setError("Koden har gått ut. Begär en ny kod.");
      } else {
        setError("Kunde inte verifiera koden. Försök igen.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Retour en arrière
  const handleBack = () => {
    if (step === "code") {
      setStep("phone");
      setCode("");
      setError("");
    } else {
      navigate(returnPath);
    }
  };

  // Demander un nouveau code
  const requestNewCode = () => {
    setStep("phone");
    setCode("");
    setError("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-8">
      <div className="max-w-md mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-t-xl shadow-sm border-b border-gray-200">
          <div className="px-6 py-4">
            <div className="flex items-center gap-3">
              <button
                onClick={handleBack}
                disabled={loading}
                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors duration-200 disabled:opacity-50"
              >
                <FaArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Ändra telefonnummer
                </h1>
                <p className="text-sm text-gray-600">
                  {step === "phone" ? "Ange nytt nummer" : "Verifiera med kod"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-b-xl shadow-sm p-6">
          {/* Error message */}
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 border border-red-200 flex items-center gap-2">
              <FaExclamationTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {step === "phone" && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-brand/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaPhone className="w-8 h-8 text-brand" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">
                  Ange nytt telefonnummer
                </h2>
                <p className="text-gray-600 text-sm">
                  Vi skickar en verifieringskod via SMS till det nya numret.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nytt telefonnummer
                </label>
                <div className="relative">
                  <FaPhone className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <input
                    type="tel"
                    className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600/50 focus:border-brand transition-colors duration-200"
                    placeholder="+46701234567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Använd internationellt format med landskod
                </p>
              </div>

              <button
                onClick={sendCode}
                disabled={loading || !phone.trim()}
                className="w-full bg-brand hover:bg-brand-dark text-white font-semibold py-3 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Skickar...
                  </div>
                ) : (
                  "Skicka verifieringskod"
                )}
              </button>
            </div>
          )}

          {step === "code" && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaCheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">
                  Ange verifieringskod
                </h2>
                <p className="text-gray-600 text-sm">
                  Vi skickade en 6-siffrig kod till {phone}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Verifieringskod
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600/50 focus:border-brand transition-colors duration-200 text-center text-lg tracking-widest"
                  placeholder="123456"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ''))}
                  maxLength={6}
                  disabled={loading}
                />
                <p className="text-xs text-gray-500 mt-1 text-center">
                  Ange den 6-siffriga koden från SMS
                </p>
              </div>

              <button
                onClick={confirmCode}
                disabled={loading || code.length !== 6}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Verifierar...
                  </div>
                ) : (
                  "Verifiera och spara"
                )}
              </button>

              <button
                onClick={requestNewCode}
                disabled={loading}
                className="w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 rounded-lg transition-colors duration-200 disabled:opacity-50"
              >
                Begär ny kod
              </button>
            </div>
          )}

          {/* 📌 Invisible reCAPTCHA container */}
          <div id="recaptcha-container" />
        </div>
      </div>
    </div>
  );
} 
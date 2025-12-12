// src/pages/VerifyPhonePage-Enhanced.jsx
import React, { useEffect, useRef, useState } from "react";
import { PhoneAuthProvider, updatePhoneNumber } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase/firebase.js";
import { useNavigate, useLocation } from "react-router-dom";
import { auth } from "../firebase/firebase.js";
import { normalizeSwedishPhone } from "../utils/phone";
import { canAttemptVerification, recordVerificationAttempt, resetVerificationCooldown } from "../utils/attemptLimiter";
import { canSendPhoneOtpServer } from "../services/otpService";
import { createInvisibleRecaptcha, clearRecaptcha } from "../utils/recaptcha";
import { useAuth } from "../context/AuthContext.jsx";

export default function VerifyPhonePageEnhanced() {
  const { user } = useAuth();
  
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get data from state passed from UserProfilePage
  const phoneFromState = location.state?.phone || "";
  const userIdFromState = location.state?.userId || user?.uid;
  const returnPathFromState = location.state?.returnPath || "/profile";
  
  const [phone, setPhone] = useState(phoneFromState);
  const [code, setCode] = useState("");
  const [verificationId, setVerificationId] = useState("");
  const [step, setStep] = useState("enter-phone");   // or "enter-code"
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const recaptchaVerifier = useRef(null);

  // Setup invisible reCAPTCHA
  useEffect(() => {
    if (!user) return;
    if (!recaptchaVerifier.current) {
      recaptchaVerifier.current = createInvisibleRecaptcha(auth, 'recaptcha-container');
    }
    return () => {
      clearRecaptcha(recaptchaVerifier.current);
      recaptchaVerifier.current = null;
    };
  }, [auth, user]);

  const validatePhone = (value) => normalizeSwedishPhone(value).ok;

  // Send verification code to phone
  const handleSendCode = async () => {
    if (!validatePhone(phone)) {
      setError("Ogiltigt telefonnummer. Använd internationellt format (t.ex. +46 70 123 45 67)");
      return;
    }
    
    setLoading(true);
    setError("");
    
    try {
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
        } else {
          setError(`Du har nått dagens gräns (${server.limit || 5}) försök`);
        }
        return;
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
      recordVerificationAttempt(user);
      const provider = new PhoneAuthProvider(auth);
      const verificationId = await provider.verifyPhoneNumber(
        norm.e164, 
        recaptchaVerifier.current
      );
      
      setVerificationId(verificationId);
      setStep("enter-code");
      setError("");
    } catch (error) {
      console.error("Error sending verification code:", error);
      resetVerificationCooldown(user);
      clearRecaptcha(recaptchaVerifier.current);
      recaptchaVerifier.current = createInvisibleRecaptcha(auth, 'recaptcha-container');
      setError(`Kunde inte skicka verifieringskod: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Verify the code and update phone number
  const handleVerifyCode = async () => {
    if (!code || code.length < 6) {
      setError("Ange en giltig verifieringskod (6 siffror)");
      return;
    }
    
    setLoading(true);
    setError("");
    
    try {
      // Create credential with verification ID and code
      const credential = PhoneAuthProvider.credential(verificationId, code);
      
      // Update user's phone number
      await updatePhoneNumber(auth.currentUser, credential);
      
      // Update Firestore user document
      await updateDoc(doc(db, "users", userIdFromState), {
        phone: normalizeSwedishPhone(phone).e164 || phone,
        phoneVerified: true,
        updatedAt: Date.now()
      });
      // Force reload auth user to propagate phoneNumber immediately
      try { await auth.currentUser?.reload?.(); } catch {}
      
      // Navigate back to profile with success message
      navigate(returnPathFromState, { 
        state: { 
          message: "Telefonnummer verifierat framgångsrikt!", 
          messageType: "success" 
        } 
      });
    } catch (error) {
      console.error("Error verifying code:", error);
      setError(`Kunde inte verifiera koden: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Go back to phone input step
  const handleBack = () => {
    setStep("enter-phone");
    setError("");
  };

  // Cancel and return to profile
  const handleCancel = () => {
    navigate(returnPathFromState);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 py-8">
      {/* Trust indicators at top */}
      <div className="max-w-md mx-auto mb-6 px-4">
        <div className="flex justify-center items-center gap-4">
          <div className="flex items-center gap-2 text-gray-600">
            <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium">Säker verifiering</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium">GDPR-godkänd</span>
          </div>
        </div>
      </div>
      
      <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl p-8">
        {/* Header with icon */}
        <div className="text-center mb-6">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-green-500 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            {step === "enter-phone" ? "Verifiera ditt telefonnummer" : "Bekräfta din identitet"}
          </h1>
          <p className="text-gray-600 mt-2">
            {step === "enter-phone" ? "För en trygg samåkningsupplevelse" : "Slutför verifieringen"}
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 flex items-start gap-3">
            <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span className="text-sm">{error}</span>
          </div>
        )}

        {step === "enter-phone" ? (
          /* Phone input step */
          <div>
            {/* Why verification box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                Varför behöver vi ditt telefonnummer?
              </h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Bekräftar din identitet för andra resenärer</li>
                <li>• Möjliggör säker kontakt vid bokningar</li>
                <li>• Skyddar mot falska konton och bedrägerier</li>
                <li>• Uppfyller lagkrav för samåkningstjänster</li>
              </ul>
            </div>
            
            <div className="mb-4">
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
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+46 70 123 45 67"
                  className="pl-10 pr-3 py-3 border-2 border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  disabled={loading}
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Endast svenska mobilnummer accepteras för säkerhet
              </p>
            </div>
            
            {/* Legal consent box */}
            <div className="bg-gray-50 rounded-lg p-4 mb-4 text-xs text-gray-600 space-y-2">
              <p>
                <strong>Dataskydd enligt GDPR:</strong> Ditt telefonnummer lagras krypterat och används endast för:
              </p>
              <ul className="ml-4 space-y-1">
                <li>• Identitetsverifiering</li>
                <li>• Säker kommunikation mellan resenärer</li>
                <li>• Viktiga meddelanden om dina resor</li>
              </ul>
              <p className="mt-2">
                <strong>Dina rättigheter:</strong> Du kan när som helst begära att få se, ändra eller radera dina uppgifter enligt GDPR artikel 15-17.
              </p>
              <p className="mt-2">
                Genom att fortsätta samtycker du till vår <a href="/privacy" className="text-blue-600 hover:underline">integritetspolicy</a> och <a href="/terms" className="text-blue-600 hover:underline">användarvillkor</a>.
              </p>
            </div>
            
            <div id="recaptcha-container"></div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleSendCode}
                disabled={loading || !validatePhone(phone)}
                className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
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
              
              <button
                onClick={handleCancel}
                disabled={loading}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Avbryt
              </button>
            </div>
          </div>
        ) : (
          /* Code verification step */
          <div>
            {/* Success notification */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <svg className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <div>
                  <h3 className="font-semibold text-green-900">SMS skickat!</h3>
                  <p className="text-sm text-green-800 mt-1">
                    Vi har skickat en 6-siffrig kod till {phone}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ange 6-siffrig kod
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="000000"
                maxLength={6}
                className="text-center text-2xl tracking-[0.5em] font-mono border-2 border-gray-300 rounded-lg w-full py-3 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                disabled={loading}
              />
              <p className="mt-2 text-xs text-gray-500 text-center">
                Koden är giltig i 10 minuter • Kontrollera din SMS
              </p>
            </div>
            
            {/* Security warning */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
              <p className="text-xs text-amber-800 flex items-start gap-2">
                <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span><strong>Säkerhetsvarning:</strong> VägVänner personal kommer ALDRIG att be om din verifieringskod via telefon eller e-post.</span>
              </p>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleVerifyCode}
                disabled={loading || code.length !== 6}
                className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
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
                    Slutför verifiering
                  </>
                )}
              </button>
              
              <button
                onClick={handleBack}
                disabled={loading}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Ändra nummer
              </button>
            </div>
          </div>
        )}
        
        {/* Trust indicators */}
        <div className="mt-6 pt-6 border-t border-gray-100">
          <div className="flex items-center justify-center gap-6">
            <img src="/assets/firebase-auth.svg" alt="Firebase Auth" className="h-6 opacity-50" />
            <img src="/assets/google-secure.svg" alt="Google Secure" className="h-6 opacity-50" />
          </div>
        </div>
      </div>
      
      {/* Footer privacy text */}
      <div className="text-center mt-6 text-sm text-gray-600 px-4">
        <p className="flex items-center justify-center gap-2">
          <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
          </svg>
          Alla uppgifter hanteras enligt svensk dataskyddslagstiftning
        </p>
        <p className="mt-1 text-xs">
          <a href="/privacy" className="text-blue-600 hover:underline">Integritetspolicy</a> • 
          <a href="/terms" className="text-blue-600 hover:underline ml-1">Användarvillkor</a> • 
          <a href="/contact" className="text-blue-600 hover:underline ml-1">Kontakta oss</a>
        </p>
      </div>
    </div>
  );
}
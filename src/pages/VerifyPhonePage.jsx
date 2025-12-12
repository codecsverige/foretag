// src/pages/VerifyPhonePage.jsx
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

export default function VerifyPhonePage() {
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold text-center mb-6">
          {step === "enter-phone" ? "Verifiera ditt telefonnummer" : "Ange verifieringskod"}
        </h1>

        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-100 text-red-700">
            {error}
          </div>
        )}

        {step === "enter-phone" ? (
          /* Phone input step */
          <div>
            <p className="text-gray-600 mb-4">
              Vi skickar en verifieringskod via SMS till ditt telefonnummer.
            </p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Telefonnummer
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+46 70 123 45 67"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              />
            </div>
            
            <div id="recaptcha-container"></div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleSendCode}
                disabled={loading || !validatePhone(phone)}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Skickar...
                  </span>
                ) : "Skicka verifieringskod"}
              </button>
              
              <button
                onClick={handleCancel}
                disabled={loading}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Avbryt
              </button>
            </div>
          </div>
        ) : (
          /* Code verification step */
          <div>
            <p className="text-gray-600 mb-4">
              Ange den 6-siffriga verifieringskoden som skickades till {phone}
            </p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Verifieringskod
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="123456"
                maxLength={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              />
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleVerifyCode}
                disabled={loading || code.length !== 6}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Verifierar...
                  </span>
                ) : "Verifiera"}
              </button>
              
              <button
                onClick={handleBack}
                disabled={loading}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Tillbaka
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

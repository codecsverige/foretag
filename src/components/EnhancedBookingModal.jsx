import React, { useState, useEffect } from "react";
import { doc, runTransaction } from "firebase/firestore";
import { db } from "../firebase/firebase.js";
import { useAuth } from "../context/AuthContext";
import TextInput from "../components/forms/TextInput";
import TextArea from "../components/forms/TextArea";
import { sendNotification } from "../services/notificationService";
import { extractCity } from "../utils/address";

export default function EnhancedBookingModal({ ride, onClose, onSuccess }) {
  
  const { user } = useAuth();
  
  // Form state
  const [name, setName] = useState(user?.displayName || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState(user?.phoneNumber || "");
  const [comment, setComment] = useState("");
  
  // UI state
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submittedData, setSubmittedData] = useState(null);
  
  // Validation state
  const [emailOptional] = useState(true);
  const [sendEmail, setSendEmail] = useState(true);

  function escapeHtml(s) {
    try {
      return String(s)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
    } catch (_) {
      return "";
    }
  }
  
  useEffect(() => {
    // Load user data if available
    if (user) {
      setName(user.displayName || "");
      setEmail(user.email || "");
      setPhone(user.phoneNumber || "");
    }
  }, [user]);
  
  // Validation
  const phoneOk = phone && phone.replace(/\D/g, "").length >= 6;
  const emailOk = !sendEmail || (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()));
  const canSubmit = name.trim() && phoneOk && emailOk && !busy;
  
  // Debug logs pour aider à résoudre les problèmes
  useEffect(() => {
    console.log("EnhancedBookingModal mounted");
    console.log("User data:", user);
    console.log("Initial form state:", { name, email, phone });
    
    return () => {
      console.log("EnhancedBookingModal unmounted");
    };
  }, []);
  
  async function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;
    
    setBusy(true);
    setError("");
    
    try {
      // Create a unique booking ID to prevent duplicates
      const bookingDocId = `seat_${ride.id}_${user.uid}_${Date.now()}`;
      
      const bookingData = {
        bookingType: "seat_booking",
        rideRole: ride.role,
        rideId: ride.id,
        ride_origin: ride.origin,
        ride_destination: ride.destination,
        ride_date: ride.date,
        ride_time: ride.departureTime,
        userId: user.uid,
        counterpartyId: ride.userId,
        passengerName: name.trim(),
        passengerEmail: sendEmail ? email.trim() : "",
        passengerPhone: phone,
        passengerComment: comment.trim(),
        driverName: ride.driverName || "Förare",
        driverEmail: ride.driverEmail,
        driverPhone: ride.driverPhone || "",
        seats: 1,
        price: ride.price || 0,
        commission: 0,
        status: "requested",
        createdAt: Date.now(),
      };
      
      // Save to Firestore in a transaction
      await runTransaction(db, async (tx) => {
        const ref = doc(db, "bookings", bookingDocId);
        tx.set(ref, bookingData);
      });
      
      // Email sending removed; rely on in-app notifications only
      
      // Send notifications
      try {
        await sendNotification(
          ride.driverEmail,
          "Ny bokningsförfrågan",
          `Du har fått en ny bokningsförfrågan för ${extractCity(ride.origin)} → ${extractCity(ride.destination)}.`,
          ride.driverName || "Förare",
          "info"
        );

        // Always notify the booking sender (current user) in their Bookingar tab
        if (user && user.email) {
          await sendNotification(
            user.email,
            "✅ Bokningsförfrågan skickad",
            `Din bokningsförfrågan har skickats till föraren.\n\n` +
            `📍 ${extractCity(ride.origin)} → ${extractCity(ride.destination)}\n` +
            `📅 ${ride.date} kl. ${ride.departureTime}\n\n` +
            `Öppna Bokningar för att följa statusen och chatta vid behov.`,
            name.trim() || "Passagerare",
            "success"
          );
        }
      } catch (notificationError) {
        console.error("Notification error:", notificationError);
        // Continue with the booking process even if notifications fail
      }
      
      // Save submitted data for confirmation view
      setSubmittedData({
        name: name.trim(),
        phone,
        email: sendEmail ? email.trim() : "",
        comment: comment.trim(),
        ride: {
          origin: ride.origin,
          destination: ride.destination,
          date: ride.date,
          time: ride.departureTime
        }
      });
      
      setSubmitted(true);
      
      // Call the success callback if provided
      if (onSuccess) {
        onSuccess(bookingDocId);
      }
    } catch (err) {
      setError(err.message || "Ett fel uppstod vid bokning.");
    }
    
    setBusy(false);
  }
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {!submitted ? (
            <>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Skicka bokningsförfrågan
                </h2>
                <button
                  onClick={onClose}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <span className="text-2xl">×</span>
                </button>
              </div>
              
              {error && (
                <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 rounded-lg">
                  {error}
                </div>
              )}
              
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Information Message */}
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-sm text-blue-700 dark:text-blue-300">
                  <p className="flex items-center gap-2">
                    <span>ℹ️</span>
                    <span><strong>Telefonnummer är obligatoriskt</strong> för att föraren ska kunna kontakta dig. E-post är valfritt.</span>
                  </p>
                </div>
                
                {/* Ride details */}
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-blue-500">🗺️</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {extractCity(ride.origin)} → {extractCity(ride.destination)}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-3 text-sm text-gray-600 dark:text-gray-300">
                    <div className="flex items-center gap-1.5">
                      <span>📅</span>
                      <span>{ride.date}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span>🕐</span>
                      <span>{ride.departureTime}</span>
                    </div>
                    {(ride.costMode === 'fixed_price' && ride.price > 0) ? (
                      <div className="flex items-center gap-1.5">
                        <span>💰</span>
                        <span>{ride.price} kr</span>
                      </div>
                    ) : (ride.costMode === 'cost_share' && Number(ride.approxPrice) > 0) ? (
                      <div className="flex items-center gap-1.5">
                        <span>💰</span>
                        <span>ca {Number(ride.approxPrice)} kr</span>
                      </div>
                    ) : null}
                  </div>
                </div>
                
                {/* Form fields */}
                <div className="space-y-4">
                  <TextInput 
                    label="Namn" 
                    value={name} 
                    onChange={setName} 
                    required 
                  />
                  
                  <div className="space-y-1">
                    <label className="block text-gray-700 dark:text-gray-300 font-medium">
                      Telefon <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded dark:bg-slate-700 dark:text-white"
                      required
                    />
                    <p className="text-xs text-rose-500 dark:text-rose-400 font-medium">
                      Telefonnummer är obligatoriskt (minst 6 siffror)
                    </p>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <label className="block text-gray-700 dark:text-gray-300 font-medium">
                        E-post {!emailOptional && <span className="text-rose-500">*</span>}
                      </label>
                      <label className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                        <input
                          type="checkbox"
                          checked={sendEmail}
                          onChange={(e) => setSendEmail(e.target.checked)}
                          className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 rounded"
                        />
                        Skicka bekräftelse via e-post
                      </label>
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded dark:bg-slate-700 dark:text-white"
                      required={!emailOptional}
                    />
                    <p className="text-xs text-blue-500 dark:text-blue-400">
                      E-post är valfritt
                    </p>
                  </div>
                  
                  <TextArea
                    label="Kommentar"
                    value={comment}
                    onChange={setComment}
                    placeholder="Valfritt meddelande till föraren..."
                  />
                </div>
                
                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={!canSubmit}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md hover:shadow-lg"
                  >
                    {busy ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Skickar...</span>
                      </span>
                    ) : (
                      "Skicka bokningsförfrågan"
                    )}
                  </button>
                </div>
              </form>
            </>
          ) : (
            <>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                  <span>✅</span>
                  <span>Bokning skickad!</span>
                </h2>
                <button
                  onClick={onClose}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <span className="text-2xl">×</span>
                </button>
              </div>
              
              <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-5 mb-4">
                <p className="text-emerald-700 dark:text-emerald-300 font-medium mb-2">
                  Din förfrågan har skickats till föraren.
                </p>
                <p className="text-sm text-emerald-600 dark:text-emerald-400">
                  Föraren kommer att kontakta dig snart.
                </p>
              </div>
              
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden mb-4">
                <div className="bg-gray-50 dark:bg-slate-700 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="font-medium text-gray-900 dark:text-white">Kontaktuppgifter</h3>
                </div>
                <div className="p-4 space-y-3">
                  <div className="grid grid-cols-3 text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Namn:</span>
                    <span className="col-span-2 font-medium text-gray-900 dark:text-white">{submittedData.name}</span>
                  </div>
                  
                  <div className="grid grid-cols-3 text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Telefon:</span>
                    <a href={`tel:${submittedData.phone}`} className="col-span-2 font-medium text-blue-600 dark:text-blue-400 hover:underline">{submittedData.phone}</a>
                  </div>
                  
                  {submittedData.email && (
                    <div className="grid grid-cols-3 text-sm">
                      <span className="text-gray-500 dark:text-gray-400">E-post:</span>
                      <a href={`mailto:${submittedData.email}`} className="col-span-2 font-medium text-blue-600 dark:text-blue-400 hover:underline">{submittedData.email}</a>
                    </div>
                  )}
                  
                  {submittedData.comment && (
                    <div className="grid grid-cols-3 text-sm">
                      <span className="text-gray-500 dark:text-gray-400">Kommentar:</span>
                      <span className="col-span-2 font-medium text-gray-900 dark:text-white">{submittedData.comment}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <div className="bg-gray-50 dark:bg-slate-700 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="font-medium text-gray-900 dark:text-white">Resdetaljer</h3>
                </div>
                <div className="p-4 space-y-3">
                  <div className="grid grid-cols-3 text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Från:</span>
                    <span className="col-span-2 font-medium text-gray-900 dark:text-white">{submittedData.ride.origin}</span>
                  </div>
                  
                  <div className="grid grid-cols-3 text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Till:</span>
                    <span className="col-span-2 font-medium text-gray-900 dark:text-white">{submittedData.ride.destination}</span>
                  </div>
                  
                  <div className="grid grid-cols-3 text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Datum:</span>
                    <span className="col-span-2 font-medium text-gray-900 dark:text-white">{submittedData.ride.date}</span>
                  </div>
                  
                  <div className="grid grid-cols-3 text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Tid:</span>
                    <span className="col-span-2 font-medium text-gray-900 dark:text-white">{submittedData.ride.time}</span>
                  </div>
                </div>
              </div>
              
              <div className="mt-6">
                <button
                  onClick={onClose}
                  className="w-full bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-gray-800 dark:text-white font-medium py-3 px-4 rounded-lg transition-colors"
                >
                  Stäng
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

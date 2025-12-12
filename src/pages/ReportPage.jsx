// src/pages/ReportPage.jsx

import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, addDoc, collection } from "firebase/firestore";
import { db } from "../firebase/firebase.js";
import { useAuth } from "../context/AuthContext.jsx";
import { HiArrowLeft } from "react-icons/hi";
import PageMeta from "../components/PageMeta.jsx";

export default function ReportPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [ride, setRide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const snap = await getDoc(doc(db, "rides", id));
        if (!cancelled) {
          if (snap.exists()) {
            setRide({ id: snap.id, ...snap.data() });
          } else {
            navigate("/", { replace: true });
          }
        }
      } catch (e) {
        console.error("Failed to load ride for report:", e);
        if (!cancelled) navigate("/", { replace: true });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason || !details.trim()) {
      alert("Vänligen fyll i alla fält");
      return;
    }

    setSubmitting(true);
    try {
      await addDoc(collection(db, "reports"), {
        rideId: id,
        rideData: ride,
        reportedBy: user?.uid || "anonymous",
        reporterEmail: user?.email || "",
        reason,
        details: details.trim(),
        createdAt: new Date().toISOString(),
        status: "pending"
      });

      alert("Tack för din rapport. Vi kommer att granska den snarast.");
      navigate(-1);
    } catch (error) {
      console.error("Error submitting report:", error);
      alert("Ett fel uppstod. Försök igen senare.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!ride) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Resan hittades inte</h1>
            <button
              onClick={() => navigate("/")}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Tillbaka till startsidan
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageMeta
        title="Rapportera annons - VägVänner"
        description="Rapportera olämplig annons eller misstänkt aktivitet"
        canonical={`https://vagvanner.se/report/${id}`}
        noindex={true}
      />

      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <HiArrowLeft className="text-xl" />
                <span className="font-medium">Tillbaka</span>
              </button>
              
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                Rapportera annons
              </h1>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
            {/* Ride Info */}
            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Rapporterar annons:</p>
              <p className="font-medium text-gray-900 dark:text-white">
                {ride.origin} → {ride.destination}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {ride.date} kl. {ride.departureTime}
              </p>
            </div>

            {/* Report Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Anledning för rapport *
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Välj en anledning</option>
                  <option value="spam">Spam eller reklam</option>
                  <option value="inappropriate">Olämpligt innehåll</option>
                  <option value="fake">Falsk annons</option>
                  <option value="suspicious">Misstänkt aktivitet</option>
                  <option value="harassment">Trakasserier</option>
                  <option value="other">Annat</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Beskriv problemet *
                </label>
                <textarea
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  rows={5}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ge mer information om varför du rapporterar denna annons..."
                  required
                />
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  disabled={submitting}
                >
                  Avbryt
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                  disabled={submitting}
                >
                  {submitting ? "Skickar..." : "Skicka rapport"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
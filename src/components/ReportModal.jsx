import React, { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from "../firebase/firebase.js";

const ReportModal = ({ isOpen, onClose, rideId, rideData }) => {
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const reportReasons = [
    'Olämpligt innehåll',
    'Felaktig information',
    'Spam eller reklam',
    'Säkerhetsproblem',
    'Bryter mot användarvillkoren',
    'Annat'
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) return;

    setIsSubmitting(true);
    try {
      // Add timeout to prevent infinite loading
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Report submission timeout')), 10000)
      );
      
      await Promise.race([
        addDoc(collection(db, 'reports'), {
          rideId,
          rideData,
          reason,
          description,
          reportedAt: new Date(),
          status: 'pending'
        }),
        timeoutPromise
      ]);
      
      setSubmitted(true);
      setTimeout(() => {
        onClose();
        setSubmitted(false);
        setReason('');
        setDescription('');
      }, 2000);
    } catch (error) {
      console.error('Error submitting report:', error);
      // Show user-friendly error message
      alert('Ett fel uppstod vid skickandet av rapporten. Försök igen senare.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-xl shadow-2xl">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Rapportera annons
          </h2>
          
          {!submitted ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Anledning för rapport *
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                  required
                >
                  <option value="">Välj anledning</option>
                  {reportReasons.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Beskrivning (valfritt)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                  placeholder="Beskriv problemet mer detaljerat..."
                />
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                <p className="text-xs text-yellow-800 dark:text-yellow-200">
                  <strong>💡 Viktigt:</strong> Vi granskar alla rapporter inom 48 timmar och tar bort innehåll som bryter mot våra riktlinjer.
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700"
                >
                  Avbryt
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !reason.trim()}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Skickar...' : 'Skicka rapport'}
                </button>
              </div>
            </form>
          ) : (
            <div className="text-center py-4">
              <div className="text-green-600 text-4xl mb-4">✅</div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Rapport skickad!
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Tack för din rapport. Vi kommer att granska den inom 48 timmar.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportModal; 
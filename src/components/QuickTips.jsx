import React, { useState, useEffect } from "react";
import { HiXMark, HiLightBulb } from "react-icons/hi2";

export default function QuickTips() {
  const [showTips, setShowTips] = useState(false);

  useEffect(() => {
    const hasSeenTips = localStorage.getItem('vagvanner_tips_seen');
    if (!hasSeenTips) {
      // Show tips after a short delay
      const timer = setTimeout(() => {
        setShowTips(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setShowTips(false);
    localStorage.setItem('vagvanner_tips_seen', 'true');
  };

  if (!showTips) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-blue-600 text-white rounded-xl shadow-2xl p-4 max-w-sm z-50 animate-slide-in-right">
      <div className="flex items-start gap-3">
        <HiLightBulb className="w-6 h-6 text-yellow-300 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h4 className="font-bold mb-2">💡 Snabbtips för VägVänner:</h4>
          <ul className="text-sm space-y-1 opacity-90">
            <li>• Sök på stad eller rutt</li>
            <li>• Använd filter för bättre träffar</li>
            <li>• Skapa egen resa om ingen passar</li>
          </ul>
        </div>
        <button
          onClick={handleClose}
          aria-label="Stäng tips"
          className="text-white hover:text-gray-200 transition-colors flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-white/70 rounded"
        >
          <HiXMark className="w-5 h-5" />
        </button>
      </div>
      
      <div className="mt-3 pt-3 border-t border-blue-500">
        <button
          onClick={handleClose}
          aria-label="Förstått, visa inte igen"
          className="text-xs text-blue-50 hover:text-white transition-colors underline-offset-2"
        >
          Förstått, visa inte igen
        </button>
      </div>
    </div>
  );
}
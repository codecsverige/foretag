import React from "react";

export default function MyRidesLoadingState() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center transition-colors duration-500">
      <div className="text-center bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-800 p-10 max-w-lg w-full animate-fade-in-up">
        <div className="animate-spin rounded-full h-20 w-20 border-4 border-blue-200 border-t-blue-600 mx-auto mb-8"></div>
        <h2 className="text-2xl font-bold text-brand mb-3">Laddar</h2>
        <p className="text-gray-600 dark:text-gray-300 text-lg">Förbereder din profil…</p>
      </div>
    </div>
  );
}

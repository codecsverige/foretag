import React from "react";

export default function MyRidesContentLoading() {
  return (
    <div className="flex items-center justify-center py-24">
      <div className="text-center bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-gray-200 dark:border-slate-800 p-10 animate-fade-in-up">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-6"></div>
        <p className="text-xl font-semibold text-brand mb-2">Hämtar data…</p>
        <p className="text-base text-gray-500 dark:text-gray-300">Vänta medan vi laddar dina resor</p>
      </div>
    </div>
  );
}

import React from "react";

export default function MyRidesNoAuth() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center px-4 transition-colors duration-500">
      <div className="text-center bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-800 p-10 max-w-lg w-full animate-fade-in-up">
        <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg">
          <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <h1 className="text-3xl font-extrabold text-brand mb-4">Logga in först</h1>
        <p className="text-gray-600 dark:text-gray-300 mb-8 text-lg">Du måste logga in för att se dina resor</p>
        <button className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-8 py-3 rounded-lg font-bold text-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-lg">
          Gå till inloggning
        </button>
      </div>
    </div>
  );
}

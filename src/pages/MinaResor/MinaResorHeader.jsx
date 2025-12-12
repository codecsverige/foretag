import React from "react";

export default function MinaResorHeader({ 
  newDriverCount = 0, 
  newBookingsCount = 0, 
  newUnlocksCount = 0 
}) {
  const totalNewCount = newDriverCount + newBookingsCount + newUnlocksCount;
  const hasNewActivities = totalNewCount > 0;

  return (
    <div className="mb-6 sm:mb-8">
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-3xl shadow-xl p-6 sm:p-8 border border-white/10">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-40 h-40 bg-white rounded-full mix-blend-overlay filter blur-xl"></div>
          <div className="absolute bottom-0 right-0 w-60 h-60 bg-white rounded-full mix-blend-overlay filter blur-xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-white rounded-full mix-blend-overlay filter blur-2xl"></div>
        </div>
        
        {/* Content */}
        <div className="relative z-10 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 bg-white/25 backdrop-blur rounded-2xl mb-3 shadow-md">
            <svg className="w-6 h-6 sm:w-7 sm:h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.22.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5S16.67 13 17.5 13s1.5.67 1.5 1.5S18.33 16 17.5 16zM5 11l1.5-4.5h11L19 11H5z"/>
            </svg>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-2 tracking-tight drop-shadow">
            Mina Resor
          </h1>
          <p className="text-white/90 text-sm sm:text-base font-medium max-w-xl mx-auto leading-relaxed">
            Välj vad du vill göra: <strong>Söker resa</strong> för att lägga/passera annons, eller se dina <strong>Kontakter</strong>.
          </p>
          {/* Removed non-Swedish helper text to keep UI consistent */}
          
          {/* Stats */}
          <div className="flex justify-center gap-3.5 sm:gap-4 mt-5">
            <div className="bg-white/25 backdrop-blur-md rounded-xl px-4 py-2 shadow">
              <div className="text-white/80 text-[11px] sm:text-xs uppercase tracking-wider">Aktiva</div>
              <div className="text-white text-lg sm:text-xl font-bold">12</div>
            </div>
            <div className="bg-white/25 backdrop-blur-md rounded-xl px-4 py-2 shadow">
              <div className="text-white/80 text-[11px] sm:text-xs uppercase tracking-wider">Denna vecka</div>
              <div className="text-white text-lg sm:text-xl font-bold">5</div>
            </div>
            <div className="bg-white/25 backdrop-blur-md rounded-xl px-4 py-2 shadow">
              <div className="text-white/80 text-[11px] sm:text-xs uppercase tracking-wider">Sparade</div>
              <div className="text-white text-lg sm:text-xl font-bold">280 kr</div>
            </div>
          </div>
        </div>
        
        {/* Notification badge */}
        {hasNewActivities && (
          <div className="absolute top-4 right-4">
            <div className="bg-white/90 text-purple-700 px-3.5 py-1.5 rounded-full shadow-xl font-bold flex items-center gap-2 animate-pulse text-xs sm:text-sm border border-purple-200">
              <span className="text-lg">✨</span>
              <span className="text-sm">{totalNewCount} nya!</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

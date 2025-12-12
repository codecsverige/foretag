import React from "react";

const emptyStateIcons = {
  driver: (
    <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 7V3a4 4 0 118 0v4m-4 0h8m-8 0H5a2 2 0 00-2 2v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3" />
    </svg>
  ),
  passenger: (
    <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  bookings: (
    <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  unlocks: (
    <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  ),
};

const GridOrEmpty = function GridOrEmpty({ items, empty, children, type = "default" }) {
  if (!items.length) {
    const icon = emptyStateIcons[type] || emptyStateIcons.bookings;
    return (
      <div className="col-span-full">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-gray-200 dark:border-slate-700 p-5 sm:p-6 lg:p-8 xl:p-10 transition-all duration-300 hover:shadow-xl">
          <div className="flex flex-col items-center justify-center text-center max-w-lg mx-auto">
            {/* Enhanced Icon */}
            <div className="relative mb-5 lg:mb-6">
              <div className="w-16 h-16 lg:w-20 lg:h-20 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-700 dark:to-slate-600 rounded-2xl flex items-center justify-center shadow-inner">
                <div className="w-10 h-10 lg:w-12 lg:h-12 text-gray-400 dark:text-gray-500">
                  {icon}
                </div>
              </div>
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-white text-[10px]">✨</span>
              </div>
            </div>

            {/* Enhanced Title and Description */}
            <h3 className="text-lg lg:text-xl font-bold text-gray-900 dark:text-white mb-2 lg:mb-3">{empty}</h3>
            <p className="text-xs lg:text-sm text-gray-600 dark:text-gray-300 mb-5 lg:mb-6 leading-relaxed max-w-md">
              {type === "driver" && "Skapa din första samåkningsannons och börja dela resor med andra resenärer i din region"}
              {type === "passenger" && "Lägg upp en resförfrågan för att hitta en resa som passar dina behov och din tidsplan"}
              {type === "bookings" && "Boka din första plats och börja resa tillsammans med andra för att spara pengar och miljö"}
              {type === "unlocks" && "Kontakta användare för att kommunicera direkt och planera resor"}
            </p>

            {/* Enhanced Action Button */}
            <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3">
              <button className="group bg-gradient-to-r from-white to-gray-50 dark:from-slate-800 dark:to-slate-700 border-2 border-gray-200 dark:border-slate-700 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 px-4 lg:px-5 py-2.5 lg:py-3.5 flex items-center justify-center gap-3 min-w-[180px]">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 lg:p-2 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900 dark:to-indigo-900 rounded-xl group-hover:scale-110 transition-transform duration-200">
                    <span className="text-base lg:text-lg">
                      {type === "driver" && "🚗"}
                      {type === "passenger" && "👤"}
                      {type === "bookings" && "🎫"}
                      {type === "unlocks" && "🔓"}
                    </span>
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-gray-900 dark:text-white text-sm lg:text-base">
                      {type === "driver" && "Skapa annons"}
                      {type === "passenger" && "Lägg upp förfrågan"}
                      {type === "bookings" && "Hitta resor"}
                      {type === "unlocks" && "Utforska resor"}
                    </div>
                    <div className="text-xs lg:text-sm text-gray-500 dark:text-gray-400">
                      {type === "driver" && "Börja erbjuda resor"}
                      {type === "passenger" && "Sök efter resor"}
                      {type === "bookings" && "Bläddra bland resor"}
                      {type === "unlocks" && "Kontakta användare"}
                    </div>
                  </div>
                </div>
                <div className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <svg className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
              </button>
            </div>

            {/* Enhanced Status Badge */}
            <div className="mt-5 lg:mt-6 flex items-center gap-2 text-xs lg:text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 lg:w-2.5 lg:h-2.5 bg-green-400 rounded-full animate-pulse shadow-sm"></div>
                <span>Plattformen är aktiv</span>
              </div>
              <span>•</span>
              <span>Säker och verifierad</span>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Enhanced responsive grid layout
  const gridClass = (type === "unlocks" || type === "bookings")
    ? "grid grid-cols-1 gap-4 lg:gap-5"
    : "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-5";
  return (
    <div className={gridClass}>
      {children}
    </div>
  );
};

export default React.memo(GridOrEmpty); 
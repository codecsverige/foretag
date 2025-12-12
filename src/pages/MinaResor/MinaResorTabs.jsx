import React from "react";
import TabBtn from "../../components/ui/TabBtn.jsx";

export default function MinaResorTabs({ 
  activeTab, 
  onTabChange, 
  newDriver = false, 
  newBookings = false, 
  newUnlocks = false,
  newDriverCount = 0,
  newBookingsCount = 0,
  newUnlocksCount = 0
}) {
  const totalNewCount = newDriverCount + newBookingsCount + newUnlocksCount;
  const hasNewActivities = totalNewCount > 0;
  const SHOW_RESOR = false; // hide driver in passenger page
  const SHOW_BOKNINGAR = false; // hide passenger bookings in this page

  const visibleTabs = [SHOW_RESOR, true /* passenger */, SHOW_BOKNINGAR, true /* unlocks */].filter(Boolean).length;
  const gridCols = visibleTabs === 2 ? 'grid-cols-2' : visibleTabs === 3 ? 'grid-cols-3' : 'grid-cols-4';

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-700 mb-6 sm:mb-8 p-2 sm:p-3 relative overflow-hidden">
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/8 via-purple-500/8 to-pink-500/8 pointer-events-none"></div>
      
      {/* Notification badge */}
      {hasNewActivities && (
        <div className="absolute -top-3 -right-3 z-30">
          <div className="relative">
            <div className="absolute inset-0 bg-red-500 rounded-full animate-ping"></div>
            <div className="relative bg-gradient-to-r from-red-500 to-pink-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg flex items-center gap-1">
              <span>✨</span>
              <span>{totalNewCount}</span>
            </div>
          </div>
        </div>
      )}
      
      <div className={`grid ${gridCols} gap-1.5 sm:gap-2 relative z-10`}>
        <TabBtn
          label="🧭 Söker resa"
          tabId="passenger"
          active={activeTab}
          onClick={onTabChange}
          compact={true}
          className="font-semibold"
        />
        <TabBtn
          label="💬 Kontakter"
          tabId="unlocks"
          active={activeTab}
          onClick={onTabChange}
          badge={newUnlocks}
          compact={true}
          className="font-semibold"
        />
      </div>
    </div>
  );
}

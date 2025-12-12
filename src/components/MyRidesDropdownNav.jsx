import React, { useState, useRef, useEffect } from "react";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/outline";

const tabConfigs = {
  driver: {
    label: "Mina resor",
    icon: "🚗",
    color: "blue",
    description: "Resor som förare"
  },
  passenger: {
    label: "Annonser", 
    icon: "👤",
    color: "green",
    description: "Passagerar-annonser"
  },
  bookings: {
    label: "Bokningar",
    icon: "📋",
    color: "purple", 
    description: "Mina bokningar"
  },
  unlocks: {
    label: "Kontakter",
    icon: "💬",
    color: "orange",
    description: "Kontakter"
  }
};

export default function MyRidesDropdownNav({ 
  activeTab, 
  onTabChange, 
  newDriver = false, 
  newBookings = false, 
  newUnlocks = false,
  newDriverCount = 0,
  newBookingsCount = 0,
  newUnlocksCount = 0
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  
  const totalNewCount = newDriverCount + newBookingsCount + newUnlocksCount;
  const hasNewActivities = totalNewCount > 0;

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleTabSelect = (tabId) => {
    onTabChange(tabId);
    setIsOpen(false);
  };

  const getNotificationCount = (tabId) => {
    switch (tabId) {
      case "driver": return newDriverCount;
      case "bookings": return newBookingsCount;
      case "unlocks": return newUnlocksCount;
      default: return 0;
    }
  };

  const hasNotification = (tabId) => {
    switch (tabId) {
      case "driver": return newDriver;
      case "bookings": return newBookings;
      case "unlocks": return newUnlocks;
      default: return false;
    }
  };

  const activeConfig = tabConfigs[activeTab];

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Enhanced Dropdown Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-full flex items-center justify-between bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-xl px-4 py-3 font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700 hover:border-gray-400 dark:hover:border-slate-500 transition-all duration-200 shadow-sm hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2 bg-gray-100 dark:bg-slate-700 rounded-lg">
            <span className="text-xl">{activeConfig.icon}</span>
          </div>
          <div className="text-left">
            <div className="font-semibold text-gray-800 dark:text-gray-100 truncate text-base">
              {activeConfig.label}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
              {activeConfig.description}
            </div>
          </div>
          {hasNewActivities && (
            <div className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-bold animate-pulse min-w-[20px] text-center">
              {totalNewCount}
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-1 ml-3">
          {isOpen ? (
            <ChevronUpIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
          ) : (
            <ChevronDownIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
          )}
        </div>
      </button>

      {/* Enhanced Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-xl shadow-xl z-50 py-2 max-h-80 overflow-y-auto backdrop-blur-sm">
          {Object.entries(tabConfigs).map(([tabId, config]) => {
            const isActive = activeTab === tabId;
            const notificationCount = getNotificationCount(tabId);
            const showNotification = hasNotification(tabId);
            
            return (
              <button
                key={tabId}
                onClick={() => handleTabSelect(tabId)}
                className={`w-full flex items-center gap-4 px-4 py-3.5 transition-all duration-200 hover:bg-gray-50 dark:hover:bg-slate-700 focus:outline-none focus:bg-gray-50 dark:focus:bg-slate-700 ${
                  isActive 
                    ? `bg-${config.color}-50 dark:bg-${config.color}-900/20 border-l-4 border-${config.color}-500 text-${config.color}-700 dark:text-${config.color}-400 font-semibold` 
                    : "text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-gray-100"
                }`}
                role="option"
                aria-selected={isActive}
              >
                <div className={`p-2.5 rounded-lg ${
                  isActive 
                    ? `bg-${config.color}-100 dark:bg-${config.color}-900/40` 
                    : "bg-gray-100 dark:bg-slate-700"
                }`}>
                  <span className="text-xl">{config.icon}</span>
                </div>
                
                <div className="flex-1 text-left min-w-0">
                  <div className="font-semibold truncate text-base">{config.label}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 truncate">{config.description}</div>
                </div>
                
                <div className="flex items-center gap-2">
                  {showNotification && notificationCount > 0 && (
                    <div className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-bold animate-pulse min-w-[24px] text-center">
                      {notificationCount}
                    </div>
                  )}
                  
                  {isActive && (
                    <div className={`p-1 rounded-full bg-${config.color}-100 dark:bg-${config.color}-900/40`}>
                      <svg className={`h-4 w-4 text-${config.color}-600 dark:text-${config.color}-400`} fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

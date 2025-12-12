import React from "react";
import NotificationBadge from "./NotificationBadge.jsx";

export default function TabNav({ 
  // Legacy props for backward compatibility
  tab, setTab, labels, badges = {}, 
  // New props interface
  tabs, activeTab, onTabChange, className = ""
}) {
  // Support both interfaces
  const currentTab = activeTab || tab;
  const setCurrentTab = onTabChange || setTab;
  const tabsData = tabs || labels;

  if (!tabsData) return null;

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 mb-6 p-1 ${className}`}>
      <div className="flex gap-1">
        {tabsData.map((t) => {
          // Support both object and string formats
          const tabId = typeof t === 'string' ? t : t.id;
          const tabLabel = typeof t === 'string' ? t : (t.label || t.id);
          const tabIcon = typeof t === 'object' && t.icon ? t.icon : '';
          const notificationCount = typeof t === 'object' ? t.notificationCount : (badges[tabId] || 0);

          return (
            <button
              key={tabId}
              className={`relative flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2
                ${currentTab === tabId
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg scale-105 focus:ring-blue-500"
                  : "bg-white text-gray-600 hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50 hover:text-blue-700 border-0 shadow-sm hover:shadow-md focus:ring-gray-300"
                }
              `}
              onClick={() => setCurrentTab(tabId)}
            >
              {tabIcon && (
                <span className="text-lg">{tabIcon}</span>
              )}
              <span className="text-sm font-medium">{tabLabel}</span>
              {notificationCount > 0 && (
                <span className="bg-orange-500 text-white text-xs font-bold rounded-full h-5 min-w-[20px] px-1 flex items-center justify-center animate-pulse">
                  {notificationCount}
                </span>
              )}
              
              {/* Legacy notification badge support */}
              <NotificationBadge 
                show={badges[tabId] || false} 
                size="small"
                position="top-right"
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}

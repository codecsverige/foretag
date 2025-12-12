import React from "react";
import Pill from "../Pill.jsx";
import NotificationBadge from "./NotificationBadge.jsx";

const tabIcons = {
  driver: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3a4 4 0 118 0v4m-4 0h8m-8 0H5a2 2 0 00-2 2v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3" />
    </svg>
  ),
  passenger: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  bookings: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  unlocks: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  ),
};

export default function TabBtn({ label, tabId, active, onClick, badge = false, compact = false }) {
  const icon = tabIcons[tabId];
  
  return (
    <button
      onClick={() => onClick(tabId)}
      className={`relative flex ${compact ? 'flex-col' : 'flex-col sm:flex-row'} items-center justify-center gap-1 ${compact ? 'px-2 py-2' : 'px-2 sm:px-4 py-2 sm:py-3'} rounded-lg font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 min-w-0
        ${active === tabId
          ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg scale-105 focus:ring-blue-500"
          : "bg-white text-gray-600 hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50 hover:text-blue-700 border-0 shadow-sm hover:shadow-md focus:ring-gray-300"
        }
      `}
      aria-current={active === tabId ? "page" : undefined}
      aria-label={label}
    >
      <span className={`transition-all duration-300 ${active === tabId ? 'scale-110' : ''} ${compact ? 'text-base' : ''}`}>
        {icon}
      </span>
      <span className={`${compact ? 'text-xs' : 'text-xs sm:text-sm'} font-medium text-center`}>{label}</span>
      <NotificationBadge 
        show={badge} 
        size={compact ? "small" : "medium"}
        position="top-right"
      />
    </button>
  );
}
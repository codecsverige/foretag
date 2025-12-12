/* ────────────────────────────────────────────────
   src/components/WelcomeNotification.jsx
   مكون إشعار الترحيب للمستخدمين الجدد/العائدين
──────────────────────────────────────────────── */

import React from 'react';

export default function WelcomeNotification({ 
  notification, 
  show, 
  onDismiss 
}) {
  if (!show || !notification) return null;

  return (
    <div className="fixed top-20 right-4 z-50 animate-slide-in-right">
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-4 rounded-xl shadow-2xl border-0 max-w-sm relative">
        {/* زر الإغلاق */}
        <button
          onClick={onDismiss}
          className="absolute top-2 right-2 text-white/80 hover:text-white transition-colors"
        >
          ✕
        </button>
        
        {/* المحتوى */}
        <div className="pr-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">👋</span>
            <h3 className="font-bold text-lg">{notification.title}</h3>
          </div>
          <p className="text-blue-100 text-sm leading-relaxed">
            {notification.message}
          </p>
        </div>
        
        {/* تأثير الإضاءة */}
        <div className="absolute inset-0 rounded-xl bg-white opacity-10 animate-pulse"></div>
      </div>
    </div>
  );
}
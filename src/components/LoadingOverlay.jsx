import React from "react";

/** طبقة تحميل نصف شفافة للشاشات الحرجة */
export default function LoadingOverlay({ text = "Laddar…" }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white p-6 rounded shadow-lg text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900 mb-4"></div>
        <p>{text}</p>
      </div>
    </div>
  );
}

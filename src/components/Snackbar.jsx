import React from "react";

const PALETTE = {
  success: "bg-emerald-600",
  error:   "bg-rose-600",
  info:    "bg-slate-800",
};

/** نافذة تنبيه عائمة تُغلق بالنقر عليها */
export default function Snackbar({ text, type = "info", onClear }) {
  if (!text) return null;

  return (
    <div
      onClick={onClear}
      className={`
        fixed bottom-6 left-1/2 -translate-x-1/2
        ${PALETTE[type] || PALETTE.info}
        text-white px-6 py-3 rounded-xl shadow-lg z-50 cursor-pointer
      `}
    >
      {text}
    </div>
  );
}

/* ────────────────────────────────────────────────
   src/components/ReportDialog.jsx
   حوار إرسال تقرير (Rapport) خلال 48 ساعة من فتح الاتصال.
   يُستعمل فى UnlockContactPage + UnlockCard.
──────────────────────────────────────────────── */
import React, { useState } from "react";
import PropTypes from "prop-types";

const REASONS = [
  { id: "wrong_number", label: "Fel nummer / kontaktuppgift" },
  { id: "no_response",  label: "Ingen kontakt / svarar inte" },
  { id: "spam",         label: "Spam / olämpligt innehåll" },
  { id: "commercial_activity", label: "Misstänkt kommersiell verksamhet" },
  { id: "other",        label: "Annat problem" },
];

export default function ReportDialog({
  open,
  onClose,
  onSubmit,
  busy = false,
  defaultReason = "wrong_number",
}) {
  const [reason, setReason] = useState(defaultReason);
  const [msg, setMsg]       = useState("");

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-xl p-6">
        <h2 className="font-bold text-lg mb-4">Rapportera problem</h2>

        <div className="space-y-2 mb-4">
          {REASONS.map(r => (
            <label key={r.id} className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="rapport_reason"
                value={r.id}
                checked={reason === r.id}
                onChange={() => setReason(r.id)}
                className="accent-brand"
                disabled={busy}
              />
              {r.label}
            </label>
          ))}
        </div>

        <textarea
          value={msg}
          onChange={e => setMsg(e.target.value)}
          placeholder="Beskriv kort..."
          className="w-full min-h-[80px] text-sm border rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-blue-600"
          disabled={busy}
        />

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="px-4 py-2 text-sm rounded bg-gray-100 hover:bg-gray-200"
          >
            Avbryt
          </button>
          <button
            type="button"
            onClick={() => onSubmit({ reason, message: msg })}
            disabled={busy}
            className="px-4 py-2 text-sm rounded bg-rose-600 hover:bg-rose-700 text-white"
          >
            Skicka
          </button>
        </div>
      </div>
    </div>
  );
}

ReportDialog.propTypes = {
  open:          PropTypes.bool.isRequired,
  onClose:       PropTypes.func.isRequired,
  onSubmit:      PropTypes.func.isRequired,
  busy:          PropTypes.bool,
  defaultReason: PropTypes.string,
};

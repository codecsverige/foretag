import React from "react";

export default function CreateAlertDialog({
  open,
  fromValue,
  toValue,
  dateValue,
  timeFromValue,
  timeToValue,
  globalChecked,
  busy,
  error,
  onChange,
  onClose,
  onSubmit,
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={busy ? undefined : onClose} />
      <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-[90%] max-w-md p-5 border dark:border-slate-700">
        <h3 className="text-base font-bold mb-2">🔔 Skapa bevakning</h3>
        <p className="text-xs text-gray-600 dark:text-gray-400 mb-4">
          Du får push-notiser och e-post när någon lägger upp en resa som matchar dina kriterier.
        </p>
        <div className="grid gap-3">
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" checked={!!globalChecked} onChange={e => onChange({ key: 'global', value: e.target.checked })} />
            <span className="text-sm">Alla resor (global bevakning)</span>
          </label>
          <div>
            <label className="block text-xs text-gray-600 dark:text-slate-300 mb-1">Från</label>
            <input
              type="text"
              className="w-full border rounded-lg px-3 py-2 dark:bg-slate-800 dark:text-slate-100"
              value={fromValue}
              onChange={e => onChange({ key: 'from', value: e.target.value })}
              placeholder="t.ex. Stockholm"
              disabled={busy}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 dark:text-slate-300 mb-1">Till</label>
            <input
              type="text"
              className="w-full border rounded-lg px-3 py-2 dark:bg-slate-800 dark:text-slate-100"
              value={toValue}
              onChange={e => onChange({ key: 'to', value: e.target.value })}
              placeholder="t.ex. Göteborg"
              disabled={busy}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 dark:text-slate-300 mb-1">Datum (valfritt)</label>
            <input
              type="date"
              className="w-full border rounded-lg px-3 py-2 dark:bg-slate-800 dark:text-slate-100"
              value={dateValue}
              onChange={e => onChange({ key: 'date', value: e.target.value })}
              disabled={busy}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-gray-600 dark:text-slate-300 mb-1">Tid från (valfritt)</label>
              <input
                type="time"
                className="w-full border rounded-lg px-3 py-2 dark:bg-slate-800 dark:text-slate-100"
                value={timeFromValue}
                onChange={e => onChange({ key: 'timeFrom', value: e.target.value })}
                disabled={busy}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 dark:text-slate-300 mb-1">Tid till (valfritt)</label>
              <input
                type="time"
                className="w-full border rounded-lg px-3 py-2 dark:bg-slate-800 dark:text-slate-100"
                value={timeToValue}
                onChange={e => onChange({ key: 'timeTo', value: e.target.value })}
                disabled={busy}
              />
            </div>
          </div>
          {error && <div className="text-xs text-rose-600">{error}</div>}
        </div>
        <div className="mt-4 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            disabled={busy}
            className="px-3 py-1.5 rounded-lg border text-sm disabled:opacity-50"
          >Avbryt</button>
          <button
            onClick={onSubmit}
            disabled={busy}
            className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold disabled:opacity-50"
          >{busy ? 'Sparar…' : 'Spara bevakning'}</button>
        </div>
      </div>
    </div>
  );
}


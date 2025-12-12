/* ───────────────────────────────────────────────
   src/components/ConfirmModal.jsx
   نافذة حوار تأكيدية مرنة (Danger / Warning / Info)
──────────────────────────────────────────────── */
import React, { useEffect, useCallback, useRef } from "react";
import PropTypes from "prop-types";

/* إعدادات الألوان حسب النوع */
const STYLES = {
  danger:  {
    icon: "⚠️",
    bgHeader: "bg-red-50",
    borderHeader: "border-red-200",
    btn: "bg-red-600 hover:bg-red-700",
  },
  warning: {
    icon: "⚠️",
    bgHeader: "bg-yellow-50",
    borderHeader: "border-yellow-200",
    btn: "bg-yellow-600 hover:bg-yellow-700",
  },
  info: {
    icon: "ℹ️",
    bgHeader: "bg-blue-50",
    borderHeader: "border-blue-200",
    btn: "bg-blue-600 hover:bg-blue-700",
  },
};

/**
 * ConfirmModal
 *
 * @param {boolean} open          إظهار/إخفاء النافذة
 * @param {string}  title         عنوان النافذة
 * @param {string}  body          نص المحتوى
 * @param {() => void} onOk       استدعاء عند التأكيد
 * @param {() => void} onCancel   استدعاء عند الإلغاء أو الإغلاق
 * @param {'danger'|'warning'|'info'} type  نوع النافذة
 */
function ConfirmModal({ open, title, body, onOk, onCancel, type = "danger" }) {
  const { icon, bgHeader, borderHeader, btn } = STYLES[type] ?? STYLES.danger;
  const dialogRef = useRef(null);

  /* إغلاق بالضغط على ESC */
  const handleEscape = useCallback(
    (e) => e.key === "Escape" && onCancel(),
    [onCancel],
  );

  /* تركيز تلقائي داخل النافذة + منع تمرير الخلفية */
  useEffect(() => {
    if (!open) return;

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleEscape);

    // التركيز على النافذة لالتقاط ESC دائماً
    dialogRef.current?.focus();

    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open, handleEscape]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in"
      aria-labelledby="confirm-title"
      role="dialog"
      aria-modal="true"
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="bg-white w-full max-w-md rounded-xl shadow-2xl focus:outline-none animate-zoom-in-95"
      >
        {/* رأس النافذة */}
        <header
          className={`p-6 border-b ${bgHeader} ${borderHeader} flex items-center gap-3`}
        >
          <span className="text-2xl" aria-hidden="true">
            {icon}
          </span>
          <h2 id="confirm-title" className="text-lg font-bold text-gray-900">
            {title}
          </h2>
        </header>

        {/* المحتوى */}
        <section className="p-6">
          <p className="text-gray-700 leading-relaxed">{body}</p>
        </section>

        {/* الأزرار */}
        <footer className="p-6 pt-0 flex flex-col sm:flex-row gap-4 justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="px-8 py-4 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors text-lg font-bold"
          >
            Avbryt
          </button>
          <button
            type="button"
            onClick={onOk}
            className={`px-8 py-4 text-white rounded-xl transition-colors text-lg font-bold ${btn}`}
          >
            Bekräfta
          </button>
        </footer>
      </div>
    </div>
  );
}

/* PropTypes للتحقق من صحة البيانات */
ConfirmModal.propTypes = {
  open:     PropTypes.bool.isRequired,
  title:    PropTypes.string.isRequired,
  body:     PropTypes.string.isRequired,
  onOk:     PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  type:     PropTypes.oneOf(["danger", "warning", "info"]),
};

export default React.memo(ConfirmModal);

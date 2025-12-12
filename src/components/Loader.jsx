/* ───────────────────────────────────────────────
   src/components/Loader.jsx
   مؤشّر تحميل متعدد الأنماط (Spinner / Dots / Pulse)
──────────────────────────────────────────────── */
import React from "react";
import PropTypes from "prop-types";

/* أحجام العنصر */
const SIZE_MAP = {
  small:  { box: "h-6  w-6  sm:h-8  sm:w-8",  text: "text-base  sm:text-lg"  },
  medium: { box: "h-12 w-12 sm:h-16 sm:w-16", text: "text-lg    sm:text-xl" },
  large:  { box: "h-20 w-20 sm:h-24 sm:w-24", text: "text-xl    sm:text-2xl"},
};

/**
 * Loader
 *
 * @param {string} text    نص مرفق (اختياري)
 * @param {'small'|'medium'|'large'} size
 * @param {'spinner'|'dots'|'pulse'}  variant
 */
function Loader({ text = "Laddar...", size = "medium", variant = "spinner" }) {
  const { box, text: textSize } = SIZE_MAP[size] ?? SIZE_MAP.medium;

  /* عناصر الرسم حسب النمط */
  const Spinner = () => (
    <div className={`${box} border-4 border-indigo-600 border-t-transparent animate-spin rounded-full`} aria-hidden="true" />
  );

  const Dots = () => (
    <div className="flex space-x-1" aria-hidden="true">
      {[0, 150, 300].map((delay) => (
        <div
          key={delay}
          className={`${box} bg-indigo-600 rounded-full animate-bounce`}
          style={{ animationDelay: `${delay}ms` }}
        />
      ))}
    </div>
  );

  const Pulse = () => (
    <div className={`${box} bg-indigo-600 rounded-full animate-pulse`} aria-hidden="true" />
  );

  const renderIndicator = () => {
    switch (variant) {
      case "dots":   return <Dots />;
      case "pulse":  return <Pulse />;
      default:       return <Spinner />;
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      role="status"
      aria-label="Loading"
    >
      <div className="flex flex-col items-center gap-3 sm:gap-4">
        {renderIndicator()}
        {text && (
          <p className={`${textSize} text-gray-600 font-medium text-center animate-pulse`}>
            {text}
          </p>
        )}
      </div>
    </div>
  );
}

/* PropTypes */
Loader.propTypes = {
  text:    PropTypes.string,
  size:    PropTypes.oneOf(["small", "medium", "large"]),
  variant: PropTypes.oneOf(["spinner", "dots", "pulse"]),
};

export default React.memo(Loader);

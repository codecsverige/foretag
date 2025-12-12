/* ────────────────────────────────
   src/components/Badge.jsx
   شارة (Badge) مع ألوان وأحجام متعددة
──────────────────────────────── */
import React from "react";
import PropTypes from "prop-types";

/* لوحة الألوان */
const COLORS = {
  rose:     { bg: "bg-red-500",     text: "text-white", hover: "hover:bg-red-600" },
  emerald:  { bg: "bg-emerald-500", text: "text-white", hover: "hover:bg-emerald-600" },
  yellow:   { bg: "bg-yellow-500",  text: "text-white", hover: "hover:bg-yellow-600" },
  orange:   { bg: "bg-orange-500",  text: "text-white", hover: "hover:bg-orange-600" },
  blue:     { bg: "bg-blue-500",    text: "text-white", hover: "hover:bg-blue-600" },
  purple:   { bg: "bg-purple-500",  text: "text-white", hover: "hover:bg-purple-600" },
  gray:     { bg: "bg-gray-500",    text: "text-white", hover: "hover:bg-gray-600" },
};

/* أحجام الخط والحشو */
const SIZES = {
  small:  "text-[10px] px-2 py-0.5",
  medium: "text-xs px-3 py-1",   // القيمة الافتراضية
  large:  "text-sm px-4 py-1.5",
};

/**
 * Badge – شارة ملوّنة صغيرة
 *
 * @param {React.ReactNode} children  النص أو المحتوى داخل الشارة
 * @param {'rose'|'emerald'|'yellow'|'orange'|'blue'|'purple'|'gray'} color
 * @param {'small'|'medium'|'large'} size
 * @param {boolean} animated  نبض متحرك؟
 */
function Badge({ children, color = "gray", size = "medium", animated = false }) {
  const { bg, text, hover } = COLORS[color] ?? COLORS.gray;
  const sizeClasses         = SIZES[size]  ?? SIZES.medium;

  return (
    <span
      role="status"
      className={`
        inline-flex items-center justify-center
        ${bg} ${text} ${hover} ${sizeClasses}
        font-medium rounded-full shadow-sm transition-colors duration-200
        ${animated ? "animate-pulse" : ""}
      `}
    >
      {children}
    </span>
  );
}

/* التحقق من الخصائص */
Badge.propTypes = {
  children: PropTypes.node.isRequired,
  color:    PropTypes.oneOf(Object.keys(COLORS)),
  size:     PropTypes.oneOf(Object.keys(SIZES)),
  animated: PropTypes.bool,
};

export default React.memo(Badge);

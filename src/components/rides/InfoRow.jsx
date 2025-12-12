// src/components/ui/InfoRow.jsx

import React from "react";
import PropTypes from "prop-types";

/**
 * InfoRow
 * Renders a compact label/value pair with adjustable styling.
 */
export default function InfoRow({ label, value, valueClass }) {
  return (
    <div className="flex justify-between items-center gap-2 text-[13px] py-1 sm:py-1.5 min-w-0">
      <span className="text-gray-600 font-medium whitespace-nowrap">{label}:</span>
      <span className={valueClass || "text-gray-800 font-semibold truncate text-right max-w-[70%]"}>
        {value}
      </span>
    </div>
  );
}

InfoRow.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.node
  ]).isRequired,
  valueClass: PropTypes.string
};

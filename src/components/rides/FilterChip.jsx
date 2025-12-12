import React from "react";
import PropTypes from "prop-types";

export default function FilterChip({ label, onRemove }) {
  return (
    <span
      className="
        flex items-center gap-1
        bg-brand/10 dark:bg-brand/20 text-brand dark:text-brand-200
        text-xs rounded-full px-2 py-0.5 mr-1 mb-1
        select-none shadow-sm border border-brand/10 dark:border-brand/40
        max-w-[90vw] sm:max-w-full truncate
      "
      style={{
        minWidth: 0,
        fontSize: "12px",
        lineHeight: "1.2",
        fontWeight: 500,
      }}
    >
      <span className="truncate">{label}</span>
      <button
        onClick={onRemove}
        aria-label="Ta bort filter"
        className="
          ml-1 w-4 h-4 flex items-center justify-center rounded-full
          hover:bg-brand hover:text-white dark:hover:bg-brand-300
          focus:outline-none focus:ring-2 focus:ring-blue-600/60
          transition-all duration-150
        "
        tabIndex={0}
        type="button"
      >
        <span className="font-bold text-[14px] leading-none">×</span>
      </button>
    </span>
  );
}

FilterChip.propTypes = {
  label: PropTypes.string.isRequired,
  onRemove: PropTypes.func.isRequired,
};

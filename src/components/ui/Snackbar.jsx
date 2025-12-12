import React from "react";
import PropTypes from "prop-types";

const palette = {
  success: "bg-emerald-600",
  error:   "bg-rose-600",
  info:    "bg-slate-800"
};

export default function Snackbar({ text, type="info", onClear }) {
  if (!text) return null;
  return (
    <div
      onClick={onClear}
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 text-white px-6 py-3 rounded-xl shadow-lg z-50 cursor-pointer ${palette[type]}`}
    >
      {text}
    </div>
  );
}

Snackbar.propTypes = {
  text:     PropTypes.string,
  type:     PropTypes.oneOf(["info","success","error"]),
  onClear:  PropTypes.func.isRequired
};

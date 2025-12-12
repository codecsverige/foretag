import React from "react";
import PropTypes from "prop-types";

export default function TextArea({ label, value, onChange, placeholder="", disabled=false }) {
  return (
    <label className="block text-sm">
      {label}:
      <textarea
        className="mt-1 w-full border rounded p-2 h-24 resize-none"
        value={value}
        onChange={e=>onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
      />
    </label>
  );
}

TextArea.propTypes = {
  label:       PropTypes.string.isRequired,
  value:       PropTypes.string,
  onChange:    PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  disabled:    PropTypes.bool
};

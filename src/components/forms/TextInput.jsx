import React from "react";
import PropTypes from "prop-types";

export default function TextInput({
  label, value, onChange,
  placeholder="", disabled=false, required=false
}) {
  return (
    <label className="block text-sm">
      {label}{required && "*"}:
      <input
        type="text"
        className="mt-1 w-full border rounded p-2"
        value={value}
        onChange={e=>onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
      />
    </label>
  );
}

TextInput.propTypes = {
  label:       PropTypes.string.isRequired,
  value:       PropTypes.string,
  onChange:    PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  disabled:    PropTypes.bool,
  required:    PropTypes.bool
};

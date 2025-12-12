// src/components/ui/IconButton.jsx
import React from "react";
import clsx from "clsx";
import PropTypes from "prop-types";

export default function IconButton({ icon, active, className, ...rest }) {
  return (
    <button
      {...rest}
      className={clsx(
        "p-2 rounded-full transition hover:bg-slate-200 dark:hover:bg-slate-700",
        active && "bg-brand text-white hover:bg-brand/90",
        className
      )}
    >
      {icon}
    </button>
  );
}
IconButton.propTypes = { icon:PropTypes.node.isRequired, active:PropTypes.bool };
IconButton.defaultProps = { active:false };

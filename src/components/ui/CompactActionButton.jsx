import React from "react";
import { FaEdit, FaTrash, FaEye, FaPhone, FaUnlock, FaTimes } from "react-icons/fa";

const buttonVariants = {
  primary: "bg-blue-500 hover:bg-blue-600 text-white",
  secondary: "bg-gray-500 hover:bg-gray-600 text-white", 
  success: "bg-green-500 hover:bg-green-600 text-white",
  warning: "bg-yellow-500 hover:bg-yellow-600 text-white",
  danger: "bg-red-500 hover:bg-red-600 text-white",
  info: "bg-indigo-500 hover:bg-indigo-600 text-white"
};

const buttonSizes = {
  xs: "px-2 py-1 text-xs",
  sm: "px-3 py-1.5 text-sm", 
  md: "px-4 py-2 text-sm",
  lg: "px-6 py-3 text-base"
};

const iconComponents = {
  edit: FaEdit,
  delete: FaTrash,
  view: FaEye,
  contact: FaPhone,
  unlock: FaUnlock,
  cancel: FaTimes
};

export default function CompactActionButton({ 
  type = "primary",
  size = "sm", 
  icon = null,
  iconOnly = false,
  children,
  onClick,
  disabled = false,
  loading = false,
  className = "",
  ...props
}) {
  const IconComponent = icon && iconComponents[icon];
  
  const buttonClasses = `
    inline-flex items-center justify-center gap-1.5 
    font-medium rounded-lg transition-all duration-200 
    shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-1
    disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none
    ${buttonVariants[type]}
    ${buttonSizes[size]}
    ${iconOnly ? "p-2" : ""}
    ${loading ? "cursor-wait" : ""}
    ${className}
  `;

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={buttonClasses}
      {...props}
    >
      {loading ? (
        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
      ) : (
        <>
          {IconComponent && <IconComponent className="w-3.5 h-3.5" />}
          {!iconOnly && children && <span className="whitespace-nowrap">{children}</span>}
        </>
      )}
    </button>
  );
}

// Predefined action buttons
export const EditButton = ({ onClick, size = "sm", ...props }) => (
  <CompactActionButton 
    type="primary" 
    icon="edit" 
    size={size}
    onClick={onClick}
    {...props}
  >
    Redigera
  </CompactActionButton>
);

export const DeleteButton = ({ onClick, size = "sm", ...props }) => (
  <CompactActionButton 
    type="danger" 
    icon="delete" 
    size={size}
    onClick={onClick}
    {...props}
  >
    Radera
  </CompactActionButton>
);

export const ViewButton = ({ onClick, size = "sm", ...props }) => (
  <CompactActionButton 
    type="info" 
    icon="view" 
    size={size}
    onClick={onClick}
    {...props}
  >
    Visa
  </CompactActionButton>
);

export const ContactButton = ({ onClick, size = "sm", ...props }) => (
  <CompactActionButton 
    type="success" 
    icon="contact" 
    size={size}
    onClick={onClick}
    {...props}
  >
    Kontakta
  </CompactActionButton>
);

export const UnlockButton = ({ onClick, size = "sm", ...props }) => (
  <CompactActionButton 
    type="warning" 
    icon="unlock" 
    size={size}
    onClick={onClick}
    {...props}
  >
    Lås upp
  </CompactActionButton>
);

export const CancelButton = ({ onClick, size = "sm", ...props }) => (
  <CompactActionButton 
    type="secondary" 
    icon="cancel" 
    size={size}
    onClick={onClick}
    {...props}
  >
    Avbryt
  </CompactActionButton>
);

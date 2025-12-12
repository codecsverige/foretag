import React from "react";

export default function LoadingSpinner({ 
  size = "md", 
  text = "", 
  className = "",
  fullScreen = false 
}) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8", 
    lg: "h-12 w-12",
    xl: "h-16 w-16"
  };

  const spinner = (
    <div className={`animate-spin rounded-full border-b-2 border-indigo-600 ${sizeClasses[size]} ${className}`}></div>
  );

  if (fullScreen) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          {spinner}
          {text && <p className="mt-4 text-gray-600">{text}</p>}
        </div>
      </div>
    );
  }

  if (text) {
    return (
      <div className="flex items-center justify-center">
        <div className="text-center">
          {spinner}
          <p className="mt-2 text-gray-600">{text}</p>
        </div>
      </div>
    );
  }

  return spinner;
} 
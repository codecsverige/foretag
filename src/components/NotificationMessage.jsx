import React, { useEffect } from "react";

const NotificationMessage = ({ message, onClose }) => {
  useEffect(() => {
    if (message.text && message.type !== "error") {
      const timer = setTimeout(() => {
        onClose();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message.text, message.type, onClose]);

  if (!message.text) return null;

  const getIcon = () => {
    switch (message.type) {
      case "success":
        return "✅";
      case "error":
        return "❌";
      case "warning":
        return "⚠️";
      default:
        return "ℹ️";
    }
  };

  const getStyles = () => {
    switch (message.type) {
      case "success":
        return "bg-green-100 text-green-700 border-green-300";
      case "error":
        return "bg-red-100 text-red-700 border-red-300";
      case "warning":
        return "bg-yellow-100 text-yellow-700 border-yellow-300";
      default:
        return "bg-blue-100 text-blue-700 border-blue-300";
    }
  };

  return (
    <div className={`mb-6 p-4 rounded-lg border ${getStyles()} animate-fade-in-down`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <span className="mr-3 text-lg">{getIcon()}</span>
          <span className="font-medium">{message.text}</span>
        </div>
        <button
          onClick={onClose}
          className="ml-4 text-gray-500 hover:text-gray-700 transition-colors"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

export default NotificationMessage; 
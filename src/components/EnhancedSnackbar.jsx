import React, { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";

/**
 * مكون Snackbar محسن لاستبدال alert() التقليدي
 * يحل مشكلة النوافذ التقليدية المربكة
 */
export default function EnhancedSnackbar({
  message,
  type = "info",
  duration = 5000,
  position = "bottom-right",
  onClose,
  show = false,
  className = "",
  ...props
}) {
  const [isVisible, setIsVisible] = useState(show);
  const [isAnimating, setIsAnimating] = useState(false);
  const timeoutRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    if (show) {
      showSnackbar();
    } else {
      hideSnackbar();
    }
  }, [show, message]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  const showSnackbar = () => {
    setIsAnimating(true);
    setIsVisible(true);
    
    // إزالة التأثير بعد انتهاء الرسوم المتحركة
    setTimeout(() => {
      setIsAnimating(false);
    }, 300);

    // إغلاق تلقائي
    if (duration > 0) {
      timeoutRef.current = setTimeout(() => {
        hideSnackbar();
      }, duration);
    }
  };

  const hideSnackbar = () => {
    setIsAnimating(true);
    
    // إزالة التأثير بعد انتهاء الرسوم المتحركة
    setTimeout(() => {
      setIsVisible(false);
      setIsAnimating(false);
      if (onClose) {
        onClose();
      }
    }, 300);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  const handleClose = () => {
    hideSnackbar();
  };

  const getTypeStyles = () => {
    switch (type) {
      case "success":
        return "bg-green-500 text-white border-green-600";
      case "error":
        return "bg-red-500 text-white border-red-600";
      case "warning":
        return "bg-yellow-500 text-white border-yellow-600";
      case "info":
      default:
        return "bg-blue-500 text-white border-blue-600";
    }
  };

  const getPositionStyles = () => {
    switch (position) {
      case "top-left":
        return "top-4 left-4";
      case "top-right":
        return "top-4 right-4";
      case "top-center":
        return "top-4 left-1/2 transform -translate-x-1/2";
      case "bottom-left":
        return "bottom-4 left-4";
      case "bottom-center":
        return "bottom-4 left-1/2 transform -translate-x-1/2";
      case "bottom-right":
      default:
        return "bottom-4 right-4";
    }
  };

  const getIcon = () => {
    switch (type) {
      case "success":
        return "✅";
      case "error":
        return "❌";
      case "warning":
        return "⚠️";
      case "info":
      default:
        return "ℹ️";
    }
  };

  if (!isVisible) return null;

  return (
    <div
      className={`fixed z-50 max-w-sm w-full ${getPositionStyles()} ${className}`}
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      {...props}
    >
      <div
        className={`
          flex items-center justify-between p-4 rounded-lg shadow-lg border-l-4
          transform transition-all duration-300 ease-in-out
          ${getTypeStyles()}
          ${isAnimating ? 'scale-95 opacity-0' : 'scale-100 opacity-100'}
        `}
      >
        <div className="flex items-center space-x-3">
          <span className="text-lg">{getIcon()}</span>
          <p className="text-sm font-medium">{message}</p>
        </div>
        
        <button
          onClick={handleClose}
          className="ml-4 text-white hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-transparent rounded"
          aria-label="Stäng meddelande"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

EnhancedSnackbar.propTypes = {
  message: PropTypes.string.isRequired,
  type: PropTypes.oneOf(['success', 'error', 'warning', 'info']),
  duration: PropTypes.number,
  position: PropTypes.oneOf(['top-left', 'top-right', 'top-center', 'bottom-left', 'bottom-right', 'bottom-center']),
  onClose: PropTypes.func,
  show: PropTypes.bool,
  className: PropTypes.string
};

// Hook للاستخدام في التطبيق
export const useSnackbar = () => {
  const [snackbar, setSnackbar] = useState({
    show: false,
    message: '',
    type: 'info',
    duration: 5000
  });

  const showSnackbar = (message, type = 'info', duration = 5000) => {
    setSnackbar({
      show: true,
      message,
      type,
      duration
    });
  };

  const hideSnackbar = () => {
    setSnackbar(prev => ({
      ...prev,
      show: false
    }));
  };

  const showSuccess = (message, duration) => showSnackbar(message, 'success', duration);
  const showError = (message, duration) => showSnackbar(message, 'error', duration);
  const showWarning = (message, duration) => showSnackbar(message, 'warning', duration);
  const showInfo = (message, duration) => showSnackbar(message, 'info', duration);

  return {
    snackbar,
    showSnackbar,
    hideSnackbar,
    showSuccess,
    showError,
    showWarning,
    showInfo
  };
};

// مكون Snackbar Provider
export const SnackbarProvider = ({ children }) => {
  const { snackbar, hideSnackbar } = useSnackbar();

  return (
    <>
      {children}
      <EnhancedSnackbar
        show={snackbar.show}
        message={snackbar.message}
        type={snackbar.type}
        duration={snackbar.duration}
        onClose={hideSnackbar}
      />
    </>
  );
};

SnackbarProvider.propTypes = {
  children: PropTypes.node.isRequired
}; 
import React from "react";
import PropTypes from "prop-types";

/**
 * مكون لتحسين إمكانية الوصول
 * يحل مشاكل Accessibility مثل مفاتيح التنقل وaria-label
 */
export default function AccessibilityWrapper({ 
  children, 
  role, 
  ariaLabel, 
  ariaDescribedBy, 
  tabIndex = 0,
  onKeyDown,
  className = "",
  ...props 
}) {
  const handleKeyDown = (event) => {
    // دعم التنقل بلوحة المفاتيح
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (onKeyDown) {
        onKeyDown(event);
      }
    }
  };

  return (
    <div
      role={role}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      tabIndex={tabIndex}
      onKeyDown={handleKeyDown}
      className={`accessibility-wrapper ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

AccessibilityWrapper.propTypes = {
  children: PropTypes.node.isRequired,
  role: PropTypes.string,
  ariaLabel: PropTypes.string,
  ariaDescribedBy: PropTypes.string,
  tabIndex: PropTypes.number,
  onKeyDown: PropTypes.func,
  className: PropTypes.string
};

// مكون للروابط المحسنة
export function AccessibleLink({ 
  href, 
  children, 
  ariaLabel, 
  className = "",
  ...props 
}) {
  return (
    <a
      href={href}
      aria-label={ariaLabel}
      className={`accessible-link ${className}`}
      tabIndex={0}
      {...props}
    >
      {children}
    </a>
  );
}

AccessibleLink.propTypes = {
  href: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  ariaLabel: PropTypes.string,
  className: PropTypes.string
};

// مكون للأزرار المحسنة
export function AccessibleButton({ 
  onClick, 
  children, 
  ariaLabel, 
  disabled = false,
  className = "",
  ...props 
}) {
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      disabled={disabled}
      className={`accessible-button ${className}`}
      tabIndex={disabled ? -1 : 0}
      {...props}
    >
      {children}
    </button>
  );
}

AccessibleButton.propTypes = {
  onClick: PropTypes.func,
  children: PropTypes.node.isRequired,
  ariaLabel: PropTypes.string,
  disabled: PropTypes.bool,
  className: PropTypes.string
};

// مكون للصور المحسنة
export function AccessibleImage({ 
  src, 
  alt, 
  className = "",
  ...props 
}) {
  return (
    <img
      src={src}
      alt={alt}
      className={`accessible-image ${className}`}
      loading="lazy"
      {...props}
    />
  );
}

AccessibleImage.propTypes = {
  src: PropTypes.string.isRequired,
  alt: PropTypes.string.isRequired,
  className: PropTypes.string
};

// مكون للتنقل المحسن
export function AccessibleNavigation({ 
  children, 
  ariaLabel = "Huvudnavigation",
  className = "",
  ...props 
}) {
  return (
    <nav
      aria-label={ariaLabel}
      className={`accessible-navigation ${className}`}
      role="navigation"
      {...props}
    >
      {children}
    </nav>
  );
}

AccessibleNavigation.propTypes = {
  children: PropTypes.node.isRequired,
  ariaLabel: PropTypes.string,
  className: PropTypes.string
};

// مكون للقوائم المحسنة
export function AccessibleList({ 
  items, 
  ariaLabel,
  className = "",
  ...props 
}) {
  return (
    <ul
      aria-label={ariaLabel}
      className={`accessible-list ${className}`}
      role="list"
      {...props}
    >
      {items.map((item, index) => (
        <li key={index} role="listitem">
          {item}
        </li>
      ))}
    </ul>
  );
}

AccessibleList.propTypes = {
  items: PropTypes.arrayOf(PropTypes.node).isRequired,
  ariaLabel: PropTypes.string,
  className: PropTypes.string
};

// مكون للعناوين المحسنة
export function AccessibleHeading({ 
  level = 1, 
  children, 
  className = "",
  ...props 
}) {
  const HeadingTag = `h${level}`;
  
  return (
    <HeadingTag
      className={`accessible-heading ${className}`}
      {...props}
    >
      {children}
    </HeadingTag>
  );
}

AccessibleHeading.propTypes = {
  level: PropTypes.oneOf([1, 2, 3, 4, 5, 6]),
  children: PropTypes.node.isRequired,
  className: PropTypes.string
};

// مكون للتنبيهات المحسنة
export function AccessibleAlert({ 
  message, 
  type = "info",
  className = "",
  ...props 
}) {
  const alertRole = type === "error" ? "alert" : "status";
  
  return (
    <div
      role={alertRole}
      aria-live="polite"
      className={`accessible-alert accessible-alert--${type} ${className}`}
      {...props}
    >
      {message}
    </div>
  );
}

AccessibleAlert.propTypes = {
  message: PropTypes.string.isRequired,
  type: PropTypes.oneOf(['info', 'success', 'warning', 'error']),
  className: PropTypes.string
}; 
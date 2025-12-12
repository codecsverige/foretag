import React from "react";
import { FaInbox } from "react-icons/fa";

export default function CompactGrid({ 
  items = [], 
  empty = "Inga objekt att visa",
  emptyIcon = null,
  children,
  columns = "auto-fit",
  minWidth = "280px",
  gap = "gap-3",
  className = ""
}) {
  const EmptyIcon = emptyIcon || FaInbox;

  // Empty state
  if (!items || items.length === 0) {
    return (
      <div className={`
        flex flex-col items-center justify-center 
        py-12 px-6 text-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-200
        ${className}
      `}>
        <div className="bg-gray-100 rounded-full p-4 mb-4">
          <EmptyIcon className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-600 mb-2">Tomt här</h3>
        <p className="text-sm text-gray-500 max-w-sm">{empty}</p>
      </div>
    );
  }

  // Grid configuration
  const gridClasses = `
    grid auto-rows-max
    ${gap}
    ${className}
  `;

  const gridStyle = {
    gridTemplateColumns: columns === "auto-fit" 
      ? `repeat(auto-fit, minmax(${minWidth}, 1fr))`
      : columns
  };

  return (
    <div className={gridClasses} style={gridStyle}>
      {children}
    </div>
  );
}

// Responsive grid presets
export const CompactMobileGrid = ({ children, ...props }) => (
  <CompactGrid
    columns="1fr"
    gap="gap-2"
    {...props}
  >
    {children}
  </CompactGrid>
);

export const CompactTabletGrid = ({ children, ...props }) => (
  <CompactGrid
    columns="repeat(auto-fit, minmax(260px, 1fr))"
    gap="gap-3"
    {...props}
  >
    {children}
  </CompactGrid>
);

export const CompactDesktopGrid = ({ children, ...props }) => (
  <CompactGrid
    columns="repeat(auto-fit, minmax(320px, 1fr))"
    gap="gap-4"
    {...props}
  >
    {children}
  </CompactGrid>
);

// Auto-responsive grid that adapts to screen size
export const ResponsiveCompactGrid = ({ children, ...props }) => (
  <div className="grid gap-2 sm:gap-3 lg:gap-4 
                  grid-cols-1 
                  sm:grid-cols-2 
                  lg:grid-cols-3 
                  xl:grid-cols-4">
    {children}
  </div>
);

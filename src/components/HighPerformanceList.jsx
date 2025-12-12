// src/components/HighPerformanceList.jsx - Composant optimisé pour des milliers d'éléments
import React, { useMemo, useState, useCallback, useRef } from "react";

const ITEM_HEIGHT = 120; // Hauteur fixe par élément
const BUFFER_SIZE = 5; // Nombre d'éléments à rendre en plus du visible

export default function HighPerformanceList({ 
  items = [], 
  renderItem, 
  containerHeight = 600,
  searchQuery = "",
  filterFn = null,
  sortFn = null,
  onItemClick = null,
  className = "",
  emptyMessage = "Inga objekt att visa"
}) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef(null);

  // Filtrage et tri optimisés avec mémoization
  const processedItems = useMemo(() => {
    let filtered = items;

    // Filtrage par recherche
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item => 
        (item.from?.toLowerCase().includes(query)) ||
        (item.to?.toLowerCase().includes(query)) ||
        (item.userName?.toLowerCase().includes(query)) ||
        (item.description?.toLowerCase().includes(query))
      );
    }

    // Filtrage personnalisé
    if (filterFn) {
      filtered = filtered.filter(filterFn);
    }

    // Tri
    if (sortFn) {
      filtered = [...filtered].sort(sortFn);
    }

    return filtered;
  }, [items, searchQuery, filterFn, sortFn]);

  // Calcul des éléments visibles
  const visibleItems = useMemo(() => {
    const containerHeight_ = containerHeight;
    const startIndex = Math.floor(scrollTop / ITEM_HEIGHT);
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight_ / ITEM_HEIGHT) + BUFFER_SIZE,
      processedItems.length
    );
    
    const visibleStartIndex = Math.max(0, startIndex - BUFFER_SIZE);
    
    return {
      items: processedItems.slice(visibleStartIndex, endIndex),
      startIndex: visibleStartIndex,
      endIndex,
      totalHeight: processedItems.length * ITEM_HEIGHT
    };
  }, [processedItems, scrollTop, containerHeight]);

  // Gestion du scroll optimisée
  const handleScroll = useCallback((e) => {
    const scrollTop = e.target.scrollTop;
    setScrollTop(scrollTop);
  }, []);

  // Scroll vers un élément spécifique (non utilisé actuellement)
  // const scrollToItem = useCallback((index) => {
  //   if (containerRef.current) {
  //     const scrollTop = index * ITEM_HEIGHT;
  //     containerRef.current.scrollTop = scrollTop;
  //   }
  // }, []);

  // Gestion du click optimisée
  const handleItemClick = useCallback((item, index) => {
    if (onItemClick) {
      onItemClick(item, index);
    }
  }, [onItemClick]);

  if (processedItems.length === 0) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ height: containerHeight }}>
        <div className="text-center text-gray-500">
          <p className="text-lg font-medium">{emptyMessage}</p>
          {searchQuery && (
            <p className="text-sm mt-2">Försök med andra sökord</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* Informations de performance */}
      <div className="text-xs text-gray-500 mb-2 flex justify-between">
        <span>Visar {visibleItems.items.length} av {processedItems.length} objekt</span>
        <span>Totalt: {items.length} objekt</span>
      </div>

      {/* Container virtualisé */}
      <div
        ref={containerRef}
        className="overflow-auto border border-gray-200 rounded-lg bg-white"
        style={{ height: containerHeight }}
        onScroll={handleScroll}
      >
        {/* Spacer pour la hauteur totale */}
        <div style={{ height: visibleItems.totalHeight, position: 'relative' }}>
          {/* Éléments visibles */}
          <div
            style={{
              transform: `translateY(${visibleItems.startIndex * ITEM_HEIGHT}px)`,
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
            }}
          >
            {visibleItems.items.map((item, index) => {
              const actualIndex = visibleItems.startIndex + index;
              return (
                <div
                  key={item.id || actualIndex}
                  style={{ height: ITEM_HEIGHT }}
                  className="border-b border-gray-100 hover:bg-gray-50 transition-colors duration-150 cursor-pointer"
                  onClick={() => handleItemClick(item, actualIndex)}
                >
                  {renderItem(item, actualIndex)}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Indicateur de scroll */}
      {processedItems.length > Math.ceil(containerHeight / ITEM_HEIGHT) && (
        <div className="mt-2 flex justify-center">
          <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
            Scroll pour voir plus d'éléments
          </div>
        </div>
      )}
    </div>
  );
}

// Hook pour utiliser la liste haute performance
export function useHighPerformanceList(items, options = {}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState(options.defaultSort || "date");
  const [sortOrder, setSortOrder] = useState(options.defaultOrder || "desc");

  const sortFn = useMemo(() => {
    return (a, b) => {
      let aVal, bVal;
      
      switch (sortBy) {
        case "date":
          aVal = new Date(a.date || a.createdAt || 0);
          bVal = new Date(b.date || b.createdAt || 0);
          break;
        case "price":
          aVal = parseFloat(a.price || 0);
          bVal = parseFloat(b.price || 0);
          break;
        case "name":
          aVal = (a.userName || a.name || "").toLowerCase();
          bVal = (b.userName || b.name || "").toLowerCase();
          break;
        default:
          return 0;
      }

      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
      return 0;
    };
  }, [sortBy, sortOrder]);

  const toggleSort = useCallback((field) => {
    if (sortBy === field) {
      setSortOrder(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  }, [sortBy]);

  return {
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    sortFn,
    toggleSort
  };
} 
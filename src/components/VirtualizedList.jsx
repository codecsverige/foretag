import React, { useState, useCallback, useRef, useMemo } from "react";
import { FixedSizeList as List } from "react-window";
import AutoSizer from "react-virtualized-auto-sizer";

const ITEM_HEIGHT = 120; // Hauteur fixe par élément
const BUFFER_SIZE = 10; // Nombre d'éléments à pré-rendre

export default function VirtualizedList({
  items = [],
  renderItem,
  height = 600,
  width = "100%",
  className = "",
  emptyMessage = "Inga objekt att visa",
  loadingMessage = "Laddar...",
  onItemClick = null,
  searchQuery = "",
  filterFn = null,
  sortFn = null
}) {
  const [scrollTop, setScrollTop] = useState(0);
  const listRef = useRef(null);

  // Optimisation: Mémoisation des données filtrées et triées
  const processedItems = useMemo(() => {
    let filtered = items;

    // Filtrage par recherche
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item => 
        (item.origin?.toLowerCase().includes(query)) ||
        (item.destination?.toLowerCase().includes(query)) ||
        (item.userName?.toLowerCase().includes(query)) ||
        (item.description?.toLowerCase().includes(query)) ||
        (item.from?.toLowerCase().includes(query)) ||
        (item.to?.toLowerCase().includes(query))
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

  // Fonction de rendu optimisée pour react-window
  const Row = useCallback(({ index, style }) => {
    const item = processedItems[index];
    if (!item) return null;

    return (
      <div style={style} className="px-2">
        <div 
          className="h-full cursor-pointer hover:bg-gray-50 transition-colors duration-150 rounded-lg"
          onClick={() => onItemClick?.(item, index)}
        >
          {renderItem(item, index)}
        </div>
      </div>
    );
  }, [processedItems, renderItem, onItemClick]);

  // Gestion du scroll optimisée
  const handleScroll = useCallback(({ scrollTop: newScrollTop }) => {
    setScrollTop(newScrollTop);
  }, []);

  // Scroll vers un élément spécifique
  const scrollToItem = useCallback((index) => {
    if (listRef.current) {
      listRef.current.scrollToItem(index, "center");
    }
  }, []);

  // Scroll vers le haut
  const scrollToTop = useCallback(() => {
    if (listRef.current) {
      listRef.current.scrollTo(0);
    }
  }, []);

  // État de chargement
  if (items.length === 0) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ height }}>
        <div className="text-center text-gray-500">
          <p className="text-lg font-medium">{emptyMessage}</p>
          {searchQuery && (
            <p className="text-sm mt-2">Försök med andra sökord</p>
          )}
        </div>
      </div>
    );
  }

  // État vide après filtrage
  if (processedItems.length === 0) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ height }}>
        <div className="text-center text-gray-500">
          <p className="text-lg font-medium">Inga resultat hittades</p>
          {searchQuery && (
            <p className="text-sm mt-2">Försök med andra sökord</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} style={{ height, width }}>
      {/* Informations de performance */}
      <div className="text-xs text-gray-500 mb-2 flex justify-between items-center">
        <span>
          Visar {processedItems.length} av {items.length} objekt
        </span>
        <div className="flex gap-2">
          <button
            onClick={scrollToTop}
            className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs transition-colors"
          >
            ↑ Topp
          </button>
          {processedItems.length > 20 && (
            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
              Virtualiserad
            </span>
          )}
        </div>
      </div>

      {/* Liste virtualisée */}
      <div className="flex-1 border border-gray-200 rounded-lg bg-white overflow-hidden">
        <AutoSizer>
          {({ height: listHeight, width: listWidth }) => (
            <List
              ref={listRef}
              height={listHeight}
              width={listWidth}
              itemCount={processedItems.length}
              itemSize={ITEM_HEIGHT}
              onScroll={handleScroll}
              overscanCount={BUFFER_SIZE}
              className="scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
            >
              {Row}
            </List>
          )}
        </AutoSizer>
      </div>

      {/* Indicateur de scroll */}
      {processedItems.length > Math.ceil(height / ITEM_HEIGHT) && (
        <div className="mt-2 flex justify-center">
          <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
            Scroll för att se fler objekt
          </div>
        </div>
      )}
    </div>
  );
}

// Hook pour utiliser la liste virtualisée
export function useVirtualizedList(items, options = {}) {
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
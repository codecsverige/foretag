import { useState, useEffect, useCallback, useMemo, useRef } from 'react';

// Hook pour la virtualisation des listes importantes
export default function useVirtualizedList({
  items = [],
  itemHeight = 200,
  containerHeight = 600,
  overscan = 5, // Nombre d'éléments supplémentaires à rendre hors de la vue
  onLoadMore,
  hasMore = false,
  loading = false
}) {
  const [scrollTop, setScrollTop] = useState(0);
  const [containerRef, setContainerRef] = useState(null);
  const loadMoreTriggered = useRef(false);

  // Calculer les indices visibles
  const { startIndex, endIndex, visibleItems, totalHeight, offsetY } = useMemo(() => {
    if (!items.length) {
      return {
        startIndex: 0,
        endIndex: 0,
        visibleItems: [],
        totalHeight: 0,
        offsetY: 0
      };
    }

    const itemsPerView = Math.ceil(containerHeight / itemHeight);
    const scrolledItems = Math.floor(scrollTop / itemHeight);
    
    const start = Math.max(0, scrolledItems - overscan);
    const end = Math.min(
      items.length,
      scrolledItems + itemsPerView + overscan
    );

    return {
      startIndex: start,
      endIndex: end,
      visibleItems: items.slice(start, end),
      totalHeight: items.length * itemHeight,
      offsetY: start * itemHeight
    };
  }, [items, itemHeight, containerHeight, scrollTop, overscan]);

  // Gestionnaire de défilement optimisé
  const handleScroll = useCallback((e) => {
    const { scrollTop: newScrollTop, scrollHeight, clientHeight } = e.target;
    
    setScrollTop(newScrollTop);

    // Déclencher le chargement de plus d'éléments
    const scrollPercentage = (newScrollTop + clientHeight) / scrollHeight;
    if (scrollPercentage > 0.8 && hasMore && !loading && !loadMoreTriggered.current) {
      loadMoreTriggered.current = true;
      onLoadMore?.();
      
      // Réinitialiser le déclencheur après un délai
      setTimeout(() => {
        loadMoreTriggered.current = false;
      }, 1000);
    }
  }, [hasMore, loading, onLoadMore]);

  // Défilement automatique vers un élément
  const scrollToIndex = useCallback((index) => {
    if (containerRef) {
      const scrollTop = index * itemHeight;
      containerRef.scrollTop = scrollTop;
    }
  }, [containerRef, itemHeight]);

  // Défilement fluide vers un élément
  const scrollToIndexSmooth = useCallback((index) => {
    if (containerRef) {
      const scrollTop = index * itemHeight;
      containerRef.scrollTo({
        top: scrollTop,
        behavior: 'smooth'
      });
    }
  }, [containerRef, itemHeight]);

  // Recherche d'un élément et défilement vers lui
  const findAndScrollTo = useCallback((predicate) => {
    const index = items.findIndex(predicate);
    if (index !== -1) {
      scrollToIndexSmooth(index);
      return index;
    }
    return -1;
  }, [items, scrollToIndexSmooth]);

  // Optimisation pour les gros datasets
  const isVirtualizationNeeded = useMemo(() => {
    return items.length > 50; // Seuil pour activer la virtualisation
  }, [items.length]);

  // Hook pour surveiller les changements de taille
  useEffect(() => {
    if (containerRef) {
      const resizeObserver = new ResizeObserver(() => {
        // Recalculer si nécessaire
      });
      resizeObserver.observe(containerRef);
      
      return () => resizeObserver.disconnect();
    }
  }, [containerRef]);

  return {
    // Données calculées
    startIndex,
    endIndex,
    visibleItems,
    totalHeight,
    offsetY,
    
    // États
    scrollTop,
    isVirtualizationNeeded,
    
    // Fonctions
    handleScroll,
    scrollToIndex,
    scrollToIndexSmooth,
    findAndScrollTo,
    setContainerRef,
    
    // Composant Container
    VirtualContainer: ({ children, className = '', style = {} }) => (
      <div
        ref={setContainerRef}
        className={`virtual-scroll-container ${className}`}
        style={{
          height: containerHeight,
          overflowY: 'auto',
          ...style
        }}
        onScroll={handleScroll}
      >
        <div
          style={{
            height: totalHeight,
            position: 'relative'
          }}
        >
          <div
            style={{
              transform: `translateY(${offsetY}px)`,
              position: 'absolute',
              width: '100%'
            }}
          >
            {children}
          </div>
        </div>
        {loading && (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}
      </div>
    )
  };
}

// src/utils/performanceUtils.js - Utilitaires de performance
import { memo, useMemo, useCallback } from "react";

/**
 * Debounce function pour optimiser les recherches
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function pour optimiser les événements de scroll
 */
export function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Lazy load des images avec intersection observer
 */
export function createLazyImageLoader() {
  const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src;
        img.classList.remove('lazy');
        observer.unobserve(img);
      }
    });
  });

  return {
    observe: (img) => imageObserver.observe(img),
    disconnect: () => imageObserver.disconnect()
  };
}

/**
 * Optimisation des listes avec virtualisation simple
 */
export function calculateVisibleItems(
  scrollTop,
  containerHeight,
  itemHeight,
  totalItems,
  overscan = 5
) {
  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.min(
    startIndex + Math.ceil(containerHeight / itemHeight) + overscan,
    totalItems
  );
  
  return {
    startIndex: Math.max(0, startIndex - overscan),
    endIndex,
    visibleItems: endIndex - Math.max(0, startIndex - overscan)
  };
}

/**
 * Mémoisation avancée pour les composants lourds
 */
export function createMemoizedComponent(Component, compareProps) {
  return memo(Component, compareProps || ((prevProps, nextProps) => {
    // Comparaison par défaut optimisée
    const prevKeys = Object.keys(prevProps);
    const nextKeys = Object.keys(nextProps);
    
    if (prevKeys.length !== nextKeys.length) return false;
    
    return prevKeys.every(key => {
      const prevVal = prevProps[key];
      const nextVal = nextProps[key];
      
      // Comparaison spéciale pour les arrays
      if (Array.isArray(prevVal) && Array.isArray(nextVal)) {
        return prevVal.length === nextVal.length && 
               prevVal.every((item, index) => item === nextVal[index]);
      }
      
      return prevVal === nextVal;
    });
  }));
}

/**
 * Hook optimisé pour les filtres de recherche
 */
export function useOptimizedSearch(items, searchFields, searchQuery) {
  return useMemo(() => {
    if (!searchQuery || !searchQuery.trim()) return items;
    
    const query = searchQuery.toLowerCase().trim();
    const queryWords = query.split(' ').filter(word => word.length > 0);
    
    return items.filter(item => {
      return queryWords.every(word => 
        searchFields.some(field => {
          const value = item[field];
          return value && value.toString().toLowerCase().includes(word);
        })
      );
    });
  }, [items, searchFields, searchQuery]);
}

/**
 * Hook optimisé pour le tri
 */
export function useOptimizedSort(items, sortBy, sortOrder) {
  return useMemo(() => {
    if (!sortBy) return items;
    
    return [...items].sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];
      
      // Gestion des dates
      if (sortBy.includes('date') || sortBy.includes('Date')) {
        aVal = new Date(aVal || 0);
        bVal = new Date(bVal || 0);
      }
      // Gestion des nombres
      else if (typeof aVal === 'string' && !isNaN(parseFloat(aVal))) {
        aVal = parseFloat(aVal);
        bVal = parseFloat(bVal);
      }
      // Gestion des strings
      else if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = (bVal || '').toLowerCase();
      }
      
      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [items, sortBy, sortOrder]);
}

/**
 * Gestionnaire d'événements optimisé
 */
export function createOptimizedEventHandler(handler, deps = []) {
  return useCallback(handler, deps);
}

/**
 * Chunking pour traiter de grandes quantités de données
 */
export function processInChunks(array, chunkSize, processor) {
  return new Promise((resolve) => {
    const results = [];
    let index = 0;
    
    function processChunk() {
      const chunk = array.slice(index, index + chunkSize);
      if (chunk.length === 0) {
        resolve(results);
        return;
      }
      
      const chunkResults = chunk.map(processor);
      results.push(...chunkResults);
      index += chunkSize;
      
      // Utiliser requestIdleCallback si disponible
      if (window.requestIdleCallback) {
        requestIdleCallback(processChunk);
      } else {
        setTimeout(processChunk, 0);
      }
    }
    
    processChunk();
  });
}

/**
 * Nettoyage automatique des listeners
 */
export function createAutoCleanupListener(element, event, handler, options) {
  element.addEventListener(event, handler, options);
  
  return () => {
    element.removeEventListener(event, handler, options);
  };
}

/**
 * Optimisation des re-renders avec des dépendances stables
 */
export function createStableDeps(deps) {
  const stableRef = useRef();
  
  return useMemo(() => {
    const currentDeps = JSON.stringify(deps);
    if (stableRef.current !== currentDeps) {
      stableRef.current = currentDeps;
    }
    return deps;
  }, [JSON.stringify(deps)]);
}

/**
 * Mesure des performances des composants
 */
export function measurePerformance(name, fn) {
  const start = performance.now();
  const result = fn();
  const end = performance.now();
  
  if (process.env.NODE_ENV === 'development') {
    console.log(`🚀 ${name}: ${(end - start).toFixed(2)}ms`);
  }
  
  return result;
}

/**
 * Cache LRU simple pour les calculs coûteux
 */
export function createLRUCache(maxSize = 100) {
  const cache = new Map();
  
  return {
    get(key) {
      if (cache.has(key)) {
        const value = cache.get(key);
        cache.delete(key);
        cache.set(key, value);
        return value;
      }
      return undefined;
    },
    
    set(key, value) {
      if (cache.has(key)) {
        cache.delete(key);
      } else if (cache.size >= maxSize) {
        const firstKey = cache.keys().next().value;
        cache.delete(firstKey);
      }
      cache.set(key, value);
    },
    
    clear() {
      cache.clear();
    },
    
    size() {
      return cache.size;
    }
  };
}

/**
 * Détection automatique des performances lentes
 */
export function createPerformanceMonitor() {
  const slowOperations = [];
  
  return {
    measure(name, fn) {
      const start = performance.now();
      const result = fn();
      const duration = performance.now() - start;
      
      if (duration > 100) { // Plus de 100ms
        slowOperations.push({ name, duration, timestamp: Date.now() });
        console.warn(`⚠️ Slow operation detected: ${name} took ${duration.toFixed(2)}ms`);
      }
      
      return result;
    },
    
    getSlowOperations() {
      return slowOperations;
    },
    
    clearHistory() {
      slowOperations.length = 0;
    }
  };
} 
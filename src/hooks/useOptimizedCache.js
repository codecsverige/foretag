// src/hooks/useOptimizedCache.js - Cache optimisé pour hautes performances
import { useState, useEffect, useRef, useCallback, useMemo } from "react";

// Cache global pour partager les données entre composants
const globalCache = new Map();
const cacheExpiry = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Nettoyage périodique du cache
setInterval(() => {
  const now = Date.now();
  for (const [key, expiry] of cacheExpiry.entries()) {
    if (now > expiry) {
      globalCache.delete(key);
      cacheExpiry.delete(key);
    }
  }
}, 60 * 1000); // Nettoie toutes les minutes

export function useOptimizedCache(key, fetchFn, options = {}) {
  const {
    cacheTime = CACHE_DURATION,
    staleTime = 30 * 1000, // 30 secondes
    refetchOnWindowFocus = true,
    enabled = true
  } = options;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastFetch, setLastFetch] = useState(0);
  
  const abortControllerRef = useRef(null);
  const mountedRef = useRef(true);

  // Vérifier si les données sont dans le cache et valides
  const getCachedData = useCallback(() => {
    const cachedData = globalCache.get(key);
    const expiry = cacheExpiry.get(key);
    
    if (cachedData && expiry && Date.now() < expiry) {
      return cachedData;
    }
    return null;
  }, [key]);

  // Mettre en cache les données
  const setCachedData = useCallback((newData) => {
    globalCache.set(key, newData);
    cacheExpiry.set(key, Date.now() + cacheTime);
  }, [key, cacheTime]);

  // Fonction de fetch optimisée
  const fetchData = useCallback(async (force = false) => {
    if (!enabled) return;

    // Vérifier le cache si ce n'est pas forcé
    if (!force) {
      const cached = getCachedData();
      if (cached) {
        setData(cached);
        setError(null);
        return cached;
      }
    }

    // Éviter les requêtes multiples
    if (loading) return;

    // Annuler la requête précédente
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    setLoading(true);
    setError(null);

    try {
      const result = await fetchFn({ signal: abortControllerRef.current.signal });
      
      if (mountedRef.current) {
        setData(result);
        setCachedData(result);
        setLastFetch(Date.now());
        setError(null);
      }
      
      return result;
    } catch (err) {
      if (err.name !== 'AbortError' && mountedRef.current) {
        setError(err);
        console.error(`Cache fetch error for ${key}:`, err);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [key, fetchFn, enabled, loading, getCachedData, setCachedData]);

  // Charger les données au montage
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Refetch sur focus de la fenêtre
  useEffect(() => {
    if (!refetchOnWindowFocus) return;

    const handleFocus = () => {
      const now = Date.now();
      if (now - lastFetch > staleTime) {
        fetchData();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [refetchOnWindowFocus, lastFetch, staleTime, fetchData]);

  // Nettoyage au démontage
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Fonctions utilitaires
  const refetch = useCallback(() => fetchData(true), [fetchData]);
  const invalidate = useCallback(() => {
    globalCache.delete(key);
    cacheExpiry.delete(key);
    fetchData(true);
  }, [key, fetchData]);

  // État dérivé
  const isStale = useMemo(() => {
    return Date.now() - lastFetch > staleTime;
  }, [lastFetch, staleTime]);

  return {
    data,
    loading,
    error,
    refetch,
    invalidate,
    isStale,
    lastFetch
  };
}

// Hook pour les listes paginées avec cache
export function usePaginatedCache(baseKey, fetchFn, options = {}) {
  const {
    pageSize = 20,
    prefetchPages = 1,
    ...cacheOptions
  } = options;

  const [currentPage, setCurrentPage] = useState(1);
  const [allData, setAllData] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  
  // Cache pour chaque page
  const pageKeys = useMemo(() => 
    Array.from({ length: Math.ceil(totalCount / pageSize) }, (_, i) => 
      `${baseKey}_page_${i + 1}`
    ), [baseKey, totalCount, pageSize]
  );

  // Fetch function pour une page spécifique
  const fetchPage = useCallback((page) => {
    return fetchFn({ 
      page, 
      pageSize,
      offset: (page - 1) * pageSize 
    });
  }, [fetchFn, pageSize]);

  // Cache pour la page courante
  const currentPageKey = `${baseKey}_page_${currentPage}`;
  const { 
    data: currentPageData, 
    loading, 
    error, 
    refetch 
  } = useOptimizedCache(currentPageKey, () => fetchPage(currentPage), cacheOptions);

  // Mettre à jour les données globales quand une page est chargée
  useEffect(() => {
    if (currentPageData) {
      setAllData(prev => {
        const newData = [...prev];
        const startIndex = (currentPage - 1) * pageSize;
        
        // Remplacer les données de la page courante
        currentPageData.items?.forEach((item, index) => {
          newData[startIndex + index] = item;
        });
        
        return newData;
      });
      
      if (currentPageData.totalCount !== undefined) {
        setTotalCount(currentPageData.totalCount);
      }
    }
  }, [currentPageData, currentPage, pageSize]);

  // Préchargement des pages adjacentes
  useEffect(() => {
    if (!currentPageData) return;

    const pagesToPrefetch = [];
    for (let i = 1; i <= prefetchPages; i++) {
      if (currentPage + i <= Math.ceil(totalCount / pageSize)) {
        pagesToPrefetch.push(currentPage + i);
      }
      if (currentPage - i >= 1) {
        pagesToPrefetch.push(currentPage - i);
      }
    }

    // Précharger de manière asynchrone
    pagesToPrefetch.forEach(page => {
      const pageKey = `${baseKey}_page_${page}`;
      if (!globalCache.has(pageKey)) {
        fetchPage(page).then(data => {
          globalCache.set(pageKey, data);
          cacheExpiry.set(pageKey, Date.now() + (cacheOptions.cacheTime || CACHE_DURATION));
        }).catch(() => {
          // Ignorer les erreurs de préchargement
        });
      }
    });
  }, [currentPageData, currentPage, totalCount, pageSize, prefetchPages, baseKey, fetchPage, cacheOptions.cacheTime]);

  // Navigation
  const goToPage = useCallback((page) => {
    if (page >= 1 && page <= Math.ceil(totalCount / pageSize)) {
      setCurrentPage(page);
    }
  }, [totalCount, pageSize]);

  const nextPage = useCallback(() => {
    goToPage(currentPage + 1);
  }, [currentPage, goToPage]);

  const prevPage = useCallback(() => {
    goToPage(currentPage - 1);
  }, [currentPage, goToPage]);

  // Informations de pagination
  const pageInfo = useMemo(() => ({
    currentPage,
    totalPages: Math.ceil(totalCount / pageSize),
    pageSize,
    totalCount,
    hasNextPage: currentPage < Math.ceil(totalCount / pageSize),
    hasPrevPage: currentPage > 1,
    startIndex: (currentPage - 1) * pageSize + 1,
    endIndex: Math.min(currentPage * pageSize, totalCount)
  }), [currentPage, totalCount, pageSize]);

  return {
    data: currentPageData?.items || [],
    allData,
    loading,
    error,
    refetch,
    pageInfo,
    goToPage,
    nextPage,
    prevPage,
    setCurrentPage
  };
}

// Utilitaire pour nettoyer tout le cache
export function clearAllCache() {
  globalCache.clear();
  cacheExpiry.clear();
}

// Utilitaire pour obtenir les statistiques du cache
export function getCacheStats() {
  return {
    size: globalCache.size,
    keys: Array.from(globalCache.keys()),
    memoryUsage: JSON.stringify([...globalCache.entries()]).length
  };
} 
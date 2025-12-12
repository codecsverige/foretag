/* ────────────────────────────────────────────────
   src/hooks/useHighPerformanceData.js
   Système de pagination haute performance pour des milliers de réservations
──────────────────────────────────────────────── */

import {
import { db } from "../firebase/firebase.js";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDocs,
  
} from "firebase/firestore";
import logger from "../utils/logger.js";

// Configuration optimisée pour haute performance
const HIGH_PERF_CONFIG = {
  INITIAL_PAGE_SIZE: 5,      // Premier chargement rapide
  REGULAR_PAGE_SIZE: 15,     // Pages suivantes
  PRELOAD_THRESHOLD: 3,      // Précharger quand il reste 3 items
  MAX_CACHE_PAGES: 10,       // Maximum de pages en cache
  CACHE_DURATION: 10 * 60 * 1000, // 10 minutes
};

// Cache global optimisé avec LRU (Least Recently Used)
class HighPerformanceCache {
  constructor(maxSize = HIGH_PERF_CONFIG.MAX_CACHE_PAGES) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.accessOrder = new Map(); // Pour LRU
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;

    // Vérifier l'expiration
    if (Date.now() - item.timestamp > HIGH_PERF_CONFIG.CACHE_DURATION) {
      this.delete(key);
      return null;
    }

    // Mettre à jour l'ordre d'accès (LRU)
    this.accessOrder.set(key, Date.now());
    return item.data;
  }

  set(key, data) {
    // Si le cache est plein, supprimer l'élément le moins récemment utilisé
    if (this.cache.size >= this.maxSize) {
      const oldestKey = [...this.accessOrder.entries()]
        .sort((a, b) => a[1] - b[1])[0][0];
      this.delete(oldestKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
    this.accessOrder.set(key, Date.now());
  }

  delete(key) {
    this.cache.delete(key);
    this.accessOrder.delete(key);
  }

  clear() {
    this.cache.clear();
    this.accessOrder.clear();
  }

  get size() {
    return this.cache.size;
  }

  // Statistiques pour monitoring
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: this.hitCount / (this.hitCount + this.missCount) * 100 || 0
    };
  }
}

const performanceCache = new HighPerformanceCache();

/**
 * Hook haute performance pour gérer des milliers de réservations
 * Utilise la pagination intelligente, le cache LRU et le préchargement
 */
export default function useHighPerformanceData(userId, tabType) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);
  const [totalCount, setTotalCount] = useState(0);

  
  const lastDoc = useRef(null);
  const pageCount = useRef(0);
  const isInitialLoad = useRef(true);
  const prefetchPromise = useRef(null);

  // Générer une clé de cache unique
  const getCacheKey = useCallback((page) => `${userId}-${tabType}-page-${page}`, [userId, tabType]);

  // Construire la requête optimisée avec index composite
  const buildQuery = useCallback((pageSize, cursor = null) => {
    if (!userId || !tabType) return null;

    const baseConditions = [];
    let collectionName = "";

    switch (tabType) {
      case "driver":
        collectionName = "rides";
        baseConditions.push(
          where("userId", "==", userId),
          where("role", "==", "driver"),
          where("status", "!=", "deleted") // Index composite: userId+role+status+createdAt
        );
        break;

      case "passenger":
        collectionName = "rides";
        baseConditions.push(
          where("userId", "==", userId),
          where("role", "==", "passenger"),
          where("status", "!=", "deleted")
        );
        break;

      case "bookings":
        collectionName = "bookings";
        baseConditions.push(
          where("userId", "==", userId),
          where("bookingType", "==", "seat_booking"),
          where("status", "!=", "cancelled") // Index composite: userId+bookingType+status+createdAt
        );
        break;

      case "unlocks":
        collectionName = "bookings";
        baseConditions.push(
          where("userId", "==", userId),
          where("bookingType", "==", "contact_unlock"),
          where("status", "!=", "cancelled")
        );
        break;

      default:
        return null;
    }

    let q = query(
      collection(db, collectionName),
      ...baseConditions,
      orderBy("createdAt", "desc"),
      limit(pageSize)
    );

    if (cursor) {
      q = query(q, startAfter(cursor));
    }

    return q;
  }, [userId, tabType, db]);

  // Charger une page spécifique avec cache
  const loadPage = useCallback(async (pageNum, cursor = null) => {
    const cacheKey = getCacheKey(pageNum);
    const cachedData = performanceCache.get(cacheKey);

    if (cachedData) {
      logger.performance(`Cache hit for page ${pageNum}`, { tabType, userId });
      return cachedData;
    }

    const pageSize = isInitialLoad.current 
      ? HIGH_PERF_CONFIG.INITIAL_PAGE_SIZE 
      : HIGH_PERF_CONFIG.REGULAR_PAGE_SIZE;

    const queryToExecute = buildQuery(pageSize, cursor);
    if (!queryToExecute) return { items: [], lastDoc: null };

    try {
      const snapshot = await getDocs(queryToExecute);
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      const result = {
        items,
        lastDoc: snapshot.docs[snapshot.docs.length - 1] || null,
        hasMore: snapshot.docs.length === pageSize
      };

      // Mettre en cache uniquement si la page est complète
      if (items.length > 0) {
        performanceCache.set(cacheKey, result);
        logger.performance(`Cached page ${pageNum}`, { 
          items: items.length, 
          tabType,
          cacheStats: performanceCache.getStats()
        });
      }

      return result;
    } catch (error) {
      logger.error(`Error loading page ${pageNum} for ${tabType}:`, error);
      throw error;
    }
  }, [getCacheKey, buildQuery]);

  // Préchargement intelligent de la page suivante
  const preloadNextPage = useCallback(async () => {
    if (!hasMore || prefetchPromise.current) return;

    const nextPageNum = pageCount.current + 1;
    const cacheKey = getCacheKey(nextPageNum);

    // Ne précharger que si pas déjà en cache
    if (performanceCache.get(cacheKey)) return;

    prefetchPromise.current = loadPage(nextPageNum, lastDoc.current);
    
    try {
      await prefetchPromise.current;
      logger.performance(`Preloaded page ${nextPageNum}`, { tabType });
    } catch (error) {
      logger.warn(`Preload failed for page ${nextPageNum}:`, error);
    } finally {
      prefetchPromise.current = null;
    }
  }, [hasMore, getCacheKey, loadPage]);

  // Charger la page suivante
  const loadNextPage = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    setError(null);

    try {
      pageCount.current += 1;
      const result = await loadPage(pageCount.current, lastDoc.current);

      setData(prevData => [...prevData, ...result.items]);
      lastDoc.current = result.lastDoc;
      setHasMore(result.hasMore && result.items.length > 0);

      // Démarrer le préchargement si on approche de la fin
      if (result.items.length <= HIGH_PERF_CONFIG.PRELOAD_THRESHOLD) {
        preloadNextPage();
      }

      isInitialLoad.current = false;
    } catch (error) {
      setError(error);
      logger.error(`Failed to load next page for ${tabType}:`, error);
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, loadPage, preloadNextPage, tabType]);

  // Initialisation et rechargement
  const refreshData = useCallback(() => {
    setData([]);
    setError(null);
    setHasMore(true);
    lastDoc.current = null;
    pageCount.current = 0;
    isInitialLoad.current = true;

    // Nettoyer le cache pour cet utilisateur/type
    const pattern = new RegExp(`^${userId}-${tabType}-`);
    for (const [key] of performanceCache.cache) {
      if (pattern.test(key)) {
        performanceCache.delete(key);
      }
    }

    // Charger la première page
    loadNextPage();
  }, [userId, tabType, loadNextPage]);

  // Effet pour l'initialisation
  useEffect(() => {
    if (userId && tabType) {
      refreshData();
    }
  }, [userId, tabType, refreshData]);

  // Nettoyage lors du démontage
  useEffect(() => {
    return () => {
      if (prefetchPromise.current) {
        prefetchPromise.current = null;
      }
    };
  }, []);

  return {
    data,
    loading,
    hasMore,
    error,
    totalCount,
    loadMore: loadNextPage,
    refresh: refreshData,
    cacheStats: performanceCache.getStats(),
    pageCount: pageCount.current
  };
}

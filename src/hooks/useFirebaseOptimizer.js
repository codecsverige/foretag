import { useRef, useCallback, useEffect } from "react";
import { db } from "firebase/firestore";

// Configuration pour l'optimisation Firebase
const FIREBASE_CONFIG = {
  // Cache configuration
  cache: {
    maxSize: 1000,
    ttl: 5 * 60 * 1000, // 5 minutes
    cleanupInterval: 60 * 1000 // 1 minute
  },
  
  // Batch operations
  batch: {
    maxSize: 500,
    timeout: 1000 // 1 second
  },
  
  // Query optimization
  query: {
    maxResults: 50,
    debounceTime: 300,
    retryAttempts: 3,
    retryDelay: 1000
  }
};

export default function useFirebaseOptimizer() {
  
  const cache = useRef(new Map());
  const pendingQueries = useRef(new Map());
  const batchOperations = useRef([]);
  const batchTimeout = useRef(null);

  // Fonction pour nettoyer le cache
  const cleanupCache = useCallback(() => {
    const now = Date.now();
    const entries = Array.from(cache.current.entries());
    
    entries.forEach(([key, value]) => {
      if (now - value.timestamp > FIREBASE_CONFIG.cache.ttl) {
        cache.current.delete(key);
      }
    });
  }, []);

  // Fonction pour obtenir des données avec cache
  const getCachedData = useCallback((key) => {
    const cached = cache.current.get(key);
    if (cached && Date.now() - cached.timestamp < FIREBASE_CONFIG.cache.ttl) {
      return cached.data;
    }
    return null;
  }, []);

  // Fonction pour mettre en cache des données
  const setCachedData = useCallback((key, data) => {
    cache.current.set(key, {
      data,
      timestamp: Date.now()
    });

    // Nettoyer le cache si nécessaire
    if (cache.current.size > FIREBASE_CONFIG.cache.maxSize) {
      const entries = Array.from(cache.current.entries());
      const toDelete = entries.slice(0, FIREBASE_CONFIG.cache.maxSize / 2);
      toDelete.forEach(([key]) => cache.current.delete(key));
    }
  }, []);

  // Fonction pour annuler les requêtes en cours
  const cancelPendingQueries = useCallback(() => {
    pendingQueries.current.forEach((controller) => {
      controller.abort();
    });
    pendingQueries.current.clear();
  }, []);

  // Fonction pour ajouter une opération batch
  const addBatchOperation = useCallback((operation) => {
    batchOperations.current.push(operation);

    // Exécuter le batch si plein ou après timeout
    if (batchOperations.current.length >= FIREBASE_CONFIG.batch.maxSize) {
      executeBatch();
    } else if (!batchTimeout.current) {
      batchTimeout.current = setTimeout(executeBatch, FIREBASE_CONFIG.batch.timeout);
    }
  }, []);

  // Fonction pour exécuter les opérations batch
  const executeBatch = useCallback(async () => {
    if (batchOperations.current.length === 0) return;

    const operations = [...batchOperations.current];
    batchOperations.current = [];
    
    if (batchTimeout.current) {
      clearTimeout(batchTimeout.current);
      batchTimeout.current = null;
    }

    try {
      // Exécuter les opérations en parallèle (max 10 à la fois)
      const chunks = [];
      for (let i = 0; i < operations.length; i += 10) {
        chunks.push(operations.slice(i, i + 10));
      }

      for (const chunk of chunks) {
        await Promise.all(chunk.map(op => op()));
      }
    } catch (error) {
      console.error("Batch operation failed:", error);
    }
  }, []);

  // Fonction pour optimiser les requêtes avec debounce
  const debouncedQuery = useCallback((queryFn, key) => {
    // Annuler la requête précédente si elle existe
    if (pendingQueries.current.has(key)) {
      pendingQueries.current.get(key).abort();
    }

    // Vérifier le cache d'abord
    const cached = getCachedData(key);
    if (cached) {
      return Promise.resolve(cached);
    }

    return new Promise((resolve, reject) => {
      const controller = new AbortController();
      pendingQueries.current.set(key, controller);

      const timeoutId = setTimeout(async () => {
        try {
          if (controller.signal.aborted) return;

          const result = await queryFn();
          
          if (!controller.signal.aborted) {
            setCachedData(key, result);
            resolve(result);
          }
        } catch (error) {
          if (!controller.signal.aborted) {
            reject(error);
          }
        } finally {
          pendingQueries.current.delete(key);
        }
      }, FIREBASE_CONFIG.query.debounceTime);

      // Nettoyer le timeout si la requête est annulée
      controller.signal.addEventListener('abort', () => {
        clearTimeout(timeoutId);
      });
    });
  }, [getCachedData, setCachedData]);

  // Fonction pour optimiser les écritures
  const optimizedWrite = useCallback(async (writeFn) => {
    return new Promise((resolve, reject) => {
      const retry = async (attempt = 0) => {
        try {
          const result = await writeFn();
          resolve(result);
        } catch (error) {
          if (attempt < FIREBASE_CONFIG.query.retryAttempts) {
            setTimeout(() => retry(attempt + 1), FIREBASE_CONFIG.query.retryDelay);
          } else {
            reject(error);
          }
        }
      };
      retry();
    });
  }, []);

  // Nettoyage périodique du cache
  useEffect(() => {
    const interval = setInterval(cleanupCache, FIREBASE_CONFIG.cache.cleanupInterval);
    return () => {
      clearInterval(interval);
      cancelPendingQueries();
      if (batchTimeout.current) {
        clearTimeout(batchTimeout.current);
      }
      executeBatch();
    };
  }, [cleanupCache, cancelPendingQueries, executeBatch]);

  return {
    // Cache functions
    getCachedData,
    setCachedData,
    clearCache: () => cache.current.clear(),
    
    // Query optimization
    debouncedQuery,
    cancelPendingQueries,
    
    // Batch operations
    addBatchOperation,
    executeBatch,
    
    // Write optimization
    optimizedWrite,
    
    // Stats
    cacheSize: cache.current.size,
    pendingQueries: pendingQueries.current.size,
    batchOperations: batchOperations.current.length
  };
} 
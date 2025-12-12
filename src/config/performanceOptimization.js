// Configuration pour l'optimisation des performances
export const PERFORMANCE_OPTIMIZATION = {
  // Configuration de la virtualisation
  virtualization: {
    itemHeight: 120,
    bufferSize: 10,
    maxItems: 10000,
    chunkSize: 50
  },

  // Configuration du cache
  cache: {
    maxSize: 1000,
    ttl: 5 * 60 * 1000, // 5 minutes
    cleanupInterval: 60 * 1000 // 1 minute
  },

  // Configuration Firebase
  firebase: {
    batchSize: 500,
    queryDebounce: 300,
    retryAttempts: 3,
    retryDelay: 1000,
    maxConcurrentQueries: 10
  },

  // Configuration des images
  images: {
    lazyLoading: true,
    webpSupport: true,
    sizes: {
      thumbnail: '150x150',
      small: '300x300',
      medium: '600x600',
      large: '1200x1200'
    }
  },

  // Configuration du code splitting
  codeSplitting: {
    chunkSize: 244 * 1024, // 244KB
    maxChunks: 10,
    preloadCritical: true
  },

  // Configuration de la mémoire
  memory: {
    maxHeapSize: 100 * 1024 * 1024, // 100MB
    cleanupThreshold: 80 * 1024 * 1024, // 80MB
    gcInterval: 30 * 1000 // 30 secondes
  },

  // Configuration des performances
  performance: {
    targetFPS: 60,
    maxRenderTime: 16, // 16ms pour 60fps
    memoryWarningThreshold: 50 * 1024 * 1024, // 50MB
    enableMonitoring: process.env.NODE_ENV === 'development'
  }
};

// Fonctions utilitaires pour l'optimisation
export const PerformanceUtils = {
  // Vérifier les performances
  checkPerformance: () => {
    const metrics = {
      fps: 0,
      memory: performance.memory ? performance.memory.usedJSHeapSize : 0,
      renderTime: 0
    };

    return metrics;
  },

  // Optimiser les requêtes
  optimizeQuery: (query, options = {}) => {
    const { debounce = 300, retry = 3 } = options;
    
    return {
      ...query,
      debounce,
      retry,
      timestamp: Date.now()
    };
  },

  // Nettoyer la mémoire
  cleanupMemory: () => {
    if (performance.memory && performance.memory.usedJSHeapSize > PERFORMANCE_OPTIMIZATION.memory.cleanupThreshold) {
      // Forcer le garbage collection si disponible
      if (window.gc) {
        window.gc();
      }
      
      // Nettoyer les caches
      if (window.caches) {
        caches.keys().then(names => {
          names.forEach(name => {
            if (name !== 'app-cache') {
              caches.delete(name);
            }
          });
        });
      }
    }
  },

  // Optimiser les images
  optimizeImage: (src, size = 'medium') => {
    const sizes = PERFORMANCE_OPTIMIZATION.images.sizes[size];
    return {
      src,
      sizes,
      loading: PERFORMANCE_OPTIMIZATION.images.lazyLoading ? 'lazy' : 'eager',
      decoding: 'async'
    };
  },

  // Mesurer le temps d'exécution
  measureTime: (fn, name = 'Function') => {
    const start = performance.now();
    const result = fn();
    const end = performance.now();
    
    if (end - start > PERFORMANCE_OPTIMIZATION.performance.maxRenderTime) {
      console.warn(`${name} took ${Math.round(end - start)}ms to execute`);
    }
    
    return result;
  },

  // Debounce function
  debounce: (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  // Throttle function
  throttle: (func, limit) => {
    let inThrottle;
    return function() {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }
};

// Hook pour l'optimisation automatique
export const usePerformanceOptimization = () => {
  const [isOptimized, setIsOptimized] = useState(false);
  const [metrics, setMetrics] = useState({});

  useEffect(() => {
    // Vérifier les performances au démarrage
    const checkPerformance = () => {
      const currentMetrics = PerformanceUtils.checkPerformance();
      setMetrics(currentMetrics);
      
      // Optimiser si nécessaire
      if (currentMetrics.memory > PERFORMANCE_OPTIMIZATION.memory.cleanupThreshold) {
        PerformanceUtils.cleanupMemory();
      }
    };

    // Vérifier périodiquement
    const interval = setInterval(checkPerformance, 30000);
    
    return () => clearInterval(interval);
  }, []);

  return {
    isOptimized,
    metrics,
    optimize: PerformanceUtils.cleanupMemory
  };
}; 
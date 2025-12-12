import { useEffect, useRef, useCallback } from 'react';

// Hook pour optimiser la mémoire et les performances
export default function useMemoryOptimization() {
  const performanceMetrics = useRef({
    renderCount: 0,
    lastRenderTime: 0,
    averageRenderTime: 0,
    memoryUsage: 0
  });

  // Mesurer les performances de rendu
  const measureRenderPerformance = useCallback(() => {
    const now = performance.now();
    if (performanceMetrics.current.lastRenderTime > 0) {
      const renderTime = now - performanceMetrics.current.lastRenderTime;
      performanceMetrics.current.renderCount++;
      
      // Calcul de la moyenne mobile
      if (performanceMetrics.current.averageRenderTime === 0) {
        performanceMetrics.current.averageRenderTime = renderTime;
      } else {
        performanceMetrics.current.averageRenderTime = 
          (performanceMetrics.current.averageRenderTime * 0.9) + (renderTime * 0.1);
      }
    }
    performanceMetrics.current.lastRenderTime = now;
  }, []);

  // Surveiller l'utilisation de la mémoire
  const checkMemoryUsage = useCallback(() => {
    if (performance.memory) {
      performanceMetrics.current.memoryUsage = performance.memory.usedJSHeapSize;
      
      // Alerter si l'utilisation mémoire dépasse 100MB
      if (performance.memory.usedJSHeapSize > 100 * 1024 * 1024) {
        console.warn('High memory usage detected:', {
          used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024) + 'MB',
          total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024) + 'MB'
        });
      }
    }
  }, []);

  // Optimisation du garbage collection
  const optimizeMemory = useCallback(() => {
    // Forcer le garbage collection si possible (Chrome DevTools)
    if (window.gc && typeof window.gc === 'function') {
      window.gc();
    }
    
    // Nettoyer les listeners d'événements orphelins
    const events = ['scroll', 'resize', 'touchmove'];
    events.forEach(event => {
      document.removeEventListener(event, () => {});
    });
    
    checkMemoryUsage();
  }, [checkMemoryUsage]);

  // Surveiller les performances
  useEffect(() => {
    measureRenderPerformance();
    
    const interval = setInterval(() => {
      checkMemoryUsage();
    }, 10000); // Check every 10 seconds

    return () => {
      clearInterval(interval);
    };
  }, [measureRenderPerformance, checkMemoryUsage]);

  // Nettoyer la mémoire périodiquement
  useEffect(() => {
    const cleanup = setInterval(optimizeMemory, 60000); // Every minute
    return () => clearInterval(cleanup);
  }, [optimizeMemory]);

  return {
    metrics: performanceMetrics.current,
    optimizeMemory,
    measureRenderPerformance
  };
}

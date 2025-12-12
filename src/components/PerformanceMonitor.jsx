import React, { useState, useEffect, useRef, useCallback } from "react";

export default function PerformanceMonitor({ 
  enabled = process.env.NODE_ENV === 'development',
  showStats = false 
}) {
  const [metrics, setMetrics] = useState({
    fps: 0,
    memory: 0,
    renderTime: 0,
    cacheSize: 0,
    pendingQueries: 0
  });
  
  const frameCount = useRef(0);
  const lastTime = useRef(performance.now());
  const animationId = useRef(null);

  // Mesurer les performances
  const measurePerformance = useCallback(() => {
    const now = performance.now();
    frameCount.current++;

    if (now - lastTime.current >= 1000) {
      const fps = Math.round((frameCount.current * 1000) / (now - lastTime.current));
      
      setMetrics(prev => ({
        ...prev,
        fps,
        memory: performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1024 / 1024) : 0
      }));

      frameCount.current = 0;
      lastTime.current = now;
    }

    animationId.current = requestAnimationFrame(measurePerformance);
  }, []);

  // Mesurer le temps de rendu
  const measureRenderTime = useCallback(() => {
    const start = performance.now();
    
    return () => {
      const end = performance.now();
      setMetrics(prev => ({
        ...prev,
        renderTime: Math.round(end - start)
      }));
    };
  }, []);

  // Démarrer la surveillance
  useEffect(() => {
    if (!enabled) return;

    measurePerformance();

    return () => {
      if (animationId.current) {
        cancelAnimationFrame(animationId.current);
      }
    };
  }, [enabled, measurePerformance]);

  // Mettre à jour les métriques externes
  const updateExternalMetrics = useCallback((newMetrics) => {
    setMetrics(prev => ({
      ...prev,
      ...newMetrics
    }));
  }, []);

  if (!enabled || !showStats) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-black bg-opacity-75 text-white p-3 rounded-lg text-xs font-mono z-50">
      <div className="space-y-1">
        <div className="flex justify-between">
          <span>FPS:</span>
          <span className={metrics.fps < 30 ? 'text-red-400' : metrics.fps < 50 ? 'text-yellow-400' : 'text-green-400'}>
            {metrics.fps}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Memory:</span>
          <span className={metrics.memory > 100 ? 'text-red-400' : 'text-green-400'}>
            {metrics.memory}MB
          </span>
        </div>
        <div className="flex justify-between">
          <span>Render:</span>
          <span className={metrics.renderTime > 16 ? 'text-red-400' : 'text-green-400'}>
            {metrics.renderTime}ms
          </span>
        </div>
        <div className="flex justify-between">
          <span>Cache:</span>
          <span>{metrics.cacheSize}</span>
        </div>
        <div className="flex justify-between">
          <span>Queries:</span>
          <span className={metrics.pendingQueries > 5 ? 'text-yellow-400' : 'text-green-400'}>
            {metrics.pendingQueries}
          </span>
        </div>
      </div>
    </div>
  );
}

// Hook pour utiliser le moniteur de performance
export function usePerformanceMonitor() {
  const [isEnabled, setIsEnabled] = useState(process.env.NODE_ENV === 'development');
  const [showStats, setShowStats] = useState(false);
  const metricsRef = useRef({});

  const updateMetrics = useCallback((newMetrics) => {
    metricsRef.current = { ...metricsRef.current, ...newMetrics };
  }, []);

  const toggleMonitoring = useCallback(() => {
    setIsEnabled(prev => !prev);
  }, []);

  const toggleStats = useCallback(() => {
    setShowStats(prev => !prev);
  }, []);

  return {
    isEnabled,
    showStats,
    updateMetrics,
    toggleMonitoring,
    toggleStats,
    metrics: metricsRef.current
  };
} 
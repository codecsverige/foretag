import React, { useEffect, useRef, useCallback } from "react";

export default function InfiniteScrollContainer({ 
  children, 
  onLoadMore, 
  hasMore, 
  loading,
  threshold = 200 
}) {
  const containerRef = useRef(null);
  const observerRef = useRef(null);

  const handleObserver = useCallback((entries) => {
    const [target] = entries;
    if (target.isIntersecting && hasMore && !loading) {
      onLoadMore();
    }
  }, [hasMore, loading, onLoadMore]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // إنشاء Intersection Observer
    observerRef.current = new IntersectionObserver(handleObserver, {
      root: null,
      rootMargin: `${threshold}px`,
      threshold: 0.1
    });

    // البحث عن العنصر الأخير للمراقبة
    const lastChild = container.lastElementChild;
    if (lastChild) {
      observerRef.current.observe(lastChild);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [children, handleObserver, threshold]);

  return (
    <div ref={containerRef} className="space-y-4">
      {children}
      
      {/* مؤشر التحميل */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center space-x-2 text-blue-600">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-200 border-t-blue-600"></div>
            <span className="text-sm font-medium">Laddar fler...</span>
          </div>
        </div>
      )}
      
      {/* رسالة انتهاء البيانات */}
      {!hasMore && !loading && children && (
        <div className="text-center py-6">
          <p className="text-gray-500 text-sm">
            📄 Alla objekt har laddats
          </p>
        </div>
      )}
    </div>
  );
}

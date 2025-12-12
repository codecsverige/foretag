import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot, 
  startAfter,
  getDocs
} from 'firebase/firestore';
import { db } from '../firebase/config';
import logger from '../utils/logger';

// إعدادات محترفة لتطبيق مشاركة السيارات
const PROFESSIONAL_CONFIG = {
  PAGE_SIZE: 50,           // حجم الصفحة للبيانات
  CACHE_SIZE: 200,         // حجم الذاكرة المؤقتة
  VIRTUAL_THRESHOLD: 30,   // عتبة التفعيل الافتراضي
  CLEANUP_INTERVAL: 300000, // فترة تنظيف الذاكرة (5 دقائق)
  PERFORMANCE_MONITOR: true // مراقبة الأداء
};

// ذاكرة مؤقتة محسنة للبيانات الكبيرة
const dataCache = new Map();
const performanceMetrics = {
  cacheHits: 0,      // عدد مرات استخدام الذاكرة المؤقتة
  cacheMisses: 0,    // عدد مرات عدم وجود البيانات في الذاكرة
  totalRequests: 0   // إجمالي الطلبات
};

const useOptimizedData = (userId, initialTab = "driver") => {
  // الحالات الأساسية
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [currentTab, setCurrentTab] = useState(initialTab);

  // مراجع للإدارة المحسنة
  const unsubscribes = useRef(new Map());
  const lastDoc = useRef(new Map());
  const loadingFlags = useRef(new Set());

  // إعداد استعلامات Firebase محسنة
  const getQueryConfig = useCallback((tabType) => {
    const baseConditions = [where("userId", "==", userId)];
    
    switch (tabType) {
      case "driver":
        return {
          collection: "rides",
          conditions: [...baseConditions, where("role", "==", "driver")]
        };
      case "passenger":
        return {
          collection: "rides", 
          conditions: [...baseConditions, where("role", "==", "passenger")]
        };
      case "bookings":
        return {
          collection: "bookings",
          conditions: [...baseConditions, where("bookingType", "==", "seat_booking")]
        };
      case "unlocks":
        return {
          collection: "bookings",
          conditions: [...baseConditions, where("bookingType", "==", "contact_unlock")]
        };
      default:
        return null;
    }
  }, [userId]);

  // إدارة الذاكرة المؤقتة الذكية
  const getCacheKey = useCallback((tabType) => `${userId}_${tabType}`, [userId]);

  const getCachedData = useCallback((key) => {
    const cached = dataCache.get(key);
    if (cached && Date.now() - cached.timestamp < PROFESSIONAL_CONFIG.CLEANUP_INTERVAL) {
      performanceMetrics.cacheHits++;
      return cached.data;
    }
    performanceMetrics.cacheMisses++;
    return null;
  }, []);

  const setCachedData = useCallback((key, data) => {
    // تحديد حجم الذاكرة المؤقتة
    if (dataCache.size >= PROFESSIONAL_CONFIG.CACHE_SIZE) {
      const firstKey = dataCache.keys().next().value;
      dataCache.delete(firstKey);
    }
    
    dataCache.set(key, {
      data,
      timestamp: Date.now(),
      size: data.length
    });
    
    if (PROFESSIONAL_CONFIG.PERFORMANCE_MONITOR) {
      logger.log(`تم حفظ ${data.length} عنصر في الذاكرة المؤقتة لـ ${key}`);
    }
  }, []);

  // إعداد مستمع الوقت الفعلي المحسن
  const setupRealtimeListener = useCallback((tabType) => {
    if (loadingFlags.current.has(tabType)) return;
    
    const queryConfig = getQueryConfig(tabType);
    if (!queryConfig) return;

    // تنظيف المستمع القديم
    const existingUnsub = unsubscribes.current.get(tabType);
    if (existingUnsub) {
      existingUnsub();
    }

    try {
      // بناء استعلام محسن
      const q = query(
        collection(db, queryConfig.collection),
        ...queryConfig.conditions,
        orderBy("createdAt", "desc"),
        limit(PROFESSIONAL_CONFIG.PAGE_SIZE)
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        if (!snapshot.metadata.hasPendingWrites) {
          const items = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));

          // تحديث البيانات المحسن
          setData(prev => ({
            ...prev,
            [tabType]: items
          }));

          // ذاكرة مؤقتة ذكية
          const cacheKey = getCacheKey(tabType);
          setCachedData(cacheKey, items);

          // إدارة التصفح
          if (snapshot.docs.length > 0) {
            lastDoc.current.set(tabType, snapshot.docs[snapshot.docs.length - 1]);
          }
          setHasMore(snapshot.docs.length === PROFESSIONAL_CONFIG.PAGE_SIZE);
          setLoading(false);

          if (PROFESSIONAL_CONFIG.PERFORMANCE_MONITOR) {
            logger.log(`${tabType}: تم تحميل ${items.length} عنصر (الوقت الفعلي)`);
          }
        }
      }, (error) => {
        logger.error(`خطأ في المستمع لـ ${tabType}:`, error);
        setError(error);
        setLoading(false);
      });

      unsubscribes.current.set(tabType, unsubscribe);
      
    } catch (error) {
      logger.error(`خطأ في الإعداد لـ ${tabType}:`, error);
      setError(error);
      setLoading(false);
    }
  }, [userId, getQueryConfig, getCacheKey, setCachedData]);

  // تحميل أولي مع ذاكرة مؤقتة
  const loadData = useCallback((tabType) => {
    if (loadingFlags.current.has(tabType)) return;
    loadingFlags.current.add(tabType);

    performanceMetrics.totalRequests++;

    // فحص الذاكرة المؤقتة أولاً
    const cacheKey = getCacheKey(tabType);
    const cached = getCachedData(cacheKey);
    if (cached) {
      setData(prev => ({ ...prev, [tabType]: cached }));
      setLoading(false);
      loadingFlags.current.delete(tabType);
      
      if (PROFESSIONAL_CONFIG.PERFORMANCE_MONITOR) {
        logger.log(`${tabType}: تم التحميل من الذاكرة المؤقتة (${cached.length} عنصر)`);
      }
      return;
    }

    // تحميل من Firebase
    setLoading(true);
    setupRealtimeListener(tabType);
    loadingFlags.current.delete(tabType);
  }, [getCacheKey, getCachedData, setupRealtimeListener]);

  // تحميل المزيد من البيانات (تصفح)
  const loadMoreData = useCallback(async (tabType) => {
    if (!hasMore || loading) return;

    const queryConfig = getQueryConfig(tabType);
    if (!queryConfig) return;

    const lastDocument = lastDoc.current.get(tabType);
    if (!lastDocument) return;

    try {
      setLoading(true);
      
      // استعلام للمزيد من البيانات
      const moreQuery = query(
        collection(db, queryConfig.collection),
        ...queryConfig.conditions,
        orderBy("createdAt", "desc"),
        startAfter(lastDocument),
        limit(PROFESSIONAL_CONFIG.PAGE_SIZE)
      );

      const snapshot = await getDocs(moreQuery);
      const moreItems = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // دمج مع البيانات الموجودة
      setData(prev => ({
        ...prev,
        [tabType]: [...(prev[tabType] || []), ...moreItems]
      }));

      // تحديث التصفح
      if (snapshot.docs.length > 0) {
        lastDoc.current.set(tabType, snapshot.docs[snapshot.docs.length - 1]);
      }
      
      setHasMore(snapshot.docs.length === PROFESSIONAL_CONFIG.PAGE_SIZE);
      
      if (PROFESSIONAL_CONFIG.PERFORMANCE_MONITOR) {
        logger.log(`${tabType}: تم تحميل ${moreItems.length} عنصر إضافي`);
      }
      
    } catch (error) {
      logger.error(`خطأ في تحميل المزيد لـ ${tabType}:`, error);
      setError(error);
    } finally {
      setLoading(false);
    }
  }, [hasMore, loading, getQueryConfig]);

  // تغيير التبويب المحسن
  const handleTabChange = useCallback((newTab) => {
    if (newTab === currentTab) return;
    
    setCurrentTab(newTab);
    setError(null);
    loadData(newTab);
  }, [currentTab, loadData]);

  // تحديث البيانات
  const refreshData = useCallback((tabType = currentTab) => {
    // تنظيف الذاكرة المؤقتة
    const cacheKey = getCacheKey(tabType);
    dataCache.delete(cacheKey);
    
    // تنظيف المستمع
    const existingUnsub = unsubscribes.current.get(tabType);
    if (existingUnsub) {
      existingUnsub();
      unsubscribes.current.delete(tabType);
    }
    
    // إعادة تعيين وإعادة تحميل
    setData(prev => ({ ...prev, [tabType]: [] }));
    lastDoc.current.delete(tabType);
    setHasMore(true);
    loadData(tabType);
  }, [currentTab, getCacheKey, loadData]);

  // تنظيف الموارد
  const cleanup = useCallback(() => {
    // تنظيف المستمعين
    unsubscribes.current.forEach((unsubscribe) => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    });
    unsubscribes.current.clear();
    loadingFlags.current.clear();
    lastDoc.current.clear();

    if (PROFESSIONAL_CONFIG.PERFORMANCE_MONITOR) {
      logger.log('تم تنظيف الموارد');
    }
  }, []);

  // بيانات محسنة مع مقاييس
  const optimizedData = useMemo(() => {
    const currentData = data[currentTab] || [];
    
    return {
      items: currentData,
      count: currentData.length,
      isEmpty: currentData.length === 0,
      shouldUseVirtualization: currentData.length > PROFESSIONAL_CONFIG.VIRTUAL_THRESHOLD,
      performanceMetrics: {
        cacheHits: performanceMetrics.cacheHits,
        cacheMisses: performanceMetrics.cacheMisses,
        totalRequests: performanceMetrics.totalRequests,
        cacheEfficiency: performanceMetrics.totalRequests > 0 ? 
          ((performanceMetrics.cacheHits / performanceMetrics.totalRequests) * 100).toFixed(1) + '%' : '0%'
      }
    };
  }, [data, currentTab]);

  // تأثير للتحميل الأولي
  useEffect(() => {
    if (userId && currentTab) {
      loadData(currentTab);
    }
  }, [userId, currentTab, loadData]);

  // تأثير للتنظيف
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  // تنظيف دوري للذاكرة المؤقتة
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      let cleanedCount = 0;
      
      for (const [key, value] of dataCache.entries()) {
        if (now - value.timestamp > PROFESSIONAL_CONFIG.CLEANUP_INTERVAL) {
          dataCache.delete(key);
          cleanedCount++;
        }
      }
      
      if (cleanedCount > 0 && PROFESSIONAL_CONFIG.PERFORMANCE_MONITOR) {
        logger.log(`تنظيف الذاكرة المؤقتة: تم حذف ${cleanedCount} مدخل`);
      }
    }, PROFESSIONAL_CONFIG.CLEANUP_INTERVAL);

    return () => clearInterval(interval);
  }, []);

  return {
    // البيانات الأساسية
    data: optimizedData,
    loading,
    error,
    hasMore,
    currentTab,

    // الإجراءات
    handleTabChange,
    loadMoreData: () => loadMoreData(currentTab),
    refreshData,
    
    // أدوات متقدمة
    clearCache: () => {
      dataCache.clear();
      logger.log('تم مسح الذاكرة المؤقتة يدوياً');
    },
    getPerformanceMetrics: () => ({
      ...performanceMetrics,
      cacheSize: dataCache.size,
      cacheEntries: Array.from(dataCache.keys())
    }),
    
    // الإعدادات
    config: PROFESSIONAL_CONFIG
  };
};

export default useOptimizedData;

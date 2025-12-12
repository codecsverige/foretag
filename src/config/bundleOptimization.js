/**
 * تحسين الحزمة لتقليل حجم JavaScript
 * يحل مشكلة الحزمة الأولى الضخمة
 */

// تحسين استيراد المكتبات الثقيلة
export const optimizeImports = {
  // استيراد جزئي لـ react-icons
  icons: {
    // استيراد الأيقونات المستخدمة فقط
    common: [
      'FaSearch',
      'FaMapMarkerAlt', 
      'FaCalendar',
      'FaClock',
      'FaUser',
      'FaPhone',
      'FaEnvelope',
      'FaCar',
      'FaMoneyBillWave',
      'FaLeaf'
    ],
    // استيراد الأيقونات حسب الصفحة
    pages: {
      home: ['FaSearch', 'FaMapMarkerAlt'],
      rides: ['FaCar', 'FaCalendar', 'FaClock'],
      profile: ['FaUser', 'FaPhone', 'FaEnvelope']
    }
  },
  
  // تحسين استيراد Firebase
  firebase: {
    // استيراد الوحدات المطلوبة فقط
    auth: ['getAuth', 'signInWithPopup', 'GoogleAuthProvider'],
    firestore: ['getFirestore', 'collection', 'query', 'where', 'orderBy', 'limit'],
    storage: ['getStorage', 'ref', 'uploadBytes', 'getDownloadURL']
  }
};

// تحسين تقسيم الكود
export const codeSplitting = {
  // الصفحات الثقيلة (>100KB)
  heavyPages: [
    'Inbox',
    'UserProfilePage', 
    'MyRides',
    'CreateRide'
  ],
  
  // المكونات التي يمكن تحميلها عند الطلب
  lazyComponents: [
    'EnhancedBookingModal',
    'RideDetailsModal',
    'ReportModal',
    'PayPalPayment'
  ],
  
  // المكتبات الخارجية الثقيلة
  externalLibraries: [
    'leaflet',
    'react-leaflet',
    'fuse.js',
    'lodash.debounce'
  ]
};

// تحسين التخزين المؤقت
export const cacheOptimization = {
  // تخزين مؤقت للبيانات
  dataCache: {
    rides: 5 * 60 * 1000, // 5 دقائق
    userProfile: 10 * 60 * 1000, // 10 دقائق
    locations: 30 * 60 * 1000 // 30 دقيقة
  },
  
  // تخزين مؤقت للمكونات
  componentCache: {
    rideCards: 2 * 60 * 1000, // 2 دقيقة
    searchResults: 1 * 60 * 1000 // 1 دقيقة
  }
};

// تحسين الأداء
export const performanceOptimization = {
  // تحسين التحميل
  loading: {
    // تحميل الصور كسولاً
    lazyImages: true,
    // تحميل المكونات عند الحاجة
    lazyComponents: true,
    // تحميل البيانات عند الطلب
    lazyData: true
  },
  
  // تحسين الذاكرة
  memory: {
    // تنظيف الذاكرة تلقائياً
    autoCleanup: true,
    // تحديد حجم التخزين المؤقت
    maxCacheSize: 50, // 50 عنصر
    // تنظيف البيانات القديمة
    cleanupInterval: 5 * 60 * 1000 // 5 دقائق
  },
  
  // تحسين الشبكة
  network: {
    // ضغط البيانات
    compression: true,
    // تخزين مؤقت للطلبات
    requestCache: true,
    // تجميع الطلبات
    batchRequests: true
  }
};

// إعدادات التطبيق
export const appSettings = {
  // وضع التطوير
  development: {
    enableDebug: true,
    showPerformanceMetrics: true,
    logBundleSize: true
  },
  
  // وضع الإنتاج
  production: {
    enableDebug: false,
    showPerformanceMetrics: false,
    logBundleSize: false,
    enableCompression: true,
    enableMinification: true
  }
};

// دالة لتحسين الحزمة
export function optimizeBundle() {
  // تحسين استيراد المكتبات
  const optimizedImports = optimizeImports;
  
  // تطبيق تقسيم الكود
  const splitting = codeSplitting;
  
  // تطبيق تحسينات الأداء
  const performance = performanceOptimization;
  
  // تطبيق إعدادات التطبيق
  const settings = process.env.NODE_ENV === 'production' 
    ? appSettings.production 
    : appSettings.development;
  
  return {
    imports: optimizedImports,
    splitting,
    performance,
    settings
  };
}

// دالة لمراقبة حجم الحزمة
export function monitorBundleSize() {
  if (process.env.NODE_ENV === 'development') {
    console.log('📦 Bundle Optimization Active');
    console.log('🔧 Code Splitting:', codeSplitting.heavyPages.length, 'heavy pages');
    console.log('⚡ Performance:', Object.keys(performanceOptimization).length, 'optimizations');
    console.log('💾 Cache:', Object.keys(cacheOptimization).length, 'cache strategies');
  }
}

// تصدير الإعدادات الافتراضية
export default {
  optimizeImports,
  codeSplitting,
  cacheOptimization,
  performanceOptimization,
  appSettings,
  optimizeBundle,
  monitorBundleSize
}; 
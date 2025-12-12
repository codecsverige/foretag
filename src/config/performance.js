// Performance configuration for VägVänner
export const PERFORMANCE_CONFIG = {
  // Code splitting configuration
  codeSplitting: {
    enabled: true,
    chunkSize: 244 * 1024, // 244KB
    maxChunks: 10
  },

  // Image optimization
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

  // Caching strategy
  caching: {
    staticAssets: '1 year',
    apiResponses: '1 hour',
    userData: '1 day'
  },

  // Bundle analysis
  bundleAnalysis: {
    enabled: process.env.NODE_ENV === 'production',
    threshold: {
      initial: 244 * 1024, // 244KB
      async: 244 * 1024 // 244KB
    }
  },

  // Performance monitoring
  monitoring: {
    enabled: true,
    metrics: ['FCP', 'LCP', 'CLS', 'FID', 'TTFB']
  }
};

// SEO optimization settings
export const SEO_CONFIG = {
  // Meta tags
  meta: {
    viewport: 'width=device-width, initial-scale=1, shrink-to-fit=no',
    themeColor: '#1976d2',
    colorScheme: 'light dark',
    formatDetection: 'telephone=no'
  },

  // Structured data
  structuredData: {
    organization: {
      name: 'VägVänner',
      url: 'https://vagvanner.se',
      logo: 'https://vagvanner.se/favicon.png',
      sameAs: [
        'https://www.facebook.com/vagvanner',
        'https://twitter.com/vagvanner'
      ]
    },
    website: {
      name: 'VägVänner',
      description: 'Sveriges ledande samåkningsplattform',
      url: 'https://vagvanner.se'
    }
  },

  // Sitemap configuration
  sitemap: {
    baseUrl: 'https://vagvanner.se',
    routes: [
      { path: '/', priority: 1.0, changefreq: 'daily' },
      { path: '/select-location', priority: 0.9, changefreq: 'daily' },
      { path: '/my-rides', priority: 0.8, changefreq: 'daily' },
      { path: '/inbox', priority: 0.7, changefreq: 'daily' },
      { path: '/create-ride', priority: 0.8, changefreq: 'weekly' },
      { path: '/book-ride', priority: 0.8, changefreq: 'weekly' },
      { path: '/user-profile', priority: 0.6, changefreq: 'weekly' }
    ]
  }
};

// Accessibility configuration
export const ACCESSIBILITY_CONFIG = {
  // ARIA labels
  ariaLabels: {
    navigation: 'Huvudnavigation',
    search: 'Sök efter resor',
    menu: 'Meny',
    close: 'Stäng',
    loading: 'Laddar...'
  },

  // Keyboard navigation
  keyboardNavigation: {
    enabled: true,
    focusVisible: true
  },

  // Color contrast
  colorContrast: {
    minimum: 4.5,
    enhanced: 7.0
  }
};

const fs = require('fs');
const path = require('path');

// Static public routes (exclude private/account pages intentionally)
const routes = [
  '/',
  '/select-location',
  '/create-ride',
  '/anvandningsvillkor',
  '/integritetspolicy',
  '/cookiepolicy',
  '/om-oss',
  '/hur-det-fungerar'
];

// Popular route pages to include (SEO high-priority)
const popularRoutePages = [
  '/ride/stockholm-goteborg',
  '/ride/malmo-stockholm',
  '/ride/uppsala-stockholm',
  '/ride/lund-goteborg'
];

// Demo ride ids for dynamic ride pages (used when no external DB is configured)
const demoRideIds = [
  'demo-stockholm-goteborg',
  'demo-malmo-stockholm',
  'demo-uppsala-stockholm',
  'demo-lund-goteborg'
];

// Priority mapping
const getPriority = (route) => {
  switch (route) {
    case '/': return '1.0';
    case '/select-location': return '0.9';
    case '/my-rides': return '0.8';
    case '/inbox': return '0.7';
    case '/create-ride': return '0.8';
    case '/book-ride': return '0.8';
    case '/user-profile': return '0.6';
    default: return '0.5';
  }
};

const getChangeFreq = (route) => {
  switch (route) {
    case '/': return 'daily';
    case '/select-location': return 'daily';
    case '/my-rides': return 'daily';
    case '/inbox': return 'daily';
    case '/create-ride': return 'weekly';
    case '/book-ride': return 'weekly';
    case '/user-profile': return 'weekly';
    default: return 'monthly';
  }
};

// Generate sitemap XML
const generateSitemap = () => {
  const baseUrl = 'https://vagvanner.se';
  const currentDate = new Date().toISOString().split('T')[0];
  
  let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

  routes.forEach(route => {
    const url = `${baseUrl}${route}`;
    const priority = getPriority(route);
    const changefreq = getChangeFreq(route);
    
    sitemap += `  <url>
    <loc>${url}</loc>
    <priority>${priority}</priority>
    <changefreq>${changefreq}</changefreq>
    <lastmod>${currentDate}</lastmod>
  </url>
`;
  });

  // Add popular route pages
  popularRoutePages.forEach(route => {
    const url = `${baseUrl}${route}`;
    const priority = getPriority(route);
    const changefreq = getChangeFreq(route);

    sitemap += `  <url>
    <loc>${url}</loc>
    <priority>${priority}</priority>
    <changefreq>${changefreq}</changefreq>
    <lastmod>${currentDate}</lastmod>
  </url>
`;
  });

  // Add demo dynamic ride pages
  demoRideIds.forEach(id => {
    const url = `${baseUrl}/ride/${encodeURIComponent(id)}`;
    const priority = getPriority('/ride');
    const changefreq = getChangeFreq('/ride');

    sitemap += `  <url>
    <loc>${url}</loc>
    <priority>${priority}</priority>
    <changefreq>${changefreq}</changefreq>
    <lastmod>${currentDate}</lastmod>
  </url>
`;
  });

  sitemap += '</urlset>';

  // Write to public/sitemap.xml
  const sitemapPath = path.join(__dirname, '..', 'public', 'sitemap.xml');
  fs.writeFileSync(sitemapPath, sitemap);
  
  console.log('✅ Sitemap generated successfully at:', sitemapPath);
  console.log(`📄 Generated ${routes.length} URLs`);
};

generateSitemap(); 
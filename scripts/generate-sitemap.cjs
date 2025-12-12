const fs = require('fs');
const path = require('path');

// Static routes (exclude private/account pages from sitemap)
const staticRoutes = [
  '/', 
  '/select-location', 
  '/create-ride', 
  '/samakning',
  // private/account pages intentionally excluded: '/my-rides', '/inbox', '/user-profile', '/book-ride'
  '/anvandningsvillkor',
  '/integritetspolicy',
  '/cookiepolicy',
  '/om-oss',
  '/hur-det-fungerar'
];

// Static route pages for popular routes (high priority for SEO)
const popularRoutePages = [
  '/ride/stockholm-goteborg',
  '/ride/goteborg-stockholm',
  '/ride/malmo-stockholm', 
  '/ride/uppsala-stockholm',
  '/ride/lund-goteborg',
  '/ride/stockholm-malmo',
  '/ride/stockholm-uppsala',
  '/ride/goteborg-malmo',
  '/ride/malmo-goteborg',
  '/ride/stockholm-vasteras',
  '/ride/vasteras-stockholm',
  '/ride/stockholm-norrkoping'
];

// Priority mapping
const getPriority = (route) => {
  switch (route) {
    case '/': return '1.0';
    case '/select-location': return '0.9';
    // Popular route pages get high priority for SEO
    case '/ride/stockholm-goteborg':
    case '/ride/goteborg-stockholm':
    case '/ride/malmo-stockholm':
    case '/ride/uppsala-stockholm':
    case '/ride/lund-goteborg':
      return '0.9';
    case '/om-oss': return '0.8';
    case '/hur-det-fungerar': return '0.8';
    case '/my-rides': return '0.8';
    case '/create-ride': return '0.8';
    case '/book-ride': return '0.8';
    case '/inbox': return '0.7';
    case '/user-profile': return '0.6';
    case '/anvandningsvillkor': return '0.5';
    case '/integritetspolicy': return '0.5';
    case '/cookiepolicy': return '0.5';
    default: return '0.7'; // pour les pages de rides dynamiques
  }
};

const getChangeFreq = (route) => {
  switch (route) {
    case '/': return 'daily';
    case '/select-location': return 'daily';
    // Popular route pages change frequently for SEO freshness
    case '/ride/stockholm-goteborg':
    case '/ride/goteborg-stockholm':
    case '/ride/malmo-stockholm':
    case '/ride/uppsala-stockholm':
    case '/ride/lund-goteborg':
      return 'daily';
    case '/om-oss': return 'monthly';
    case '/hur-det-fungerar': return 'monthly';
    case '/my-rides': return 'daily';
    case '/inbox': return 'daily';
    case '/create-ride': return 'weekly';
    case '/book-ride': return 'weekly';
    case '/user-profile': return 'weekly';
    case '/anvandningsvillkor': return 'monthly';
    case '/integritetspolicy': return 'monthly';
    case '/cookiepolicy': return 'monthly';
    default: return 'daily'; // pour les pages de rides dynamiques
  }
};

// Fonction pour récupérer les rides depuis Firestore
async function getRideIds() {
  try {
    // Essayer d'importer firebase-admin si disponible
    const admin = require('firebase-admin');
    
    if (!admin.apps || admin.apps.length === 0) {
      const serviceAccountJson = process.env.FIREBASE_ADMIN_SA_JSON;
      if (!serviceAccountJson) {
        console.log('⚠️  FIREBASE_ADMIN_SA_JSON non trouvé, recherche d\'un export local de rides...');
        // Try local export files before falling back to demo rides
        const localFiles = [
          path.join(__dirname, '..', 'data', 'rides-export.json'),
          path.join(__dirname, '..', 'public', 'rides-export.json'),
          path.join(__dirname, '..', 'data', 'rides.json')
        ];

        for (const lf of localFiles) {
          if (fs.existsSync(lf)) {
            try {
              const content = fs.readFileSync(lf, 'utf8');
              const items = JSON.parse(content);
              if (Array.isArray(items) && items.length) {
                console.log(`✅ Found local rides export at ${lf} — using ${items.length} rides`);
                return items.map(it => it.id || it.slug || it.name || JSON.stringify(it)).map(String);
              }
            } catch (err) {
              console.warn('⚠️  Failed to parse local rides export:', err.message);
            }
          }
        }

        console.log('⚠️  Aucun export local trouvé — tentative de lecture des pages statiques sous public/ride/...');

        // If static pages exist under public/ride/, use their directory names as ride IDs
        const publicRideDir = path.join(__dirname, '..', 'public', 'ride');
        if (fs.existsSync(publicRideDir)) {
          const entries = fs.readdirSync(publicRideDir, { withFileTypes: true });
          const ids = entries.filter(e => e.isDirectory()).map(d => d.name).filter(Boolean);
          if (ids.length) {
            console.log(`✅ Found ${ids.length} static ride pages under public/ride/ — using them in sitemap`);
            return ids;
          }
        }

        console.log('⚠️  Aucun export local trouvé et pas de pages statiques — utilisation des rides de démo pour le sitemap');
        return getDemoRideIds();
      }
      
      const serviceAccount = JSON.parse(serviceAccountJson);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    }
    
    const db = admin.firestore();
    const snapshot = await db.collection('rides')
      .where('expired', '!=', true)
      .orderBy('createdAt', 'desc')
      .limit(500)
      .get();
    
    const rideIds = [];
    snapshot.forEach((doc) => {
      rideIds.push(doc.id);
    });
    
    console.log(`✅ ${rideIds.length} rides récupérés depuis Firestore`);
    return rideIds;
  } catch (error) {
    console.log('⚠️  Erreur lors de la récupération des rides:', error.message);
    console.log('💡 Utilisation des rides de démo pour le sitemap');
    return getDemoRideIds();
  }
}

// Rides de démonstration pour le SEO (même liste que dans generate-ride-pages.cjs)
function getDemoRideIds() {
  return [
    'demo-stockholm-goteborg',
    'demo-malmo-stockholm', 
    'demo-uppsala-stockholm',
    'demo-lund-goteborg',
    'demo-passenger-request'
  ];
}

// Generate sitemap XML
async function generateSitemap() {
  const baseUrl = 'https://vagvanner.se';
  const currentDate = new Date().toISOString().split('T')[0];

  // Récupérer les IDs des rides
  const rideIds = await getRideIds();
  
  let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

  // Ajouter les routes statiques
  staticRoutes.forEach(route => {
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

  // Ajouter les pages de routes populaires avec haute priorité
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

  // Ajouter les pages de rides individuelles
  rideIds.forEach(rideId => {
    const url = `${baseUrl}/ride/${encodeURIComponent(rideId)}`;
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

  // Include additional curated static ride pages (ensure present under public/ride)
  const curated = [
    '/ride/stockholm-orebro',
    '/ride/stockholm-linkoping',
    '/ride/stockholm-jonkoping',
    '/ride/uppsala-gavle',
    '/ride/goteborg-helsingborg',
    '/ride/stockholm-umea',
    '/ride/malmo-lund',
    '/ride/umea-lulea',
    '/ride/stockholm-karlstad',
    '/ride/vaxjo-kalmar',
    '/ride'
  ];

  // Include city pages under /ride/city/* if present
  try {
    const cityDir = path.join(__dirname, '..', 'public', 'ride', 'city');
    if (fs.existsSync(cityDir)) {
      const entries = fs.readdirSync(cityDir, { withFileTypes: true });
      entries.filter(e => e.isDirectory()).forEach(d => {
        const route = `/ride/city/${d.name}`;
        const url = `${baseUrl}${route}`;
        const priority = '0.85';
        const changefreq = 'weekly';
        sitemap += `  <url>
    <loc>${url}</loc>
    <priority>${priority}</priority>
    <changefreq>${changefreq}</changefreq>
    <lastmod>${currentDate}</lastmod>
  </url>
`;
      });
    }
  } catch {}

  // Include long-distance pages under /ride/long/* if present
  try {
    const longDir = path.join(__dirname, '..', 'public', 'ride', 'long');
    if (fs.existsSync(longDir)) {
      const entries = fs.readdirSync(longDir, { withFileTypes: true });
      entries.filter(e => e.isDirectory()).forEach(d => {
        const route = `/ride/long/${d.name}`;
        const url = `${baseUrl}${route}`;
        const priority = '0.9';
        const changefreq = 'weekly';
        sitemap += `  <url>
    <loc>${url}</loc>
    <priority>${priority}</priority>
    <changefreq>${changefreq}</changefreq>
    <lastmod>${currentDate}</lastmod>
  </url>
`;
      });
    }
  } catch {}
  curated.forEach(route => {
    const url = `${baseUrl}${route}`;
    const priority = '0.8';
    const changefreq = 'daily';
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
  
  // Also write to build directory
  const buildDir = path.join(__dirname, '..', 'build');
  const buildSitemapPath = path.join(buildDir, 'sitemap.xml');
  if (fs.existsSync(buildDir)) {
    fs.writeFileSync(buildSitemapPath, sitemap);
    console.log('✅ Sitemap generated in build directory');
  }
  
  const totalUrls = staticRoutes.length + popularRoutePages.length + rideIds.length;
  console.log('✅ Sitemap generated successfully at:', sitemapPath);
  console.log(`📄 Generated ${totalUrls} URLs (${staticRoutes.length} static + ${popularRoutePages.length} popular routes + ${rideIds.length} dynamic rides)`);
}

// Run the generation
async function main() {
  try {
    console.log('🚀 Génération du sitemap...');
    await generateSitemap();
    console.log('✅ Sitemap généré avec succès!');
  } catch (error) {
    console.error('❌ Erreur lors de la génération du sitemap:', error && (error.stack || error));
    // Do not fail CI for optional sitemap generation errors
    process.exit(0);
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  main();
}

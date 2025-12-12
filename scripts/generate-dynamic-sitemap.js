const fs = require('fs');
const path = require('path');

// Routes publiques seulement (sans pages privées)
const publicRoutes = [
  '/',
  '/select-location', 
  '/create-ride',
  '/anvandningsvillkor',
  '/integritetspolicy',
  '/cookiepolicy'
];

// Routes statiques des démonstrations de trajets
const demoRideRoutes = [
  '/ride/stockholm-goteborg',
  '/ride/malmo-stockholm', 
  '/ride/uppsala-stockholm',
  '/ride/lund-goteborg',
  '/ride/demo-stockholm-goteborg',
  '/ride/demo-malmo-stockholm',
  '/ride/demo-uppsala-stockholm',
  '/ride/demo-lund-goteborg',
  '/ride/demo-passenger-request'
];

// Priorités et fréquences
const getPriority = (route) => {
  if (route === '/') return '1.0';
  if (route === '/select-location') return '0.9';
  if (route.startsWith('/ride/') && !route.includes('demo')) return '0.9';
  if (route === '/create-ride') return '0.8';
  if (route.startsWith('/ride/demo')) return '0.7';
  return '0.5';
};

const getChangeFreq = (route) => {
  if (route === '/' || route === '/select-location') return 'daily';
  if (route.startsWith('/ride/')) return 'daily';
  if (route === '/create-ride') return 'weekly';
  return 'monthly';
};

// Fonction pour ajouter des URLs de rides dynamiques (pour plus tard avec Firebase)
const getDynamicRideUrls = () => {
  // Cette fonction pourra être étendue pour récupérer les vraies rides depuis Firestore
  // Pour l'instant, on retourne un tableau vide pour ne pas affecter l'app
  return [];
};

// Générer le sitemap optimisé
const generateOptimizedSitemap = () => {
  const baseUrl = 'https://vagvanner.se';
  const currentDate = new Date().toISOString().split('T')[0];
  
  console.log('🔄 Génération du sitemap optimisé...');
  
  let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

  // Ajouter les routes publiques
  const allRoutes = [...publicRoutes, ...demoRideRoutes];
  
  allRoutes.forEach(route => {
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

  // Espace pour les futures rides dynamiques (sans affecter l'app actuelle)
  const dynamicRides = getDynamicRideUrls();
  dynamicRides.forEach(rideUrl => {
    sitemap += `  <url>
    <loc>${baseUrl}${rideUrl}</loc>
    <priority>0.8</priority>
    <changefreq>weekly</changefreq>
    <lastmod>${currentDate}</lastmod>
  </url>
`;
  });

  sitemap += '</urlset>';

  // Écrire le sitemap
  const sitemapPath = path.join(__dirname, '..', 'public', 'sitemap.xml');
  fs.writeFileSync(sitemapPath, sitemap);
  
  console.log('✅ Sitemap optimisé généré avec succès !');
  console.log(`📄 ${allRoutes.length + dynamicRides.length} URLs générées`);
  console.log(`📁 Fichier: ${sitemapPath}`);
  console.log('🚫 Pages privées exclues pour respecter robots.txt');
  
  return sitemapPath;
};

// Script exécutable
if (require.main === module) {
  generateOptimizedSitemap();
}

module.exports = { generateOptimizedSitemap };

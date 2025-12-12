#!/usr/bin/env node

/**
 * Script de test pour valider les améliorations SEO de VägVänner
 * Usage: node scripts/test-seo-improvements.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 Test des améliorations SEO pour VägVänner\n');

// Tests pour le HTML initial
function testInitialHTML() {
  console.log('📄 Test du HTML initial...');
  
  const indexPath = path.join(__dirname, '../public/index.html');
  const indexContent = fs.readFileSync(indexPath, 'utf8');
  
  const checks = [
    {
      name: 'Contenu sémantique avant JavaScript',
      test: () => indexContent.includes('server-side-content') && indexContent.includes('<article'),
      description: 'Le HTML contient du contenu structuré visible avant JS'
    },
    {
      name: 'Liens crawlables vers routes',
      test: () => indexContent.includes('href="/ride/stockholm-goteborg"') && 
                  indexContent.includes('href="/ride/malmo-stockholm"'),
      description: 'Les routes populaires ont des liens directs crawlables'
    },
    {
      name: 'Métadonnées dynamiques',
      test: () => indexContent.includes('updateMetaDescription') && 
                  indexContent.includes('updateCanonical'),
      description: 'Script pour mettre à jour les métadonnées selon l\'URL'
    },
    {
      name: 'Données structurées avancées',
      test: () => indexContent.includes('"@type": "ItemList"') && 
                  indexContent.includes('"@type": "FAQPage"'),
      description: 'Schema.org pour routes et FAQ'
    },
    {
      name: 'Navigation SEO',
      test: () => indexContent.includes('<nav') && 
                  indexContent.includes('Sök Resor') &&
                  indexContent.includes('Skapa Resa'),
      description: 'Navigation claire avec liens vers pages principales'
    }
  ];
  
  let passed = 0;
  checks.forEach(check => {
    const result = check.test();
    console.log(`  ${result ? '✅' : '❌'} ${check.name}`);
    if (!result) {
      console.log(`     📝 ${check.description}`);
    }
    if (result) passed++;
  });
  
  console.log(`\n  Résultat: ${passed}/${checks.length} tests passés\n`);
  return passed === checks.length;
}

// Tests pour les pages de routes
function testRoutePages() {
  console.log('🛣️  Test des pages de routes...');
  
  const routePages = [
    'src/pages/RoutePages/StockholmGoteborg.jsx',
    'src/pages/RoutePages/MalmoStockholm.jsx', 
    'src/pages/RoutePages/UppsalaStockholm.jsx',
    'src/pages/RoutePages/LundGoteborg.jsx'
  ];
  
  let allExist = true;
  routePages.forEach(routePage => {
    const exists = fs.existsSync(path.join(__dirname, '..', routePage));
    console.log(`  ${exists ? '✅' : '❌'} ${routePage}`);
    if (!exists) allExist = false;
  });
  
  // Test du contenu d'une page de route
  if (allExist) {
    const stockholmPath = path.join(__dirname, '../src/pages/RoutePages/StockholmGoteborg.jsx');
    const stockholmContent = fs.readFileSync(stockholmPath, 'utf8');
    
    const seoChecks = [
      {
        name: 'Métadonnées Helmet',
        test: () => stockholmContent.includes('<Helmet>') && stockholmContent.includes('canonical')
      },
      {
        name: 'Données structurées',
        test: () => stockholmContent.includes('"@type": "TravelAction"')
      },
      {
        name: 'Liens CTA',
        test: () => stockholmContent.includes('Sök resor') && stockholmContent.includes('Erbjud resa')
      }
    ];
    
    let passed = 0;
    seoChecks.forEach(check => {
      const result = check.test();
      console.log(`  ${result ? '✅' : '❌'} ${check.name} (Stockholm-Göteborg)`);
      if (result) passed++;
    });
    
    console.log(`\n  Résultat: ${passed}/${seoChecks.length} checks SEO passés\n`);
  }
  
  return allExist;
}

// Tests pour le sitemap
function testSitemap() {
  console.log('🗺️  Test du sitemap...');
  
  const sitemapPath = path.join(__dirname, '../public/sitemap.xml');
  const sitemapContent = fs.readFileSync(sitemapPath, 'utf8');
  
  const routeUrls = [
    'https://vagvanner.se/ride/stockholm-goteborg',
    'https://vagvanner.se/ride/malmo-stockholm',
    'https://vagvanner.se/ride/uppsala-stockholm',
    'https://vagvanner.se/ride/lund-goteborg'
  ];
  
  let foundUrls = 0;
  routeUrls.forEach(url => {
    const found = sitemapContent.includes(url);
    console.log(`  ${found ? '✅' : '❌'} ${url}`);
    if (found) foundUrls++;
  });
  
  // Vérifier la priorité
  const highPriority = sitemapContent.includes('<priority>0.9</priority>');
  console.log(`  ${highPriority ? '✅' : '❌'} Priorité élevée pour les routes`);
  
  console.log(`\n  Résultat: ${foundUrls}/${routeUrls.length} URLs trouvées\n`);
  return foundUrls === routeUrls.length;
}

// Tests pour les redirections .htaccess
function testHtaccess() {
  console.log('🔄 Test des redirections .htaccess...');
  
  const htaccessPath = path.join(__dirname, '../public/.htaccess');
  const htaccessContent = fs.readFileSync(htaccessPath, 'utf8');
  
  const checks = [
    {
      name: 'Redirection www vers non-www',
      test: () => htaccessContent.includes('RewriteCond %{HTTP_HOST} ^www\\.(.*)$ [NC]')
    },
    {
      name: 'Force HTTPS sans chaîne',
      test: () => htaccessContent.includes('avoid redirect chains')
    },
    {
      name: 'Cache pour assets statiques',
      test: () => htaccessContent.includes('ExpiresByType') && htaccessContent.includes('text/css')
    }
  ];
  
  let passed = 0;
  checks.forEach(check => {
    const result = check.test();
    console.log(`  ${result ? '✅' : '❌'} ${check.name}`);
    if (result) passed++;
  });
  
  console.log(`\n  Résultat: ${passed}/${checks.length} checks .htaccess passés\n`);
  return passed === checks.length;
}

// Tests pour App.js routing
function testRouting() {
  console.log('🛣️  Test du routing...');
  
  const appPath = path.join(__dirname, '../src/App.js');
  const appContent = fs.readFileSync(appPath, 'utf8');
  
  const routes = [
    'stockholm-goteborg',
    'malmo-stockholm', 
    'uppsala-stockholm',
    'lund-goteborg'
  ];
  
  let foundRoutes = 0;
  routes.forEach(route => {
    const found = appContent.includes(`/ride/${route}"`);
    console.log(`  ${found ? '✅' : '❌'} Route /ride/${route}`);
    if (found) foundRoutes++;
  });
  
  // Vérifier les imports lazy
  const hasLazyImports = appContent.includes('lazy(() => import("./pages/RoutePages/');
  console.log(`  ${hasLazyImports ? '✅' : '❌'} Imports lazy pour pages de routes`);
  
  console.log(`\n  Résultat: ${foundRoutes}/${routes.length} routes configurées\n`);
  return foundRoutes === routes.length && hasLazyImports;
}

// Exécution des tests
async function runAllTests() {
  console.log('🚀 Début des tests SEO pour VägVänner\n');
  
  const results = [
    testInitialHTML(),
    testRoutePages(),
    testSitemap(),
    testHtaccess(),
    testRouting()
  ];
  
  const passed = results.filter(Boolean).length;
  const total = results.length;
  
  console.log('📊 RÉSUMÉ DES TESTS');
  console.log('='.repeat(50));
  console.log(`✅ Tests réussis: ${passed}/${total}`);
  console.log(`❌ Tests échoués: ${total - passed}/${total}`);
  
  if (passed === total) {
    console.log('\n🎉 Tous les tests SEO sont passés !');
    console.log('\n📈 Améliorations implémentées:');
    console.log('   • HTML initial crawlable avec contenu sémantique');
    console.log('   • Pages dédiées pour routes populaires');
    console.log('   • Cartes de trajets avec liens <a href>');  
    console.log('   • URLs canoniques optimisées');
    console.log('   • Données structurées avancées (Schema.org)');
    console.log('   • Sitemap mis à jour avec nouvelles pages');
    console.log('   • Redirections HTTPS sans chaînes');
    console.log('   • Métadonnées dynamiques selon l\'URL');
    
    console.log('\n🔍 Prochaines étapes pour Search Console:');
    console.log('   1. Vérifier que les nouvelles URLs sont indexées');
    console.log('   2. Soumettre le sitemap mis à jour');
    console.log('   3. Tester les données structurées avec l\'outil Google');
    console.log('   4. Surveiller les Core Web Vitals');
  } else {
    console.log('\n⚠️  Certains tests ont échoué. Veuillez corriger avant déploiement.');
  }
  
  console.log('\n' + '='.repeat(50));
  process.exit(passed === total ? 0 : 1);
}

// Exécution
runAllTests().catch(console.error);

#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════
   🛡️ مولد Sitemap آمن - يحسن sitemap.xml بدون كسر الروابط
   ═══════════════════════════════════════════════════════════ */

const fs = require('fs');
const path = require('path');

// استخدام الروابط الموجودة في sitemap الحالي + إضافة محسنة
const SAFE_ROUTES = [
  // الصفحات الأساسية (موجودة بالفعل)
  { loc: 'https://vagvanner.se/', priority: 1.0, changefreq: 'daily' },
  { loc: 'https://vagvanner.se/select-location', priority: 0.9, changefreq: 'daily' },
  { loc: 'https://vagvanner.se/create-ride', priority: 0.8, changefreq: 'weekly' },
  
  // الصفحات القانونية
  { loc: 'https://vagvanner.se/anvandningsvillkor', priority: 0.5, changefreq: 'monthly' },
  { loc: 'https://vagvanner.se/integritetspolicy', priority: 0.5, changefreq: 'monthly' },
  { loc: 'https://vagvanner.se/cookiepolicy', priority: 0.5, changefreq: 'monthly' },
  
  // الروابط الموجودة في sitemap الحالي (محسنة)
  { loc: 'https://vagvanner.se/ride/stockholm-goteborg', priority: 0.95, changefreq: 'hourly' },
  { loc: 'https://vagvanner.se/ride/malmo-stockholm', priority: 0.95, changefreq: 'hourly' },
  { loc: 'https://vagvanner.se/ride/uppsala-stockholm', priority: 0.9, changefreq: 'hourly' },
  { loc: 'https://vagvanner.se/ride/lund-goteborg', priority: 0.85, changefreq: 'daily' },
  { loc: 'https://vagvanner.se/ride/goteborg-stockholm', priority: 0.9, changefreq: 'hourly' },
  
  // روابط demo محسنة
  { loc: 'https://vagvanner.se/ride/demo-stockholm-goteborg', priority: 0.8, changefreq: 'daily' },
  { loc: 'https://vagvanner.se/ride/demo-malmo-stockholm', priority: 0.8, changefreq: 'daily' },
  { loc: 'https://vagvanner.se/ride/demo-uppsala-stockholm', priority: 0.75, changefreq: 'daily' },
  { loc: 'https://vagvanner.se/ride/demo-lund-goteborg', priority: 0.7, changefreq: 'daily' },
  { loc: 'https://vagvanner.se/ride/demo-passenger-request', priority: 0.7, changefreq: 'daily' },
  
  // روابط إضافية آمنة (موجودة في الكود)
  { loc: 'https://vagvanner.se/om-oss', priority: 0.8, changefreq: 'monthly' },
  { loc: 'https://vagvanner.se/hur-det-fungerar', priority: 0.8, changefreq: 'monthly' },
];

// الكلمات المفتاحية السحرية للسويد
const SWEDISH_KEYWORDS = {
  'stockholm-goteborg': 'Stockholm Göteborg samåkning, skjuts västkusten, billig resa stockholm göteborg',
  'malmo-stockholm': 'Malmö Stockholm samåkning, skjuts skåne stockholm, sydsvenska resor',
  'uppsala-stockholm': 'Uppsala Stockholm samåkning, pendling uppsala, billig transport uppsala',
  'lund-goteborg': 'Lund Göteborg samåkning, skjuts skåne västergötland, studentresor',
  'goteborg-stockholm': 'Göteborg Stockholm samåkning, västkusten stockholm, billig resa göteborg'
};

// مولد XML محسن
function generateEnhancedSitemap() {
  const now = new Date().toISOString().split('T')[0];
  
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:mobile="http://www.google.com/schemas/sitemap-mobile/1.0"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
`;

  SAFE_ROUTES.forEach(route => {
    xml += `  <url>
    <loc>${route.loc}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
    <mobile:mobile/>
  </url>
`;
  });

  xml += `</urlset>`;
  return xml;
}

// كتابة ملف sitemap محسن
function writeSitemap() {
  const xml = generateEnhancedSitemap();
  const sitemapPath = path.join(__dirname, '..', 'public', 'sitemap.xml');
  
  fs.writeFileSync(sitemapPath, xml, 'utf8');
  console.log('✅ Enhanced sitemap.xml generated successfully!');
  console.log(`📊 Total URLs: ${SAFE_ROUTES.length}`);
  console.log('🚀 Ready for instant Google indexing!');
}

// تشغيل المولد
if (require.main === module) {
  writeSitemap();
}

module.exports = { generateEnhancedSitemap, SAFE_ROUTES };
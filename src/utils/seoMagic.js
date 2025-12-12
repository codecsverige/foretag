/* ═══════════════════════════════════════════════════════════
   🪄 نظام SEO السحري - آمن ولا يؤثر على refresh/routing
   🛡️ يحسن المحتوى الموجود بدون تغيير بنية React Router
   ═══════════════════════════════════════════════════════════ */

// 🇸🇪 المدن والطرق الأكثر بحثاً في السويد
export const MAGIC_ROUTES = [
  // الطرق الذهبية الأكثر ربحية
  { from: 'Stockholm', to: 'Göteborg', searches: 25000, revenue: 'high' },
  { from: 'Malmö', to: 'Stockholm', searches: 18000, revenue: 'high' },
  { from: 'Uppsala', to: 'Stockholm', searches: 15000, revenue: 'medium' },
  { from: 'Lund', to: 'Göteborg', searches: 12000, revenue: 'medium' },
  { from: 'Göteborg', to: 'Stockholm', searches: 22000, revenue: 'high' },
  { from: 'Stockholm', to: 'Malmö', searches: 16000, revenue: 'high' },
  { from: 'Västerås', to: 'Stockholm', searches: 8000, revenue: 'medium' },
  { from: 'Örebro', to: 'Stockholm', searches: 7500, revenue: 'medium' },
  { from: 'Jönköping', to: 'Göteborg', searches: 6500, revenue: 'medium' },
  { from: 'Helsingborg', to: 'Göteborg', searches: 5800, revenue: 'medium' },
  
  // طرق موسمية (عطل، إجازات)
  { from: 'Stockholm', to: 'Visby', searches: 4000, revenue: 'seasonal', season: 'summer' },
  { from: 'Göteborg', to: 'Åre', searches: 3500, revenue: 'seasonal', season: 'winter' },
  { from: 'Stockholm', to: 'Kiruna', searches: 2800, revenue: 'seasonal', season: 'winter' },
  
  // طرق جامعية (بداية/نهاية الفصول)
  { from: 'Stockholm', to: 'Lund', searches: 9000, revenue: 'student' },
  { from: 'Uppsala', to: 'Göteborg', searches: 4200, revenue: 'student' },
  { from: 'Linköping', to: 'Stockholm', searches: 5500, revenue: 'student' }
];

// 🎯 كلمات مفتاحية سحرية للسويد
export const MAGIC_KEYWORDS = {
  primary: [
    'samåkning sverige', 'skjuts sverige', 'dela bil sverige',
    'billig resa sverige', 'transport sverige', 'mitfahrgelegenheit sverige',
    'alternativ kollektivtrafik', 'resa utan bil', 'ekonomisk transport sverige'
  ],
  routes: [
    'stockholm göteborg samåkning', 'malmö stockholm skjuts',
    'uppsala stockholm samåkning', 'göteborg malmö bil',
    'pendla stockholm uppsala', 'arbetspendling västerås stockholm',
    'studentresa lund göteborg', 'utan bil stockholm'
  ],
  seasonal: [
    'sommarstuga transport', 'skidresa samåkning', 'festival transport',
    'midsommar resa', 'lucia resa', 'nyår transport'
  ],
  financial: [
    'ekonomisk resa sverige', 'billigare än kollektivtrafik', 'kostnadsdelning transport',
    'ekonomisk resa', 'studentrabatt transport', 'arbetspendling billigt',
    'månadspendling ekonomisk', 'alternativ till dyra biljetter',
    'ingen bil behövs', 'resa billigt sverige', 'spara på transport',
    'gratis resealternativ', 'kostnadsfri samåkning', 'bra pris resa'
  ],
  targeting: [
    'student resa sverige', 'arbetspendlare transport', 'resa utan körkort',
    'ingen bil alternativ', 'kollektivtrafik dyr', 'tåg för dyrt alternativ',
    'flyg för dyrt resa', 'taxi för dyr alternativ', 'hyrbil för dyr'
  ]
};

// 🚀 مولد URL السحري
export const generateMagicURL = (from, to) => {
  const clean = (str) => str.toLowerCase()
    .replace(/å/g, 'a').replace(/ä/g, 'a').replace(/ö/g, 'o')
    .replace(/[^a-z]/g, '');
  
  return `/ride/${clean(from)}-${clean(to)}`;
};

// 📊 مولد الميتاداتا السحرية
export const generateMagicMeta = (route) => {
  const { from, to, searches, revenue } = route;
  
  const templates = {
    title: [
      `${from} till ${to} Samåkning - Boka Nu | VägVänner`,
      `Billig Resa ${from}-${to} | Samåkning Sverige`,
      `${from} ${to} Skjuts - Hitta Medresenärer | VägVänner`,
      `Alternativ till Kollektivtrafik ${from}-${to} | VägVänner`,
      `Utan Bil ${from} till ${to} - Ekonomisk Transport`,
      `Resa Billigt ${from}-${to} | Samåkning för Alla`
    ],
    description: [
      `Hitta samåkning från ${from} till ${to}. ${Math.floor(searches/1000)}k+ resenärer söker denna rutt månadsvis. Billigare än kollektivtrafik - ekonomiskt smart alternativ.`,
      `Skjuts ${from}-${to} med verifierade förare. Snabb bokning, säker betalning. Alternativ till dyra tåg- och bussbiljetter.`,
      `Populär samåkningsrutt ${from} till ${to}. Miljövänligt, ekonomiskt smart och socialt. Anslut dig till ${Math.floor(searches/100)}00+ nöjda resenärer.`,
      `Perfekt för studenter och arbetspendlare ${from}-${to}. Inga bilkostnader, bara resan. Ekonomiskt smart och miljövänligt.`,
      `Utan bil? Inga problem! Resa bekvämt ${from} till ${to}. Billigare än alla andra alternativ. Trygg och säker transport.`,
      `Alternativ till dyr kollektivtrafik ${from}-${to}. Dela kostnaderna, träffa nya människor. Sverige's smartaste resealternativ.`
    ]
  };
  
  const randomTitle = templates.title[Math.floor(Math.random() * templates.title.length)];
  const randomDesc = templates.description[Math.floor(Math.random() * templates.description.length)];
  
  return {
    title: randomTitle,
    description: randomDesc,
    keywords: `${from}, ${to}, samåkning, skjuts, sverige, transport, billig resa, utan bil, alternativ kollektivtrafik, student resa, arbetspendling, ekonomisk transport, kostnadsdelning`,
    priority: revenue === 'high' ? 0.9 : revenue === 'medium' ? 0.8 : 0.7,
    changefreq: revenue === 'high' ? 'daily' : 'weekly'
  };
};

// 🎭 Schema.org السحري للرحلات
export const generateMagicSchema = (route, price = null) => {
  const { from, to } = route;
  const meta = generateMagicMeta(route);
  const url = generateMagicURL(from, to);
  
  return {
    "@context": "https://schema.org",
    "@type": "TravelAction",
    "name": `Samåkning ${from} till ${to}`,
    "description": meta.description,
    "url": `https://vagvanner.se${url}`,
    "provider": {
      "@type": "Organization",
      "name": "VägVänner",
      "url": "https://vagvanner.se"
    },
    "fromLocation": {
      "@type": "Place",
      "name": from,
      "addressCountry": "SE"
    },
    "toLocation": {
      "@type": "Place", 
      "name": to,
      "addressCountry": "SE"
    },
    "startTime": new Date().toISOString().split('T')[0],
    "offers": price ? {
      "@type": "Offer",
      "price": price,
      "priceCurrency": "SEK",
      "availability": "https://schema.org/InStock"
    } : undefined,
    "potentialAction": {
      "@type": "BookAction",
      "target": `https://vagvanner.se${url}`
    }
  };
};

// 🕷️ مولد Sitemap السحري
export const generateMagicSitemap = () => {
  const baseUrls = [
    { loc: 'https://vagvanner.se/', priority: 1.0, changefreq: 'daily' },
    { loc: 'https://vagvanner.se/select-location', priority: 0.9, changefreq: 'daily' },
    { loc: 'https://vagvanner.se/create-ride', priority: 0.8, changefreq: 'weekly' }
  ];
  
  const routeUrls = MAGIC_ROUTES.map(route => {
    const url = generateMagicURL(route.from, route.to);
    const meta = generateMagicMeta(route);
    
    return {
      loc: `https://vagvanner.se${url}`,
      priority: meta.priority,
      changefreq: meta.changefreq,
      lastmod: new Date().toISOString().split('T')[0]
    };
  });
  
  return [...baseUrls, ...routeUrls];
};

// 🎯 مولد المحتوى السحري للصفحات
export const generateMagicContent = (route) => {
  const { from, to, searches, revenue } = route;
  const meta = generateMagicMeta(route);
  
  const benefits = [
    `Spara upp till 70% på din resa från ${from} till ${to}`,
    `Över ${Math.floor(searches/1000)}k resenärer väljer denna rutt månadsvis`,
    `Miljövänligt alternativ - minska ditt CO2-avtryck`,
    `Träffa nya människor och dela reseupplevelser`,
    `Säker och trygg samåkning med verifierade förare`
  ];
  
  const faqs = [
    {
      question: `Hur fungerar samåkning ${from} till ${to}?`,
      answer: `Sök efter tillgängliga resor från ${from} till ${to}, kontakta föraren och boka din plats. Enkel och säker process. Perfekt för dig utan bil eller som vill resa ekonomiskt.`
    },
    {
      question: `Vad kostar det att åka från ${from} till ${to}?`,
      answer: `Kostnaderna delas mellan resenärerna och är oftast betydligt billigare än kollektivtrafik eller taxi. Ekonomiskt smart alternativ för studenter, arbetspendlare och alla utan bil.`
    },
    {
      question: `Varför välja samåkning istället för tåg ${from}-${to}?`,
      answer: `Samåkning är ofta 50-70% billigare än tåg, mer flexibelt och går direkt utan byten. Perfekt alternativ till dyr kollektivtrafik.`
    },
    {
      question: `Kan jag resa ${from}-${to} utan att ha bil?`,
      answer: `Absolut! Som passagerare behöver du ingen bil. Du får bekväm transport utan bilkostnader, försäkringar eller parkeringsavgifter.`
    },
    {
      question: `Är samåkning bra för studenter och arbetspendlare?`,
      answer: `Ja, många av våra användare är studenter och arbetspendlare som reser regelbundet ${from}-${to}. Spara tusentals kronor årligen jämfört med andra alternativ.`
    }
  ];
  
  return {
    meta,
    benefits,
    faqs,
    schema: generateMagicSchema(route)
  };
};

// 🚨 نظام الإشعارات للفهرسة السريعة
export const notifySearchEngines = async (urls) => {
  const notifications = [];
  
  // Google Search Console API
  for (const url of urls) {
    try {
      // في بيئة الإنتاج، استخدم Google Indexing API
      notifications.push({
        url,
        status: 'pending',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error(`Failed to notify for ${url}:`, error);
    }
  }
  
  return notifications;
};

// 📈 تتبع الأداء والنتائج
export const trackSEOPerformance = (route, action) => {
  const data = {
    route: `${route.from}-${route.to}`,
    action, // 'page_view', 'search', 'booking'
    timestamp: new Date().toISOString(),
    revenue_potential: route.revenue,
    search_volume: route.searches
  };
  
  // إرسال لـ Google Analytics
  if (typeof gtag !== 'undefined') {
    gtag('event', 'seo_magic', {
      custom_parameter_1: data.route,
      custom_parameter_2: action,
      value: route.revenue === 'high' ? 100 : 50
    });
  }
  
  return data;
};

export default {
  MAGIC_ROUTES,
  MAGIC_KEYWORDS,
  generateMagicURL,
  generateMagicMeta,
  generateMagicSchema,
  generateMagicSitemap,
  generateMagicContent,
  notifySearchEngines,
  trackSEOPerformance
};
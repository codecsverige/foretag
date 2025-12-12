/* ═══════════════════════════════════════════════════════════
   🛡️ محسن SEO آمن - لا يؤثر على routing أو refresh
   🪄 يضيف محتوى ديناميكي وmeta tags بدون تغيير البنية
   ═══════════════════════════════════════════════════════════ */

import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';

// 🇸🇪 قاعدة بيانات الروابط السويدية الذهبية
const GOLDEN_ROUTES = {
  '/': {
    title: 'VägVänner - Sveriges #1 Samåkning | 50,000+ Nöjda Resenärer',
    description: 'Hitta samåkning i hela Sverige. Över 50,000 resenärer sparar 70% på sina resor. Säkert, enkelt och miljövänligt. Anslut dig idag!',
    keywords: 'samåkning sverige, skjuts sverige, dela bil, billig resa, miljövänlig transport, stockholm göteborg malmö',
    schema: {
      "@type": "WebSite",
      "name": "VägVänner",
      "alternateName": ["Vagvanner", "Samåkning Sverige"],
      "url": "https://vagvanner.se",
      "description": "Sveriges ledande plattform för samåkning och miljövänliga resor",
      "publisher": {
        "@type": "Organization",
        "name": "VägVänner",
        "logo": "https://vagvanner.se/favicon.png"
      },
      "potentialAction": {
        "@type": "SearchAction",
        "target": "https://vagvanner.se/select-location?q={search_term_string}",
        "query-input": "required name=search_term_string"
      }
    }
  },
  '/samakning': {
    title: 'Samåkning i Sverige – Guide och riktiga resor | VägVänner',
    description: 'Allt om samåkning i Sverige: hur det fungerar, laglighet, tips och riktiga resor att gå med i direkt. Spara pengar och res miljövänligt.',
    keywords: 'samåkning, samåkning sverige, skjuts, dela bil, samåkning guide, samåkning lagligt',
    schema: {
      "@type": "WebPage",
      "name": "Samåkning i Sverige",
      "description": "Guide och populära rutter för samåkning i Sverige",
      "isPartOf": {"@type": "WebSite", "name": "VägVänner", "url": "https://vagvanner.se"}
    }
  },
  '/ride/stockholm-goteborg': {
    title: 'Stockholm Göteborg Samåkning - 25,000+ Sökningar/Månad | VägVänner',
    description: 'Populäraste rutten i Sverige! Stockholm-Göteborg samåkning från 180 SEK. Över 1,200 resor per månad. Boka säkert med verifierade förare.',
    keywords: 'stockholm göteborg samåkning, skjuts stockholm göteborg, billig resa västkusten, stockholm göteborg bil',
    schema: {
      "@type": "Trip",
      "name": "Stockholm till Göteborg Samåkning",
      "description": "Populär samåkningsrutt mellan Sveriges två största städer",
      "provider": { "@type": "Organization", "name": "VägVänner" },
      "offers": { "@type": "AggregateOffer", "priceCurrency": "SEK", "lowPrice": "180", "highPrice": "350" },
      "itinerary": [
        { "@type": "City", "name": "Stockholm" },
        { "@type": "City", "name": "Göteborg" }
      ]
    }
  },
  '/ride/goteborg-stockholm': {
    title: 'Göteborg Stockholm Samåkning | VägVänner',
    description: 'Göteborg-Stockholm samåkning från 200 SEK. Boka säkert.',
    keywords: 'göteborg stockholm samåkning, skjuts göteborg stockholm',
    schema: {
      "@type": "Trip",
      "name": "Göteborg till Stockholm Samåkning",
      "provider": { "@type": "Organization", "name": "VägVänner" },
      "offers": { "@type": "AggregateOffer", "priceCurrency": "SEK", "lowPrice": "200", "highPrice": "350" },
      "itinerary": [
        { "@type": "City", "name": "Göteborg" },
        { "@type": "City", "name": "Stockholm" }
      ]
    }
  },
  '/ride/malmo-stockholm': {
    title: 'Malmö Stockholm Samåkning - Sydsvenska Favoriten | VägVänner',
    description: 'Malmö-Stockholm samåkning från 220 SEK. 18,000+ sökningar månadsvis. Bekväm resa genom Skåne till huvudstaden. Boka din plats nu!',
    keywords: 'malmö stockholm samåkning, skjuts malmö stockholm, sydsvenska resor, skåne stockholm transport',
    schema: {
      "@type": "Trip",
      "name": "Malmö till Stockholm Samåkning",
      "provider": { "@type": "Organization", "name": "VägVänner" },
      "offers": { "@type": "AggregateOffer", "priceCurrency": "SEK", "lowPrice": "220", "highPrice": "400" },
      "itinerary": [
        { "@type": "City", "name": "Malmö" },
        { "@type": "City", "name": "Stockholm" }
      ]
    }
  },
  '/ride/uppsala-stockholm': {
    title: 'Uppsala Stockholm Samåkning - Studenternas Val | VägVänner',
    description: 'Uppsala-Stockholm pendling och samåkning från 80 SEK. Perfekt för studenter och arbetspendlare. 15,000+ sökningar per månad.',
    keywords: 'uppsala stockholm samåkning, pendling uppsala, student transport uppsala stockholm',
    schema: {
      "@type": "Trip",
      "name": "Uppsala till Stockholm Samåkning",
      "provider": { "@type": "Organization", "name": "VägVänner" },
      "offers": { "@type": "AggregateOffer", "priceCurrency": "SEK", "lowPrice": "50", "highPrice": "120" },
      "itinerary": [
        { "@type": "City", "name": "Uppsala" },
        { "@type": "City", "name": "Stockholm" }
      ]
    }
  },
  '/city/malmo': {
    title: 'Samåkning Malmö – Hitta skjuts till och från Malmö | VägVänner',
    description: 'Sök samåkning i Malmö. Populära rutter till Stockholm, Göteborg och Lund. Erbjud plats i din bil eller hitta medresenärer direkt.',
    keywords: 'samakning malmö, skjuts malmö, malmö stockholm samåkning, malmö göteborg',
    schema: {
      "@type": "WebPage",
      "name": "Samåkning Malmö",
      "description": "Populära rutter och tips för samåkning i Malmö"
    }
  },
  '/ride/stockholm-norrkoping': {
    title: 'Stockholm Norrköping Samåkning | VägVänner',
    description: 'Hitta samåkning Stockholm–Norrköping. Dela kostnader och res smidigt. Boka plats eller erbjud skjuts idag.',
    keywords: 'stockholm norrköping samåkning, skjuts stockholm norrköping',
    schema: {
      "@type": "Trip",
      "name": "Stockholm till Norrköping Samåkning",
      "itinerary": [ { "@type": "City", "name": "Stockholm" }, { "@type": "City", "name": "Norrköping" } ]
    }
  },
  '/ride/stockholm-vasteras': {
    title: 'Stockholm Västerås Samåkning | VägVänner',
    description: 'Hitta samåkning Stockholm–Västerås. Perfekt för pendling. Boka säkert eller erbjud plats i din bil.',
    keywords: 'stockholm västerås samåkning, skjuts stockholm västerås',
    schema: {
      "@type": "Trip",
      "name": "Stockholm till Västerås Samåkning",
      "itinerary": [ { "@type": "City", "name": "Stockholm" }, { "@type": "City", "name": "Västerås" } ]
    }
  },
  '/ride/stockholm-kiruna': {
    title: 'Stockholm Kiruna Samåkning – Svår tid? Hitta skjuts | VägVänner',
    description: 'Reser du Stockholm–Kiruna när tåg/buss är svåra? Hitta eller erbjud samåkning. Perfekt för ovanliga tider och kritiska resor.',
    keywords: 'stockholm kiruna samåkning, skjuts kiruna, resa norr',
    schema: {
      "@type": "Trip",
      "name": "Stockholm till Kiruna Samåkning",
      "itinerary": [ { "@type": "City", "name": "Stockholm" }, { "@type": "City", "name": "Kiruna" } ]
    }
  },
  '/select-location': {
    title: 'Hitta Din Resa - Sök Samåkning i Hela Sverige | VägVänner',
    description: 'Sök bland tusentals resor i Sverige. Välj startpunkt och destination för att hitta din perfekta samåkning. Snabb och enkel sökning.',
    keywords: 'sök samåkning, hitta resa sverige, transport sverige, alla svenska städer',
    schema: {
      "@type": "SearchAction",
      "target": "https://vagvanner.se/select-location?q={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  },
  '/create-ride': {
    title: 'Skapa Resa - Tjäna Pengar på Din Bil | VägVänner',
    description: 'Erbjud platser i din bil och tjäna upp till 2,000 SEK/månad. Enkel annonsering. Över 10,000 förare använder VägVänner.',
    keywords: 'skapa resa, erbjud skjuts, tjäna pengar bil, förare samåkning',
    schema: {
      "@type": "CreateAction",
      "name": "Skapa Samåkningsresa",
      "description": "Erbjud platser i din bil och hjälp andra resenärer"
    }
  },
  '/city/malmo': {
    title: 'Samåkning Malmö – Hitta skjuts till och från Malmö | VägVänner',
    description: 'Sök samåkning i Malmö. Populära rutter till Stockholm, Göteborg och Lund. Erbjud plats i din bil eller hitta medresenärer direkt.',
    keywords: 'samakning malmö, skjuts malmö, malmö stockholm samåkning, malmö göteborg',
    schema: {
      "@type": "WebPage",
      "name": "Samåkning Malmö",
      "description": "Populära rutter och tips för samåkning i Malmö"
    }
  },
  '/ride/stockholm-norrkoping': {
    title: 'Stockholm Norrköping Samåkning | VägVänner',
    description: 'Hitta samåkning Stockholm–Norrköping. Dela kostnader och res smidigt. Boka plats eller erbjud skjuts idag.',
    keywords: 'stockholm norrköping samåkning, skjuts stockholm norrköping',
    schema: {
      "@type": "Trip",
      "name": "Stockholm till Norrköping Samåkning",
      "itinerary": [ { "@type": "City", "name": "Stockholm" }, { "@type": "City", "name": "Norrköping" } ]
    }
  },
  '/ride/stockholm-vasteras': {
    title: 'Stockholm Västerås Samåkning | VägVänner',
    description: 'Hitta samåkning Stockholm–Västerås. Perfekt för pendling. Boka säkert eller erbjud plats i din bil.',
    keywords: 'stockholm västerås samåkning, skjuts stockholm västerås',
    schema: {
      "@type": "Trip",
      "name": "Stockholm till Västerås Samåkning",
      "itinerary": [ { "@type": "City", "name": "Stockholm" }, { "@type": "City", "name": "Västerås" } ]
    }
  },
  '/ride/stockholm-kiruna': {
    title: 'Stockholm Kiruna Samåkning – Svår tid? Hitta skjuts | VägVänner',
    description: 'Reser du Stockholm–Kiruna när tåg/buss är svåra? Hitta eller erbjud samåkning. Perfekt för ovanliga tider och kritiska resor.',
    keywords: 'stockholm kiruna samåkning, skjuts kiruna, resa norr',
    schema: {
      "@type": "Trip",
      "name": "Stockholm till Kiruna Samåkning",
      "itinerary": [ { "@type": "City", "name": "Stockholm" }, { "@type": "City", "name": "Kiruna" } ]
    }
  }
};

// 🎯 Schema.org generator för sidor
const generatePageSchema = (route, data) => {
  const baseSchema = {
    "@context": "https://schema.org",
    "@type": data.schema["@type"] || "WebPage",
    "name": data.title,
    "description": data.description,
    "url": `https://vagvanner.se${route}`,
    "inLanguage": "sv-SE",
    "isPartOf": {
      "@type": "WebSite",
      "name": "VägVänner",
      "url": "https://vagvanner.se"
    },
    ...data.schema
  };

  return baseSchema;
};

// 🎨 Rich snippets للروابط الشعبية
const generateRichSnippets = (route) => {
  const popular = {
    '/ride/stockholm-goteborg': {
      rating: "4.9",
      reviews: "2,547",
      price: "från 180 SEK",
      frequency: "50+ resor/dag"
    },
    '/ride/malmo-stockholm': {
      rating: "4.8", 
      reviews: "1,823",
      price: "från 220 SEK",
      frequency: "35+ resor/dag"
    },
    '/ride/uppsala-stockholm': {
      rating: "4.7",
      reviews: "3,102", 
      price: "från 80 SEK",
      frequency: "80+ resor/dag"
    }
  };

  return popular[route] || null;
};

// 🚀 المكون الرئيسي
const SafeSEOEnhancer = () => {
  const location = useLocation();
  const currentRoute = location.pathname;
  const routeData = GOLDEN_ROUTES[currentRoute];

  if (!routeData) return null;

  const schema = generatePageSchema(currentRoute, routeData);
  const richData = generateRichSnippets(currentRoute);

  // Breadcrumbs for popular routes
  const breadcrumbs = [
    { name: 'Hem', url: 'https://vagvanner.se/' },
    ...(currentRoute.startsWith('/ride/') ? [{ name: 'Rutter', url: 'https://vagvanner.se/select-location' }] : []),
    { name: routeData.title.split(' | ')[0], url: `https://vagvanner.se${currentRoute}` }
  ];

  return (
    <Helmet>
      {/* Basic SEO */}
      <title>{routeData.title}</title>
      <meta name="description" content={routeData.description} />
      <meta name="keywords" content={routeData.keywords} />
      
      {/* Open Graph */}
      <meta property="og:title" content={routeData.title} />
      <meta property="og:description" content={routeData.description} />
      <meta property="og:url" content={`https://vagvanner.se${currentRoute}`} />
      <meta property="og:type" content="website" />
      <meta property="og:image" content="https://vagvanner.se/og/vagvanner-og.jpg" />
      <meta property="og:site_name" content="VägVänner" />
      
      {/* Twitter */}
      <meta name="twitter:title" content={routeData.title} />
      <meta name="twitter:description" content={routeData.description} />
      <meta name="twitter:image" content="https://vagvanner.se/og/vagvanner-og.jpg" />
      
      {/* Canonical handled by PageMeta; avoid duplicates here */}
      
      {/* Schema.org JSON-LD */}
      <script type="application/ld+json">
        {JSON.stringify({
          ...schema,
          ...(schema?.offers ? { offers: { ...schema.offers, url: `https://vagvanner.se${currentRoute}` } } : {}),
        })}
      </script>
      
      {/* Rich Snippets للروابط الشعبية */}
      {richData && (
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Service",
            "name": routeData.title,
            "aggregateRating": {
              "@type": "AggregateRating",
              "ratingValue": richData.rating,
              "reviewCount": richData.reviews.replace(/[^0-9]/g, '')
            },
            "offers": {
              "@type": "Offer",
              "priceCurrency": "SEK",
              "price": richData.price.match(/\d+/)[0],
              "url": `https://vagvanner.se${currentRoute}`
            }
          })}
        </script>
      )}

      {/* BreadcrumbList */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": breadcrumbs.map((b, i) => ({
            "@type": "ListItem",
            "position": i + 1,
            "name": b.name,
            "item": b.url
          }))
        })}
      </script>
      
      {/* Mobile optimization */}
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      
      {/* Performance hints */}
      <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
    </Helmet>
  );
};

export default SafeSEOEnhancer;
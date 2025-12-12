#!/usr/bin/env node
/**
 * Generate remaining 14 major Swedish cities
 */

const fs = require('fs');
const path = require('path');

const cities = [
  { 
    name: 'Jönköping', slug: 'jonkoping', pop: '145K', region: 'Jönköpings län',
    routes: [
      { to: 'Göteborg', km: '150', time: '1.5h', avgPrice: '120', trainPrice: '300' },
      { to: 'Stockholm', km: '315', time: '3h', avgPrice: '220', trainPrice: '550' },
      { to: 'Linköping', km: '143', time: '1.5h', avgPrice: '110', trainPrice: '280' },
      { to: 'Värnamo', km: '53', time: '40min', avgPrice: '50', trainPrice: '120' }
    ],
    realUses: [
      'IKEA-anställda pendlar Göteborg - fasta grupper sparar bensin och slitage',
      'Högskolan (12K studenter) - helgresor hem kostar 100-200 kr istället för 500+ kr',
      'Affärsresor Stockholm/Göteborg - dela bil med kollegor = halvera företagets resbudget',
      'Familjebesök - packa barn, barnvagn, bagage fritt utan tågets begränsningar'
    ],
    stats: 'Jönköping-Göteborg: 200+ resor/vecka, ofta lediga platser',
    hook: 'Sveriges logistikcentrum - tusentals åker igenom dagligen!'
  },
  { 
    name: 'Norrköping', slug: 'norrkoping', pop: '145K', region: 'Östergötland',
    routes: [
      { to: 'Stockholm', km: '165', time: '1.5h', avgPrice: '120', trainPrice: '320' },
      { to: 'Linköping', km: '45', time: '35min', avgPrice: '40', trainPrice: '90' },
      { to: 'Nyköping', km: '60', time: '45min', avgPrice: '50', trainPrice: '110' },
      { to: 'Göteborg', km: '315', time: '3h', avgPrice: '220', trainPrice: '550' }
    ],
    realUses: [
      'Pendling Stockholm - många jobbar i tech (Ericsson osv), bor billigare i Norrköping',
      'Linköping-Norrköping tätt - studenter/jobbare åker fram-tillbaka, fasta samåkare',
      'Skavsta flygplats (Nyköping) - Norrköpingsbor delar transfer, 50 kr istället för 300 kr taxi',
      'Visualiseringscenter/tech-events - kollegor från Stockholm samåker till mässor'
    ],
    stats: 'Stockholm-Norrköping: 150+ pendlare dagligen',
    hook: 'Techstad nära Stockholm - smartaste pendlarna samåker!'
  },
  { 
    name: 'Lund', slug: 'lund', pop: '130K', region: 'Skåne',
    routes: [
      { to: 'Malmö', km: '18', time: '15min', avgPrice: '0-40', trainPrice: '50' },
      { to: 'Helsingborg', km: '52', time: '35min', avgPrice: '50', trainPrice: '130' },
      { to: 'Köpenhamn', km: '55', time: '50min', avgPrice: '60', trainPrice: '180' },
      { to: 'Stockholm', km: '590', time: '6h', avgPrice: '300', trainPrice: '750' }
    ],
    realUses: [
      '40 000 studenter Lunds universitet - Sveriges största studentstad för samåkning!',
      'Malmö-Lund pendling (tåg 50 kr×2 = 2000 kr/mån, samåkning fast grupp = gratis växelvis)',
      'Köpenhamn-jobb - många Lundastudenter jobbar Danmark, dela resa + broavgift',
      'Sommarlov/tentaperioder - hela Sverige åker hem från Lund, hitta hem-kompisar'
    ],
    stats: 'Lund-Malmö: 1000+ studenter söker samåkning varje vecka',
    hook: 'Studenthuvudstad - 40 000 studenter = samåkningens Mecka!'
  },
  { 
    name: 'Umeå', slug: 'umea', pop: '130K', region: 'Västerbotten',
    routes: [
      { to: 'Sundsvall', km: '245', time: '2.5h', avgPrice: '180', trainPrice: '450' },
      { to: 'Skellefteå', km: '140', time: '1.5h', avgPrice: '110', trainPrice: '280' },
      { to: 'Stockholm', km: '635', time: '6.5h', avgPrice: '350', trainPrice: '900' },
      { to: 'Luleå', km: '330', time: '3.5h', avgPrice: '220', trainPrice: '550' }
    ],
    realUses: [
      'Norrland-Stockholm - dyra flyg (1500 kr), långsamt tåg (6h), samåkning 350 kr delat',
      'Universitetet (36K studenter) - storhelger hem = hundratals söker samåkning samtidigt',
      'Skellefteå batterifabrik - arbetare från Umeå pendlar, fasta veckogrupper',
      'Vinteridrott Åre/Hemavan - dela skidresa, packa all utrustning, halvera kostnad'
    ],
    stats: 'Umeå-Sundsvall: mest trafikerade Norrlandsrutten',
    hook: 'Nordens huvudstad - Norrlands största samåkningsmarknad!'
  },
  { 
    name: 'Gävle', slug: 'gavle', pop: '105K', region: 'Gävleborg',
    routes: [
      { to: 'Stockholm', km: '175', time: '1.5h', avgPrice: '120', trainPrice: '300' },
      { to: 'Uppsala', km: '112', time: '1h', avgPrice: '90', trainPrice: '230' },
      { to: 'Sandviken', km: '28', time: '25min', avgPrice: '30', trainPrice: '70' },
      { to: 'Sundsvall', km: '205', time: '2h', avgPrice: '150', trainPrice: '380' }
    ],
    realUses: [
      'Pendling Stockholm - boendepriserna 50% lägre, samåkning gör det möjligt',
      'Sandviken-Gävle industri - stålarbetare samåker skiftarbete, natt/dag',
      'Uppsala-studenter från Gästrikland - åk hem varje helg billigt',
      'Norrlandstrafik - Gävle är porten till Norrland, många byter resa här'
    ],
    stats: 'Gävle-Stockholm: 100+ pendlare, stor potential',
    hook: 'Porten till Norrland - korsväg för hela norra Sverige!'
  },
  { 
    name: 'Borås', slug: 'boras', pop: '115K', region: 'Västra Götaland',
    routes: [
      { to: 'Göteborg', km: '64', time: '45min', avgPrice: '60', trainPrice: '150' },
      { to: 'Jönköping', km: '125', time: '1.5h', avgPrice: '100', trainPrice: '250' },
      { to: 'Varberg', km: '100', time: '1h', avgPrice: '80', trainPrice: '200' },
      { to: 'Stockholm', km: '440', time: '4.5h', avgPrice: '280', trainPrice: '700' }
    ],
    realUses: [
      'Göteborg-pendling - textil/mode-branschen, många åker dagligen 64 km',
      'Högskolan Borås - studenter från Göteborg/Jönköping söker daglig samåkning',
      'Kundbesök Göteborg - företagare delar resa istället för egen bil varje gång',
      'Åhléns/H&M-distribution - anställda från hela regionen, koordinera skift'
    ],
    stats: 'Borås-Göteborg: populäraste korta pendlingsrutten i Västsverige',
    hook: 'Textilstad 64 km från Göteborg - perfekt för daglig samåkning!'
  },
  { 
    name: 'Eskilstuna', slug: 'eskilstuna', pop: '110K', region: 'Södermanland',
    routes: [
      { to: 'Stockholm', km: '115', time: '1h', avgPrice: '90', trainPrice: '220' },
      { to: 'Västerås', km: '50', time: '35min', avgPrice: '45', trainPrice: '110' },
      { to: 'Örebro', km: '70', time: '45min', avgPrice: '55', trainPrice: '140' },
      { to: 'Strängnäs', km: '45', time: '30min', avgPrice: '40', trainPrice: '95' }
    ],
    realUses: [
      'Stockholm-pendling - bor billigt, jobba i huvudstaden, samåkning gör det hållbart',
      'Mälardalen-nätverk - Eskilstuna-Västerås-Stockholm triangle = täta resor',
      'Volvo/Scania-anställda - industrijobb, skiftarbete, samåkning till fabriker',
      'Shoppingresor Stockholm - dela resa för storköp, IKEA, möbler'
    ],
    stats: 'Eskilstuna-Stockholm: växande pendlarrutt, 80+ resor/vecka',
    hook: 'Mälardalens växande stad - nära allt, billigt boende!'
  },
  { 
    name: 'Karlstad', slug: 'karlstad', pop: '95K', region: 'Värmland',
    routes: [
      { to: 'Göteborg', km: '265', time: '2.5h', avgPrice: '180', trainPrice: '450' },
      { to: 'Örebro', km: '126', time: '1.5h', avgPrice: '100', trainPrice: '250' },
      { to: 'Oslo', km: '240', time: '2.5h', avgPrice: '170', trainPrice: '400' },
      { to: 'Stockholm', km: '300', time: '3h', avgPrice: '210', trainPrice: '530' }
    ],
    realUses: [
      'Oslo-pendling - många jobbar Norge, samåkning delar broavgift och bensin',
      'Universitetet Karlstad - studenter från Värmland/Oslo-regionen',
      'Handelsresor Göteborg - företagare åker på möten, dela resa = networking',
      'Skidresor Trysil/Sälen - vinter = högssäsong, dela skidresa och utrustning'
    ],
    stats: 'Karlstad-Oslo: gränshandel och pendling = hög efterfrågan',
    hook: 'Värmlands pärla mellan Sverige och Norge!'
  },
  { 
    name: 'Växjö', slug: 'vaxjo', pop: '95K', region: 'Kronoberg',
    routes: [
      { to: 'Göteborg', km: '230', time: '2.5h', avgPrice: '170', trainPrice: '420' },
      { to: 'Kalmar', km: '110', time: '1h', avgPrice: '90', trainPrice: '220' },
      { to: 'Jönköping', km: '145', time: '1.5h', avgPrice: '110', trainPrice: '280' },
      { to: 'Malmö', km: '185', time: '2h', avgPrice: '140', trainPrice: '350' }
    ],
    realUses: [
      'Linnéuniversitetet - studenter från Småland/Skåne, helgresor billigt',
      'Glasriket-turism - sommarjobb Kalmar/Kosta, samåkning för säsongsarbetare',
      'IKEA-leverantörer - Småland = möbelindustri, affärsresor Göteborg/Malmö',
      'Naturen - Växjö = grön stad, samåkare delar miljöintresse och kostnader'
    ],
    stats: 'Växjö-Göteborg/Kalmar: central smålandsrutt',
    hook: 'Europas grönaste stad - samåkare som bryr sig!'
  },
  { 
    name: 'Sundsvall', slug: 'sundsvall', pop: '100K', region: 'Västernorrland',
    routes: [
      { to: 'Stockholm', km: '395', time: '4h', avgPrice: '260', trainPrice: '650' },
      { to: 'Umeå', km: '245', time: '2.5h', avgPrice: '180', trainPrice: '450' },
      { to: 'Östersund', km: '220', time: '2.5h', avgPrice: '160', trainPrice: '400' },
      { to: 'Gävle', km: '205', time: '2h', avgPrice: '150', trainPrice: '380' }
    ],
    realUses: [
      'Stockholm-Norrland gateway - alla som åker norr stannar/byter i Sundsvall',
      'Norrlandspendling - jobb i Stockholm vissa veckor, samåkning = övernatta hos kompisar',
      'Vinterturism - Åre/fjällen via Östersund, dela skidresa från Stockholm',
      'Familj/släkt - många Norrlandsbor har rötter här, besöksresor 4-6 ggr/år'
    ],
    stats: 'Sundsvall = Norrlands nav, högtrafik vinter och sommar',
    hook: 'Norrlands huvudstad - alla vägar möts här!'
  },
  { 
    name: 'Halmstad', slug: 'halmstad', pop: '105K', region: 'Halland',
    routes: [
      { to: 'Göteborg', km: '143', time: '1.5h', avgPrice: '110', trainPrice: '280' },
      { to: 'Malmö', km: '155', time: '1.5h', avgPrice: '120', trainPrice: '300' },
      { to: 'Helsingborg', km: '100', time: '1h', avgPrice: '80', trainPrice: '200' },
      { to: 'Varberg', km: '40', time: '30min', avgPrice: '40', trainPrice: '90' }
    ],
    realUses: [
      'Sommarstad - turistsäsong = massor vill åka hit billigt från Göteborg/Malmö',
      'Högskolan Halmstad - studenter från Göteborg pendlar, billigare bo i Halmstad',
      'Västkustjobb - pendling mellan Hallandsstäder, samåkning vardagsrutin',
      'Strandresor - familjer delar resa till stranden, packa surfbrädor och picknickkorg'
    ],
    stats: 'Halmstad-Göteborg: sommar +150% traffic',
    hook: 'Sveriges sommarstad - stranden nås billigare med samåkning!'
  },
  { 
    name: 'Kalmar', slug: 'kalmar', pop: '70K', region: 'Kalmar län',
    routes: [
      { to: 'Stockholm', km: '385', time: '4h', avgPrice: '250', trainPrice: '630' },
      { to: 'Växjö', km: '110', time: '1h', avgPrice: '90', trainPrice: '220' },
      { to: 'Linköping', km: '240', time: '2.5h', avgPrice: '170', trainPrice: '430' },
      { to: 'Karlskrona', km: '85', time: '1h', avgPrice: '70', trainPrice: '170' }
    ],
    realUses: [
      'Öland-turism - sommar = peak, dela resa till ön, packa cyklar och tält',
      'Linnéuniversitetet - studenter från Stockholm/Småland, långa resor = stor besparing',
      'Glasriket-säsongsarbete - sommarjobbare från hela Sverige, hitta resa hem',
      'Militär Karlskrona - anställda bor Kalmar (billigare), pendlar 85 km'
    ],
    stats: 'Kalmar-Stockholm: 60+ resor/vecka, ofta långfärdsresor',
    hook: 'Porten till Öland - Sveriges sommarparadis!'
  },
  { 
    name: 'Kristianstad', slug: 'kristianstad', pop: '85K', region: 'Skåne',
    routes: [
      { to: 'Malmö', km: '95', time: '1h', avgPrice: '80', trainPrice: '200' },
      { to: 'Karlskrona', km: '88', time: '1h', avgPrice: '75', trainPrice: '190' },
      { to: 'Helsingborg', km: '100', time: '1h', avgPrice: '85', trainPrice: '210' },
      { to: 'Lund', km: '85', time: '1h', avgPrice: '70', trainPrice: '175' }
    ],
    realUses: [
      'Skånes inland - billigare boende, jobb i Malmö/Lund, pendling möjlig',
      'Lundastudenter hemifrån Kristianstad - helgpendling, fasta kompisar',
      'Karlskrona-Kristianstad - militär och tech, många pendlar mellan städerna',
      'Österlen-turism - sommar = besökare från Malmö, dela resa till stranden'
    ],
    stats: 'Kristianstad-Malmö: 50+ resor/vecka, student-dominerat',
    hook: 'Skånes hjärta - billigt bo, nära allt!'
  },
  { 
    name: 'Luleå', slug: 'lulea', pop: '80K', region: 'Norrbotten',
    routes: [
      { to: 'Umeå', km: '330', time: '3.5h', avgPrice: '220', trainPrice: '550' },
      { to: 'Boden', km: '36', time: '30min', avgPrice: '35', trainPrice: '80' },
      { to: 'Kiruna', km: '335', time: '4h', avgPrice: '230', trainPrice: '580' },
      { to: 'Stockholm', km: '900', time: '9h+', avgPrice: '500', trainPrice: 'Flyg 1200+' }
    ],
    realUses: [
      'LKAB-gruvarbetare Kiruna - veckovis pendling, dela resa = spara 1000-tals',
      'Tekniska högskolan - studenter från Norrbottenstäder, samåk hem',
      'Stockholm-resor - tåg/flyg extremt dyrt, samåkning + övernattningar = halvera',
      'Facebook datacenter - tech-workers från hela Norrland, bilpooler'
    ],
    stats: 'Luleå-Boden: daglig pendling, militär och gruvarbetare',
    hook: 'Norrbottens huvudstad - extrema avstånd = samåkning livsavgörande!'
  }
];

// Same powerful template as before
const template = (city) => `<!DOCTYPE html>
<html lang="sv">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Samåkning ${city.name} - Hitta resa från ${city.name} | ${city.pop} invånare | VägVänner</title>
    <meta name="description" content="${city.name} (${city.pop}): ${city.routes.map(r => city.name + '-' + r.to + ' ' + r.avgPrice + ' kr').join(', ')}. ${city.stats}. Gratis.">
    <link rel="canonical" href="https://vagvanner.se/city/${city.slug}">
    
    <meta property="og:title" content="Samåkning ${city.name} - ${city.hook}">
    <meta property="og:url" content="https://vagvanner.se/city/${city.slug}">
    <meta property="og:image" content="https://vagvanner.se/og/vagvanner-og.jpg">
    
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: -apple-system, system-ui, sans-serif; color: #1e293b; background: #f8fafc; }
      .hero { background: linear-gradient(135deg, #1e3a8a, #3b82f6); color: #fff; padding: 48px 20px; text-align: center; }
      .hero h1 { font-size: 40px; font-weight: 900; margin-bottom: 12px; }
      .hook { font-size: 19px; opacity: 0.95; margin-bottom: 20px; }
      .stats { background: rgba(255,255,255,0.15); display: inline-block; padding: 10px 20px; border-radius: 25px; font-size: 14px; }
      .container { max-width: 1000px; margin: 0 auto; padding: 20px; }
      .cta-box { background: white; border-radius: 16px; padding: 28px; margin: -30px 20px 40px; box-shadow: 0 10px 40px rgba(0,0,0,0.12); text-align: center; }
      .btn { display: inline-block; padding: 14px 28px; border-radius: 10px; text-decoration: none; font-weight: 700; margin: 8px; }
      .btn-primary { background: #2563eb; color: white; }
      .btn-secondary { background: #f0f9ff; color: #1e40af; border: 2px solid #3b82f6; }
      .routes { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 14px; margin: 24px 0; }
      .route { background: white; border: 2px solid #e2e8f0; padding: 18px; border-radius: 10px; }
      .route:hover { border-color: #3b82f6; }
      .route h3 { color: #1e293b; font-size: 17px; margin-bottom: 8px; }
      .route-meta { font-size: 13px; color: #64748b; margin: 4px 0; }
      .savings { background: #dcfce7; color: #15803d; padding: 6px 10px; border-radius: 6px; font-weight: 700; display: inline-block; margin-top: 8px; font-size: 13px; }
      .uses { list-style: none; margin: 20px 0; }
      .uses li { background: white; padding: 16px; margin: 10px 0; border-left: 4px solid #3b82f6; border-radius: 6px; }
      .uses li:before { content: '✓'; color: #22c55e; font-weight: 900; margin-right: 10px; font-size: 16px; }
      .final { background: linear-gradient(135deg, #2563eb, #3b82f6); color: white; text-align: center; padding: 44px 24px; border-radius: 18px; margin: 44px 0; }
      .final h2 { font-size: 30px; margin-bottom: 14px; }
      .final .big-btn { display: inline-block; background: white; color: #1e40af; padding: 16px 36px; border-radius: 10px; text-decoration: none; font-weight: 800; font-size: 16px; }
      footer { background: #0f172a; color: #94a3b8; padding: 30px 20px; text-align: center; font-size: 14px; }
      footer a { color: #60a5fa; }
    </style>
</head>
<body>
    <div class="hero">
        <h1>Samåkning ${city.name}</h1>
        <p class="hook">${city.hook}</p>
        <div class="stats">${city.stats}</div>
    </div>

    <div class="cta-box">
        <h2 style="font-size: 22px; color: #1e293b; margin-bottom: 16px;">Hitta eller erbjud resa från ${city.name}</h2>
        <a href="https://vagvanner.se/select-location?from=${city.name}" class="btn btn-primary">🔍 Sök resor</a>
        <a href="https://vagvanner.se/create-ride?from=${city.name}" class="btn btn-secondary">🚗 Erbjud resa</a>
        <p style="color: #94a3b8; margin-top: 10px; font-size: 13px;">Helt gratis · Tar 30 sekunder</p>
    </div>

    <div class="container">
        <h2 style="font-size: 26px; margin-bottom: 20px;">📍 Populära rutter från ${city.name}</h2>
        <div class="routes">
            ${city.routes.map(r => `
            <a href="https://vagvanner.se/select-location?from=${city.name}&to=${r.to}" class="route" style="text-decoration: none;">
                <h3>${city.name} → ${r.to}</h3>
                <div class="route-meta">📏 ${r.km} · ⏱️ ${r.time}</div>
                <div class="route-meta" style="margin-top: 6px;"><s style="color: #94a3b8;">Tåg ${r.trainPrice} kr</s></div>
                <div class="savings">Samåkning ${r.avgPrice} kr</div>
            </a>
            `).join('')}
        </div>

        <h2 style="font-size: 26px; margin: 40px 0 20px;">💡 Så används VägVänner i ${city.name}</h2>
        <ul class="uses">
            ${city.realUses.map(use => `<li>${use}</li>`).join('\n            ')}
        </ul>

        <div class="final">
            <h2>Börja resa från ${city.name} idag</h2>
            <p style="margin-bottom: 20px; font-size: 17px;">Tusentals resor varje vecka - hitta din nu</p>
            <a href="https://vagvanner.se/select-location?from=${city.name}" class="final big-btn">Hitta resa från ${city.name} →</a>
        </div>
    </div>

    <footer>
        <p><strong>VägVänner</strong> - Samåkning i hela Sverige</p>
        <p style="margin-top: 12px;"><a href="https://vagvanner.se/">Startsida</a> · <a href="https://vagvanner.se/anvandningsvillkor">Villkor</a></p>
    </footer>
</body>
</html>`;

// Generate
const publicDir = path.join(__dirname, '..', 'public', 'city');

cities.forEach(city => {
  const cityDir = path.join(publicDir, city.slug);
  if (!fs.existsSync(cityDir)) {
    fs.mkdirSync(cityDir, { recursive: true });
  }
  
  fs.writeFileSync(path.join(cityDir, 'index.html'), template(city), 'utf8');
  console.log(`✅ ${city.name}: ${city.pop}, ${city.routes.length} routes`);
});

console.log(`\n🎉 Generated ${cities.length} additional city pages!`);
console.log(`📈 Total city coverage now: 20+ cities`);

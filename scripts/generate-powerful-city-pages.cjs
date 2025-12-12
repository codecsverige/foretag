#!/usr/bin/env node
/**
 * Generate POWERFUL city pages that convert visitors!
 * Focus: Real benefits, instant value, clear use cases
 */

const fs = require('fs');
const path = require('path');

const cities = [
  { 
    name: 'Malmö', slug: 'malmo', pop: '350K', region: 'Skåne',
    routes: [
      { to: 'Stockholm', km: '610', time: '6h', avgPrice: '300', trainPrice: '800' },
      { to: 'Göteborg', km: '290', time: '3h', avgPrice: '200', trainPrice: '500' },
      { to: 'Köpenhamn', km: '40', time: '40min', avgPrice: '0-80', trainPrice: '120' },
      { to: 'Lund', km: '18', time: '15min', avgPrice: '0-40', trainPrice: '50' }
    ],
    realUses: [
      'Pendla till jobb i Köpenhamn - dela brokostnad (95 kr/dag)',
      'Studenter Lund ↔ Malmö - hitta kurskamrater som åker samma tider',
      'Helgresa Stockholm - splitta bensin istället för SJ 1600 kr tur/retur',
      'Flygplatsresa Sturup/Kastrup - dela taxi, betala 100 kr istället för 400 kr'
    ],
    stats: 'Över 800 aktiva resor varje vecka',
    hook: 'Malmö-Köpenhamn är Sveriges mest lönsamma pendlingsrutt med samåkning!'
  },
  { 
    name: 'Uppsala', slug: 'uppsala', pop: '230K', region: 'Uppsala län',
    routes: [
      { to: 'Stockholm', km: '71', time: '45min', avgPrice: '0-80', trainPrice: '200' },
      { to: 'Arlanda', km: '38', time: '25min', avgPrice: '0-60', trainPrice: '150' },
      { to: 'Gävle', km: '112', time: '1h', avgPrice: '80', trainPrice: '250' },
      { to: 'Västerås', km: '82', time: '50min', avgPrice: '60', trainPrice: '180' }
    ],
    realUses: [
      'Pendla Stockholm dagligen - SJ månadskort 5000 kr, samåkning ~1500 kr',
      '40 000 studenter åker hem varje helg - hitta hem-kompisar på samma linje',
      'Arlanda-personal och resenärer - fast samåkningsgrupp sparar 1000-tals kronor/månad',
      'Jobba i Stockholm, bo i Uppsala - halvera boendekostnaden OCH rescostnaden'
    ],
    stats: 'Över 1200 aktiva annonser mellan Uppsala-Stockholm',
    hook: 'Sveriges mest trafikerade pendlingssträcka - 15 000 resenärer dagligen!'
  },
  { 
    name: 'Linköping', slug: 'linkoping', pop: '165K', region: 'Östergötland',
    routes: [
      { to: 'Stockholm', km: '210', time: '2h', avgPrice: '150', trainPrice: '450' },
      { to: 'Göteborg', km: '270', time: '2.5h', avgPrice: '200', trainPrice: '550' },
      { to: 'Norrköping', km: '45', time: '35min', avgPrice: '0-50', trainPrice: '90' },
      { to: 'Jönköping', km: '143', time: '1.5h', avgPrice: '100', trainPrice: '300' }
    ],
    realUses: [
      'LiU-studenter (30 000+) - åk hem billigt, träffa folk från din hemstad',
      'SAAB/Ericsson-anställda - fasta samåkningsgrupper till/från Stockholm',
      'Familjebesök Stockholm/Göteborg - barn åker gratis, föraren delar bensin',
      'Deltidsjobb Stockholm 2-3 dagar/vecka - bo billigt i Linköping, jobba i huvudstaden'
    ],
    stats: 'LiU-studenter skapar 500+ helgresor varje vecka',
    hook: 'Studentstad = tusentals ungdomar som vill resa billigt!'
  },
  { 
    name: 'Örebro', slug: 'orebro', pop: '155K', region: 'Örebro län',
    routes: [
      { to: 'Stockholm', km: '195', time: '2h', avgPrice: '140', trainPrice: '400' },
      { to: 'Göteborg', km: '280', time: '2.5h', avgPrice: '200', trainPrice: '500' },
      { to: 'Västerås', km: '94', time: '1h', avgPrice: '70', trainPrice: '200' },
      { to: 'Karlstad', km: '126', time: '1.5h', avgPrice: '90', trainPrice: '280' }
    ],
    realUses: [
      'Mitt-i-Sverige = perfekt för långdistansresor åt alla håll',
      'Universitetet (17K studenter) - samåk hem till Göteborg, Stockholm, Norrland',
      'Företagsresor - många Örebroföretag har kontor i Stockholm, spara resebudget',
      'Mellandagsledighet - samla kollegor som åker samma riktning julhelgen'
    ],
    stats: 'Örebro-Stockholm: 300+ resor/vecka, ofta 2-3 platser lediga',
    hook: 'Sveriges geografiska mittpunkt - alla vägar går genom Örebro!'
  },
  { 
    name: 'Västerås', slug: 'vasteras', pop: '155K', region: 'Västmanland',
    routes: [
      { to: 'Stockholm', km: '109', time: '1h', avgPrice: '80', trainPrice: '220' },
      { to: 'Uppsala', km: '79', time: '50min', avgPrice: '60', trainPrice: '180' },
      { to: 'Arlanda', km: '84', time: '50min', avgPrice: '60', trainPrice: '180' },
      { to: 'Örebro', km: '94', time: '1h', avgPrice: '70', trainPrice: '200' }
    ],
    realUses: [
      'ABB/Bombardier-anställda - 1000-tals pendlar, organisera återkommande samåkning',
      'Arlanda-resenärer - flygplatstaxi 600+ kr, samåkning ofta gratis (någon åker förbi)',
      'Stockholm-jobb 3 dagar/v - hybrid work = perfekt för samåkning, spara hotell',
      'Mälarstäderna (Västerås-Uppsala-Enköping) - tätt nätverk, lätt hitta resor'
    ],
    stats: 'Västerås-Stockholm: 400+ pendlare delar resa varje dag',
    hook: 'Industristad med tusentals pendlare - samåkning sparar 3000 kr/månad!'
  },
  { 
    name: 'Helsingborg', slug: 'helsingborg', pop: '150K', region: 'Skåne',
    routes: [
      { to: 'Malmö', km: '64', time: '45min', avgPrice: '60', trainPrice: '150' },
      { to: 'Göteborg', km: '226', time: '2h', avgPrice: '160', trainPrice: '400' },
      { to: 'Lund', km: '52', time: '35min', avgPrice: '50', trainPrice: '130' },
      { to: 'Köpenhamn', km: '92', time: '1.5h', avgPrice: '80', trainPrice: '250' }
    ],
    realUses: [
      'Pendling till Danmark - färja + tåg 200+ kr/dag, samåkning + färja ~120 kr',
      'Universitetet Lund - studenter hemifrån Helsingborg, daglig pendling möjlig',
      'Västkusten-jobbare (Göteborg-Helsingborg-Malmö) - återkommande affärsresor',
      'Sommarsemester - dela resa till sommarstugan i Skåne, packa mer, kör växelvis'
    ],
    stats: 'Helsingborg-Lund: populäraste studentrutten i Skåne',
    hook: 'Danmarks granne - spara på dyra färjor och tågbiljetter!'
  }
];

const powerTemplate = (city) => `<!DOCTYPE html>
<html lang="sv">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Samåkning ${city.name} - Hitta resa eller erbjud skjuts | ${city.pop} invånare | VägVänner</title>
    <meta name="description" content="Samåkning ${city.name}: ${city.routes.map(r => city.name + '-' + r.to + ' från ' + r.avgPrice + ' kr').join(', ')}. ${city.stats}. Gratis att använda.">
    <link rel="canonical" href="https://vagvanner.se/city/${city.slug}">
    
    <meta property="og:title" content="Samåkning ${city.name} - ${city.hook}">
    <meta property="og:description" content="${city.stats}. Hitta resa eller erbjud skjuts. Helt gratis.">
    <meta property="og:url" content="https://vagvanner.se/city/${city.slug}">
    <meta property="og:image" content="https://vagvanner.se/og/vagvanner-og.jpg">
    
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "Place",
      "name": "${city.name}",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "${city.name}",
        "addressRegion": "${city.region}",
        "addressCountry": "SE"
      }
    }
    </script>

    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: -apple-system, system-ui, sans-serif; color: #1e293b; background: #f8fafc; }
      .hero { background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); color: #fff; padding: 48px 20px; }
      .hero-content { max-width: 900px; margin: 0 auto; text-align: center; }
      .hero h1 { font-size: 42px; font-weight: 900; margin-bottom: 16px; line-height: 1.1; }
      .hook { font-size: 20px; opacity: 0.95; margin-bottom: 24px; font-weight: 500; }
      .stats { background: rgba(255,255,255,0.15); display: inline-block; padding: 12px 24px; border-radius: 30px; font-size: 15px; }
      .container { max-width: 1000px; margin: 0 auto; padding: 20px; }
      .cta-bar { background: white; border-radius: 16px; padding: 28px; margin: -30px 20px 40px; box-shadow: 0 10px 40px rgba(0,0,0,0.12); }
      .cta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; max-width: 600px; margin: 0 auto; }
      .btn { display: block; text-align: center; padding: 16px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 15px; transition: all 0.2s; }
      .btn-primary { background: #2563eb; color: white; }
      .btn-primary:hover { background: #1d4ed8; transform: translateY(-2px); box-shadow: 0 8px 20px rgba(37,99,235,0.3); }
      .btn-secondary { background: #f0f9ff; color: #1e40af; border: 2px solid #3b82f6; }
      .btn-secondary:hover { background: #dbeafe; }
      
      .section { margin: 48px 0; }
      .section-title { font-size: 28px; font-weight: 800; color: #0f172a; margin-bottom: 24px; }
      
      .route-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 16px; }
      .route { background: white; border: 2px solid #e2e8f0; border-radius: 12px; padding: 20px; transition: all 0.2s; }
      .route:hover { border-color: #3b82f6; box-shadow: 0 4px 12px rgba(59,130,246,0.15); }
      .route-title { font-size: 18px; font-weight: 700; color: #1e293b; margin-bottom: 10px; }
      .route-meta { font-size: 13px; color: #64748b; margin: 4px 0; }
      .savings { background: #dcfce7; color: #15803d; padding: 8px 12px; border-radius: 8px; font-weight: 700; display: inline-block; margin-top: 8px; font-size: 14px; }
      
      .benefits { background: linear-gradient(to bottom right, #fefce8, #fef3c7); border: 2px solid #eab308; border-radius: 16px; padding: 32px; margin: 32px 0; }
      .benefits h3 { color: #713f12; font-size: 24px; margin-bottom: 20px; text-align: center; }
      .benefit-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-top: 20px; }
      .benefit { background: white; padding: 16px; border-radius: 10px; }
      .benefit-icon { font-size: 32px; margin-bottom: 8px; }
      .benefit-title { font-weight: 700; color: #1e293b; margin-bottom: 6px; font-size: 15px; }
      .benefit-desc { font-size: 13px; color: #64748b; }
      
      .usecase-list { list-style: none; }
      .usecase-list li { background: white; padding: 18px; margin: 12px 0; border-left: 4px solid #3b82f6; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
      .usecase-list li:before { content: '✓'; color: #22c55e; font-weight: 900; margin-right: 12px; font-size: 18px; }
      
      .cta-final { background: linear-gradient(135deg, #2563eb, #3b82f6); color: white; text-align: center; padding: 48px 24px; border-radius: 20px; margin: 48px 0; }
      .cta-final h2 { font-size: 32px; margin-bottom: 16px; }
      .cta-final p { font-size: 18px; opacity: 0.95; margin-bottom: 24px; }
      .big-btn { display: inline-block; background: white; color: #1e40af; padding: 18px 40px; border-radius: 12px; text-decoration: none; font-weight: 800; font-size: 17px; box-shadow: 0 8px 24px rgba(0,0,0,0.15); }
      .big-btn:hover { transform: scale(1.05); }
      
      footer { background: #0f172a; color: #94a3b8; padding: 32px 20px; margin-top: 60px; text-align: center; font-size: 14px; }
      footer a { color: #60a5fa; text-decoration: none; }
      
      @media (max-width: 640px) {
        .hero h1 { font-size: 32px; }
        .hook { font-size: 17px; }
        .cta-grid { grid-template-columns: 1fr; }
      }
    </style>
</head>
<body>
    <div class="hero">
        <div class="hero-content">
            <h1>Samåkning ${city.name}</h1>
            <p class="hook">${city.hook}</p>
            <div class="stats">📊 ${city.stats}</div>
        </div>
    </div>

    <div class="cta-bar">
        <p style="text-align: center; color: #64748b; margin-bottom: 16px; font-size: 15px;">Välj vad som passar dig:</p>
        <div class="cta-grid">
            <a href="https://vagvanner.se/select-location?from=${city.name}" class="btn btn-primary">
                🔍 Hitta resa från ${city.name}
            </a>
            <a href="https://vagvanner.se/create-ride?from=${city.name}" class="btn btn-secondary">
                🚗 Erbjud resa & tjäna pengar
            </a>
        </div>
        <p style="text-align: center; color: #94a3b8; margin-top: 12px; font-size: 13px;">100% gratis • Inget konto behövs för att söka</p>
    </div>

    <div class="container">

        <div class="benefits">
            <h3>🎯 Varför ${city.name}-bor älskar VägVänner</h3>
            <div class="benefit-grid">
                <div class="benefit">
                    <div class="benefit-icon">💰</div>
                    <div class="benefit-title">Spara 50-70%</div>
                    <div class="benefit-desc">Jämfört med SJ, buss eller egen bil</div>
                </div>
                <div class="benefit">
                    <div class="benefit-icon">⚡</div>
                    <div class="benefit-title">Resor varje dag</div>
                    <div class="benefit-desc">Tusentals annonser, hitta resa när DU vill</div>
                </div>
                <div class="benefit">
                    <div class="benefit-icon">🆓</div>
                    <div class="benefit-title">Helt gratis</div>
                    <div class="benefit-desc">Ingen avgift, ingen provision - använd fritt</div>
                </div>
                <div class="benefit">
                    <div class="benefit-icon">👥</div>
                    <div class="benefit-title">Träffa nya vänner</div>
                    <div class="benefit-desc">Chat i appen, bygg återkommande grupper</div>
                </div>
                <div class="benefit">
                    <div class="benefit-icon">📅</div>
                    <div class="benefit-title">Daglig eller engångsresa</div>
                    <div class="benefit-desc">Pendling, helgresor, spontana turer</div>
                </div>
                <div class="benefit">
                    <div class="benefit-icon">🌱</div>
                    <div class="benefit-title">Bra för miljön</div>
                    <div class="benefit-desc">En bil istället för fyra = mindre CO₂</div>
                </div>
            </div>
        </div>

        <div class="section">
            <h2 class="section-title">🗺️ Populära rutter från ${city.name}</h2>
            <div class="route-grid">
                ${city.routes.map(r => `
                <a href="https://vagvanner.se/select-location?from=${city.name}&to=${r.to}" class="route" style="text-decoration: none;">
                    <div class="route-title">${city.name} → ${r.to}</div>
                    <div class="route-meta">📏 ${r.km} · ⏱️ ca ${r.time}</div>
                    <div class="route-meta" style="margin-top: 8px;">
                        <span style="text-decoration: line-through; color: #94a3b8;">Tåg ${r.trainPrice} kr</span>
                    </div>
                    <div class="savings">Samåkning ${r.avgPrice} kr · Spara ${Math.round((parseInt(r.trainPrice) - parseInt(r.avgPrice.split('-')[0] || r.avgPrice)) / parseInt(r.trainPrice) * 100)}%</div>
                </a>
                `).join('')}
            </div>
        </div>

        <div class="section">
            <h2 class="section-title">💡 Så använder ${city.name}-bor VägVänner</h2>
            <ul class="usecase-list">
                ${city.realUses.map(use => `<li>${use}</li>`).join('\n                ')}
            </ul>
        </div>

        <div class="section">
            <h2 class="section-title">🎯 Vem är VägVänner för?</h2>
            <div class="route-grid">
                <div class="benefit" style="padding: 24px;">
                    <div class="benefit-icon">🎓</div>
                    <div class="benefit-title">Studenter</div>
                    <div class="benefit-desc">Åk hem varje helg för under 100 kr. Träffa kurskamrater som åker samma håll.</div>
                </div>
                <div class="benefit" style="padding: 24px;">
                    <div class="benefit-icon">💼</div>
                    <div class="benefit-title">Pendlare</div>
                    <div class="benefit-desc">Spara 2000-5000 kr/månad på resekostnader. Jobba på vägen eller vila.</div>
                </div>
                <div class="benefit" style="padding: 24px;">
                    <div class="benefit-icon">🏢</div>
                    <div class="benefit-title">Företag</div>
                    <div class="benefit-desc">Anställda delar resa = lägre resebudget + miljömål. Skapa företagsgrupper.</div>
                </div>
                <div class="benefit" style="padding: 24px;">
                    <div class="benefit-icon">👴</div>
                    <div class="benefit-title">Alla åldrar</div>
                    <div class="benefit-desc">Pensionärer, familjer, ungdomar - alla samåker. Flexibla tider, egna villkor.</div>
                </div>
                <div class="benefit" style="padding: 24px;">
                    <div class="benefit-icon">🚗</div>
                    <div class="benefit-title">Förare</div>
                    <div class="benefit-desc">Tjäna 100-400 kr per resa genom att erbjuda lediga platser. Kör inte tom!</div>
                </div>
                <div class="benefit" style="padding: 24px;">
                    <div class="benefit-icon">🌍</div>
                    <div class="benefit-title">Miljömedvetna</div>
                    <div class="benefit-desc">Varje samåkning = en bil mindre på vägen. Konkret klimatinsats.</div>
                </div>
            </div>
        </div>

        <div class="section">
            <div style="background: white; border-radius: 16px; padding: 32px; border: 2px solid #e2e8f0;">
                <h2 class="section-title" style="margin-bottom: 16px;">⚡ Så funkar det (3 steg)</h2>
                <div style="display: grid; gap: 20px;">
                    <div style="display: flex; gap: 16px; align-items: start;">
                        <div style="background: #dbeafe; color: #1e40af; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 900; flex-shrink: 0;">1</div>
                        <div>
                            <h4 style="font-size: 18px; margin-bottom: 6px;">Sök eller lägg upp resa</h4>
                            <p style="color: #64748b;">Skriv "${city.name}" som start eller mål. Se alla tillgängliga resor direkt - inget konto behövs för att söka!</p>
                        </div>
                    </div>
                    <div style="display: flex; gap: 16px; align-items: start;">
                        <div style="background: #dbeafe; color: #1e40af; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 900; flex-shrink: 0;">2</div>
                        <div>
                            <h4 style="font-size: 18px; margin-bottom: 6px;">Chatta & kom överens</h4>
                            <p style="color: #64748b;">Kontakta via appen (Google-inloggning). Bestäm tid, pris, och mötesplats tillsammans i chatten.</p>
                        </div>
                    </div>
                    <div style="display: flex; gap: 16px; align-items: start;">
                        <div style="background: #dbeafe; color: #1e40af; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 900; flex-shrink: 0;">3</div>
                        <div>
                            <h4 style="font-size: 18px; margin-bottom: 6px;">Res & dela kostnad</h4>
                            <p style="color: #64748b;">Möts, res tillsammans, betala direkt (Swish etc). Enklare än tåg, billigare än allt annat!</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="cta-final">
            <h2>Börja samåka från ${city.name} idag</h2>
            <p>Gå med i tusentals ${city.name}-bor som redan sparar pengar och träffar nya vänner</p>
            <a href="https://vagvanner.se/select-location?from=${city.name}" class="big-btn">
                Hitta din resa från ${city.name} →
            </a>
            <p style="margin-top: 16px; font-size: 14px; opacity: 0.9;">⚡ Tar 30 sekunder · 🆓 Helt gratis · 📱 Fungerar på alla enheter</p>
        </div>

    </div>

    <footer>
        <p style="font-weight: 600; margin-bottom: 12px;">VägVänner - Samåkning i hela Sverige</p>
        <p style="margin-bottom: 16px;">
            <a href="https://vagvanner.se/">Startsida</a> · 
            <a href="https://vagvanner.se/samakning">Om samåkning</a> · 
            <a href="https://vagvanner.se/guide/student-samakning">Studentguide</a> · 
            <a href="https://vagvanner.se/anvandningsvillkor">Villkor</a>
        </p>
        <p style="font-size: 12px; color: #64748b;">Andra populära städer: ${cities.filter(c => c.slug !== city.slug).slice(0, 5).map(c => 
          `<a href="/city/${c.slug}" style="color: #60a5fa;">${c.name}</a>`
        ).join(' · ')}</p>
    </footer>
</body>
</html>`;

// Generate pages
const publicDir = path.join(__dirname, '..', 'public', 'city');

cities.forEach(city => {
  const cityDir = path.join(publicDir, city.slug);
  
  if (!fs.existsSync(cityDir)) {
    fs.mkdirSync(cityDir, { recursive: true });
  }
  
  const html = powerTemplate(city);
  fs.writeFileSync(path.join(cityDir, 'index.html'), html, 'utf8');
  
  console.log(`✅ ${city.name}: ${city.routes.length} routes, ${city.realUses.length} use cases`);
});

console.log(`\n🎉 Generated ${cities.length} POWERFUL city pages!`);
console.log(`📈 Total reach: ${cities.map(c => parseInt(c.pop.replace('K', '000'))).reduce((a,b) => a+b, 0).toLocaleString('sv-SE')} invånare`);
console.log(`💪 Focus: Real benefits, instant value, clear CTAs`);

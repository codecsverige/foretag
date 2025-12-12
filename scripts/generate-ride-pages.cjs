const fs = require('fs');
const path = require('path');

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
}

const SWEDISH_CHAR_REGEX = /[åäö]/;

function normalizeLower(str = '') {
  return String(str || '').trim().toLowerCase();
}

function removeDiacritics(str = '') {
  return String(str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function collectSlugVariants(inputSlug = '') {
  const base = normalizeLower(inputSlug);
  if (!base) return [];

  const variants = new Set([base]);

  const withoutDiacritics = removeDiacritics(base);
  if (withoutDiacritics && withoutDiacritics !== base) {
    variants.add(withoutDiacritics);
  }

  const simpleSwap = base
    .replace(/å/g, 'a')
    .replace(/ä/g, 'a')
    .replace(/ö/g, 'o');
  if (simpleSwap && simpleSwap !== base) {
    variants.add(simpleSwap);
  }

  const extendedSwap = base
    .replace(/å/g, 'aa')
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe');
  if (extendedSwap && extendedSwap !== base) {
    variants.add(extendedSwap);
  }

  if (SWEDISH_CHAR_REGEX.test(base)) {
    const truncatedBeforeAccent = base.split(SWEDISH_CHAR_REGEX)[0].replace(/-+$/, '');
    if (truncatedBeforeAccent && truncatedBeforeAccent !== base) {
      variants.add(truncatedBeforeAccent);
    }
  }

  const cleaned = new Set();
  for (const variant of variants) {
    if (!variant) continue;
    if (variant === base) {
      cleaned.add(variant);
      continue;
    }
    const sanitized = removeDiacritics(variant)
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    if (sanitized) cleaned.add(sanitized);
  }

  cleaned.add(base);
  return Array.from(cleaned);
}

function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatDate(dateStr) {
  try { return new Date(dateStr).toISOString().split('T')[0]; } catch { return dateStr || ''; }
}

function tryReadServiceAccountFromEnvFiles() {
  try {
    const envPath = path.join(__dirname, '..', 'env.local');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      const match = content.match(/FIREBASE_ADMIN_SA_JSON=(.+)/);
      if (match && match[1]) {
        // Handle potential quoted or unquoted JSON
        const raw = match[1].trim();
        if (raw.startsWith('{') || raw.startsWith('"{')) {
          return raw.startsWith('"') ? JSON.parse(raw) : raw;
        }
      }
    }
  } catch {}
  return null;
}

function renderRideHtml(baseUrl, ride) {
  const id = ride.id;
  const origin = escapeHtml(ride.origin || '');
  const destination = escapeHtml(ride.destination || '');
  const date = escapeHtml(formatDate(ride.date));
  const time = escapeHtml(ride.departureTime || '');
  const flex = Number(ride.timeFlexMinutes || 0);
  const price = 'Gratis eller kostnadsdelning';
  const seats = ride.availableSeats || ride.count || 1;
  const title = `${origin} → ${destination} - ${date} | VägVänner`;
  const description = `${ride.role === 'passagerare' ? 'Söker' : 'Erbjuder'} samåkning ${origin} → ${destination} den ${date}${time ? ' kl ' + time : ''}${flex>0 ? ` (flex ±${flex} min)` : ''}. Gratis skjuts ibland eller enkel kostnadsdelning. Träffa nya vänner och res mer miljövänligt.`;
  
  // Use appropriate URL based on ride role
  const routePath = ride.role === 'passagerare' ? 'passenger' : 'ride';
  const url = `${baseUrl}/${routePath}/${encodeURIComponent(id)}`;

  // Build ISO start and end times
  const startIso = `${formatDate(ride.date)}T${ride.departureTime || '08:00'}:00`;
  const calcEnd = (start, hours = 3) => {
    try {
      const dt = new Date(start);
      dt.setHours(dt.getHours() + hours);
      const yyyy = dt.getFullYear();
      const mm = String(dt.getMonth() + 1).padStart(2, '0');
      const dd = String(dt.getDate()).padStart(2, '0');
      const hh = String(dt.getHours()).padStart(2, '0');
      const mi = String(dt.getMinutes()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}T${hh}:${mi}:00`;
    } catch {
      return start;
    }
  };

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    inLanguage: 'sv-SE',
    name: `${ride.role === 'passagerare' ? 'Söker' : 'Erbjuder'} samåkning från ${origin} till ${destination}`,
    description: `Samåkning från ${origin} till ${destination}`,
    startDate: startIso,
    endDate: calcEnd(startIso, 3),
    location: {
      '@type': 'Place',
      name: origin,
      address: origin
    },
    arrivalLocation: {
      '@type': 'Place', 
      name: destination,
      address: destination
    },
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    organizer: {
      '@type': 'Person',
      name: ride.driverName || ride.passengerName || 'VägVänner användare',
      url
    },
    performer: {
      '@type': 'Organization',
      name: 'VägVänner',
      url: 'https://vagvanner.se'
    },
    image: `${baseUrl}/og/vagvanner-og.jpg`,
    offers: {
      '@type': 'Offer',
      url,
      price: (ride && typeof ride.price !== 'undefined') ? String(ride.price) : '0',
      priceCurrency: 'SEK',
      availability: 'https://schema.org/InStock',
      validFrom: startIso
    },
    url,
  };

  return `<!doctype html>
<html lang="sv">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="description" content="${escapeHtml(description)}" />
  <link rel="canonical" href="${url}" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:url" content="${url}" />
  <meta property="og:type" content="website" />
  <meta property="og:locale" content="sv_SE" />
  <meta property="og:image" content="${baseUrl}/og/vagvanner-og.jpg" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta name="twitter:description" content="${escapeHtml(description)}" />
  <meta name="twitter:image" content="${baseUrl}/og/vagvanner-og.jpg" />
  <title>${escapeHtml(title)}</title>
  <link rel="alternate" href="${url}" hreflang="sv-SE" />
  <link rel="alternate" href="${url}" hreflang="x-default" />
  <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; line-height: 1.6; }
    .ride-header { background: linear-gradient(135deg, #1976d2, #1565c0); color: white; padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 30px; }
    .ride-details { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
    .route-info { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); margin-bottom: 20px; }
    .cta-section { background: #e3f2fd; padding: 20px; border-radius: 8px; text-align: center; }
    .btn { display: inline-block; padding: 12px 24px; background: #1976d2; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; }
  </style>
</head>
<body>
  <div class="ride-header">
    <h1>${ride.role === 'passagerare' ? '🔍 Söker samåkning' : '🚗 Erbjuder samåkning'}</h1>
    <h2 style="margin: 10px 0; font-size: 1.8em;">${escapeHtml(origin)} → ${escapeHtml(destination)}</h2>
    <p style="margin: 5px 0; opacity: 0.9;">${escapeHtml(ride.driverName || ride.passengerName || 'VägVänner användare')}</p>
  </div>

  <div class="route-info">
    <h3>Resedetaljer</h3>
    <p><strong>📅 Datum:</strong> ${date}${time ? ' klockan ' + time : ''}${flex>0 ? ` <span style="background:#e0ecff;color:#1e40af;border-radius:999px;padding:2px 8px;margin-left:6px;font-size:12px;">Flex ±${flex} min</span>` : ''}</p>
    <p><strong>${ride.role === 'passagerare' ? '👥 Antal passagerare' : '🎫 Lediga platser'}:</strong> ${seats}</p>
    <p><strong>💚 Kostnad:</strong> Gratis eller kostnadsdelning</p>
    ${ride.notes ? `<p><strong>📝 Anteckningar:</strong> ${escapeHtml(ride.notes)}</p>` : ''}
  </div>

  <div class="ride-details">
    <h3>${ride.role === 'passagerare' ? 'Om denna passagerarförfrågan' : 'Om denna resa'}</h3>
    <p>${ride.role === 'passagerare' 
      ? `Här söker en passagerare samåkning från ${escapeHtml(origin)} till ${escapeHtml(destination)}. Detta är en förfrågan från någon som behöver transport och är villig att dela kostnader.`
      : `Här erbjuder en förare plats i sin bil från ${escapeHtml(origin)} till ${escapeHtml(destination)}. Föraren delar resan för att minska kostnader och miljöpåverkan.`
    }</p>
    
    <p>VägVänner hjälper resenärer att hitta varandra för gemensamma resor. Genom samåkning kan både förare och passagerare:</p>
    <ul>
      <li>🌱 Minska utsläpp och värna miljön genom att dela resa</li>
      <li>🆓 Hitta ibland gratis skjuts – annars enkel kostnadsdelning</li>
      <li>🤝 Träffa nya människor och hitta trevligt sällskap</li>
      <li>💸 Minska dina resekostnader utan krångel</li>
    </ul>
  </div>

  <div class="cta-section">
    <h3>Öppna i appen</h3>
    <p>För att se kontaktuppgifter och boka via plattformen, öppna sökningen med denna rutt:</p>
    <a href="${baseUrl}/select-location?from=${encodeURIComponent(origin)}&to=${encodeURIComponent(destination)}" class="btn">Sök resor i appen</a>
    <p style="margin-top: 15px; font-size: 0.9em; color: #666;">
      Denna sida är en SEO-förhandsgranskning. För full funktionalitet, öppna appen.
    </p>
  </div>

  <footer style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #666; font-size: 0.9em;">
    <p><a href="${baseUrl}" style="color: #1976d2; text-decoration: none;">← Tillbaka till VägVänner</a></p>
    <p>Sök fler resor på <a href="${baseUrl}" style="color: #1976d2;">VägVänner.se</a> - Sveriges plattform för samåkning</p>
  </footer>

  <noscript>
    <p style="background: #fff3cd; padding: 15px; border-radius: 6px; margin: 20px 0;">
      Detta är en förrenderad sida optimerad för sökmotorer. För full funktionalitet och för att kontakta resenärer, 
      aktivera JavaScript och besök <a href="${baseUrl}">VägVänner.se</a>.
    </p>
  </noscript>
</body>
</html>`;
}

function capitalizeWord(s = '') {
  if (!s) return '';
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// Pretty-print Swedish city names from ASCII slugs
function prettifyCitySlug(slug = '') {
  const raw = String(slug || '').toLowerCase().trim();
  const map = {
    goteborg: 'Göteborg',
    gothenburg: 'Göteborg',
    malmo: 'Malmö',
    vasteras: 'Västerås',
    orebro: 'Örebro',
    ostersund: 'Östersund',
    angelholm: 'Ängelholm',
    jonkoping: 'Jönköping',
    lulea: 'Luleå',
    umea: 'Umeå',
    gavle: 'Gävle',
    vaxjo: 'Växjö',
    norrkoping: 'Norrköping',
    skovde: 'Skövde',
    boras: 'Borås',
    kopenhamn: 'Köpenhamn',
    halmstad: 'Halmstad',
  };
  if (map[raw]) return map[raw];
  // Fallback: title case each word
  return raw.split('-').map(w => capitalizeWord(w)).join(' ');
}

function renderRouteHtml(baseUrl, fromSlug, toSlug, latestRides) {
  const origin = prettifyCitySlug(fromSlug);
  const destination = prettifyCitySlug(toSlug);
  const title = `Samåkning ${origin} → ${destination} | Gratis skjuts & nya vänner | VägVänner`;
  const description = `Hitta eller erbjud samåkning ${origin} → ${destination}. Fokus på gratis skjuts när möjligt, kostnadsdelning i övrigt, träffa nya vänner och res mer miljövänligt – VägVänner.`;
  const utm = `utm_source=seo&utm_medium=route&utm_campaign=${encodeURIComponent(fromSlug)}-${encodeURIComponent(toSlug)}`;
  const searchUrl = `${baseUrl}/select-location?from=${encodeURIComponent(origin)}&to=${encodeURIComponent(destination)}&${utm}`;
  const createUrl = `${baseUrl}/create-ride?from=${encodeURIComponent(origin)}&to=${encodeURIComponent(destination)}&${utm}`;
  const lastUpdated = new Date().toLocaleDateString('sv-SE', { year: 'numeric', month: 'long', day: 'numeric' });

  const faqs = [
    {
      q: `Hur hittar jag gratis skjuts ${origin} → ${destination}?`,
      a: `Håll utkik efter annonser markerade “Gratis” eller med kostnadsdelning. Skapa en bevakning så får du notiser direkt när det dyker upp något.`
    },
    {
      q: `Är samåkning bra för miljön?`,
      a: `Ja, samåkning minskar antalet bilar på vägarna och därmed utsläpp. Du delar resa, kostnader och gör resandet mer hållbart.`
    },
    {
      q: `Hur går det till?`,
      a: `Sök en resa eller lägg upp din annons. Kontakta via appen och kom överens om detaljer. Plattformen förmedlar kontakt – inte betalningar.`
    }
  ];

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a }
    }))
  };

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `Samåkning ${origin} till ${destination}`,
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Sök resor', url: searchUrl },
      { '@type': 'ListItem', position: 2, name: 'Erbjud resa', url: createUrl }
    ]
  };

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': [
      { '@type': 'ListItem', position: 1, name: 'VägVänner', item: baseUrl },
      { '@type': 'ListItem', position: 2, name: 'Samåkning', item: `${baseUrl}/ride` },
      { '@type': 'ListItem', position: 3, name: `${origin} → ${destination}`, item: `${baseUrl}/ride/${fromSlug}-${toSlug}` }
    ]
  };

  const latestHtml = Array.isArray(latestRides) && latestRides.length ? (
    `<div class="card">
          <div style="font-weight:700;color:#111827;margin-bottom:6px;">Senaste resor</div>
          <ul style="margin:0;padding-left:18px;color:#374151;line-height:1.9">
            ${latestRides.slice(0,3).map(r => {
              const id = escapeHtml(String(r.id || ''));
              const d = escapeHtml(formatDate(r.date));
              const t = escapeHtml(r.departureTime || '');
              const label = (r && (r.costMode === 'free' || r.price === 0)) ? 'Gratis' : 'Kostnadsdelning';
              return `<li><a href="${baseUrl}/ride/${id}">${d}${t? ' kl '+t: ''} • ${label}</a></li>`;
            }).join('')}
          </ul>
        </div>`
  ) : '';

  return `<!doctype html>
<html lang="sv">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}" />
  <link rel="canonical" href="${baseUrl}/ride/${fromSlug}-${toSlug}" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:url" content="${baseUrl}/ride/${fromSlug}-${toSlug}" />
  <meta property="og:type" content="website" />
  <meta property="og:locale" content="sv_SE" />
  <meta property="og:image" content="${baseUrl}/og/vagvanner-og.jpg" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta name="twitter:description" content="${escapeHtml(description)}" />
  <meta name="twitter:image" content="${baseUrl}/og/vagvanner-og.jpg" />
  <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
  <script type="application/ld+json">${JSON.stringify(breadcrumbLd)}</script>
  <script type="application/ld+json">${JSON.stringify(faqJsonLd)}</script>
  <style>
    body { font-family: system-ui, sans-serif; color:#0f172a; }
    .wrap { max-width: 980px; margin: 0 auto; padding: 20px; }
    header { background: linear-gradient(90deg,#eff6ff,#eef2ff); border-bottom: 1px solid #e5e7eb; }
    .brand { text-decoration:none; color:#1e293b; font-weight:800; font-size:18px; }
    .cta { display:inline-block; padding: 10px 14px; border-radius: 10px; font-weight: 700; text-decoration: none; }
    .cta-primary { background:#2563eb; color:#fff; }
    .cta-outline { border:1px solid #2563eb; color:#2563eb; }
    .card { background:#fff; border:1px solid #e5e7eb; border-radius:12px; padding:16px; }
    .grid { display:grid; grid-template-columns: repeat(auto-fit,minmax(220px,1fr)); gap:16px; }
    .muted { color:#64748b; }
  </style>
</head>
<body>
  <header>
    <div class="wrap" style="display:flex;justify-content:space-between;align-items:center;padding:24px 16px;">
      <a href="${baseUrl}/" class="brand">🚗 VägVänner</a>
      <nav style="font-size:14px;">
        <a href="${baseUrl}/select-location" style="margin-right:16px;color:#1d4ed8;text-decoration:none;">Sök resor</a>
        <a href="${baseUrl}/create-ride" style="color:#1d4ed8;text-decoration:none;">Erbjud resa</a>
      </nav>
    </div>
  </header>
  <main>
    <section style="background:linear-gradient(180deg,#ffffff,#f8fafc);padding:36px 16px;border-bottom:1px solid #e5e7eb;">
      <div class="wrap">
        <h1 style="font-size:28px;font-weight:800;color:#111827;margin:0 0 8px">Samåkning ${escapeHtml(origin)} → ${escapeHtml(destination)}</h1>
        <p style="margin:0 0 16px;color:#374151;">Billigare än tåg/flyg. Gratis att annonsera. Trygg kontakt via appen.</p>
        <p class="muted" style="margin:0 0 10px;">Senast uppdaterad: ${escapeHtml(lastUpdated)}</p>
        <div>
          <a href="${searchUrl}" class="cta cta-primary" style="margin-right:8px;">Sök resor</a>
          <a href="${createUrl}" class="cta cta-outline">Erbjud resa</a>
        </div>
      </div>
    </section>
    <section class="wrap" style="padding:24px 16px;">
      <div class="grid">
        <div class="card">
          <div style="font-weight:700;color:#111827;margin-bottom:6px;">Varför VägVänner?</div>
          <ul style="margin:0;padding-left:18px;color:#374151;line-height:1.7">
            <li>🆓 Ibland gratis skjuts – annars enkel kostnadsdelning</li>
            <li>🤝 Träffa trevliga reskamrater och nya vänner</li>
            <li>🌱 Minska miljöpåverkan genom att dela resa</li>
            <li>🔒 Trygg chatt – dela kontakt först när du vill</li>
          </ul>
        </div>
        <div class="card">
          <div style="font-weight:700;color:#111827;margin-bottom:6px;">Kom igång direkt</div>
          <p style="color:#374151;">Sök efter resor mellan ${escapeHtml(origin)} och ${escapeHtml(destination)}, eller lägg upp din egen resa (gratis att annonsera) och få förfrågningar.</p>
          <div>
            <a href="${searchUrl}" class="cta cta-primary" style="margin-right:8px;">Hitta resa</a>
            <a href="${createUrl}" class="cta cta-outline">Lägg upp resa</a>
          </div>
        </div>
        ${latestHtml}
        <div class="card">
          <div style="font-weight:700;color:#111827;margin-bottom:6px;">Vanliga frågor</div>
          <div style="color:#374151;line-height:1.7">
            ${faqs.map(f => `<p><strong>${escapeHtml(f.q)}</strong><br/>${escapeHtml(f.a)}</p>`).join('')}
          </div>
        </div>
      </div>
    </section>
  </main>
  <noscript>
    <p style="max-width:800px;margin:20px auto;padding:12px;background:#fff3cd;border:1px solid #ffe08a;border-radius:8px;">Detta är en förhandsvisning för sökmotorer. För att boka eller annonsera, besök <a href="${baseUrl}">VägVänner.se</a>.</p>
  </noscript>
</body>
</html>`;
}

function renderCityHtml(baseUrl, citySlug, cityName, routePairs) {
  const prettyCity = prettifyCitySlug(citySlug);
  const title = `Samåkning från och till ${prettyCity} | VägVänner`;
  const description = `Hitta eller erbjud samåkning till/från ${prettyCity}. Fokus på gratis skjuts när möjligt, kostnadsdelning i övrigt, nya vänner och miljönytta.`;
  const lastUpdated = new Date().toLocaleDateString('sv-SE', { year: 'numeric', month: 'long', day: 'numeric' });

  const utm = (slug) => `utm_source=seo&utm_medium=city&utm_campaign=${encodeURIComponent(citySlug)}-${encodeURIComponent(slug)}`;

  const itemList = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `Samåkning från och till ${prettyCity}`,
    itemListElement: routePairs.map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: `${prettifyCitySlug(p.fromSlug)} → ${prettifyCitySlug(p.toSlug)}`,
      url: `${baseUrl}/ride/${p.fromSlug}-${p.toSlug}`
    }))
  };

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'VägVänner', item: baseUrl },
      { '@type': 'ListItem', position: 2, name: 'Samåkning', item: `${baseUrl}/ride` },
      { '@type': 'ListItem', position: 3, name: prettyCity, item: `${baseUrl}/ride/city/${citySlug}` }
    ]
  };

  const searchUrl = `${baseUrl}/select-location?from=${encodeURIComponent(prettyCity)}&${utm('search')}`;
  const createUrl = `${baseUrl}/create-ride?from=${encodeURIComponent(prettyCity)}&${utm('create')}`;

  const nearbyHtml = routePairs.slice(0, 12).map(p => (
    `<li><a href=\"${baseUrl}/ride/${p.fromSlug}-${p.toSlug}\">${prettifyCitySlug(p.fromSlug)} → ${prettifyCitySlug(p.toSlug)}</a></li>`
  )).join('');

  return `<!doctype html>
<html lang="sv">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}" />
  <link rel="canonical" href="${baseUrl}/ride/city/${citySlug}" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:url" content="${baseUrl}/ride/city/${citySlug}" />
  <meta property="og:type" content="website" />
  <meta property="og:locale" content="sv_SE" />
  <meta property="og:image" content="${baseUrl}/og/vagvanner-og.jpg" />
  <script type="application/ld+json">${JSON.stringify(itemList)}</script>
  <script type="application/ld+json">${JSON.stringify(breadcrumbLd)}</script>
  <style>
    body { font-family: system-ui, sans-serif; color:#0f172a; }
    .wrap { max-width: 980px; margin: 0 auto; padding: 20px; }
    header { background: linear-gradient(90deg,#eff6ff,#eef2ff); border-bottom: 1px solid #e5e7eb; }
    .brand { text-decoration:none; color:#1e293b; font-weight:800; font-size:18px; }
    .cta { display:inline-block; padding: 10px 14px; border-radius: 10px; font-weight: 700; text-decoration: none; }
    .cta-primary { background:#2563eb; color:#fff; }
    .cta-outline { border:1px solid #2563eb; color:#2563eb; }
    .card { background:#fff; border:1px solid #e5e7eb; border-radius:12px; padding:16px; }
  </style>
</head>
<body>
  <header>
    <div class="wrap" style="display:flex;justify-content:space-between;align-items:center;padding:24px 16px;">
      <a href="${baseUrl}/" class="brand">🚗 VägVänner</a>
      <nav style="font-size:14px;">
        <a href="${baseUrl}/select-location" style="margin-right:16px;color:#1d4ed8;text-decoration:none;">Sök resor</a>
        <a href="${baseUrl}/create-ride" style="color:#1d4ed8;text-decoration:none;">Erbjud resa</a>
      </nav>
    </div>
  </header>
  <main>
    <section style="background:linear-gradient(180deg,#ffffff,#f8fafc);padding:36px 16px;border-bottom:1px solid #e5e7eb;">
      <div class="wrap">
        <h1 style=\"font-size:28px;font-weight:800;color:#111827;margin:0 0 8px\">Samåkning – ${escapeHtml(prettyCity)}</h1>
        <p style="margin:0 0 16px;color:#374151;">Gratis skjuts när möjligt, annars enkel kostnadsdelning. Gratis att annonsera. Trygg kontakt via appen.</p>
        <p class="muted" style="margin:0 0 10px;">Senast uppdaterad: ${escapeHtml(lastUpdated)}</p>
        <div>
          <a href=\"${searchUrl}\" class=\"cta cta-primary\" style=\"margin-right:8px;\">Sök resor från ${escapeHtml(prettyCity)}</a>
          <a href=\"${createUrl}\" class=\"cta cta-outline\">Erbjud resa från ${escapeHtml(prettyCity)}</a>
        </div>
      </div>
    </section>
    <section class="wrap" style="padding:24px 16px;">
      <div class="card">
        <div style="font-weight:700;color:#111827;margin-bottom:6px;">Populära rutter</div>
        <ul style="margin:0;padding-left:18px;color:#374151;line-height:1.9">${nearbyHtml}</ul>
      </div>
    </section>
  </main>
</body>
</html>`;
}

function renderLongRouteHtml(baseUrl, fromSlug, toSlug) {
  const origin = capitalizeWord(fromSlug.replace(/-/g, ' '));
  const destination = capitalizeWord(toSlug.replace(/-/g, ' '));
  const title = `Långdistans samåkning ${origin} → ${destination} | VägVänner`;
  const description = `Planera långdistans samåkning mellan ${origin} och ${destination}. Res mer miljövänligt, hitta reskamrater, och dela kostnader enkelt (ibland gratis skjuts).`;
  const lastUpdated = new Date().toLocaleDateString('sv-SE', { year: 'numeric', month: 'long', day: 'numeric' });
  const utm = `utm_source=seo&utm_medium=long&utm_campaign=${encodeURIComponent(fromSlug)}-${encodeURIComponent(toSlug)}`;
  const searchUrl = `${baseUrl}/select-location?from=${encodeURIComponent(origin)}&to=${encodeURIComponent(destination)}&${utm}`;
  const createUrl = `${baseUrl}/create-ride?from=${encodeURIComponent(origin)}&to=${encodeURIComponent(destination)}&${utm}`;

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'VägVänner', item: baseUrl },
      { '@type': 'ListItem', position: 2, name: 'Långdistans', item: `${baseUrl}/ride/long` },
      { '@type': 'ListItem', position: 3, name: `${origin} → ${destination}`, item: `${baseUrl}/ride/long/${fromSlug}-${toSlug}` }
    ]
  };

  return `<!doctype html>
<html lang="sv">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}" />
  <link rel="canonical" href="${baseUrl}/ride/long/${fromSlug}-${toSlug}" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:url" content="${baseUrl}/ride/long/${fromSlug}-${toSlug}" />
  <meta property="og:type" content="website" />
  <meta property="og:locale" content="sv_SE" />
  <meta property="og:image" content="${baseUrl}/og/vagvanner-og.jpg" />
  <script type="application/ld+json">${JSON.stringify(breadcrumbLd)}</script>
  <style>
    body { font-family: system-ui, sans-serif; color:#0f172a; }
    .wrap { max-width: 980px; margin: 0 auto; padding: 20px; }
    header { background: linear-gradient(90deg,#eff6ff,#eef2ff); border-bottom: 1px solid #e5e7eb; }
    .brand { text-decoration:none; color:#1e293b; font-weight:800; font-size:18px; }
    .cta { display:inline-block; padding: 10px 14px; border-radius: 10px; font-weight: 700; text-decoration: none; }
    .cta-primary { background:#2563eb; color:#fff; }
    .cta-outline { border:1px solid #2563eb; color:#2563eb; }
    .card { background:#fff; border:1px solid #e5e7eb; border-radius:12px; padding:16px; }
  </style>
</head>
<body>
  <header>
    <div class="wrap" style="display:flex;justify-content:space-between;align-items:center;padding:24px 16px;">
      <a href="${baseUrl}/" class="brand">🚗 VägVänner</a>
      <nav style="font-size:14px;">
        <a href="${baseUrl}/select-location" style="margin-right:16px;color:#1d4ed8;text-decoration:none;">Sök resor</a>
        <a href="${baseUrl}/create-ride" style="color:#1d4ed8;text-decoration:none;">Erbjud resa</a>
      </nav>
    </div>
  </header>
  <main>
    <section style="background:linear-gradient(180deg,#ffffff,#f8fafc);padding:36px 16px;border-bottom:1px solid #e5e7eb;">
      <div class="wrap">
        <h1 style="font-size:28px;font-weight:800;color:#111827;margin:0 0 8px">Långdistans ${escapeHtml(origin)} → ${escapeHtml(destination)}</h1>
        <p style="margin:0 0 16px;color:#374151;">Planera längre resor smart – samåkning minskar kostnad och gör resan trevligare.</p>
        <p class="muted" style="margin:0 0 10px;">Senast uppdaterad: ${escapeHtml(lastUpdated)}</p>
        <div>
          <a href="${searchUrl}" class="cta cta-primary" style="margin-right:8px;">Sök långdistans</a>
          <a href="${createUrl}" class="cta cta-outline">Erbjud långdistans</a>
        </div>
      </div>
    </section>
  </main>
</body>
</html>`;
}

async function fetchRides(limitCount = 500) {
  try {
    const admin = require('firebase-admin');
    if (!admin.apps || admin.apps.length === 0) {
      let json = process.env.FIREBASE_ADMIN_SA_JSON;
      if (!json) {
        const fromFile = tryReadServiceAccountFromEnvFiles();
        if (fromFile) json = fromFile;
      }
      if (!json) {
        console.log('⚠️  FIREBASE_ADMIN_SA_JSON inte satt — använder demo rides för SEO.');
        return getDemoRides();
      }
      admin.initializeApp({ credential: admin.credential.cert(JSON.parse(json)) });
    }
    const db = admin.firestore();
    const snapshot = await db.collection('rides')
      .where('expired', '!=', true)
      .orderBy('createdAt', 'desc')
      .limit(limitCount)
      .get();
    const rides = [];
    snapshot.forEach(d => rides.push({ id: d.id, ...d.data() }));
    console.log(`✅ Hämtade ${rides.length} rides från Firebase`);
    return rides;
  } catch (err) {
    console.log('⚠️  Kunde inte hämta rides från Firebase:', err.message);
    console.log('💡 Använder demo rides för SEO istället.');
    return getDemoRides();
  }
}

function getDemoRides() {
  return [
    {
      id: 'demo-stockholm-goteborg',
      origin: 'Stockholm, Sverige',
      destination: 'Göteborg, Sverige', 
      date: '2025-08-15',
      departureTime: '08:00',
      price: 350,
      availableSeats: 3,
      role: 'förare',
      driverName: 'Anna Andersson',
      notes: 'Bekväm bil, mellanlandning i Jönköping möjlig.'
    },
    {
      id: 'demo-malmo-stockholm',
      origin: 'Malmö, Sverige',
      destination: 'Stockholm, Sverige',
      date: '2025-08-16', 
      departureTime: '06:30',
      price: 450,
      availableSeats: 2,
      role: 'förare',
      driverName: 'Erik Eriksson',
      notes: 'Direktresa utan stopp. WiFi i bilen.'
    },
    {
      id: 'demo-uppsala-stockholm',
      origin: 'Uppsala, Sverige',
      destination: 'Stockholm, Sverige',
      date: '2025-08-17',
      departureTime: '07:15',
      price: 80,
      availableSeats: 1,
      role: 'förare',
      driverName: 'Maria Larsson', 
      notes: 'Daglig pendling, flera avgångar.'
    },
    {
      id: 'demo-lund-goteborg',
      origin: 'Lund, Sverige',
      destination: 'Göteborg, Sverige',
      date: '2025-08-18',
      departureTime: '09:00',
      price: 250,
      availableSeats: 2,
      role: 'förare',
      driverName: 'Lars Pettersson',
      notes: 'Miljövänlig hybridbil.'
    },
    {
      id: 'demo-passenger-request',
      origin: 'Västerås, Sverige', 
      destination: 'Stockholm, Sverige',
      date: '2025-08-19',
      departureTime: '17:30',
      count: 1,
      role: 'passagerare',
      passengerName: 'Sara Johansson',
      notes: 'Söker bekväm resa hem från jobbet.'
    }
  ];
}

async function writeRidePages() {
  const baseUrl = 'https://vagvanner.se';
  const rides = await fetchRides(parseInt(process.env.RIDE_PAGES_LIMIT || '500', 10));
  if (!rides.length) return;

  const publicDir = path.join(__dirname, '..', 'public');
  const buildDir = path.join(__dirname, '..', 'build');

  for (const ride of rides) {
    const html = renderRideHtml(baseUrl, ride);

    // public/ride/:id/index.html
    const pubRideDir = path.join(publicDir, 'ride', String(ride.id));
    ensureDir(pubRideDir);
    fs.writeFileSync(path.join(pubRideDir, 'index.html'), html);

    // build/ride/:id/index.html (om build finns)
    if (fs.existsSync(buildDir)) {
      const buildRideDir = path.join(buildDir, 'ride', String(ride.id));
      ensureDir(buildRideDir);
      fs.writeFileSync(path.join(buildRideDir, 'index.html'), html);
    }

    // For passenger rides, also create /passenger/:id routes
    if (ride.role === 'passagerare') {
      // public/passenger/:id/index.html
      const pubPassengerDir = path.join(publicDir, 'passenger', String(ride.id));
      ensureDir(pubPassengerDir);
      fs.writeFileSync(path.join(pubPassengerDir, 'index.html'), html);

      // build/passenger/:id/index.html (om build finns)
      if (fs.existsSync(buildDir)) {
        const buildPassengerDir = path.join(buildDir, 'passenger', String(ride.id));
        ensureDir(buildPassengerDir);
        fs.writeFileSync(path.join(buildPassengerDir, 'index.html'), html);
      }
    }
  }

  console.log('✅ Genererade statiska ride-sidor.');
}

function readRouteSlugs(publicDir) {
  const rideDir = path.join(publicDir, 'ride');
  if (!fs.existsSync(rideDir)) return [];
  const entries = fs.readdirSync(rideDir, { withFileTypes: true });
  return entries
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .filter((name) => name !== 'index.html');
}

function splitRoute(slug) {
  const parts = slug.split('-');
  if (parts.length >= 2) {
    const mid = Math.floor(parts.length / 2);
    const from = parts.slice(0, mid).join('-');
    const to = parts.slice(mid).join('-');
    return { from, to };
  }
  return { from: parts[0] || 'stad', to: parts[1] || 'stad' };
}

async function writeRoutePages() {
  const baseUrl = 'https://vagvanner.se';
  const publicDir = path.join(__dirname, '..', 'public');
  // Load routes list from routes.json
  const cfgPath = path.join(__dirname, 'routes.json');
  let routes = [];
  try {
    const raw = fs.readFileSync(cfgPath, 'utf8');
    routes = JSON.parse(raw).routes || [];
  } catch (e) {
    console.warn('⚠️  routes.json saknas eller ogiltig, fallback till existerande slugs');
    const slugs = readRouteSlugs(publicDir);
    routes = slugs.map((slug) => {
      const { from, to } = splitRoute(slug);
      return { from, to };
    });
  }

  routes.sort((a,b) => (a.priority||9) - (b.priority||9));

  // Fetch rides once to build latest per route (fallback to demo if needed)
  let allRides = [];
  try { allRides = await fetchRides(300); } catch {}

  routes.forEach((r) => {
    const fromSlug = String(r.from || '').toLowerCase().replace(/\s+/g,'-');
    const toSlug   = String(r.to   || '').toLowerCase().replace(/\s+/g,'-');
    const norm = (s) => String(s || '').toLowerCase();
    const latest = (allRides || []).filter(x => {
      const o = norm((x.origin || '').split(',')[0]);
      const d = norm((x.destination || '').split(',')[0]);
      return o.includes(norm(r.from)) && d.includes(norm(r.to));
    }).slice(0,3);
    const html = renderRouteHtml(baseUrl, fromSlug, toSlug, latest);
    const canonicalSlug = `${fromSlug}-${toSlug}`;
    const variants = collectSlugVariants(canonicalSlug);
    variants.forEach((variant) => {
      const outDir = path.join(publicDir, 'ride', variant);
      ensureDir(outDir);
      fs.writeFileSync(path.join(outDir, 'index.html'), html);
    });
  });
  console.log(`✅ Uppdaterade ${routes.length} statiska rutt‑sidor under public/ride/`);
}

async function writeCityPages() {
  const baseUrl = 'https://vagvanner.se';
  const publicDir = path.join(__dirname, '..', 'public');
  const cfgPath = path.join(__dirname, 'routes.json');
  let routes = [];
  try {
    const raw = fs.readFileSync(cfgPath, 'utf8');
    routes = JSON.parse(raw).routes || [];
  } catch {
    console.warn('⚠️  routes.json saknas — hoppar över city‑sidor');
    return;
  }

  const norm = (s) => String(s || '').trim();
  const slugify = (s) => norm(s).toLowerCase().replace(/\s+/g, '-');

  // Collect unique cities
  const cities = new Set();
  routes.forEach(r => { cities.add(norm(r.from)); cities.add(norm(r.to)); });

  let count = 0;
  for (const city of Array.from(cities).filter(Boolean)) {
    const citySlug = slugify(city);
    // Prepare route pairs from this city (both directions)
    const pairs = [];
    routes.forEach(r => {
      if (norm(r.from) === city) {
        pairs.push({ from: r.from, to: r.to, fromSlug: slugify(r.from), toSlug: slugify(r.to) });
      }
      if (norm(r.to) === city) {
        pairs.push({ from: r.to, to: r.from, fromSlug: slugify(r.to), toSlug: slugify(r.from) });
      }
    });
    // Deduplicate by slug
    const seen = new Set();
    const uniqPairs = [];
    for (const p of pairs) {
      const key = `${p.fromSlug}-${p.toSlug}`;
      if (seen.has(key)) continue; seen.add(key); uniqPairs.push(p);
    }

    if (!uniqPairs.length) continue;

    const html = renderCityHtml(baseUrl, citySlug, city, uniqPairs);
    const variants = collectSlugVariants(citySlug);
    variants.forEach((variant) => {
      const outDir = path.join(publicDir, 'ride', 'city', variant);
      ensureDir(outDir);
      fs.writeFileSync(path.join(outDir, 'index.html'), html);
    });
    count++;
  }
  console.log(`✅ Genererade ${count} city‑sidor under public/ride/city/`);
}

async function writeLongPages() {
  const baseUrl = 'https://vagvanner.se';
  const publicDir = path.join(__dirname, '..', 'public');
  const cfgPath = path.join(__dirname, 'routes.json');
  let routes = [];
  try {
    const raw = fs.readFileSync(cfgPath, 'utf8');
    routes = JSON.parse(raw).routes || [];
  } catch { return; }

  const longRoutes = routes.filter(r => (r.category || '').toLowerCase() === 'long');
  let count = 0;
  for (const r of longRoutes) {
    const fromSlug = String(r.from || '').toLowerCase().replace(/\s+/g,'-');
    const toSlug   = String(r.to   || '').toLowerCase().replace(/\s+/g,'-');
    const html = renderLongRouteHtml(baseUrl, fromSlug, toSlug);
    const canonicalSlug = `${fromSlug}-${toSlug}`;
    const variants = collectSlugVariants(canonicalSlug);
    variants.forEach((variant) => {
      const outDir = path.join(publicDir, 'ride', 'long', variant);
      ensureDir(outDir);
      fs.writeFileSync(path.join(outDir, 'index.html'), html);
    });
    count++;
  }
  console.log(`✅ Genererade ${count} långdistans‑sidor under public/ride/long/`);
}

async function main() {
  try {
    console.log('🚀 Genererar statiska sidor för routes...');
    await writeRoutePages();
    console.log('🚀 Genererar statiska sidor för cities...');
    await writeCityPages();
    console.log('🚀 Genererar statiska sidor för långdistans...');
    await writeLongPages();
    console.log('🚀 Genererar statiska sidor för rides...');
    await writeRidePages();
    console.log('✅ Klart.');
  } catch (e) {
    console.error('❌ Fel vid generering:', e);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

/**
 * Service Worker för VägVänner
 * Hanterar offline-funktionalitet och cachning
 */

const CACHE_NAME = 'vagvanner-v1.1.0';
const STATIC_CACHE = 'vagvanner-static-v1.1.0';
const DYNAMIC_CACHE = 'vagvanner-dynamic-v1.1.0';
const IMAGE_CACHE = 'vagvanner-images-v1.1.0';

// Statiska filer som ska cachas vid installation
const STATIC_FILES = [
  '/',
  '/offline',
  '/favicon.png',
  '/manifest.json',
  '/index.html'
];

// Cache-strategier för olika typer av resurser
const CACHE_STRATEGIES = {
  STATIC: 'cache-first',
  DYNAMIC: 'network-first',
  IMAGES: 'stale-while-revalidate'
};

// Installation av Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Installerar Service Worker...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Cachar statiska filer');
        // Försök cacha alla filer, men fortsätt även om några misslyckas
        return Promise.allSettled(
          STATIC_FILES.map(file => 
            cache.add(file).catch(err => 
              console.warn(`[SW] Kunde inte cacha ${file}:`, err)
            )
          )
        );
      })
      .then(() => {
        console.log('[SW] Installation klar');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Installation misslyckades:', error);
      })
  );
});

// Aktivering av Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Aktiverar Service Worker...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        // Ta bort gamla cacher
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (![STATIC_CACHE, DYNAMIC_CACHE, IMAGE_CACHE].includes(cacheName)) {
              console.log('[SW] Tar bort gammal cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW] Aktivering klar');
        return self.clients.claim();
      })
  );
});

// Hantera fetch-händelser
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Hoppa över POST-requests och externa resurser
  if (request.method === 'POST' || 
      url.hostname.includes('firebase') || 
      url.hostname.includes('paypal') ||
      url.hostname.includes('google')) {
    return;
  }

  // Hantera navigering (HTML-sidor)
  if (request.mode === 'navigate') {
    event.respondWith(handleNavigation(request));
    return;
  }

  // Hantera statiska filer
  if (isStaticFile(request)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // Hantera bilder
  if (isImage(request)) {
    event.respondWith(staleWhileRevalidate(request, IMAGE_CACHE));
    return;
  }

  // Hantera API-anrop och andra dynamiska resurser
  event.respondWith(networkFirst(request, DYNAMIC_CACHE));
});

// Hantera navigering med offline-stöd
async function handleNavigation(request) {
  try {
    // Försök hämta från nätverket först
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      // Cacha svaret för framtida användning
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
    throw new Error('Network response was not ok');
  } catch (error) {
    // Om offline, försök hämta från cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Om ingen cachad version finns, visa offline-sidan
    const offlinePage = await caches.match('/offline');
    if (offlinePage) {
      return offlinePage;
    }
    
    // Fallback till en enkel offline-sida
    return new Response(
      `<!DOCTYPE html>
      <html lang="sv">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Offline - VägVänner</title>
        <style>
          body {
            font-family: system-ui, -apple-system, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-align: center;
            padding: 20px;
          }
          .container {
            max-width: 400px;
          }
          h1 { margin-bottom: 10px; }
          p { opacity: 0.9; line-height: 1.5; }
          button {
            margin-top: 20px;
            padding: 12px 24px;
            background: white;
            color: #667eea;
            border: none;
            border-radius: 6px;
            font-size: 16px;
            cursor: pointer;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Du är offline</h1>
          <p>Det verkar som att du inte har någon internetanslutning just nu. 
             Kontrollera din anslutning och försök igen.</p>
          <button onclick="location.reload()">Försök igen</button>
        </div>
      </body>
      </html>`,
      { 
        status: 503,
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      }
    );
  }
}

// Cache First strategi
async function cacheFirst(request, cacheName) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error('[SW] Cache First misslyckades:', error);
    // Returnera en tom respons istället för fel
    return new Response('', { status: 503 });
  }
}

// Network First strategi
async function networkFirst(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    // Returnera en tom respons för API-anrop
    return new Response('{}', { 
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Stale While Revalidate strategi
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);

  const networkResponsePromise = fetch(request).then((response) => {
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  }).catch(() => null);

  return cachedResponse || networkResponsePromise || new Response('', { status: 503 });
}

// Kontrollera om det är en statisk fil
function isStaticFile(request) {
  const url = new URL(request.url);
  const path = url.pathname;
  return path.includes('/static/') || 
         path.endsWith('.css') || 
         path.endsWith('.js') ||
         path.endsWith('.json') ||
         path === '/manifest.json';
}

// Kontrollera om det är en bild
function isImage(request) {
  const url = new URL(request.url);
  const path = url.pathname;
  return path.endsWith('.jpg') || 
         path.endsWith('.jpeg') || 
         path.endsWith('.png') || 
         path.endsWith('.gif') ||
         path.endsWith('.svg') ||
         path.endsWith('.webp') ||
         path.endsWith('.ico');
}

// Hantera push-notifikationer
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'Ny notifikation från VägVänner',
    icon: '/favicon.png',
    badge: '/favicon.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    }
  };

  event.waitUntil(
    self.registration.showNotification('VägVänner', options)
  );
});

// Hantera klick på notifikationer
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    clients.openWindow('/')
  );
});

// Bakgrundssynkronisering
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-messages') {
    event.waitUntil(syncMessages());
  }
});

async function syncMessages() {
  // Här kan du lägga till logik för att synka meddelanden när anslutningen återställs
  console.log('[SW] Synkar meddelanden...');
}
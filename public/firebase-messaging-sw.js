/* Firebase Cloud Messaging Service Worker */
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

// Public config (public Firebase web key is not a secret)
firebase.initializeApp({
  apiKey: "AIzaSyBFJJAHtkBZQ8PQRXL6X4TBecK-eQZ-0Gs",
  authDomain: "vagvanner.firebaseapp.com",
  projectId: "vagvanner",
  storageBucket: "vagvanner.appspot.com",
  messagingSenderId: "504069749464",
  appId: "1:504069749464:web:b8d6529d243431dfa7b5ad",
  measurementId: "G-NCY1TDE13V"
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  const title = (payload && payload.notification && payload.notification.title) || 'VägVänner';
  const body = (payload && payload.notification && payload.notification.body) || '';
  const data = (payload && payload.data) || {};
  
  const options = {
    body,
    icon: '/favicon.png',
    badge: '/favicon.png',
    vibrate: [200, 100, 200],
    requireInteraction: true,
    tag: 'vagvanner-notification',
    renotify: true,
    data: {
      ...data,
      timestamp: Date.now()
    }
  };
  
  return self.registration.showNotification(title, options);
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  
  const url = (event.notification && event.notification.data && event.notification.data.route) || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      // Check if there's already a window/tab open
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url.startsWith(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      // If no window/tab is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

// IMPORTANT: Do not add fetch listeners here to avoid interfering with app

// src/serviceWorkerRegistration.js
// This file registers the CRA service worker for PWA capabilities.
const isLocalhost = Boolean(
  window.location.hostname === "localhost" ||
    window.location.hostname === "[::1]" ||
    window.location.hostname.match(
      /^127(?:\.(?:25[0-5]|2[0-4]\d|[01]?\d?\d)){3}$/
    )
);

export function register() {
  if ("serviceWorker" in navigator) {
    const swUrl = `${process.env.PUBLIC_URL}/service-worker.js`;

    if (isLocalhost) {
      // This is running on localhost. Check if service worker exists.
      fetch(swUrl, { headers: { "Service-Worker": "script" } })
        .then(response => {
          if (
            response.status === 404 ||
            response.headers.get("content-type").indexOf("javascript") === -1
          ) {
            navigator.serviceWorker.ready.then(registration => {
              registration.unregister();
            });
          } else {
            registerValidSW(swUrl);
          }
        })
        .catch(() => {});
    } else {
      registerValidSW(swUrl);
    }
  }
}

function registerValidSW(swUrl) {
  navigator.serviceWorker
    .register(swUrl)
    .then(registration => {
      registration.onupdatefound = () => {
        const installingWorker = registration.installing;
        if (!installingWorker) return;
        installingWorker.onstatechange = () => {
          if (installingWorker.state === "installed" && navigator.serviceWorker.controller) {
            // New content is available; please refresh.
            console.log("New content available, please refresh.");
          }
        };
      };
    })
    .catch(console.error);
}

export function unregister() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.ready.then(registration => {
      registration.unregister();
    });
  }
}

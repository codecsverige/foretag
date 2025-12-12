// src/index.js
import React, { Suspense } from "react";
import { HelmetProvider } from "react-helmet-async";
import { createRoot } from "react-dom/client";
import App from "./App.js";
import "./index.css"; // ← فقط طبقات Tailwind

/* ── Error Boundary لمنع كسر التطبيق ───────────────────────── */
class ErrorBoundary extends React.Component {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(e, info) {
    console.error("App crashed:", e, info);
  }
  render() {
    if (this.state.hasError)
      return (
        <div className="min-h-screen flex items-center justify-center text-center p-6">
          <div>
            <h1 className="text-2xl font-bold mb-2 text-red-600">
              Något gick fel
            </h1>
            <p className="text-gray-600">
              Ladda om sidan eller kontakta support.
            </p>
          </div>
        </div>
      );
    return this.props.children;
  }
}

/* ── Loader أثناء Lazy Loading ─────────────────────────────── */
const Loader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="h-10 w-10 border-4 border-blue-600 border-t-transparent animate-spin rounded-full" />
  </div>
);

/* ── React 18 root ─────────────────────────────────────────── */
const container = document.getElementById("root");

createRoot(container).render(
  <React.StrictMode>
    <HelmetProvider>
      <ErrorBoundary>
        <Suspense fallback={<Loader />}>
          <App />
        </Suspense>
      </ErrorBoundary>
    </HelmetProvider>
  </React.StrictMode>
);

// Register Firebase Messaging SW and clean conflicting ones
if ('serviceWorker' in navigator) {
  (async () => {
    try {
      // Clean up old/conflicting service workers
      const registrations = await navigator.serviceWorker.getRegistrations();
      
      for (const registration of registrations) {
        const url = registration.active?.scriptURL || '';
        // Keep only Firebase Messaging SW
        if (!url.includes('firebase-messaging-sw.js')) {
          await registration.unregister();
        }
      }
      
      // Register Firebase Messaging SW if not already registered
      const firebaseSW = registrations.find(r => r.active?.scriptURL?.includes('firebase-messaging-sw.js'));
      if (!firebaseSW) {
        await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      }
    } catch (error) {
      console.error('Service Worker registration error:', error);
    }
  })();
}

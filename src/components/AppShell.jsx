import React, { useState, useEffect, Suspense } from "react";
import ServerSideContent from "./ServerSideContent.jsx";

/**
 * AppShell - Gère le chargement progressif de l'application
 * Optimise l'expérience utilisateur et le SEO
 */
export default function AppShell({ children, pathname = "/" }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // Marquer que nous sommes côté client
    setIsClient(true);
    
    // Simuler un chargement minimal pour éviter le flash
    const timer = setTimeout(() => {
      setIsLoading(false);
      document.body.classList.add('app-ready');
    }, 100);

    return () => {
      clearTimeout(timer);
      document.body.classList.remove('app-ready');
    };
  }, []);

  // Pendant le chargement initial ou côté serveur
  if (!isClient || isLoading) {
    return <ServerSideContent pathname={pathname} />;
  }

  // Application chargée
  return (
    <Suspense fallback={<ServerSideContent pathname={pathname} />}>
      <div className="app-shell">
        {children}
      </div>
    </Suspense>
  );
}

// Loader optimisé pour les pages
export function PageLoader({ pathname, children }) {
  const [isClient, setIsClient] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setIsClient(true);
    
    // Donner la priorité au contenu initial
    const timer = requestAnimationFrame(() => {
      setIsReady(true);
    });

    return () => cancelAnimationFrame(timer);
  }, []);

  // Pendant l'hydratation, montrer le contenu statique
  if (!isClient || !isReady) {
    return <ServerSideContent pathname={pathname} />;
  }

  // Une fois hydraté, montrer le contenu dynamique
  return children;
}
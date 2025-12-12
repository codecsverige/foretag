import React, { useEffect, useMemo, useState } from "react";

/** زر/بانر لتثبيت التطبيق: يدعم Android (beforeinstallprompt) و iOS (إرشادات) */
export default function InstallPrompt() {
  const [dismissedAt, setDismissedAt] = useState(() => {
    try { return parseInt(localStorage.getItem('a2hs_dismissed_at') || '0', 10) || 0; } catch { return 0; }
  });
  const [installed, setInstalled] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showCustomPrompt, setShowCustomPrompt] = useState(false);

  // Platform detection
  const { isIos, isStandalone, isMobile, isAndroid } = useMemo(() => {
    const ua = (navigator.userAgent || '').toLowerCase();
    const ios = /iphone|ipad|ipod/.test(ua) || (/macintosh/.test(ua) && 'ontouchend' in document);
    const standalone = (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || (navigator && (navigator).standalone === true);
    const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1920;
    const mobile = /iphone|ipad|ipod|android/.test(ua) || ('ontouchend' in window && viewportWidth < 1025);
    const android = /android/.test(ua);
    
    
    return { isIos: ios, isStandalone: standalone, isMobile: mobile, isAndroid: android };
  }, []);

  // Capture the beforeinstallprompt event
  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later
      setDeferredPrompt(e);
      // Show custom prompt after a delay
      setTimeout(() => setShowCustomPrompt(true), 2000);
    };

    const installedHandler = () => {
      setInstalled(true);
      setShowCustomPrompt(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', installedHandler);
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', installedHandler);
    };
  }, []);

  const dismiss = () => {
    const ts = Date.now();
    setDismissedAt(ts);
    try { localStorage.setItem('a2hs_dismissed_at', String(ts)); } catch {}
  };

  // Don’t show on desktop or when already installed
  if (installed || isStandalone || !isMobile) return null;

  // iOS Safari path: show small banner with instructions, but allow dismiss
  // Show only if not dismissed recently (e.g., 7 days)
  const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
  const recentlyDismissed = dismissedAt && (Date.now() - dismissedAt < WEEK_MS);
  if (isIos && !recentlyDismissed) {
    return (
      <div className="fixed inset-x-4 bottom-4 md:left-auto md:right-4 z-50 bg-white/95 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl shadow-xl p-3 flex items-center gap-3">
        <div className="text-2xl">📱</div>
        <div className="text-xs sm:text-sm text-gray-800 dark:text-gray-100">
          Lägg till på hemskärmen: tryck på Dela (⤴️) → <b>Lägg till på hemskärmen</b>
        </div>
        <button onClick={dismiss} className="ml-auto text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white text-sm px-2">Stäng</button>
      </div>
    );
  }

  // Android prompt when beforeinstallprompt is available
  if (isAndroid && showCustomPrompt && deferredPrompt && !recentlyDismissed) {
    const handleInstallClick = async () => {
      if (!deferredPrompt) return;
      
      // Show the install prompt
      deferredPrompt.prompt();
      
      // Wait for the user to respond to the prompt
      const { outcome } = await deferredPrompt.userChoice;
      
      // Clear the deferredPrompt
      setDeferredPrompt(null);
      setShowCustomPrompt(false);
    };

    return (
      <div className="fixed inset-x-4 bottom-4 md:left-auto md:right-4 z-50 bg-white/95 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl shadow-xl p-4 flex items-center gap-3">
        <div className="text-2xl">📱</div>
        <div className="flex-1">
          <div className="text-sm font-semibold text-gray-800 dark:text-gray-100">
            Installera VägVänner
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">
            Få snabb åtkomst och notiser
          </div>
        </div>
        <button 
          onClick={handleInstallClick}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          Installera
        </button>
        <button 
          onClick={dismiss} 
          className="text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white text-sm px-2"
        >
          ✕
        </button>
      </div>
    );
  }

  return null;
}

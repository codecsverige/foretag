import React, { useState, useEffect } from "react";
import { Suspense } from "react";
import { lazyWithRetry } from "./utils/lazyWithRetry.js";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import RouteSeo from "./components/RouteSeo.jsx";
import SafeSEOEnhancer from "./components/SafeSEOEnhancer.jsx";

import { AuthProvider, useAuth } from "./context/AuthContext.jsx";
import { NotificationProvider, useNotification } from "./context/NotificationContext.jsx";
import { ActivityProvider }     from "./context/ActivityContext.jsx";

import Header              from "./components/Header.jsx";
import Footer              from "./components/Footer.jsx";
import Loader              from "./components/Loader.jsx";
import ScrollToTop         from "./components/ScrollToTop.jsx";
import CookieConsentBanner from "./components/CookieConsentBanner.jsx";
import AppShell            from "./components/AppShell.jsx";
import InstallPrompt       from "./components/InstallPrompt.jsx";

// Defer heavy analytics libs to reduce main bundle and improve LCP
let sentryInitScheduled = false;
let gaInitScheduled = false;

// import { RequirePhoneVerified } from "./components/RequirePhoneVerified.jsx";

// Initialize monitoring services after idle to avoid delaying FCP/LCP
const scheduleIdle = (cb) => {
  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    window.requestIdleCallback(cb, { timeout: 3000 });
  } else {
    setTimeout(cb, 0);
  }
};

scheduleIdle(async () => {
  if (!sentryInitScheduled) {
    try {
      const { initSentry } = await import("./services/sentry.js");
      initSentry();
    } catch (_) {}
    sentryInitScheduled = true;
  }
});

scheduleIdle(async () => {
  if (!gaInitScheduled) {
    try {
      const { initGA } = await import("./services/analytics.js");
      initGA();
    } catch (_) {}
    gaInitScheduled = true;
  }
});

/* ───── Lazy‐loaded pages ───── */
const Home               = lazyWithRetry(() => import("./pages/SearchDynamic.jsx"));
const SelectLocation     = lazyWithRetry(() => import("./pages/SelectLocation.jsx"));
// const CreateRide         = lazyWithRetry(() => import("./pages/CreateRide.jsx"));
const Inbox              = lazyWithRetry(() => import("./pages/Inbox.jsx"));
const BusSearch          = lazyWithRetry(() => import("./pages/BusSearch.jsx"));
const BusAdmin           = lazyWithRetry(() => import("./pages/BusAdmin.jsx"));
const BusDetails         = lazyWithRetry(() => import("./pages/BusDetails.jsx"));
const UserSettings       = lazyWithRetry(() => import("./pages/UserProfilePage.jsx"));
const MinaResor          = lazyWithRetry(() => import("./pages/MinaResor/index.jsx"));
const MyDriverRides      = lazyWithRetry(() => import("./pages/MyDriverRides.jsx"));
const MyPassengerRides   = lazyWithRetry(() => import("./pages/MyPassengerRides.jsx"));
const BookRide           = lazyWithRetry(() => import("./pages/BookRide.jsx"));
const BookRidePassenger  = lazyWithRetry(() => import("./pages/BookRidePassanger.jsx"));
const UnlockContactPage  = lazyWithRetry(() => import("./pages/UnlockContactPage.jsx"));
const RideDetails        = lazyWithRetry(() => import("./pages/RideDetails.jsx"));
const ReportPage         = lazyWithRetry(() => import("./pages/ReportPage.jsx"));

const GoogleAuth         = lazyWithRetry(() => import("./components/GoogleAuth.jsx"));
const PhoneVerification  = lazyWithRetry(() => import("./pages/PhoneVerificationPage.jsx"));
const ChangePhone        = lazyWithRetry(() => import("./pages/ChangePhonePage.jsx"));
const Cookiepolicy       = lazyWithRetry(() => import("./pages/Cookiepolicy.jsx"));
const Integritetspolicy  = lazyWithRetry(() => import("./pages/Integritetspolicy.jsx"));
const Terms              = lazyWithRetry(() => import("./pages/Anvandningsvillkor.jsx"));
const Samakning          = lazyWithRetry(() => import("./pages/Samakning.jsx"));
const CityPage           = lazyWithRetry(() => import("./pages/CityPage.jsx"));
const StudentGuide       = lazyWithRetry(() => import("./pages/StudentGuide.jsx"));
const CommuterGuide      = lazyWithRetry(() => import("./pages/CommuterGuide.jsx"));
const NoCarGuide         = lazyWithRetry(() => import("./pages/NoCarGuide.jsx"));
const TravelTips         = lazyWithRetry(() => import("./pages/TravelTips.jsx"));

/* ───── BokaNära (ads creation only for now) ───── */
const CreateListing      = lazyWithRetry(() => import("./pages/CreateListing.jsx"));

/* ───── Error pages ───── */
const Error404           = lazyWithRetry(() => import("./pages/Error404.jsx"));
const Error500           = lazyWithRetry(() => import("./pages/Error500.jsx"));
const Offline            = lazyWithRetry(() => import("./pages/Offline.jsx"));

/* ───── Error Boundary ───── */
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };
  
  static getDerivedStateFromError(error) { 
    return { hasError: true, error }; 
  }
  
  componentDidCatch(error, info) { 
    console.error("App crashed:", error, info);
    // Here you could send error to monitoring service
  }
  
  handleReload = () => {
    window.location.reload();
  }
  
  handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
          <div className="text-center space-y-4 p-6">
            <div className="text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-red-600 dark:text-red-400">Något gick fel</h1>
            <p className="text-gray-600 dark:text-gray-400 max-w-md">
              Ett oväntat fel uppstod. Ingen fara - försök bara ladda om sidan eller gå tillbaka till startsidan.
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={this.handleReload}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Ladda om sidan
              </button>
              <button
                onClick={this.handleGoHome}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Gå till startsidan
              </button>
            </div>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-4 p-4 bg-gray-100 rounded text-left text-sm">
                <summary className="cursor-pointer font-medium">Teknisk information</summary>
                <pre className="mt-2 text-xs overflow-auto">{this.state.error.toString()}</pre>
              </details>
            )}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

/* ───── Layout ───── */
function Layout({ children }) {
  const { authLoading, user } = useAuth();
  const [showFallback, setShowFallback] = useState(false);
  const { notify } = useNotification();

  // Setup FCM push notifications when user logs in
  useEffect(() => {
    if (!user || !user.email) return;
    
    (async () => {
      try {
        // Check if notifications are supported
        if (!('Notification' in window)) return;
        
        // Check current permission state
        const currentPermission = Notification.permission;
        
        // Request permission if not granted
        if (currentPermission === 'default') {
          console.log('🔔 Requesting notification permission...');
          const permission = await Notification.requestPermission();
          console.log('🔔 Permission result:', permission);
          if (permission !== 'granted') {
            console.warn('❌ Notification permission denied');
            return;
          }
        } else if (currentPermission === 'denied') {
          console.warn('❌ Notification permission was denied');
          return;
        }
        
        console.log('✅ Notification permission granted');
        
        // Setup push notifications using the new unified system
        const { setupPushNotifications } = await import("./utils/pushNotificationHelper.js");
        const { onForegroundFcm } = await import("./firebase/firebase.js");
        const { shouldRefreshFcmToken, saveFcmTokenTimestamp } = await import("./utils/fcmHelper.js");
        const { handleIncomingNotification } = await import("./utils/pushNotificationHelper.js");
        
        // Check platform type
        const isCapacitor = window.Capacitor?.isNativePlatform?.();
        const isPWA = window.matchMedia('(display-mode: standalone)').matches;
        
        console.log('📱 Platform detection:', { isCapacitor, isPWA });
        
        // ALWAYS setup foreground message handler (even if token exists)
        if (isCapacitor || isPWA) {
          // ✅ Use Capacitor PushNotifications for installed apps
          console.log('🔧 Setting up Capacitor push listeners...');
          
          try {
            const { PushNotifications } = await import('@capacitor/push-notifications');
            
            // Remove any existing listeners first
            await PushNotifications.removeAllListeners();
            
            // Foreground: when app is open
            PushNotifications.addListener('pushNotificationReceived', (notification) => {
              console.log('📩 Capacitor push received (foreground):', notification);
              
              // Convert Capacitor format to FCM format
              const payload = {
                notification: {
                  title: notification.title || 'VägVänner',
                  body: notification.body || ''
                },
                data: notification.data || {}
              };
              
              // Use unified handler
              handleIncomingNotification(payload);
              
              // Also show in-app toast
              notify({ 
                type: 'info', 
                message: `${notification.title}: ${notification.body}` 
              });
            });
            
            // Background: when user taps notification
            PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
              console.log('🔔 Capacitor push action performed:', action);
              
              // Navigate to route if specified
              const route = action.notification?.data?.route;
              if (route) {
                window.location.href = route;
              }
            });
            
            console.log('✅ Capacitor listeners registered');
          } catch (err) {
            console.error('❌ Failed to setup Capacitor listeners:', err);
          }
        } else {
          // ✅ Use Web FCM for browser
          console.log('🔧 Setting up Web FCM listener...');
          
          const unsubscribe = onForegroundFcm((payload) => {
            console.log('📩 Web FCM received:', payload);
            
            // Use unified handler
            handleIncomingNotification(payload);
            
            // Also show in-app toast
            const title = payload.notification?.title || 'VägVänner';
            const body = payload.notification?.body || '';
            
            // Show both browser notification and in-app toast
            if (Notification.permission === 'granted') {
              new Notification(title, {
                body,
                icon: '/favicon.png',
                tag: 'vagvanner-foreground'
              });
            }
            
            notify({ 
              type: 'info', 
              message: `${title}: ${body}`,
              duration: 6000
            });
          });
          
          // Store unsubscribe function for cleanup
          window.__fcmUnsubscribe = unsubscribe;
          console.log('✅ Web FCM listener registered');
        }
        
        // Check if we need to refresh token
        if (!shouldRefreshFcmToken()) {
          console.log('✅ FCM token is still fresh, skipping refresh');
          return; // Token is still fresh, but handler is already set up above
        }
        
        // Setup notifications (will handle PWA/Native/Browser automatically)
        const token = await setupPushNotifications(user);
        
        if (token) {
          console.log('✅ FCM token registered:', token.substring(0, 20) + '...');
          // Save timestamp for token refresh check
          saveFcmTokenTimestamp();
          
          // Show success notification
          notify({ 
            type: 'success', 
            message: '🔔 Push-notiser aktiverade! Du får notiser när nya resor matchar dina bevakningar.',
            duration: 4000
          });
          
          // Test notification to confirm it works
          if (Notification.permission === 'granted') {
            setTimeout(() => {
              new Notification('VägVänner', {
                body: 'Push-notiser är nu aktiverade! 🎉',
                icon: '/favicon.png',
                tag: 'setup-confirmation'
              });
            }, 1000);
          }
          
          localStorage.setItem('push_setup_done', 'true');
        } else {
          console.warn('❌ Failed to get FCM token');
          notify({ 
            type: 'warning', 
            message: '⚠️ Kunde inte aktivera push-notiser. Du får fortfarande e-post-notiser.',
            duration: 5000
          });
        }
      } catch (err) {
        // Silent fail in production
        console.error('Push notification setup failed:', err.message);
      }
    })();
  }, [user, notify]);

  // Show fallback after 5 seconds of loading
  useEffect(() => {
    if (authLoading) {
      const timer = setTimeout(() => {
        setShowFallback(true);
      }, 5000);
      
      return () => clearTimeout(timer);
    } else {
      setShowFallback(false);
    }
  }, [authLoading]);

  // Show loading screen while auth is initializing
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 dark:text-gray-400">Laddar...</p>
            {showFallback && (
              <div className="mt-4 space-y-2">
                <p className="text-sm text-gray-500">Tar det för lång tid?</p>
                <button 
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                >
                  Ladda om sidan
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Header />
      <main className="min-h-screen pt-4">
        <Suspense fallback={<Loader />}>{children}</Suspense>
      </main>
      {/* A2HS install prompt for mobile */}
      <InstallPrompt />
      {/* Test notification removed for production */}
      <Footer />
    </>
  );
}

function ModalRoutesAware() {
  const location = useLocation();
  const state = location.state;

  return (
    <>
      <RouteSeo />
      <Routes location={state?.background || location}>
        {/* public */}
        <Route path="/" element={<Home />} />
        <Route path="/ride/:id" element={<RideDetails />} />
        <Route path="/passenger/:id" element={<RideDetails />} />
        <Route path="/report/:id" element={<ReportPage />} />
        <Route path="/select-location" element={<SelectLocation />} />
        {/* Replace create-ride flow with company ad creation */}
        <Route path="/create-ride" element={<CreateListing />} />
        <Route path="/samakning" element={<Samakning />} />
        <Route path="/city/:city" element={<CityPage />} />
        
        {/* Bus routes - completely separate */}
        <Route path="/admin" element={<Navigate to="/bus-admin" replace />} />
        <Route path="/bus" element={<BusSearch />} />
        <Route path="/bus/:id" element={<BusDetails />} />
        <Route path="/bus-admin" element={<BusAdmin />} />
        <Route path="/student-guide" element={<StudentGuide />} />
        <Route path="/commuter-guide" element={<CommuterGuide />} />
        <Route path="/no-car-guide" element={<NoCarGuide />} />
        <Route path="/travel-tips" element={<TravelTips />} />
        <Route path="/inbox" element={<Inbox />} />
        <Route path="/my-rides" element={<MinaResor />} />
        <Route path="/my-driver-rides" element={<MyDriverRides />} />
        <Route path="/my-passenger-rides" element={<MyPassengerRides />} />
        <Route path="/user-profile" element={<UserSettings />} />

        {/* booking routes (phone verification enforced at submit, not at navigation) */}
        <Route path="/book-ride/:rideId" element={<BookRide />} />
        <Route path="/book-ride-passanger/:rideId" element={<BookRidePassenger />} />

        {/* unlock contact (must come *after* all /book‑ride... routes!) */}
        <Route path="/unlock/:bookingId" element={<UnlockContactPage />} />

        {/* auth & policies */}
        <Route path="/google-auth"        element={<GoogleAuth />} />
        <Route path="/verify-phone"       element={<PhoneVerification />} />
        <Route path="/change-phone"       element={<ChangePhone />} />
        <Route path="/cookiepolicy"       element={<Cookiepolicy />} />
        <Route path="/integritetspolicy"  element={<Integritetspolicy />} />
        <Route path="/anvandningsvillkor" element={<Terms />} />

        {/* error pages */}
        <Route path="/404" element={<Error404 />} />
        <Route path="/500" element={<Error500 />} />
        <Route path="/offline" element={<Offline />} />
        
        {/* fallback */}
        <Route path="*" element={<Error404 />} />
      </Routes>

      {/* Modals disabled - using full pages instead */}
    </>
  );
}

/* ───── App ───── */
export default function App() {
  // Handle redirect after page refresh
  React.useEffect(() => {
    const redirectPath = sessionStorage.getItem('redirectPath');
    if (redirectPath) {
      sessionStorage.removeItem('redirectPath');
      window.history.replaceState(null, '', redirectPath);
    }
  }, []);

  return (
    <HelmetProvider>
      <Router basename="/">
        <AppShell>
          <CookieConsentBanner />
          <AuthProvider>
            <NotificationProvider>
              <ActivityProvider>
                <SafeSEOEnhancer />
                <ScrollToTop />
                <ErrorBoundary>
                  <Layout>
                    <ModalRoutesAware />
                  </Layout>
                </ErrorBoundary>
              </ActivityProvider>
            </NotificationProvider>
          </AuthProvider>
        </AppShell>
      </Router>
    </HelmetProvider>
  );
}

/* ────────────────────────────────────────────────
   src/firebase/firebase.js
   ملفّ التهيئة المركزى لـ Firebase
──────────────────────────────────────────────── */

import { initializeApp } from "firebase/app";
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";
import { getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getMessaging, getToken, onMessage, isSupported } from "firebase/messaging";

/* قيم البيئة فى .env / .env.local */
const firebaseConfig = {
  apiKey:            process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyBFJJAHtkBZQ8PQRXL6X4TBecK-eQZ-0Gs",
  authDomain:        process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "vagvanner.firebaseapp.com",
  projectId:         process.env.REACT_APP_FIREBASE_PROJECT_ID || "vagvanner",
  storageBucket:     process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "vagvanner.appspot.com",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "504069749464",
  appId:             process.env.REACT_APP_FIREBASE_APP_ID || "1:504069749464:web:b8d6529d243431dfa7b5ad",
  measurementId:     process.env.REACT_APP_FIREBASE_MEASUREMENT_ID || "G-NCY1TDE13V",
};

/* init */
const app = initializeApp(firebaseConfig);

/* auth */
const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence).catch(console.error);

/* db + storage */
let db;
try {
  db = initializeFirestore(app, {
    // Enable robust offline cache with multi-tab support
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager()
    }),
    // Auto fallback to long-polling in environments where websockets/WebChannel fail
    experimentalAutoDetectLongPolling: true,
    // Avoid fetch streams to improve compatibility on some proxies/CDNs
    useFetchStreams: false
  });
} catch (e) {
  // Fallback to default Firestore if initialization options are unsupported
  db = getFirestore(app);
}
const storage = getStorage(app);

let messaging;
let fcmSupported = false;

// Check FCM support
try {
  fcmSupported = await isSupported();
} catch (e) {
  fcmSupported = false;
}

// Initialize messaging if supported
if (fcmSupported) {
  try {
    messaging = getMessaging(app);
  } catch (e) {
    console.error('FCM initialization error:', e.message);
  }
}

export async function requestFcmPermissionAndToken(vapidKey) {
  if (!fcmSupported || !messaging) {
    console.warn('❌ FCM not supported or messaging not initialized');
    return null;
  }
  
  try {
    // Check current permission
    const currentPerm = Notification.permission;
    console.log('🔔 Current notification permission:', currentPerm);
    if (currentPerm !== 'granted') {
      console.warn('❌ Notification permission not granted');
      return null;
    }
    
    // Get service worker
    let swReg = null;
    try {
      if ('serviceWorker' in navigator) {
        console.log('🔧 Looking for service worker...');
        const registrations = await navigator.serviceWorker.getRegistrations();
        console.log('🔧 Found', registrations.length, 'service worker registrations');
        
        // Find Firebase messaging SW
        swReg = registrations.find(r => r.active?.scriptURL?.includes('firebase-messaging-sw.js'));
        if (!swReg) {
          console.log('🔧 Firebase SW not found, using ready SW...');
          swReg = await navigator.serviceWorker.ready;
        } else {
          console.log('✅ Found Firebase messaging SW');
        }
      }
    } catch (swError) {
      console.warn('⚠️ Service worker error:', swError.message);
      // Continue without SW registration
    }
    
    // Get FCM token - this might fail due to network or browser issues
    console.log('🔧 Requesting FCM token with VAPID:', vapidKey.substring(0, 20) + '...');
    const token = await getToken(
      messaging,
      swReg ? { vapidKey, serviceWorkerRegistration: swReg } : { vapidKey }
    );
    
    if (token) {
      console.log('✅ FCM token generated successfully');
    } else {
      console.warn('❌ FCM token is null or empty');
    }
    
    return token || null;
  } catch (error) {
    // Common error: Registration failed - push service error
    // This happens when the browser's push service is unavailable
    // or when there are network issues
    if (error.message?.includes('Registration failed')) {
      console.warn('⚠️ FCM registration failed - push service unavailable');
      return null;
    }
    console.error('❌ FCM Token Error:', error.message);
    return null;
  }
}

export function onForegroundFcm(handler) {
  if (!fcmSupported || !messaging) return () => {};
  return onMessage(messaging, (payload) => handler && handler(payload));
}

export { app, auth, db, storage, messaging };
export default app;

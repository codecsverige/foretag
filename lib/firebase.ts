import { initializeApp, getApps, FirebaseApp } from 'firebase/app'
import { 
  getAuth, 
  setPersistence, 
  browserLocalPersistence,
  Auth 
} from 'firebase/auth'
import { 
  getFirestore,
  initializeFirestore,
  connectFirestoreEmulator,
  Firestore
} from 'firebase/firestore'
import { getStorage, FirebaseStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyBogjhVj-jDGKJHwJEh3DmZHR-JnT7cduo",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "bokanara-4797d.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "bokanara-4797d",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "bokanara-4797d.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "980354990772",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:980354990772:web:d02b0018fad7ef6dc90de1",
}

let app: FirebaseApp | undefined
let auth: Auth | undefined
let db: Firestore | undefined
let storage: FirebaseStorage | undefined

// Initialize only on client side
if (typeof window !== 'undefined') {
  try {
    // Initialize app
    if (getApps().length === 0) {
      app = initializeApp(firebaseConfig)
    } else {
      app = getApps()[0]
    }

    // Initialize auth
    auth = getAuth(app)
    setPersistence(auth, browserLocalPersistence).catch(() => {})

    // Initialize Firestore - prefer standard WebSocket connection for performance
    try {
      db = getFirestore(app)
      console.log('✅ Firestore initialized (WebSockets)')
    } catch (e) {
      console.warn('⚠️ Standard Firestore init failed, trying fallback:', e)
      try {
        db = initializeFirestore(app, {
          experimentalForceLongPolling: true,
          ignoreUndefinedProperties: true
        })
        console.log('✅ Firestore initialized with long-polling fallback')
      } catch (e2) {
        console.error('❌ Firestore initialization failed:', e2)
      }
    }

    // Initialize storage with error handling
    try {
      storage = getStorage(app)
      console.log('✅ Storage initialized:', firebaseConfig.storageBucket)
    } catch (e) {
      console.warn('⚠️ Storage initialization failed:', e)
    }
    
    console.log('✅ Firebase initialized successfully')
  } catch (error) {
    console.error('❌ Firebase initialization error:', error)
  }
}

export { app, auth, db, storage }
export default app

/* ────────────────────────────────────────────────
   lib/firebase.ts
   ملفّ التهيئة المركزى لـ Firebase - منسوخ من المشروع القديم
──────────────────────────────────────────────── */

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
  Firestore
} from 'firebase/firestore'
import { getStorage, FirebaseStorage } from 'firebase/storage'

/* قيم البيئة - Environment variables are required */
const requiredEnvVars = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID',
] as const

// Validate required environment variables (client-side only)
if (typeof window !== 'undefined') {
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName])
  if (missingVars.length > 0) {
    console.error('❌ Missing required Firebase environment variables:', missingVars)
    console.error('⚠️ Firebase services will not be initialized.')
    console.error('Please check your .env.local file or Vercel environment variables')
  }
}

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

/* Initialize Firebase */
let app: FirebaseApp | undefined
let auth: Auth | undefined
let db: Firestore | undefined
let storage: FirebaseStorage | undefined

// Only initialize on client side
if (typeof window !== 'undefined') {
  // Check if all required config values are present
  const hasRequiredConfig = Object.values(firebaseConfig).every(val => val && val.length > 0)
  
  if (!hasRequiredConfig) {
    console.error('❌ Firebase initialization skipped due to missing configuration')
  } else {
    try {
      // Initialize app
      if (getApps().length === 0) {
        app = initializeApp(firebaseConfig)
      } else {
        app = getApps()[0]
      }

      // Initialize auth with persistence
      auth = getAuth(app)
      setPersistence(auth, browserLocalPersistence).catch(console.error)

      // Initialize Firestore with settings for better compatibility
      try {
        db = initializeFirestore(app, {
          experimentalAutoDetectLongPolling: true,
        })
      } catch (e: any) {
        // If already initialized, just get the instance
        if (e.code === 'failed-precondition') {
          db = getFirestore(app)
        } else {
          console.error('Firestore init error:', e)
          db = getFirestore(app)
        }
      }

      // Initialize storage
      storage = getStorage(app)
      
      console.log('✅ Firebase initialized successfully')
    } catch (error) {
      console.error('❌ Firebase initialization error:', error)
    }
  }
}

export { app, auth, db, storage }
export default app

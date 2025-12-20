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

/* قيم البيئة - نفس الإعدادات من المشروع القديم */
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// Validate Firebase configuration
if (!firebaseConfig.projectId) {
  console.error('❌ Invalid Firebase configuration. Please check your environment variables.')
  console.error('Missing required variables: NEXT_PUBLIC_FIREBASE_PROJECT_ID')
  throw new Error('Firebase configuration is missing or invalid')
}

// Validate we're using the correct project
if (firebaseConfig.projectId !== 'bokanara-4797d') {
  console.warn('⚠️ Warning: Using Firebase project:', firebaseConfig.projectId)
  console.warn('⚠️ Expected project: bokanara-4797d')
}

/* Initialize Firebase */
let app: FirebaseApp | undefined
let auth: Auth | undefined
let db: Firestore | undefined
let storage: FirebaseStorage | undefined

// Only initialize on client side
if (typeof window !== 'undefined') {
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

export { app, auth, db, storage }
export default app

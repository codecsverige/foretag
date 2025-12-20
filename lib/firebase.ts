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
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyBogjhVj-jDGKJHwJEh3DmZHR-JnT7cduo",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "bokanara-4797d.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "bokanara-4797d",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "bokanara-4797d.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "980354990772",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:980354990772:web:d02b0018fad7ef6dc90de1",
}

// Validate Firebase configuration
function validateFirebaseConfig() {
  const requiredKeys = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId']
  const missingKeys = requiredKeys.filter(key => !firebaseConfig[key as keyof typeof firebaseConfig])
  
  if (missingKeys.length > 0) {
    console.error('❌ Missing Firebase configuration keys:', missingKeys)
    return false
  }
  
  // Check if using default values from .env.example
  if (firebaseConfig.projectId === 'bokanara-4797d') {
    console.log('ℹ️ Using Firebase project: bokanara-4797d')
  }
  
  return true
}

/* Initialize Firebase */
let app: FirebaseApp | undefined
let auth: Auth | undefined
let db: Firestore | undefined
let storage: FirebaseStorage | undefined

// Only initialize on client side
if (typeof window !== 'undefined') {
  if (!validateFirebaseConfig()) {
    console.error('❌ Firebase configuration validation failed. Please check your .env.local file.')
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
      setPersistence(auth, browserLocalPersistence).catch((error) => {
        console.error('❌ Auth persistence error:', error)
      })

      // Initialize Firestore with settings for better compatibility
      try {
        db = initializeFirestore(app, {
          experimentalAutoDetectLongPolling: true,
        })
        console.log('✅ Firestore initialized successfully')
      } catch (e: any) {
        // If already initialized, just get the instance
        if (e.code === 'failed-precondition') {
          db = getFirestore(app)
          console.log('✅ Firestore already initialized')
        } else {
          console.error('❌ Firestore init error:', e)
          db = getFirestore(app)
        }
      }

      // Initialize storage
      storage = getStorage(app)
      
      console.log('✅ Firebase initialized successfully with project:', firebaseConfig.projectId)
    } catch (error: any) {
      console.error('❌ Firebase initialization error:', error)
      console.error('Please verify your Firebase configuration in .env.local')
      console.error('Expected project ID:', firebaseConfig.projectId)
    }
  }
}

export { app, auth, db, storage }
export default app

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

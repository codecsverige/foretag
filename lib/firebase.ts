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

/* قيم البيئة - نفس الإعدادات من المشروع القديم 
 * NOTE: Firebase client API keys are safe to commit and designed to be public.
 * Security is enforced through Firestore security rules, not API key secrecy.
 * These are fallback values - production should use environment variables.
 */
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
    // Validate configuration
    if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
      console.error('❌ Missing Firebase configuration. Check environment variables.')
      throw new Error('Missing Firebase configuration')
    }

    const isDev = process.env.NODE_ENV === 'development'

    // Initialize app
    if (getApps().length === 0) {
      app = initializeApp(firebaseConfig)
      if (isDev) console.log('🔥 Firebase app initialized')
    } else {
      app = getApps()[0]
      if (isDev) console.log('🔥 Using existing Firebase app')
    }

    // Initialize auth with persistence
    auth = getAuth(app)
    setPersistence(auth, browserLocalPersistence).catch((error) => {
      console.error('⚠️ Auth persistence error:', error)
    })
    if (isDev) console.log('🔐 Firebase Auth initialized')

    // Initialize Firestore with settings for better compatibility
    try {
      db = initializeFirestore(app, {
        experimentalAutoDetectLongPolling: true,
      })
      if (isDev) console.log('📊 Firestore initialized with long polling')
    } catch (e: any) {
      // If already initialized, just get the instance
      if (e.code === 'failed-precondition') {
        db = getFirestore(app)
        if (isDev) console.log('📊 Using existing Firestore instance')
      } else {
        console.error('❌ Firestore init error:', e)
        db = getFirestore(app)
        if (isDev) console.log('📊 Fallback to default Firestore')
      }
    }

    // Initialize storage
    storage = getStorage(app)
    if (isDev) console.log('💾 Firebase Storage initialized')
    
    if (isDev) {
      console.log('✅ Firebase initialized successfully')
      console.log('   Project ID:', firebaseConfig.projectId)
    }
  } catch (error: any) {
    console.error('❌ Firebase initialization error:', error)
    console.error('   Error code:', error.code)
    console.error('   Error message:', error.message)
  }
}

export { app, auth, db, storage }
export default app

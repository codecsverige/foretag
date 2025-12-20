/* ────────────────────────────────────────────────
   lib/firebase.ts
   تهيئة Firebase محسّنة - مستوحاة من vagvanner
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

/* Firebase Configuration - من Firebase Console */
const firebaseConfig = {
  apiKey: "AIzaSyBogjhVj-jDGKJHwJEh3DmZHR-JnT7cduo",
  authDomain: "bokanara-4797d.firebaseapp.com",
  projectId: "bokanara-4797d",
  storageBucket: "bokanara-4797d.firebasestorage.app",
  messagingSenderId: "980354990772",
  appId: "1:980354990772:web:d02b0018fad7ef6dc90de1"
}

/* Initialize Firebase App */
let app: FirebaseApp
let auth: Auth | undefined
let db: Firestore | undefined
let storage: FirebaseStorage | undefined

try {
  // Initialize app (works on both client and server)
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig)
    console.log('🔥 Firebase app initialized')
  } else {
    app = getApps()[0]
    console.log('🔥 Firebase app already initialized')
  }

  // Initialize Auth (client-side only)
  if (typeof window !== 'undefined') {
    auth = getAuth(app)
    setPersistence(auth, browserLocalPersistence).catch(err => {
      console.warn('⚠️ Auth persistence warning:', err)
    })
    console.log('✅ Firebase Auth initialized')
  }

  // Initialize Firestore (works on both client and server)
  try {
    db = initializeFirestore(app, {
      experimentalAutoDetectLongPolling: true,
    })
    console.log('✅ Firestore initialized')
  } catch (e: any) {
    if (e.code === 'failed-precondition') {
      db = getFirestore(app)
      console.log('✅ Firestore retrieved (already initialized)')
    } else {
      console.error('❌ Firestore initialization error:', e)
      db = getFirestore(app)
    }
  }

  // Initialize Storage (client-side only)
  if (typeof window !== 'undefined') {
    storage = getStorage(app)
    console.log('✅ Firebase Storage initialized')
  }

  console.log('✅ Firebase fully initialized successfully')
} catch (error) {
  console.error('❌ Firebase initialization failed:', error)
  throw error
}

export { app, auth, db, storage }
export default app

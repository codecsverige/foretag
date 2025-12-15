import { initializeApp, getApps, FirebaseApp } from 'firebase/app'
import { getFirestore, Firestore } from 'firebase/firestore'
import { getAuth, Auth } from 'firebase/auth'
import { getStorage, FirebaseStorage } from 'firebase/storage'

// Firebase configuration with fallback values
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyBogjhVj-jDGKJHwJEh3DmZHR-JnT7cduo",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "bokanara-4797d.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "bokanara-4797d",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "bokanara-4797d.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "980354990772",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:980354990772:web:d02b0018fad7ef6dc90de1",
}

// Initialize Firebase
let app: FirebaseApp | undefined
let db: Firestore | undefined
let auth: Auth | undefined
let storage: FirebaseStorage | undefined

function initializeFirebase() {
  if (typeof window === 'undefined') {
    return // Don't initialize on server
  }
  
  try {
    if (getApps().length === 0) {
      app = initializeApp(firebaseConfig)
    } else {
      app = getApps()[0]
    }
    
    db = getFirestore(app)
    auth = getAuth(app)
    storage = getStorage(app)
  } catch (error) {
    console.error('Firebase initialization error:', error)
  }
}

// Initialize on client side
if (typeof window !== 'undefined') {
  initializeFirebase()
}

export { app, db, auth, storage }
export default app

/**
 * Firebase Server-Side Utilities
 * Helper functions for initializing Firebase in server-side contexts (SSR, API routes, etc.)
 */

import { getApps, initializeApp, FirebaseApp } from 'firebase/app'
import { getFirestore, Firestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

/**
 * Get or initialize Firebase app for server-side rendering
 * Reuses existing app instance if available
 */
export function getServerFirebaseApp(): FirebaseApp {
  if (getApps().length === 0) {
    return initializeApp(firebaseConfig)
  }
  return getApps()[0]
}

/**
 * Get Firestore instance for server-side rendering
 * Call this in server components or API routes
 */
export function getServerFirestore(): Firestore {
  const app = getServerFirebaseApp()
  return getFirestore(app)
}

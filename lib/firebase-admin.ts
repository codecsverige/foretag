import { initializeApp, getApps, cert, App } from 'firebase-admin/app'
import { getFirestore, Firestore } from 'firebase-admin/firestore'

let adminApp: App | null = null
let adminDb: Firestore | null = null

// Initialize Firebase Admin only on server side
if (typeof window === 'undefined') {
  try {
    if (!getApps().length) {
      // Check if we have all required environment variables
      const projectId = process.env.FIREBASE_PROJECT_ID
      const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
      const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')

      if (projectId && clientEmail && privateKey) {
        adminApp = initializeApp({
          credential: cert({
            projectId,
            clientEmail,
            privateKey,
          }),
        })
        adminDb = getFirestore(adminApp)
      } else {
        console.warn('Firebase Admin SDK not initialized: Missing environment variables')
      }
    } else {
      adminApp = getApps()[0]
      adminDb = getFirestore(adminApp)
    }
  } catch (error) {
    console.error('Firebase Admin initialization error:', error)
  }
}

export { adminApp, adminDb }

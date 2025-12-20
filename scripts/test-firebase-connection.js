#!/usr/bin/env node

/**
 * Quick Firebase Connection Test
 * 
 * This is a simplified test that just checks if Firebase can be initialized.
 * For full validation, use: npm run validate:firebase
 */

const { initializeApp, getApps } = require('firebase/app')
const { getFirestore, collection, getDocs, limit, query } = require('firebase/firestore')

// NOTE: Firebase client API keys are safe to commit and designed to be public.
// Security is enforced through Firestore security rules, not API key secrecy.
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyBogjhVj-jDGKJHwJEh3DmZHR-JnT7cduo",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "bokanara-4797d.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "bokanara-4797d",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "bokanara-4797d.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "980354990772",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:980354990772:web:d02b0018fad7ef6dc90de1",
}

async function quickTest() {
  console.log('🔥 Quick Firebase Connection Test\n')
  
  try {
    console.log('Initializing Firebase...')
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
    console.log('✅ Firebase initialized')
    console.log(`   Project: ${firebaseConfig.projectId}\n`)
    
    console.log('Connecting to Firestore...')
    const db = getFirestore(app)
    console.log('✅ Firestore connected\n')
    
    console.log('Reading companies collection...')
    const companiesRef = collection(db, 'companies')
    const q = query(companiesRef, limit(1))
    const snapshot = await getDocs(q)
    
    console.log('✅ Successfully read from Firestore')
    console.log(`   Companies in database: ${snapshot.size === 0 ? 'None yet' : 'At least 1'}\n`)
    
    console.log('🎉 Firebase is working correctly!')
    console.log('✨ You can now create advertisements through the app.\n')
    
    process.exit(0)
  } catch (error) {
    console.error('\n❌ Connection Failed!')
    console.error('Error:', error.message)
    
    if (error.code === 'unavailable') {
      console.error('\n💡 This might be a network issue.')
      console.error('   - Check your internet connection')
      console.error('   - Verify firestore.googleapis.com is accessible')
    }
    
    process.exit(1)
  }
}

quickTest()

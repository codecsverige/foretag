#!/usr/bin/env node

/**
 * Firebase Integration Validation Script
 * 
 * This script validates that:
 * 1. Firebase SDK initializes correctly
 * 2. Firestore connection works
 * 3. Can write test data to Firestore
 * 4. Can read data back from Firestore
 * 5. Can query data with filters
 */

const { initializeApp, getApps } = require('firebase/app')
const { getFirestore, collection, addDoc, getDocs, query, where, deleteDoc, doc, serverTimestamp } = require('firebase/firestore')

// Firebase configuration from environment or defaults
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyBogjhVj-jDGKJHwJEh3DmZHR-JnT7cduo",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "bokanara-4797d.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "bokanara-4797d",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "bokanara-4797d.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "980354990772",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:980354990772:web:d02b0018fad7ef6dc90de1",
}

let testDocId = null

async function validateFirebase() {
  console.log('🔥 Firebase Integration Validation Starting...\n')
  
  try {
    // Step 1: Initialize Firebase
    console.log('1️⃣ Testing Firebase SDK initialization...')
    let app
    if (getApps().length === 0) {
      app = initializeApp(firebaseConfig)
    } else {
      app = getApps()[0]
    }
    console.log('✅ Firebase SDK initialized successfully')
    console.log(`   Project ID: ${firebaseConfig.projectId}\n`)
    
    // Step 2: Get Firestore instance
    console.log('2️⃣ Testing Firestore connection...')
    const db = getFirestore(app)
    console.log('✅ Firestore instance created\n')
    
    // Step 3: Write test data
    console.log('3️⃣ Testing write operation to Firestore...')
    const testCompany = {
      name: 'Test Company - Firebase Validation',
      category: 'test',
      categoryName: 'Test',
      emoji: '🧪',
      city: 'Test City',
      description: 'This is a test company for Firebase validation',
      phone: '+46701234567',
      email: 'test@example.com',
      website: 'https://test.example.com',
      services: [
        {
          name: 'Test Service',
          price: 100,
          duration: 30,
          description: 'Test service description'
        }
      ],
      openingHours: {
        monday: { open: '09:00', close: '17:00', closed: false }
      },
      ownerId: 'test-validation-script',
      ownerName: 'Validation Script',
      ownerEmail: 'test@example.com',
      rating: 0,
      reviewCount: 0,
      views: 0,
      status: 'active',
      premium: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      isTestData: true // Mark as test data for easy cleanup
    }
    
    const docRef = await addDoc(collection(db, 'companies'), testCompany)
    testDocId = docRef.id
    console.log('✅ Test document written successfully')
    console.log(`   Document ID: ${testDocId}\n`)
    
    // Step 4: Read data back
    console.log('4️⃣ Testing read operation from Firestore...')
    const companiesRef = collection(db, 'companies')
    const q = query(companiesRef, where('isTestData', '==', true))
    const querySnapshot = await getDocs(q)
    
    if (querySnapshot.empty) {
      throw new Error('Could not read back the test document')
    }
    
    console.log('✅ Test document read successfully')
    console.log(`   Found ${querySnapshot.size} test document(s)\n`)
    
    // Step 5: Query with status filter (like the homepage does)
    console.log('5️⃣ Testing query with status filter (homepage scenario)...')
    const activeQuery = query(
      companiesRef,
      where('status', '==', 'active'),
      where('isTestData', '==', true)
    )
    const activeSnapshot = await getDocs(activeQuery)
    console.log('✅ Status query executed successfully')
    console.log(`   Found ${activeSnapshot.size} active test document(s)\n`)
    
    // Step 6: Cleanup test data
    console.log('6️⃣ Cleaning up test data...')
    for (const docSnapshot of querySnapshot.docs) {
      await deleteDoc(doc(db, 'companies', docSnapshot.id))
      console.log(`   Deleted test document: ${docSnapshot.id}`)
    }
    console.log('✅ Test data cleaned up successfully\n')
    
    // Final summary
    console.log('=' .repeat(60))
    console.log('🎉 ALL FIREBASE INTEGRATION TESTS PASSED!')
    console.log('=' .repeat(60))
    console.log('\n✅ Firebase SDK: OK')
    console.log('✅ Firestore Connection: OK')
    console.log('✅ Write Operations: OK')
    console.log('✅ Read Operations: OK')
    console.log('✅ Query Operations: OK')
    console.log('✅ Cleanup Operations: OK')
    console.log('\n🚀 Your Firebase integration is working correctly!')
    console.log('📝 You can now create advertisements through the app interface.')
    
    process.exit(0)
    
  } catch (error) {
    console.error('\n❌ Firebase Validation Failed!')
    console.error('=' .repeat(60))
    console.error('Error:', error.message)
    
    if (error.code) {
      console.error('Error Code:', error.code)
    }
    
    console.error('\n💡 Troubleshooting Tips:')
    
    if (error.code === 'permission-denied') {
      console.error('   - Check Firestore security rules')
      console.error('   - Ensure the Firebase project allows writes')
    } else if (error.code === 'unavailable' || error.message.includes('UNAVAILABLE')) {
      console.error('   - Check your internet connection')
      console.error('   - Verify Firebase project is accessible')
      console.error('   - Check if firestore.googleapis.com is reachable')
    } else if (error.code === 'invalid-api-key') {
      console.error('   - Verify your Firebase API key is correct')
      console.error('   - Check environment variables or .env.local file')
    } else {
      console.error('   - Check your Firebase configuration')
      console.error('   - Verify all environment variables are set correctly')
      console.error('   - Review Firestore security rules')
    }
    
    console.error('\n📚 Documentation: https://firebase.google.com/docs/firestore')
    
    process.exit(1)
  }
}

// Run validation
validateFirebase()

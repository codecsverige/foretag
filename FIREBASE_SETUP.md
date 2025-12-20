# Firebase Configuration Guide

This document provides instructions for setting up and verifying Firebase configuration for the BokaNära project.

## 🔧 Setup Steps

### 1. Create .env.local File

Copy the example environment file:

```bash
cp .env.example .env.local
```

### 2. Verify Firebase Keys

The `.env.local` file should contain the following Firebase configuration keys from the Firebase Console:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyBogjhVj-jDGKJHwJEh3DmZHR-JnT7cduo
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=bokanara-4797d.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=bokanara-4797d
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=bokanara-4797d.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=980354990772
NEXT_PUBLIC_FIREBASE_APP_ID=1:980354990772:web:d02b0018fad7ef6dc90de1
```

**⚠️ Note:** These keys match the Firebase project `bokanara-4797d`.

### 3. How to Get Firebase Keys from Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select the project: **bokanara-4797d**
3. Click the gear icon ⚙️ next to "Project Overview"
4. Navigate to: **Project Settings** → **General** → **Your apps** → **Web app**
5. Copy the configuration values

### 4. Verify Firebase Project Settings

In the Firebase Console, ensure the following are configured:

#### Firestore Database
- Location: Set up in production mode
- Rules: Deployed from `firestore.rules`
- Indexes: Deployed from `firestore.indexes.json`

#### Authentication
- Enable sign-in methods (currently set to allow anonymous users temporarily)
- Google Sign-in: Not yet configured
- Email/Password: Not yet configured

## 🔍 Testing Firebase Configuration

### Test 1: Check Console Logs

When you run the application, check the browser console for:

```
✅ Firebase initialized successfully with project: bokanara-4797d
✅ Firestore initialized successfully
```

### Test 2: Create a Test Company

1. Run the development server:
   ```bash
   npm run dev
   ```

2. Navigate to: http://localhost:3000/skapa

3. Fill in the company creation form:
   - Company Name: Test Company
   - Category: Select any
   - City: Stockholm
   - Description: Test description
   - Phone: 08-123 45 67
   - Add at least one service with a price

4. Submit the form

5. Check console logs for:
   ```
   📝 Attempting to save to Firestore...
   ✅ Successfully saved to Firestore with ID: [document-id]
   Company data: { name: 'Test Company', category: '...', city: 'Stockholm', status: 'active' }
   ```

### Test 3: Verify on Homepage

1. After creating a company, navigate to: http://localhost:3000

2. The company should appear in the "🆕 Nya företag" section

3. If companies don't appear, check:
   - Browser console for Firestore errors
   - Firebase Console → Firestore Database → `companies` collection
   - Verify the document has `status: 'active'`

## 🐛 Common Issues and Solutions

### Issue 1: "permission-denied" Error

**Symptom:** Console shows:
```
❌ Firestore error details: { code: 'permission-denied', ... }
Behörighet nekad. Kontrollera Firebase-regler.
```

**Solution:**
1. Check Firestore rules allow anonymous writes (temporarily enabled)
2. In `firestore.rules`, verify:
   ```javascript
   match /companies/{companyId} {
     allow create: if isSignedIn() 
       && request.resource.data.ownerId == request.auth.uid;
   }
   ```
3. Current workaround: `ownerId: 'anonymous'` is used temporarily until auth is fully configured

### Issue 2: "unavailable" Error

**Symptom:** Console shows:
```
❌ Firestore error details: { code: 'unavailable', ... }
Firebase-tjänsten är inte tillgänglig. Kontrollera anslutningen.
```

**Solution:**
1. Check internet connection
2. Verify Firebase project is active in Firebase Console
3. Check if there are any Firebase service outages

### Issue 3: Companies Not Appearing on Homepage

**Possible Causes:**
1. **Status mismatch:** Ensure companies are created with `status: 'active'`
2. **Query issue:** Homepage queries for `status === 'active'`
3. **Timestamp issue:** Check if `createdAt` field is properly set

**Debug Steps:**
1. Open Firebase Console → Firestore Database
2. Check `companies` collection
3. Verify document fields:
   - `status` should be `"active"`
   - `createdAt` should be a timestamp
   - Required fields: `name`, `category`, `city`, `description`

### Issue 4: Firebase Not Initialized

**Symptom:** Console shows:
```
⚠️ Firestore not initialized. Saving to localStorage.
```

**Solution:**
1. Verify `.env.local` exists and contains all required keys
2. Restart the development server
3. Check browser console for initialization errors

## 📊 Database Status Field

**Important:** Companies use `status: 'active'` (not 'published')

Valid status values:
- `"active"` - Company is visible and can receive bookings
- `"pending"` - Company is awaiting approval (not yet implemented)

Queries filter by:
```javascript
where('status', '==', 'active')
```

## 🚀 Deployment Checklist

When deploying to Vercel:

1. ✅ Add all Firebase environment variables in Vercel Dashboard
2. ✅ Deploy Firestore rules: `firebase deploy --only firestore:rules`
3. ✅ Deploy Firestore indexes: `firebase deploy --only firestore:indexes`
4. ✅ Verify environment variables are set in Vercel project settings
5. ✅ Test company creation on production URL

## 📝 Current Configuration Status

- **Firebase Project:** bokanara-4797d
- **Authentication:** Anonymous mode (temporary)
- **Firestore Rules:** Allow anonymous company creation
- **Status Field:** Uses `"active"` (not "published")
- **Error Handling:** ✅ Improved with detailed logging
- **Fallback:** LocalStorage backup if Firestore fails

## 🔐 Security Notes

**Current Temporary Settings:**
- Anonymous company creation is allowed (`ownerId: 'anonymous'`)
- This is temporary until proper authentication is implemented

**Future Security Improvements:**
1. Enable Firebase Authentication (Google + Email/Password)
2. Update Firestore rules to require authenticated users
3. Update company creation to use real user IDs
4. Add company ownership verification

## 📞 Support

If you encounter issues:
1. Check browser console for detailed error logs
2. Verify Firebase Console configuration
3. Review this document for common solutions
4. Check GitHub Issues for similar problems

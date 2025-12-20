# Quick Testing Guide

## Prerequisites
Ensure you have a `.env.local` file with the following variables:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyBogjhVj-jDGKJHwJEh3DmZHR-JnT7cduo
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=bokanara-4797d.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=bokanara-4797d
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=bokanara-4797d.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=980354990772
NEXT_PUBLIC_FIREBASE_APP_ID=1:980354990772:web:d02b0018fad7ef6dc90de1
```

## Quick Test Flow

### 1. Start Development Server
```bash
npm run dev
```

### 2. Open Browser Console
- Open Chrome/Firefox DevTools (F12)
- Check Console tab for Firebase validation message:
  - ✅ Should see: "Firebase configured for BokaNära project"
  - ⚠️ If you see warnings about missing env vars, check your .env.local

### 3. Test Homepage Real-Time Updates

**Option A: Two Browser Windows**
1. Open `http://localhost:3000` in Window 1
2. Open `http://localhost:3000/skapa` in Window 2
3. Create a new company in Window 2:
   - Fill in: Name, Category, City, Description, Phone
   - Add at least one service with price
   - Set opening hours
   - Click "Publicera annons"
4. Look at Window 1 (homepage) - it should update automatically!
5. The new company should appear in "🆕 Nya företag" section

**Option B: Single Window**
1. Open `http://localhost:3000`
2. Note the number of companies shown (or if empty state is shown)
3. Go to `/skapa` and create a company
4. After success message, click "Tillbaka till startsidan"
5. Homepage should show your new company immediately

### 4. Test Loading State
1. Open homepage in Incognito/Private window
2. Clear browser cache (Ctrl+Shift+Del)
3. Reload page
4. You should briefly see: "⏳ Laddar företag..."

### 5. Test Empty State
On a fresh/empty Firestore database:
1. Open homepage
2. Should see: "🏢 Var först med att lista ditt företag!"

### 6. Test Error Handling

**Test 1: Required Field Validation**
1. Go to `/skapa`
2. Try clicking "Nästa" without filling any fields
3. Button should be disabled

**Test 2: Service Validation**
1. Go to `/skapa`, fill Step 1
2. In Step 2, leave service name or price empty
3. Try clicking "Nästa"
4. Button should be disabled

**Test 3: Network Error Simulation**
1. Open DevTools → Network tab
2. Set throttling to "Offline"
3. Try to create a company
4. You should see retry attempts in console
5. Should eventually show error message

### 7. Verify Firestore Data
1. Go to Firebase Console: https://console.firebase.google.com/
2. Select project: `bokanara-4797d`
3. Go to Firestore Database
4. Check `companies` collection
5. Verify your created company exists with all fields

## Console Messages to Expect

### Successful Flow:
```
✅ Firebase initialized successfully
✅ Firebase configured for BokaNära project
✅ Company saved to Firestore: [ID]
```

### With Retry (simulated network issue):
```
⚠️ Firestore operation failed (attempt 1/3): [error message]
⚠️ Firestore operation failed (attempt 2/3): [error message]
✅ Company saved to Firestore: [ID]
```

### Configuration Warning:
```
⚠️ WARNING: Project ID is "xxx", expected "bokanara-4797d"
⚠️ Make sure you are connected to the correct Firebase project!
```

## Expected Behavior

### ✅ What Should Work:
- Homepage shows loading state briefly on first load
- Creating a company saves to Firestore immediately
- Homepage updates in real-time when new company is created
- Retry logic handles temporary network failures
- Clear error messages when something goes wrong
- Premium companies show with "⭐ Premium" badge
- Companies sorted by creation date (newest first)

### 🎯 Performance:
- Homepage should load in < 2 seconds
- Real-time updates appear within 1 second
- No page refresh needed to see new companies

## Common Issues

### Issue: "Firebase er inte konfigureret korrekt"
**Solution**: Create `.env.local` with all NEXT_PUBLIC_FIREBASE_* variables

### Issue: Companies not appearing on homepage
**Solution**: 
1. Check Firestore security rules allow read access
2. Verify company `status` field is set to "active"
3. Check browser console for errors

### Issue: "permission-denied" error
**Solution**: Update Firestore security rules to allow anonymous writes:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /companies/{companyId} {
      allow read: if true;
      allow write: if true; // Temporarily for testing
    }
  }
}
```

### Issue: Real-time updates not working
**Solution**:
1. Check if Firebase is initialized (see console)
2. Verify `onSnapshot` listeners are set up (see console)
3. Hard refresh the page (Ctrl+F5)

## Build & Deploy Test

### Build for Production:
```bash
npm run build
npm start
```

Access at: `http://localhost:3000`

### Deploy to Vercel:
Ensure environment variables are set in Vercel Dashboard:
- Settings → Environment Variables
- Add all `NEXT_PUBLIC_FIREBASE_*` variables
- Redeploy

## Success Criteria
- [ ] Homepage loads without errors
- [ ] Can create a new company successfully
- [ ] New company appears on homepage automatically
- [ ] Loading state shows during initial fetch
- [ ] Error state shows when Firestore is unavailable
- [ ] Empty state shows when no companies exist
- [ ] Console shows validation messages
- [ ] Build completes successfully
- [ ] Linter passes
- [ ] No TypeScript errors

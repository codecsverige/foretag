# 🔍 Testing Guide - Firebase & Firestore Integration

This guide helps you verify that all Firebase and Firestore functionality is working correctly after the configuration updates.

---

## 📋 What Was Fixed

### Critical Issues Resolved ✅

1. **AuthProvider Missing in Layout**
   - **Problem:** AuthProvider was implemented but not wrapping the application
   - **Solution:** Added `<AuthProvider>` wrapper in `app/layout.tsx`
   - **Impact:** Authentication context now available to all components

2. **Build Failing Due to Google Fonts**
   - **Problem:** Google Fonts blocked by network restrictions during build
   - **Solution:** Removed external font dependency, using system fonts instead
   - **Impact:** Successful builds with no external dependencies

3. **Header Not Showing User State**
   - **Problem:** Header component didn't display user login state
   - **Solution:** Integrated useAuth() to show login/account based on user state
   - **Impact:** Users can now see their account status and access their profile

4. **Create Page Not Using Authenticated User**
   - **Problem:** Company creation used 'anonymous' even when user was logged in
   - **Solution:** Updated to use authenticated user's uid, displayName, and email
   - **Impact:** Companies properly associated with their owners

---

## 🧪 Test Scenarios

### Test 1: Google Sign-In Authentication

**Prerequisites:**
- Firebase Console has Google Sign-In enabled
- Domain added to Authorized domains

**Steps:**
1. Navigate to `http://localhost:3000/login` (or your deployment URL)
2. Click **"Logga in med Google"** button
3. Google account selection popup should appear
4. Select your Google account
5. Should redirect to home page (`/`)
6. Header should show user avatar (first letter of name)
7. Click avatar → should navigate to `/konto`

**Expected Results:**
- ✅ Google popup opens without errors
- ✅ Authentication succeeds
- ✅ User redirected to home page
- ✅ Header shows user avatar/name
- ✅ Account page shows user details

**Verification in Firebase Console:**
- Go to **Authentication** → **Users**
- Should see new user with Google provider
- User should have email, display name, and photo URL

---

### Test 2: Email/Password Registration & Login

**Prerequisites:**
- Firebase Console has Email/Password Sign-In enabled

**Steps - Registration:**
1. Navigate to `http://localhost:3000/registrera`
2. Fill in:
   - Name: "Test User"
   - Email: "test@example.com"
   - Password: "test123" (min 6 characters)
   - Confirm Password: "test123"
3. Click **"Registrera"** button
4. Should redirect to home page (`/`)
5. Header should show user avatar with "T"

**Steps - Login:**
1. Logout (from `/konto` page)
2. Navigate to `/login`
3. Enter email: "test@example.com"
4. Enter password: "test123"
5. Click **"Logga in"** button
6. Should authenticate and redirect to home

**Expected Results:**
- ✅ Registration succeeds without errors
- ✅ User document created in Firestore
- ✅ Can login with created credentials
- ✅ Header shows user state correctly

**Verification in Firebase Console:**
- Go to **Authentication** → **Users**
- Should see user with Email/Password provider
- Go to **Firestore Database** → **Data** → **users** collection
- Should see document with user's UID containing email and displayName

---

### Test 3: Create Company (Firestore Write)

**Prerequisites:**
- User must be logged in (Google or Email/Password)
- Firestore rules deployed
- Firestore database created

**Steps:**
1. Login to the application
2. Navigate to `/skapa` (or click "Skapa annons" in header)
3. Fill out Step 1 - Basic Info:
   - Company Name: "Test Frisör"
   - Category: Select "Frisör"
   - City: Select "Stockholm"
   - Address: "Testgatan 123"
   - Description: "En test frisörsalong"
   - Phone: "08-123 45 67"
4. Click **"Nästa: Tjänster"**
5. Fill out Step 2 - Services:
   - Service Name: "Herrklippning"
   - Price: "300"
   - Duration: "30"
6. Click **"Nästa: Öppettider"**
7. Review opening hours (defaults are fine)
8. Click **"Publicera annons"**
9. Should see success screen
10. Click **"Visa din sida"** to view company page

**Expected Results:**
- ✅ Form submission succeeds without errors
- ✅ Success screen shows with company ID
- ✅ Company page loads with entered data
- ✅ Company shows owner information

**Verification in Firebase Console:**
- Go to **Firestore Database** → **Data** → **companies** collection
- Should see new document with:
  - `name`: "Test Frisör"
  - `ownerId`: Your user's UID (not "anonymous")
  - `ownerName`: Your display name
  - `ownerEmail`: Your email
  - `services`: Array with service details
  - `createdAt`: Recent timestamp
  - `status`: "active"

**Verification in Application:**
- Go to `/konto` (Account page)
- Should see "Test Frisör" in "Mina företag" tab
- Should show edit/delete buttons (you're the owner)

---

### Test 4: Firestore Read Operations

**Prerequisites:**
- At least one company created in database

**Steps:**
1. Navigate to home page `/`
2. Companies should be displayed (if any exist)
3. Navigate to `/sok` (Search page)
4. Select category "Frisör"
5. Select city "Stockholm"
6. Click search
7. Should see "Test Frisör" in results
8. Click on company card
9. Should navigate to company detail page
10. Company details should display correctly

**Expected Results:**
- ✅ Companies load on home page
- ✅ Search filters work correctly
- ✅ Company card shows basic info
- ✅ Company detail page loads full data
- ✅ Services and opening hours display

---

### Test 5: Security Rules Enforcement

**Prerequisites:**
- Firestore rules deployed
- Browser DevTools open (Console tab)

**Steps - Try to Create Without Auth:**
1. Logout from application (if logged in)
2. Navigate to `/skapa`
3. Fill out form completely
4. Submit the form
5. Check console for errors

**Expected Results:**
- ✅ If SKIP_AUTH is true: Should save to localStorage as fallback
- ✅ If SKIP_AUTH is false: Should redirect to `/login`
- ✅ Firestore write should fail with "permission-denied" if not authenticated

**Steps - Try to Edit Someone Else's Company:**
1. Login with User A
2. Create a company (note the ID)
3. Logout
4. Login with User B
5. Try to navigate to `/redigera/{company-id-from-user-a}`
6. Try to edit and save

**Expected Results:**
- ✅ Firestore should reject the update
- ✅ Error: "Missing or insufficient permissions"
- ✅ User B can view but not edit User A's company

---

### Test 6: Account Page & User Data

**Prerequisites:**
- User logged in with at least one company created

**Steps:**
1. Navigate to `/konto`
2. Check profile section:
   - Should show avatar/initial
   - Should show display name
   - Should show email
3. Check "Mina företag" tab:
   - Should list your companies
   - Should show company details
   - Should show edit/delete buttons
4. Click **"Logga ut"** button
5. Should redirect to home page
6. Header should show "Logga in" instead of avatar

**Expected Results:**
- ✅ Account page loads user data
- ✅ Companies list shows owned companies only
- ✅ Logout clears user state
- ✅ Header updates after logout

---

## 🔧 Developer Testing

### Test with Firebase Emulator (Optional)

For safer testing without affecting production data:

```bash
# Install Firebase tools if not already installed
npm install -g firebase-tools

# Start emulators
firebase emulators:start

# Update .env.local to point to emulators
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=localhost
NEXT_PUBLIC_FIREBASE_FIRESTORE_HOST=localhost:8080
```

### Test Offline Mode

Firestore automatically handles offline mode:

1. Login and load some data
2. Open DevTools → Network tab
3. Set throttling to "Offline"
4. Try to create a company
5. Data should be queued locally
6. Enable network again
7. Data should sync to Firestore

---

## 🚨 Troubleshooting

### Authentication Issues

**Error: "auth/unauthorized-domain"**
- **Solution:** Add domain to Authorized domains in Firebase Console
- **Location:** Authentication → Settings → Authorized domains

**Error: "auth/popup-blocked"**
- **Solution:** Allow popups in browser settings
- **Note:** Use redirect-based auth if popups are problematic

**Error: "auth/configuration-not-found"**
- **Solution:** Enable Google/Email provider in Firebase Console
- **Location:** Authentication → Sign-in method

### Firestore Issues

**Error: "Missing or insufficient permissions"**
- **Solution:** Deploy Firestore rules: `firebase deploy --only firestore:rules`
- **Verify:** Check rules in Firebase Console → Firestore → Rules

**Error: "Firestore not initialized"**
- **Solution:** Check environment variables are set correctly
- **Verify:** All vars have `NEXT_PUBLIC_` prefix

**Data not appearing:**
- **Check:** User is authenticated
- **Check:** Firestore rules allow the operation
- **Check:** Console for JavaScript errors
- **Verify:** Data exists in Firebase Console

---

## 📊 Performance Testing

### Load Time Tests

1. **Cold Start (No Cache):**
   - Clear browser cache
   - Navigate to `/`
   - Should load in < 3 seconds

2. **Authenticated Load:**
   - Login to application
   - Navigate to `/konto`
   - Should load user data in < 2 seconds

3. **Company List:**
   - Navigate to `/sok`
   - Search with filters
   - Results should appear in < 1 second

### Stress Testing

1. Create 10+ companies
2. Check query performance on `/sok`
3. Verify pagination works (if implemented)
4. Check Firestore Console for read counts

---

## ✅ Acceptance Criteria

All tests should pass before considering the implementation complete:

- [ ] Google Sign-In works without errors
- [ ] Email/Password registration and login work
- [ ] User can create a company while authenticated
- [ ] Created company shows correct owner information (not "anonymous")
- [ ] Company data persists in Firestore
- [ ] User can view their companies in account page
- [ ] Security rules prevent unauthorized edits
- [ ] Logout clears user state correctly
- [ ] Header displays user state correctly
- [ ] No console errors during normal operation
- [ ] Build completes successfully
- [ ] No security vulnerabilities detected

---

## 📝 Next Steps After Testing

Once all tests pass:

1. **Remove SKIP_AUTH flag** (in `app/skapa/page.tsx`) to require authentication
2. **Deploy to production** via Vercel
3. **Monitor Firebase Console** for usage and errors
4. **Set up alerts** for quota limits
5. **Configure custom domain** if needed
6. **Enable analytics** for user behavior tracking

---

**Happy Testing! 🎉**

If all tests pass, your Firebase and Firestore integration is working correctly!

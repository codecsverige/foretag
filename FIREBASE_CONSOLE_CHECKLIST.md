# 🔧 Firebase Console Configuration Checklist

This checklist ensures that all necessary Firebase services are properly enabled and configured in the Firebase Console before deploying the BokaNära application.

---

## ⚠️ Prerequisites

Before starting, ensure you have:
- [ ] Access to [Firebase Console](https://console.firebase.google.com/)
- [ ] Firebase project created (project ID: `bokanara-4797d` or your custom project ID)
- [ ] Firebase CLI installed: `npm install -g firebase-tools`

---

## 🔐 Step 1: Enable Authentication Methods

### Enable Google Sign-In ✅

1. Open [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Authentication** → **Sign-in method**
4. Click on **Google** provider row
5. Toggle the **Enable** switch ON
6. Set **Project support email** (required by Google)
7. Click **Save**

**Verification:**
- ✅ Google provider shows as "Enabled" in the Sign-in method list

### Enable Email/Password Sign-In ✅

1. In **Authentication** → **Sign-in method**
2. Click on **Email/Password** provider row
3. Toggle **Enable** switch ON (first option only)
4. Do NOT enable "Email link (passwordless sign-in)" - not needed
5. Click **Save**

**Verification:**
- ✅ Email/Password provider shows as "Enabled" in the Sign-in method list

---

## 🌐 Step 2: Add Authorized Domains

### Why This Is Critical
Without authorized domains, authentication will fail with error:
```
auth/unauthorized-domain: This domain is not authorized for OAuth operations
```

### Add Required Domains

1. Navigate to **Authentication** → **Settings** → **Authorized domains**
2. Verify `localhost` is already in the list (added by default)
3. Click **Add domain** and add each of the following:

**Development:**
- ✅ `localhost` (should already exist)

**Production (add these):**
- ✅ Your Vercel preview domain: `your-app.vercel.app`
- ✅ Your Vercel production domain: `your-app-production.vercel.app`
- ✅ Your custom domain (if any): `bokanara.se`

**Important:** 
- Each deployment branch on Vercel gets a unique URL - you may need to add multiple domains
- Or use a wildcard approach by adding your main Vercel domain

---

## 🗄️ Step 3: Create Firestore Database

### Initialize Firestore

1. Navigate to **Firestore Database** in the left sidebar
2. Click **Create database**
3. Choose **Start in production mode** (we have custom security rules)
4. Select location: **europe-west3 (Belgium)** - closest to Sweden
5. Click **Enable**

**Verification:**
- ✅ Firestore Database shows as "Created"
- ✅ Location is set to europe-west3

### Deploy Security Rules

From your project directory:

```bash
# Login to Firebase (if not already logged in)
firebase login

# Initialize Firebase project
firebase init

# Select:
# - Firestore: Configure security rules and indexes files
# - Use existing project: bokanara-4797d

# Deploy the rules
firebase deploy --only firestore:rules
```

**Verification in Firebase Console:**
1. Go to **Firestore Database** → **Rules**
2. Rules should show custom rules, not the default test mode
3. Look for collections: users, companies, bookings, reviews, etc.
4. Published date should be recent

### Deploy Firestore Indexes

```bash
firebase deploy --only firestore:indexes
```

**Verification:**
1. Go to **Firestore Database** → **Indexes**
2. Should show composite indexes (if any defined in firestore.indexes.json)

---

## 📦 Step 4: Configure Storage (Optional)

If you plan to allow image uploads (company logos, etc.):

1. Navigate to **Storage** in the left sidebar
2. Click **Get started**
3. Choose **Start in production mode**
4. Select the same location as Firestore: **europe-west3**
5. Click **Done**

**Verification:**
- ✅ Storage bucket created
- ✅ Location matches Firestore

---

## 🌍 Step 5: Set Environment Variables

### For Local Development

Create `.env.local` in project root:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyBogjhVj-jDGKJHwJEh3DmZHR-JnT7cduo
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=bokanara-4797d.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=bokanara-4797d
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=bokanara-4797d.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=980354990772
NEXT_PUBLIC_FIREBASE_APP_ID=1:980354990772:web:d02b0018fad7ef6dc90de1
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### For Vercel Production

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Navigate to **Settings** → **Environment Variables**
4. Add each variable from above
5. Set `NEXT_PUBLIC_APP_URL` to your production URL

---

## 🧪 Step 6: Test Configuration

### Test Locally

1. Start development server:
   ```bash
   npm run dev
   ```

2. Open `http://localhost:3000`

3. Test Google Sign-In:
   - Navigate to `/login`
   - Click "Logga in med Google"
   - Should open Google account selection
   - Should successfully authenticate

4. Test Email/Password Sign-In:
   - Navigate to `/registrera`
   - Create account with email/password
   - Should successfully create account
   - Try logging in at `/login`

5. Test Firestore Write:
   - Login to the app
   - Navigate to `/skapa` (Create company)
   - Fill out form and submit
   - Check Firebase Console → Firestore Database
   - Verify company document created with your UID as ownerId

### Verify in Firebase Console

**Authentication:**
- [ ] Check **Authentication** → **Users** tab
- [ ] Should see your test user(s)
- [ ] Verify provider (Google or Email)

**Firestore:**
- [ ] Check **Firestore Database** → **Data** tab
- [ ] Should see `users` collection with your user document
- [ ] Should see `companies` collection (if you created a company)
- [ ] Verify data structure matches expected schema

---

## 🚨 Common Issues and Solutions

### Issue: "auth/unauthorized-domain"
**Solution:** Add your domain to Authorized domains in Firebase Console

### Issue: "Missing or insufficient permissions"
**Solution:** 
1. Check that Firestore rules are deployed: `firebase deploy --only firestore:rules`
2. Verify user is authenticated before writing data
3. Check that `ownerId` in document matches authenticated user's UID

### Issue: "Firebase not initialized"
**Solution:**
1. Verify all environment variables are set
2. Check that variables have `NEXT_PUBLIC_` prefix (required for client-side)
3. Restart development server after changing `.env.local`

### Issue: "Could not reach Cloud Firestore backend"
**Solution:** This is expected during build (SSG) - Firestore works in offline mode. Not a problem.

---

## ✅ Final Checklist

Before going to production, verify:

- [ ] Google Sign-In enabled in Firebase Console
- [ ] Email/Password Sign-In enabled in Firebase Console
- [ ] Production domain(s) added to Authorized domains
- [ ] Firestore Database created in appropriate region
- [ ] Firestore security rules deployed
- [ ] Firestore indexes deployed
- [ ] Storage configured (if needed)
- [ ] Environment variables set in Vercel
- [ ] Test authentication working (Google + Email)
- [ ] Test Firestore read/write working
- [ ] Test user data persists correctly
- [ ] Check Firebase Console Users tab shows authenticated users
- [ ] Check Firestore Data tab shows created documents

---

## 📊 Monitoring

After deployment, monitor:

1. **Firebase Console → Authentication → Users**
   - Track new user registrations
   - Monitor authentication methods used

2. **Firebase Console → Firestore → Usage**
   - Monitor read/write operations
   - Watch for quota limits (50K reads/day on free tier)

3. **Vercel Logs**
   - Check for runtime errors
   - Monitor API response times

---

## 🆘 Getting Help

If you encounter issues:

1. Check [Firebase Documentation](https://firebase.google.com/docs)
2. Review [Firestore Security Rules Guide](https://firebase.google.com/docs/firestore/security/get-started)
3. See detailed setup in `FIREBASE_SETUP.md`
4. Check project's GitHub Issues
5. Contact: support@bokanara.se

---

**Configuration Complete! 🎉**

Once all items are checked, your Firebase/Firestore setup is complete and the application is ready for production deployment.

# 🔥 Firebase Setup Guide for BokaNära

This guide provides step-by-step instructions for configuring Firebase and Firestore for the BokaNära application.

---

## 📋 Prerequisites

- A Google account
- Access to [Firebase Console](https://console.firebase.google.com/)
- Firebase CLI installed: `npm install -g firebase-tools`

---

## 1️⃣ Create Firebase Project

### Step 1: Create New Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"** or **"Create a project"**
3. Enter project name: `bokanara-4797d` (or your preferred name)
4. Choose whether to enable Google Analytics (recommended)
5. Click **"Create project"**

### Step 2: Register Web App

1. In Firebase Console, click the **Web icon** (</>) to add a web app
2. Enter app nickname: `BokaNära Web`
3. Check **"Also set up Firebase Hosting"** (optional)
4. Click **"Register app"**
5. Copy the Firebase configuration object - you'll need this for `.env.local`

---

## 2️⃣ Configure Authentication

### Enable Google Sign-In ✅

1. Navigate to **Authentication** → **Sign-in method**
2. Click on **Google** provider
3. Toggle **"Enable"**
4. Set Project support email
5. Click **"Save"**

### Enable Email/Password Sign-In ✅

1. Navigate to **Authentication** → **Sign-in method**
2. Click on **Email/Password** provider
3. Toggle **"Enable"** (first option only, not passwordless)
4. Click **"Save"**

### Configure Authorized Domains ✅

1. Navigate to **Authentication** → **Settings** → **Authorized domains**
2. By default, `localhost` should already be there
3. Add your production domain(s):
   - Your Vercel domain: `your-app.vercel.app`
   - Custom domain if you have one: `bokanara.se`
4. Click **"Add domain"** for each

**⚠️ Important:** Without adding your domains here, authentication will fail with "unauthorized-domain" error!

---

## 3️⃣ Configure Firestore Database

### Create Firestore Database

1. Navigate to **Firestore Database** in Firebase Console
2. Click **"Create database"**
3. Choose **"Start in production mode"** (we have custom rules)
4. Select a location: **europe-west3** (Belgium) recommended for Sweden
5. Click **"Enable"**

### Deploy Security Rules

The project includes comprehensive security rules in `firestore.rules`. Deploy them:

```bash
# Login to Firebase
firebase login

# Initialize Firebase in project (if not done)
firebase init

# Deploy Firestore rules
firebase deploy --only firestore:rules

# Deploy Firestore indexes
firebase deploy --only firestore:indexes
```

### Verify Rules Are Active

1. In Firebase Console, go to **Firestore Database** → **Rules**
2. You should see the custom rules from `firestore.rules`
3. The rules should include collections: users, companies, bookings, reviews, etc.

---

## 4️⃣ Configure Firebase Storage (Optional)

If you plan to allow image uploads:

1. Navigate to **Storage** in Firebase Console
2. Click **"Get started"**
3. Choose **"Start in production mode"**
4. Select the same location as Firestore
5. Click **"Done"**

---

## 5️⃣ Environment Variables

### Local Development

Create `.env.local` in the project root:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyBogjhVj-jDGKJHwJEh3DmZHR-JnT7cduo
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=bokanara-4797d.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=bokanara-4797d
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=bokanara-4797d.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=980354990772
NEXT_PUBLIC_FIREBASE_APP_ID=1:980354990772:web:d02b0018fad7ef6dc90de1

# Application URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Vercel Production

1. Go to your Vercel project
2. Navigate to **Settings** → **Environment Variables**
3. Add all `NEXT_PUBLIC_*` variables from above
4. Set `NEXT_PUBLIC_APP_URL` to your production domain

---

## 6️⃣ Firestore Collections Structure

The application uses the following collections:

### 👤 `users/`
- Stores user profiles
- **Security:** Users can read all, create/update only their own document

### 🏢 `companies/`
- Stores company listings
- **Security:** Public read, authenticated users can create, only owners can update/delete

### 📅 `bookings/`
- Stores booking information
- **Security:** Only customer and company owner can read their bookings

### ⭐ `reviews/`
- Stores company reviews
- **Security:** Public read, authenticated users can create their own reviews

### 🔔 `notifications/`
- Stores user notifications
- **Security:** Users can only read/update their own notifications

For detailed schema, see the main `README.md`.

---

## 7️⃣ Testing Firebase Configuration

### Test Authentication

1. Start the development server: `npm run dev`
2. Navigate to `http://localhost:3000/login`
3. Try Google Sign-In:
   - Should open Google account selection
   - Should successfully authenticate and redirect
4. Try Email/Password Sign-In:
   - Register at `/registrera`
   - Login at `/login`

### Test Firestore Operations

1. Login to the application
2. Navigate to `/skapa` (Create company)
3. Fill out the form and submit
4. Check Firebase Console → Firestore Database
5. Verify the company document was created
6. Check that `ownerId` matches your user UID

### Common Issues

#### "auth/unauthorized-domain"
- **Solution:** Add your domain to Authorized domains in Firebase Console

#### "Missing or insufficient permissions"
- **Solution:** Deploy Firestore rules with `firebase deploy --only firestore:rules`

#### "Firebase not initialized"
- **Solution:** Check that all environment variables are set correctly

---

## 8️⃣ Cloud Functions Setup (Optional)

For SMS reminders and other backend logic:

```bash
# Navigate to functions directory
cd functions

# Install dependencies
npm install

# Deploy functions
firebase deploy --only functions
```

Configure environment variables for Cloud Functions:

```bash
# SMS Provider (46elks, Twilio, or Sinch)
firebase functions:config:set sms.provider="46elks"
firebase functions:config:set sms.api_key="YOUR_API_KEY"
firebase functions:config:set sms.api_secret="YOUR_API_SECRET"
firebase functions:config:set sms.sender="BokaNara"
```

---

## 9️⃣ Security Best Practices

### ✅ Do's

- ✅ Keep Firebase config in environment variables
- ✅ Use `NEXT_PUBLIC_*` prefix for client-side variables
- ✅ Deploy Firestore rules to restrict access
- ✅ Use Firebase Auth for authentication
- ✅ Validate data on both client and server
- ✅ Use server-side Cloud Functions for sensitive operations

### ❌ Don'ts

- ❌ Never commit `.env.local` to Git
- ❌ Never expose Firebase API keys in public repositories (they're ok in client code as they're meant to be public, but protect with security rules)
- ❌ Never use admin SDK credentials in client code
- ❌ Never allow unauthenticated writes without proper validation
- ❌ Never skip Firestore security rules

---

## 🔟 Monitoring and Maintenance

### Firebase Console Monitoring

1. **Authentication:** Monitor sign-in methods, users
2. **Firestore:** Monitor reads/writes, data usage
3. **Usage:** Check quotas and billing
4. **Performance:** Use Firebase Performance Monitoring

### Important Quotas (Free Tier)

- **Firestore:**
  - 50K document reads/day
  - 20K document writes/day
  - 20K document deletes/day
  - 1 GiB storage

- **Authentication:**
  - Unlimited (on Spark plan)

- **Cloud Functions:**
  - 125K invocations/month
  - 40K GB-seconds
  - 40K CPU-seconds

---

## 📞 Support

If you encounter issues:

1. Check [Firebase Documentation](https://firebase.google.com/docs)
2. Review [Firestore Security Rules Guide](https://firebase.google.com/docs/firestore/security/get-started)
3. Check the project's GitHub Issues
4. Contact: support@bokanara.se

---

## ✅ Configuration Checklist

Before deploying to production, verify:

- [ ] Firebase project created
- [ ] Google Sign-In enabled
- [ ] Email/Password Sign-In enabled
- [ ] Production domains added to Authorized domains
- [ ] Firestore database created in appropriate region
- [ ] Firestore security rules deployed
- [ ] Firestore indexes deployed
- [ ] Environment variables set in Vercel
- [ ] Storage configured (if needed)
- [ ] Cloud Functions deployed (if needed)
- [ ] SMS provider configured (if needed)
- [ ] Test authentication working
- [ ] Test Firestore read/write working
- [ ] Production domain points to Vercel
- [ ] SSL certificate active

---

**Happy Coding! 🚀**

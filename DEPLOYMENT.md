# 🚀 Deployment Guide - Fix for Ads Display Issue

## Overview
This guide covers deploying the fixes for the issue where created ads don't appear on the home page.

## Changes Made

### 1. Missing Firestore Index
**Problem**: The query `where('status', '==', 'active').orderBy('createdAt', 'desc')` was missing from Firestore indexes.

**Solution**: Added the index to `firestore.indexes.json`

### 2. Page Revalidation
**Problem**: Home page was cached indefinitely with no updates.

**Solution**: Added `revalidate = 60` to refresh page data every 60 seconds.

### 3. Error Logging
**Problem**: Silent failures made debugging difficult.

**Solution**: Added comprehensive logging throughout the data fetching process.

## Deployment Steps

### Important: Security Configuration

The current implementation allows anonymous company creation (without authentication) for testing purposes. This is configured in two places:

1. **Client Code** (`app/skapa/page.tsx`):
   - `SKIP_AUTH = true` allows creation without login
   - Companies are created with `ownerId: 'anonymous'`

2. **Firestore Rules** (`firestore.rules`):
   - Updated to allow anonymous creation
   - Rule: `!isSignedIn() && request.resource.data.ownerId == 'anonymous'`

⚠️ **Production Recommendation**: 
- Set `SKIP_AUTH = false` in production
- Remove the anonymous creation rule from `firestore.rules`
- Require proper authentication for company creation

### Step 1: Deploy Firestore Rules and Indexes

### Step 1: Deploy Firestore Rules and Indexes

Deploy both the security rules and indexes to Firebase:

```bash
# Deploy both rules and indexes
firebase deploy --only firestore

# Or deploy separately
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
```

**Expected Output**:
```
✔ Deploy complete!

Indexes will be created in the background. Check the Firebase Console to monitor progress.
```

**Verification**:
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: `bokanara-4797d`
3. Navigate to Firestore Database → Indexes
4. Verify the new index is being created:
   - Collection: `companies`
   - Fields: `status` (ASC), `createdAt` (DESC)
5. Wait for index status to change from "Building" to "Enabled" (may take several minutes)

### Step 2: Deploy to Vercel

Once indexes are deployed and enabled, deploy the application:

```bash
# If using Vercel CLI
vercel --prod

# Or push to main branch to trigger automatic deployment
git push origin main
```

### Step 3: Verify the Fix

1. **Create a test ad**:
   - Go to `/skapa` on your production site
   - Fill in all required fields
   - Submit the form
   - Note the company ID

2. **Check Firestore**:
   - Open Firebase Console
   - Navigate to Firestore Database → companies collection
   - Verify your new company document exists with:
     - `status: "active"`
     - `createdAt: <timestamp>`

3. **Wait and verify home page**:
   - Wait up to 60 seconds (revalidation period)
   - Refresh the home page (`/`)
   - Verify the new ad appears in the "Nya företag" section

4. **Test real-time updates**:
   - Create another ad
   - Wait 60 seconds
   - Refresh home page
   - Verify it appears

## Troubleshooting

### Issue: Ads still don't appear after 60 seconds

**Check 1: Firestore Index Status**
```bash
firebase firestore:indexes
```
Ensure all indexes are "Enabled", not "Building" or "Error"

**Check 2: Company Document Fields**
In Firebase Console, verify the company document has:
- `status: "active"` (exactly, case-sensitive)
- `createdAt: <timestamp>` (not null or undefined)

**Check 3: Server Logs**
Check deployment logs for errors:
- In Vercel: Go to your deployment → Functions → View logs
- Look for Firebase connection errors or query errors

### Issue: Index deployment fails

**Error**: "Index already exists"
- This is OK, it means the index was already present

**Error**: "Permission denied"
- Run `firebase login` again
- Ensure you have Owner/Editor role on the Firebase project

### Issue: Build fails locally

**Error**: "Cannot reach Cloud Firestore backend"
- This is expected during local build
- The error is handled gracefully
- The app will work correctly in production

## Monitoring

After deployment, monitor:

1. **Firebase Console → Firestore → Usage**
   - Check for query errors
   - Monitor read/write counts

2. **Vercel Dashboard → Deployment Logs**
   - Check for runtime errors
   - Monitor function execution times

3. **Home Page Performance**
   - First load should fetch and display ads
   - Subsequent loads should be fast (cached)
   - Every 60 seconds, data refreshes

## Configuration Reference

### Firestore Indexes Required
```json
{
  "collectionGroup": "companies",
  "fields": [
    { "fieldPath": "status", "order": "ASCENDING" },
    { "fieldPath": "createdAt", "order": "DESCENDING" }
  ]
}
```

### Environment Variables (Vercel)
Ensure these are set in Vercel project settings:
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

## Rolling Back

If issues occur, you can rollback:

1. **Vercel**: 
   - Go to Deployments
   - Find previous working deployment
   - Click "⋯" → "Promote to Production"

2. **Firestore Indexes**:
   - Indexes are additive, no need to rollback
   - Old queries will continue to work

## Support

If you encounter issues:
1. Check Firebase Console for index status
2. Check Vercel logs for runtime errors
3. Verify environment variables are set correctly
4. Test in development environment first

---

**Last Updated**: 2025-12-20
**Related Issue**: Ads not appearing on home page

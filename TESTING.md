# Testing Guide - Ads Display Fix

## Prerequisites
Before testing, ensure you have:
1. Firebase CLI installed: `npm install -g firebase-tools`
2. Logged into Firebase: `firebase login`
3. Access to the `bokanara-4797d` Firebase project
4. Node.js and npm installed

## Step 1: Deploy Firestore Configuration

Deploy the updated Firestore rules and indexes:

```bash
cd /home/runner/work/foretag/foretag

# Deploy both rules and indexes
firebase deploy --only firestore

# Wait for confirmation
# Expected output:
# ✔ Deploy complete!
```

**Important**: After deploying indexes, wait for them to finish building. Check status:
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Navigate to your project: `bokanara-4797d`
3. Go to Firestore Database → Indexes
4. Wait until all indexes show "Enabled" (not "Building")

## Step 2: Local Testing

### Option A: Test with Firebase Emulator (Recommended)

```bash
# Start Firebase emulators
firebase emulators:start

# In another terminal, start the dev server
npm run dev

# Open browser to http://localhost:3000
```

### Option B: Test with Production Firebase

```bash
# Start the dev server
npm run dev

# Open browser to http://localhost:3000
```

## Step 3: Test Ad Creation Flow

### Create a Test Ad

1. Navigate to http://localhost:3000/skapa
2. Fill in the form:
   - **Företagsnamn**: Test Frisör AB
   - **Kategori**: Frisör
   - **Stad**: Stockholm
   - **Beskrivning**: Detta är en testannons
   - **Telefon**: 08-123 45 67
   
3. Click "Nästa: Tjänster →"

4. Add a service:
   - **Namn på tjänsten**: Herrklippning
   - **Pris**: 350
   - **Tid**: 45
   
5. Click "Nästa: Öppettider →"

6. Review opening hours (default values are fine)

7. Click "🚀 Publicera annons"

8. **Expected Result**: 
   - Success message appears
   - Company ID is displayed
   - Option to view company page or return to home

### Verify in Firebase Console

1. Open [Firebase Console](https://console.firebase.google.com/)
2. Navigate to Firestore Database
3. Open the `companies` collection
4. Find your newly created company document
5. Verify it has:
   - `status: "active"`
   - `createdAt: <timestamp>`
   - All the data you entered

## Step 4: Test Home Page Display

### Immediate Test (Client-side)

1. Navigate to http://localhost:3000
2. Check if your ad appears in the "🆕 Nya företag" section
3. If not visible immediately, it's expected (SSR cache)

### Revalidation Test (Server-side)

1. Wait 60 seconds (revalidation period)
2. Refresh the page
3. Your ad should now appear in "🆕 Nya företag"

### Manual Revalidation Test

You can force a revalidation by stopping and restarting the dev server:

```bash
# Stop the dev server (Ctrl+C)
# Start it again
npm run dev

# Open browser to http://localhost:3000
# Your ad should appear immediately
```

## Step 5: Test Multiple Ads

Create 2-3 more test ads with different categories and cities:

1. **Test Ad 2**:
   - Name: Massage Studio
   - Category: Massage
   - City: Göteborg

2. **Test Ad 3**:
   - Name: Städfirma Nord
   - Category: Städning
   - City: Uppsala

3. Verify all ads appear on the home page after revalidation

## Step 6: Test Premium Ads

To test premium ads, you need to manually update a company in Firebase:

1. Open Firebase Console → Firestore
2. Select one of your test companies
3. Add/update field: `premium: true`
4. Wait 60 seconds or restart dev server
5. Verify the ad appears in "⭐ Utvalda företag" section
6. Verify it has the "⭐ Premium" badge

## Expected Behavior

### ✅ Success Indicators

1. **Ad Creation**:
   - Success message appears after submission
   - Company document exists in Firestore
   - Document has `status: "active"`

2. **Home Page Display**:
   - Ads appear within 60 seconds (or immediately after server restart)
   - Ads are in "🆕 Nya företag" section
   - Premium ads (if any) are in "⭐ Utvalda företag" section
   - Company cards show correct information

3. **Console Logs** (check browser/terminal):
   - "🔍 Fetching companies from Firestore..."
   - "✅ Fetched X premium and Y latest companies"
   - No error messages

### ❌ Failure Indicators

1. **Ad Creation Fails**:
   - Error message appears
   - No document in Firestore
   - Check: Firestore rules deployed correctly?

2. **Ads Don't Appear**:
   - Home page shows placeholder
   - Console shows "✅ Fetched 0 premium and 0 latest companies"
   - Check: Firestore indexes deployed and enabled?

3. **Permission Errors**:
   - Console shows "Permission denied" errors
   - Check: Firestore rules allow anonymous creation?

## Troubleshooting

### Issue: "Permission denied" when creating ad

**Solution**:
```bash
# Redeploy Firestore rules
firebase deploy --only firestore:rules

# Verify in Firebase Console → Firestore → Rules
# Should allow anonymous creation
```

### Issue: Ads don't appear after 60 seconds

**Check 1**: Firestore indexes
```bash
# Check index status
firebase firestore:indexes

# Should show all indexes as "Enabled"
```

**Check 2**: Company document
- Open Firebase Console
- Verify company has `status: "active"`
- Verify `createdAt` field exists and is a timestamp

**Check 3**: Server logs
- Check terminal for error messages
- Look for Firebase connection errors

### Issue: "Index not found" error

**Solution**:
```bash
# Redeploy indexes
firebase deploy --only firestore:indexes

# Wait for indexes to finish building (check Firebase Console)
```

## Production Testing

After deploying to production (Vercel, etc.):

1. Navigate to your production URL
2. Create a test ad using the same steps above
3. Wait 60 seconds
4. Refresh the home page
5. Verify the ad appears

**Note**: Production testing requires real Firebase credentials (not emulator).

## Cleanup

After testing, you may want to delete test ads:

1. Open Firebase Console → Firestore
2. Navigate to `companies` collection
3. Delete test company documents
4. Or set `status: "inactive"` to hide them

## Performance Monitoring

Monitor performance after deployment:

1. **Firebase Console → Firestore → Usage**:
   - Check read/write counts
   - Monitor quota usage

2. **Vercel Dashboard → Analytics**:
   - Monitor page load times
   - Check function execution times

3. **Browser DevTools → Network**:
   - Check page load time
   - Verify data fetching works

## Success Criteria

The fix is successful if:

- ✅ Ads can be created without authentication
- ✅ Created ads appear in Firebase Firestore
- ✅ Ads appear on home page within 60 seconds
- ✅ Both regular and premium ads display correctly
- ✅ No console errors
- ✅ Page revalidates every 60 seconds
- ✅ Multiple ads can be created and displayed

## Additional Tests

### Edge Cases

1. **Test with no ads**:
   - Delete all companies
   - Home page should show placeholder

2. **Test with many ads**:
   - Create 10+ ads
   - Only 6 should appear (limit)

3. **Test with old ads**:
   - Create ad, wait, create another
   - Newest should appear first

4. **Test premium filtering**:
   - Mix of premium and non-premium
   - Premium appears in correct section

---

**Last Updated**: 2025-12-20
**Related**: FIX_SUMMARY.md, DEPLOYMENT.md

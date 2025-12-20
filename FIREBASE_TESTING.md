# Firebase Integration Testing Guide

This document outlines the testing procedures for validating Firebase integration in the BokaNära application.

## Overview

The application uses Firebase for:
- **Firestore Database**: Storing company data, bookings, reviews, etc.
- **Firebase Authentication**: User authentication (currently disabled with SKIP_AUTH flag)
- **Firebase Storage**: File uploads (company images, etc.)

## Automated Validation

### Running the Firebase Validation Script

```bash
npm run validate:firebase
```

This script will:
1. ✅ Initialize Firebase SDK
2. ✅ Connect to Firestore
3. ✅ Write a test company document
4. ✅ Read the document back
5. ✅ Query documents with filters
6. ✅ Clean up test data

**Expected Output:**
```
🔥 Firebase Integration Validation Starting...

1️⃣ Testing Firebase SDK initialization...
✅ Firebase SDK initialized successfully
   Project ID: bokanara-4797d

2️⃣ Testing Firestore connection...
✅ Firestore instance created

3️⃣ Testing write operation to Firestore...
✅ Test document written successfully
   Document ID: [auto-generated-id]

4️⃣ Testing read operation from Firestore...
✅ Test document read successfully
   Found 1 test document(s)

5️⃣ Testing query with status filter (homepage scenario)...
✅ Status query executed successfully
   Found 1 active test document(s)

6️⃣ Cleaning up test data...
   Deleted test document: [auto-generated-id]
✅ Test data cleaned up successfully

============================================================
🎉 ALL FIREBASE INTEGRATION TESTS PASSED!
============================================================

✅ Firebase SDK: OK
✅ Firestore Connection: OK
✅ Write Operations: OK
✅ Read Operations: OK
✅ Query Operations: OK
✅ Cleanup Operations: OK

🚀 Your Firebase integration is working correctly!
📝 You can now create advertisements through the app interface.
```

## Manual Testing: Advertisement Creation Workflow

### Step 1: Start the Development Server

```bash
npm run dev
```

The application should start at `http://localhost:3000`

### Step 2: Navigate to Create Advertisement Page

1. Open `http://localhost:3000`
2. Click on "Skapa annons gratis" button (or go directly to `/skapa`)

### Step 3: Fill in Company Information

**Basic Information (Step 1):**
- Company Name: e.g., "Test Frisörsalong"
- Category: Select one (e.g., "Frisör")
- City: Select or type (e.g., "Stockholm")
- Address: e.g., "Testgatan 123"
- Description: Add a brief description

Click "Nästa" to proceed.

**Contact Information (Step 2):**
- Phone: e.g., "+46701234567"
- Email: e.g., "test@example.com"
- Website: e.g., "https://test.example.com"

Click "Nästa" to proceed.

**Services (Step 3):**
- Service Name: e.g., "Klippning"
- Price: e.g., "300"
- Duration: e.g., "60"
- Description: Optional

Add more services if needed using "+ Lägg till tjänst"

Click "Nästa" to proceed.

**Opening Hours (Step 4):**
- Set opening and closing times for each day
- Check "Stängt" for days the business is closed

Click "Skapa annons" to submit.

### Step 4: Verify Success

After submission, you should see:
- ✅ Success message: "🎉 Annonsen skapad!"
- ✅ Document ID displayed
- ✅ Options to view the company page or return to homepage

### Step 5: Verify Display on Homepage

1. Click "Tillbaka till startsidan" or navigate to `/`
2. Scroll to "🆕 Nya företag" section
3. ✅ Your newly created company should be visible
4. ✅ Verify all details are correct:
   - Company name
   - Category badge
   - City
   - Price information

### Step 6: Verify Company Page

1. Click on your company card
2. You should be taken to `/foretag/[id]`
3. ✅ Verify all information is displayed correctly:
   - Company name and description
   - Contact information
   - Services list
   - Opening hours

## Status Field Validation

The advertisement creation uses `status: 'active'` by default (not 'published'). This is correct for the current implementation.

**Current Status Values:**
- `active`: Company is visible and active
- `pending`: Company awaiting approval (not currently used)

**Firestore Rules:**
The `firestore.rules` file allows:
- ✅ Anyone to read companies
- ✅ Signed-in users to create companies
- ✅ Owners to update/delete their companies

## Error Handling

### Common Errors and Solutions

#### 1. "Firebase initialization error"
**Cause**: Missing or invalid Firebase configuration
**Solution**: 
- Check `.env.local` has all required variables
- Verify Firebase keys are correct
- Check `lib/firebase.ts` configuration

#### 2. "Permission denied" when writing to Firestore
**Cause**: Firestore security rules blocking the operation
**Solution**:
- Check `firestore.rules` allows the operation
- Ensure `status: 'active'` is being set (not 'pending')
- Deploy rules: `firebase deploy --only firestore:rules`

#### 3. "Could not reach Cloud Firestore backend"
**Cause**: Network connectivity issues
**Solution**:
- Check internet connection
- Verify firestore.googleapis.com is accessible
- Check browser console for detailed errors

#### 4. Company not appearing on homepage
**Cause**: Query filters not matching
**Solution**:
- Verify status is exactly 'active' (not 'Active' or 'published')
- Check Firestore console to see the actual document
- Verify `createdAt` field has a valid timestamp

## Testing in Different Environments

### Development (Local)
```bash
npm run dev
# Test at http://localhost:3000
```

### Production Build (Local)
```bash
npm run build
npm run start
# Test at http://localhost:3000
```

### GitHub Actions (CI)
The build is tested on every push/PR via `.github/workflows/ci.yml`
- Builds the application
- Type checks TypeScript
- Ensures no compilation errors

### Vercel (Production)
1. Push changes to main branch
2. Vercel automatically deploys
3. Test at production URL
4. Verify environment variables are set in Vercel dashboard

## Firestore Indexes

Some queries require composite indexes. If you see an error like:
```
"The query requires an index"
```

**Solution:**
1. Click the link in the error message to create the index
2. Or deploy indexes manually:
   ```bash
   firebase deploy --only firestore:indexes
   ```

Current indexes are defined in `firestore.indexes.json`.

## Data Validation Checklist

When testing, verify these fields are correctly saved:

### Required Fields
- ✅ `name` - Company name
- ✅ `category` - Category ID
- ✅ `categoryName` - Human-readable category
- ✅ `city` - City name
- ✅ `status` - Must be 'active'
- ✅ `ownerId` - User ID or 'anonymous'
- ✅ `createdAt` - Server timestamp
- ✅ `updatedAt` - Server timestamp

### Optional Fields
- `description` - Company description
- `phone` - Contact phone
- `email` - Contact email
- `website` - Company website
- `services` - Array of service objects
- `openingHours` - Opening hours object
- `rating` - Default 0
- `reviewCount` - Default 0
- `premium` - Default false

## Monitoring and Logs

### Browser Console
- Check for Firebase initialization logs: "✅ Firebase initialized successfully"
- Check for Firestore operation logs
- Monitor for any errors or warnings

### Firestore Console
- Visit https://console.firebase.google.com
- Navigate to Firestore Database
- Verify documents are being created in `companies` collection
- Check document structure matches expected schema

### Server Logs (Next.js)
- Check terminal running `npm run dev`
- Look for successful builds
- Monitor for any server-side errors

## Security Considerations

1. ✅ **Firestore Rules**: Properly configured in `firestore.rules`
2. ✅ **API Keys**: Safe to expose in client code (Firebase design)
3. ✅ **Read Access**: Public read access for SEO and listing
4. ✅ **Write Access**: Requires authentication (currently bypassed with SKIP_AUTH)
5. ⚠️ **TODO**: Enable Firebase Authentication and update security rules

## Next Steps

After successful validation:

1. **Enable Authentication**:
   - Set `SKIP_AUTH = false` in `/app/skapa/page.tsx`
   - Implement proper user authentication flow
   - Update security rules to use `request.auth.uid`

2. **Add More Tests**:
   - Create unit tests for Firebase utilities
   - Add E2E tests with Playwright or Cypress
   - Test error scenarios

3. **Monitoring**:
   - Set up Firebase Analytics
   - Monitor Firestore usage and quotas
   - Set up error tracking (Sentry, etc.)

4. **Performance**:
   - Implement caching for frequently accessed data
   - Optimize queries with proper indexes
   - Use pagination for large lists

## Support

If you encounter issues:
1. Check this guide for common solutions
2. Review Firebase documentation: https://firebase.google.com/docs
3. Check Firestore rules: https://firebase.google.com/docs/firestore/security/get-started
4. Create an issue on GitHub with error logs and steps to reproduce

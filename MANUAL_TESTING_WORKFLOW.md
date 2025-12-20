# Manual Testing Workflow: Advertisement Creation

This document provides a step-by-step workflow for manually testing the advertisement creation feature.

## Prerequisites

1. Firebase project is set up with correct credentials
2. Firestore database is in production mode
3. Security rules are deployed (`firestore.rules`)
4. Application is running (dev or production)

## Test Scenario 1: Create Advertisement and Verify Display

### Objective
Verify that a newly created advertisement:
1. Successfully saves to Firestore
2. Has an 'active' status
3. Displays correctly on the homepage
4. Can be viewed on its detail page

### Steps

#### 1. Start the Application

**Development Mode:**
```bash
npm run dev
```
Access at: `http://localhost:3000`

**Production Mode:**
```bash
npm run build
npm run start
```
Access at: `http://localhost:3000`

#### 2. Navigate to Homepage

- Open browser to `http://localhost:3000`
- **Expected:** Homepage loads successfully
- **Expected:** See hero section with search bar
- **Expected:** See category grid
- **Expected:** See either placeholder ("Var först med att lista ditt företag!") or existing companies

Take screenshot: `homepage_initial.png`

#### 3. Click "Skapa annons gratis"

- Click the prominent button in hero or CTA section
- **Expected:** Redirected to `/skapa`
- **Expected:** See "Skapa företagsannons" form (Step 1/4)

Take screenshot: `create_form_step1.png`

#### 4. Fill Basic Information (Step 1/4)

Fill in the following:
- **Företagsnamn:** "Test Frisörsalong Alpha"
- **Kategori:** Select "Frisör" from dropdown
- **Stad:** Select "Stockholm" from dropdown
- **Adress:** "Testgatan 123, 123 45 Stockholm"
- **Beskrivning:** "En modern frisörsalong i hjärtat av Stockholm. Vi erbjuder professionella klippningar och färgningar."

Click "Nästa" button

**Expected:** Form advances to Step 2/4

Take screenshot: `create_form_step2.png`

#### 5. Fill Contact Information (Step 2/4)

Fill in the following:
- **Telefonnummer:** "+46701234567"
- **E-post:** "test@frisorsalong.se"
- **Webbplats:** "https://testfrisor.se" (optional)

Click "Nästa" button

**Expected:** Form advances to Step 3/4

Take screenshot: `create_form_step3.png`

#### 6. Add Services (Step 3/4)

**Service 1:**
- **Tjänstens namn:** "Damklippning"
- **Pris (kr):** "450"
- **Längd (min):** "60"
- **Beskrivning:** "Klippning med konsultation och styling"

Click "+ Lägg till tjänst" to add another service

**Service 2:**
- **Tjänstens namn:** "Herrklippning"
- **Pris (kr):** "350"
- **Längd (min):** "45"
- **Beskrivning:** "Herrklippning med styling"

Click "Nästa" button

**Expected:** Form advances to Step 4/4

Take screenshot: `create_form_step4.png`

#### 7. Set Opening Hours (Step 4/4)

Configure opening hours:
- **Måndag-Fredag:** 09:00 - 18:00
- **Lördag:** 10:00 - 16:00
- **Söndag:** Check "Stängt"

Click "Skapa annons" button

**Expected:** 
- Button shows "Skapar..." briefly
- Success screen appears

Take screenshot: `success_screen.png`

#### 8. Verify Success Screen

**Expected on success screen:**
- ✅ Green checkmark icon
- ✅ Message "🎉 Annonsen skapad!"
- ✅ Document ID displayed (not starting with "local_")
- ✅ "Visa din sida" button visible
- ✅ "Tillbaka till startsidan" button visible

**Browser Console Check:**
Open browser console (F12) and verify:
- ✅ Log message: "✅ Saved to Firestore: [document-id]"
- ❌ NO error messages

**Document ID:** _________________________ (record this)

#### 9. Verify in Firestore Console

Open Firebase Console:
1. Go to https://console.firebase.google.com
2. Select project: "bokanara-4797d"
3. Navigate to Firestore Database
4. Open "companies" collection
5. Find document with ID from step 8

**Verify Document Fields:**
- ✅ `name`: "Test Frisörsalong Alpha"
- ✅ `category`: "frisor"
- ✅ `categoryName`: "Frisör"
- ✅ `emoji`: "💇"
- ✅ `city`: "Stockholm"
- ✅ `address`: "Testgatan 123, 123 45 Stockholm"
- ✅ `description`: Contains description text
- ✅ `phone`: "+46701234567"
- ✅ `email`: "test@frisorsalong.se"
- ✅ `website`: "https://testfrisor.se"
- ✅ `services`: Array with 2 items
- ✅ `services[0].name`: "Damklippning"
- ✅ `services[0].price`: 450
- ✅ `services[1].name`: "Herrklippning"
- ✅ `status`: "active" (NOT "published")
- ✅ `premium`: false
- ✅ `ownerId`: "anonymous"
- ✅ `rating`: 0
- ✅ `reviewCount`: 0
- ✅ `createdAt`: Valid timestamp
- ✅ `updatedAt`: Valid timestamp

Take screenshot: `firestore_document.png`

#### 10. View Company Detail Page

From success screen, click "Visa din sida"

**Expected:**
- ✅ URL is `/foretag/[document-id]`
- ✅ Company name displayed prominently
- ✅ Category badge shows "💇 Frisör"
- ✅ Location shows "📍 Stockholm"
- ✅ Contact information displayed
- ✅ Services list shows both services with prices
- ✅ Opening hours displayed correctly
- ✅ No errors in console

Take screenshot: `company_detail_page.png`

#### 11. Return to Homepage

Click "Tillbaka till startsidan" or navigate to `/`

**Expected:**
- ✅ Homepage loads successfully
- ✅ "🆕 Nya företag" section is visible
- ✅ Your test company appears in the list
- ✅ Company card shows:
  - Company name
  - Category badge "💇 Frisör"
  - Location "Stockholm"
  - Rating "Nytt företag" (since reviewCount = 0)
  - Price "Från 350 kr" (lowest service price)

Take screenshot: `homepage_with_new_company.png`

#### 12. Click on Company Card from Homepage

Click on your test company card

**Expected:**
- ✅ Navigates to `/foretag/[document-id]`
- ✅ Company detail page loads correctly
- ✅ All information matches what was entered

### Success Criteria

✅ All steps completed without errors
✅ Company document exists in Firestore with status='active'
✅ Company visible on homepage in "Nya företag" section
✅ Company detail page displays all information correctly
✅ No error messages in browser console
✅ No Firebase errors in console

---

## Test Scenario 2: Error Handling

### Objective
Verify that errors are handled gracefully when:
1. Firebase is unavailable
2. Invalid data is submitted
3. Network interruptions occur

### Test 2.1: Invalid Email Format

1. Go to `/skapa`
2. Fill Step 1 with valid data
3. In Step 2, enter invalid email: "not-an-email"
4. Continue to Step 4 and submit

**Expected:**
- ✅ Form validation catches invalid email OR
- ✅ Firebase error is caught and user-friendly message shown

### Test 2.2: Missing Required Fields

1. Go to `/skapa`
2. Try to proceed without filling "Företagsnamn"

**Expected:**
- ✅ HTML5 validation prevents form submission
- ✅ User sees message about required field

### Test 2.3: Network Interruption Simulation

This test requires browser DevTools:

1. Open browser DevTools (F12)
2. Go to Network tab
3. Enable "Offline" mode
4. Try to create a new advertisement

**Expected:**
- ✅ Error message: "Kan inte ansluta till Firebase. Kontrollera din internetanslutning."
- ✅ Form remains filled (data not lost)
- ✅ User can retry after re-enabling network

---

## Test Scenario 3: Multiple Advertisements

### Objective
Verify that creating multiple advertisements works correctly

### Steps

1. Create advertisement #1 using steps from Scenario 1
2. From success screen, click "Skapa en till annons"
3. Create advertisement #2 with different data:
   - Name: "Test Massage Studio Beta"
   - Category: "Massage"
   - City: "Göteborg"
4. Verify both companies appear on homepage
5. Verify they are sorted by creation date (newest first)

**Expected:**
- ✅ Both companies visible on homepage
- ✅ Newest company appears first
- ✅ Each has unique document ID

---

## Test Scenario 4: Status Field Validation

### Objective
Confirm that the status field is correctly set to 'active'

### Steps

1. Create a new advertisement
2. Check Firestore document
3. Verify `status` field value

**Expected:**
- ✅ `status` = "active" (exactly, case-sensitive)
- ❌ NOT "published"
- ❌ NOT "Active"
- ❌ NOT "pending"

### Notes
The requirement mentions "published status" but the code uses "active". This is intentional based on the schema defined in:
- `firestore.rules` (references 'active' status)
- `app/page.tsx` (queries for status='active')
- `app/skapa/page.tsx` (sets status='active')

---

## Test Scenario 5: Homepage Query Performance

### Objective
Verify that homepage queries work efficiently

### Steps

1. Create 10+ test advertisements
2. Navigate to homepage
3. Check browser DevTools Network tab
4. Verify Firestore query performance

**Expected:**
- ✅ Homepage loads in < 3 seconds
- ✅ Premium companies section shows up to 6 items
- ✅ Latest companies section shows up to 6 items
- ✅ No unnecessary duplicate queries

---

## Cleanup After Testing

### Remove Test Data

**Option 1: Via Firestore Console**
1. Go to Firebase Console
2. Navigate to Firestore Database
3. Find and delete test documents manually

**Option 2: Via Script**
Run validation script which includes cleanup:
```bash
npm run validate:firebase
```

---

## Troubleshooting Common Issues

### Issue: "Firebase initialization error"
**Solution:** Check that all environment variables are set correctly in `.env.local`

### Issue: "Permission denied"
**Solution:** 
1. Verify `firestore.rules` allows writes
2. Check that `status: 'active'` is being set
3. Deploy rules: `firebase deploy --only firestore:rules`

### Issue: Company not appearing on homepage
**Solution:**
1. Hard refresh browser (Ctrl+Shift+R)
2. Check that `status === 'active'`
3. Verify `createdAt` timestamp exists
4. Check browser console for query errors

### Issue: "Could not reach Cloud Firestore backend"
**Solution:**
1. Check internet connection
2. Verify firestore.googleapis.com is accessible
3. Check for firewall/proxy blocking Firebase

---

## Reporting Issues

When reporting issues, please include:
1. All screenshots from the test scenario
2. Document ID from Firestore
3. Browser console logs
4. Network tab output (if relevant)
5. Firestore document data
6. Steps to reproduce

---

## Success Summary

After completing all test scenarios:

- [ ] Scenario 1: Create and display advertisement ✓
- [ ] Scenario 2: Error handling ✓
- [ ] Scenario 3: Multiple advertisements ✓
- [ ] Scenario 4: Status field validation ✓
- [ ] Scenario 5: Homepage query performance ✓
- [ ] All test data cleaned up ✓

**Tested by:** _____________
**Date:** _____________
**Environment:** Development / Production
**Result:** PASS / FAIL

**Notes:**

# VägVänner - Ownership Transfer Guide
## دليل نقل ملكية VägVänner

**Version:** 1.0  
**Date:** 2025-10-07  
**Estimated Transfer Time:** 2-4 hours  
**Recommended Transition Period:** 30 days with seller support

---

## 📋 Table of Contents

1. [Pre-Transfer Checklist](#pre-transfer-checklist)
2. [Asset List](#asset-list)
3. [Step-by-Step Transfer Process](#step-by-step-transfer-process)
4. [Post-Transfer Verification](#post-transfer-verification)
5. [Transition Support](#transition-support)
6. [Emergency Rollback Plan](#emergency-rollback-plan)

---

## 1. Pre-Transfer Checklist | قائمة ما قبل النقل

### ✅ Seller Preparation (البائع)

- [ ] All code committed to GitHub main branch
- [ ] No pending pull requests or unmerged changes
- [ ] All environment variables documented
- [ ] PayPal account in good standing (no disputes)
- [ ] Firebase project has no outstanding bills
- [ ] Vercel account has no unpaid invoices
- [ ] Domain renewal paid for at least 1 year
- [ ] All passwords and API keys documented securely
- [ ] Backup of entire Firebase database created
- [ ] List of all active users (anonymized if needed)
- [ ] Revenue statistics prepared (last 3-6 months)
- [ ] No active customer support tickets

### ✅ Buyer Preparation (المشتري)

- [ ] GitHub account created
- [ ] Vercel account created
- [ ] Firebase (Google Cloud) account created
- [ ] PayPal Business account created (or existing)
- [ ] Domain registrar account (if needed)
- [ ] EmailJS account created
- [ ] Sentry account created (optional)
- [ ] Swedish business organization number (if required)
- [ ] Legal entity established (if corporate purchase)
- [ ] Technical contact person identified
- [ ] Payment method ready for domain/services

---

## 2. Asset List | قائمة الأصول

### 🔐 Critical Assets to Transfer

| Asset | Current Owner | Transfer Method | Critical? | Est. Time |
|-------|--------------|----------------|-----------|-----------|
| **GitHub Repository** | codecsverige | Transfer ownership | ✅ Yes | 15 min |
| **Domain (vagvanner.se)** | Current registrar | Transfer/Update DNS | ✅ Yes | 24-48h |
| **Firebase Project** | Current Google account | Add as owner → Remove old | ✅ Yes | 30 min |
| **Vercel Project** | Current Vercel account | Re-import from GitHub | ✅ Yes | 20 min |
| **PayPal Business Account** | Current PayPal account | Cannot transfer - create new | ✅ Yes | 2-3 days |
| **EmailJS Account** | Current EmailJS account | Share credentials or create new | ⚠️ Medium | 15 min |
| **Sentry Account** | Current Sentry account | Transfer project or create new | 🔵 Low | 15 min |
| **SSL Certificates** | Vercel auto-generates | Auto-renewed | ✅ Yes | Auto |
| **Environment Variables** | Documented | Update in Vercel | ✅ Yes | 30 min |
| **Database Backup** | Firebase export | Import to new project | ✅ Yes | 1-2h |

### 📊 Non-Critical Assets (Nice to Have)

- [ ] Analytics data (if Google Analytics added)
- [ ] User feedback/support history
- [ ] Marketing materials
- [ ] Social media accounts (if any)
- [ ] Email lists (if any)

---

## 3. Step-by-Step Transfer Process | خطوات النقل التفصيلية

### Phase 1: Access Preparation (Before Payment) | المرحلة 1: التحضير

**Duration:** 1 hour  
**Risk Level:** Low

#### Step 1.1: GitHub Access Setup
```bash
# Seller Actions:
1. Go to github.com/codecsverige/vagvanner/settings
2. Navigate to "Manage Access"
3. Add buyer as "Admin" collaborator
4. Buyer accepts invitation
5. Buyer clones repository locally:
   git clone https://github.com/codecsverige/vagvanner.git
6. Verify all files present

# Verification:
- Buyer can see all code
- Buyer can create test branch
- All commit history visible
```

#### Step 1.2: Firebase Read-Only Access
```bash
# Seller Actions:
1. Go to Firebase Console → vagvanner project
2. Go to "Project Settings" → "Users and permissions"
3. Add buyer's Google email as "Viewer" role
4. Buyer logs in and verifies access

# Verification:
- Buyer can view Firestore database
- Buyer can view Authentication users
- Buyer can view Functions
- Buyer can view Storage
```

#### Step 1.3: Vercel Read-Only Access
```bash
# Seller Actions:
1. Go to Vercel Dashboard → vagvanner project
2. Settings → Team Members
3. Invite buyer as "Viewer"
4. Buyer accepts and verifies

# Verification:
- Buyer can see deployment history
- Buyer can see build logs
- Buyer can see environment variables (masked)
```

---

### Phase 2: Payment & Legal (Escrow Recommended) | المرحلة 2: الدفع

**Duration:** 1-7 days (depending on payment method)  
**Risk Level:** Medium

#### Step 2.1: Legal Agreement
```markdown
Recommended Contract Includes:
✅ Purchase price and payment terms
✅ Asset list (from section 2)
✅ Seller representations (no hidden liabilities)
✅ Transition support period (recommended 30 days)
✅ Intellectual property transfer
✅ Non-compete clause (optional)
✅ Liability limitations
✅ Dispute resolution

Swedish Legal Note:
- Consider using standard "Köpekontrakt för digitala tjänster"
- Consult lawyer for amounts > 100,000 SEK
- Use escrow service (e.g., Escrow.com) for international
```

#### Step 2.2: Payment Options

**Option A: Escrow Service** (Recommended for 200k+ SEK)
```
1. Seller and buyer agree on Escrow.com (or similar)
2. Buyer deposits funds
3. Seller begins transfer (Phase 3)
4. Buyer verifies (Phase 4)
5. Buyer approves release of funds
6. Escrow releases to seller

Timeline: 7-14 days
Fees: 1-3% of transaction
```

**Option B: Bank Transfer** (Simpler, higher risk)
```
1. Buyer sends 50% upfront
2. Seller begins transfer
3. Buyer sends remaining 50% after verification
4. Full transfer completed

Timeline: 2-3 days
Fees: Minimal bank fees
```

**Option C: Installments** (For larger amounts)
```
1. Initial payment (30%)
2. After GitHub + Firebase transfer (40%)
3. After 30-day support period (30%)

Timeline: 30-45 days
Fees: Depends on agreement
```

---

### Phase 3: Core Transfer (Critical) | المرحلة 3: النقل الأساسي

**Duration:** 2-3 hours  
**Risk Level:** High - Follow exactly!

#### Step 3.1: GitHub Repository Transfer ✅

**Timing:** Do this first!

```bash
# Seller Actions:
1. Go to github.com/codecsverige/vagvanner/settings
2. Scroll to "Danger Zone"
3. Click "Transfer ownership"
4. Enter buyer's GitHub username
5. Confirm transfer

# Buyer Actions:
1. Accept transfer invitation
2. Repository now at github.com/{BUYER_USERNAME}/vagvanner
3. Verify:
   - All code present
   - All branches intact
   - All commit history preserved
   - Issues/PRs transferred

# ⚠️ IMPORTANT:
After transfer, Vercel will lose connection.
This is expected and will be fixed in Step 3.4.
```

#### Step 3.2: Firebase Project Transfer ✅

**Timing:** After GitHub transfer  
**Method:** Add buyer as owner, then remove seller

```bash
# Seller Actions (Firebase Console):
1. Go to Project Settings → Users and permissions
2. Click "Add member"
3. Add buyer's Google email as "Owner" role
4. Buyer should receive email invitation

# Buyer Actions:
1. Accept Firebase invitation
2. Log in to Firebase Console
3. Verify "Owner" role
4. DO NOT remove seller yet (wait for verification)

# Both Parties Verify Together:
✅ Buyer can access all services:
   - Firestore
   - Authentication
   - Functions
   - Storage
   - Hosting
   - Settings

✅ Buyer can perform actions:
   - Add/remove users
   - Modify rules
   - Deploy functions
   - View billing

# After 24h of buyer testing:
Seller removes their own access:
1. Project Settings → Users and permissions
2. Remove seller's email
3. Buyer is now sole owner

# ⚠️ CRITICAL NOTES:
- Firebase project CANNOT be transferred between Google accounts
- Buyer must use same Google account long-term
- Billing will transfer to buyer's Google Cloud billing
- Set up billing alerts immediately!
```

#### Step 3.3: Database Export & Import (Safety Backup)

**Timing:** Before removing seller's Firebase access  
**Purpose:** Safety backup for buyer

```bash
# Seller Creates Export:
1. Firebase Console → Firestore Database
2. Import/Export tab
3. Click "Export"
4. Choose GCS bucket: gs://vagvanner.appspot.com/backups
5. Export all collections
6. Wait for completion (5-30 minutes depending on size)
7. Download export files
8. Share secure link with buyer (Google Drive, Dropbox, etc.)

# Buyer Saves Export:
1. Download export to local machine
2. Store securely (encrypted)
3. This is emergency backup only

# If Buyer Needs to Import (only if catastrophic failure):
1. Create new Firebase project
2. Go to Firestore Import/Export
3. Upload exported files
4. Import all collections
5. Update environment variables to new project

# ⚠️ IMPORTANT:
- This backup is for emergencies only
- Live database stays in original Firebase project
- No data migration needed if transfer goes smoothly
```

#### Step 3.4: Vercel Reconnection ✅

**Timing:** After GitHub transfer complete  
**Purpose:** Restore automatic deployments

```bash
# Seller Actions:
1. Go to Vercel Dashboard
2. vagvanner project → Settings
3. Delete the project (this is safe, just deployment config)

# Buyer Actions:
1. Log in to Vercel
2. Click "New Project"
3. Import from GitHub → Select vagvanner repository
4. Configure:
   Framework Preset: Create React App
   Build Command: npm run build
   Output Directory: build
   Install Command: npm install
   
5. Environment Variables (Critical!):
   - Add all REACT_APP_* variables
   - Add NODE_ENV=production
   - Add VERCEL_TOOLBAR=0
   
   (See .env.example for complete list)

6. Deploy to Production
7. Domain Settings:
   - Add custom domain: vagvanner.se
   - Add www.vagvanner.se (optional)
   
8. Wait for DNS propagation (24-48h)

# Verification:
✅ Build succeeds
✅ Site loads at temporary Vercel URL
✅ All features work (test thoroughly!)
✅ Domain resolves to new deployment
```

#### Step 3.5: Domain Transfer (DNS Update)

**Option A: DNS Update Only** (Recommended - faster)
```bash
# Timing: After Vercel setup complete
# Current registrar: Check whois vagvanner.se

# Seller Actions (DNS Records):
1. Go to domain registrar (e.g., Loopia, GleSYS, etc.)
2. Access DNS settings for vagvanner.se
3. Add buyer as co-admin (if possible)

# Buyer Actions:
1. Log in to domain registrar
2. Update DNS A records to point to Vercel:
   
   A Record:
   Host: @
   Value: 76.76.21.21 (Vercel's IP)
   
   A Record:
   Host: www
   Value: 76.76.21.21
   
   CNAME (alternative):
   Host: www
   Value: cname.vercel-dns.com
   
3. Save changes
4. Wait 24-48h for propagation

# Verification (after 48h):
dig vagvanner.se
# Should show Vercel IP

# After buyer confirms everything works:
Seller transfers domain ownership (optional):
1. Generate transfer code at current registrar
2. Buyer initiates transfer at their registrar
3. Accept transfer (5-7 days)
```

**Option B: Full Domain Transfer** (More permanent)
```bash
# Timing: Can be done later, not critical
# Cost: ~280 SEK/year renewal

1. Seller unlocks domain at current registrar
2. Seller generates transfer authorization code (EPP code)
3. Buyer initiates transfer at their registrar
4. Seller approves transfer
5. Domain moves to buyer's registrar (5-7 days)
6. Buyer configures DNS as in Option A

# ⚠️ Note:
Can cause downtime if not done carefully.
Recommend doing Option A first, Option B later.
```

---

### Phase 4: PayPal Business Account (Special Case) | المرحلة 4: حساب PayPal

**Duration:** 2-7 business days  
**Risk Level:** Medium  
**Note:** PayPal Business accounts CANNOT be transferred

#### Step 4.1: Buyer Creates New PayPal Business Account

```bash
# Buyer Actions:
1. Go to paypal.com/se/business
2. Click "Get Started" → Business Account
3. Fill in business information:
   - Business name (if company)
   - Swedish organization number
   - Bank account details (for receiving money)
   - Contact information
   
4. Verify email and phone
5. Link bank account (requires micro-deposits, 2-3 days)
6. Apply for business verification (may require documents)

# ⚠️ Important:
PayPal Business verification can take 2-7 business days.
Plan accordingly!
```

#### Step 4.2: PayPal API Credentials Setup

```bash
# Buyer Actions (After business account verified):
1. Log in to PayPal Business account
2. Go to Developer Dashboard:
   https://developer.paypal.com/dashboard
   
3. Create Live App:
   - Click "My Apps & Credentials"
   - Click "Create App"
   - App Name: VägVänner Live
   - App Type: Merchant
   - Click "Create App"
   
4. Copy credentials:
   - Client ID (starts with "A...")
   - Secret (keep very secure!)
   
5. Configure App:
   - Return URL: https://vagvanner.se
   - Cancel URL: https://vagvanner.se
   - Enable "Accept Payments"
   - Save

# Add to Vercel:
1. Vercel Dashboard → vagvanner → Settings → Environment Variables
2. Add:
   REACT_APP_PAYPAL_CLIENT_ID_PROD = {your_live_client_id}
3. Redeploy application

# ⚠️ CRITICAL:
Test payments in production BEFORE going fully live!
Make small test transaction (10 SEK) and verify:
- Payment authorized
- Contact unlocked
- 48h capture works
- Refund works (if needed)
```

#### Step 4.3: Migration Strategy (Minimize Downtime)

**Recommended Approach: Parallel Operation**

```markdown
Week 1-2:
- Buyer creates PayPal account
- Buyer gets verified
- Buyer sets up API credentials

Week 2 (switchover):
- Seller keeps old PayPal active
- Buyer updates Vercel environment variables
- New bookings use buyer's PayPal
- Old bookings (if any pending) still use seller's PayPal

Week 3-4:
- Seller monitors old PayPal for any stragglers
- After all old transactions settled, seller can close account

⚠️ Edge Case:
If there are pending authorizations (not captured yet):
- Wait 48 hours for all to capture
- OR manually capture them via seller's PayPal dashboard
- THEN switch to buyer's PayPal
```

---

### Phase 5: EmailJS Transfer | المرحلة 5: EmailJS

**Duration:** 15 minutes  
**Risk Level:** Low

**Option A: Share Credentials** (Quick)
```bash
# Seller Actions:
1. Go to EmailJS Dashboard
2. Settings → Account
3. Share login credentials with buyer securely
4. Buyer logs in and changes password
5. Buyer updates account email to their own

# Verification:
Test email sending from application
```

**Option B: Create New Account** (Clean break)
```bash
# Buyer Actions:
1. Go to emailjs.com → Sign Up
2. Create free account
3. Add Email Service:
   - Gmail, Outlook, or SMTP
   - Follow EmailJS setup wizard
   
4. Create Email Template:
   - Copy template from seller's account
   - Template ID needed for environment variable
   
5. Get credentials:
   - Service ID
   - Template ID
   - Public Key (API Key)

# Update Vercel:
REACT_APP_EMAILJS_PUBLIC_KEY = {your_public_key}
REACT_APP_EMAILJS_SERVICE_ID = {your_service_id}
REACT_APP_EMAILJS_TEMPLATE_ID = {your_template_id}

# Redeploy and test
```

---

### Phase 6: Optional Services | المرحلة 6: الخدمات الاختيارية

#### Sentry (Error Tracking)

**Transfer or New:**
```bash
# If transferring:
1. Seller adds buyer to Sentry project
2. Buyer becomes owner
3. Seller removes themselves

# If creating new:
1. Sign up at sentry.io
2. Create new project → React
3. Copy DSN
4. Update Vercel:
   REACT_APP_SENTRY_DSN = {your_dsn}
5. Redeploy
```

#### Google Analytics (If Added)

```bash
# If transferring:
1. Seller adds buyer to Google Analytics property
2. Buyer becomes admin
3. Update tracking code if needed

# If creating new:
1. Create Google Analytics 4 property
2. Get Measurement ID
3. Add to application
```

---

## 4. Post-Transfer Verification | التحقق بعد النقل

### ✅ Immediate Checks (Within 24 hours)

**Buyer Tests:**

#### Test 1: User Registration & Login
```bash
1. Go to vagvanner.se
2. Click "Logga in"
3. Sign in with Google
4. Verify phone number
5. ✅ Success: Redirected to home page
```

#### Test 2: Create a Ride
```bash
1. Click "Skapa resa"
2. Fill in all fields
3. Submit
4. ✅ Success: Ride appears in database
5. Check Firebase Console → Firestore → rides
```

#### Test 3: Search & Browse
```bash
1. Search for a city (e.g., "Stockholm")
2. Click on a ride
3. ✅ Success: Ride details load
```

#### Test 4: Booking Flow
```bash
1. Click "Boka" on a ride
2. Fill in passenger details
3. Submit booking
4. ✅ Success: Booking created in Firestore
```

#### Test 5: PayPal Payment (Critical!)
```bash
1. Go to a booking
2. Click "Lås upp kontakt"
3. Complete PayPal payment (10 SEK test)
4. ✅ Success: Contact info revealed
5. Check PayPal dashboard for authorization
6. Wait 48 hours
7. ✅ Success: Payment captured automatically
```

#### Test 6: Email Notifications
```bash
1. Create a booking
2. ✅ Success: Email sent to driver
3. Check email inbox
4. Verify email content correct
```

#### Test 7: Firebase Functions
```bash
1. Go to Firebase Console → Functions
2. Check logs for errors
3. ✅ Success: No errors in last 24h
```

#### Test 8: Mobile Responsiveness
```bash
1. Open vagvanner.se on mobile
2. Test all features
3. ✅ Success: UI works on mobile
```

### ✅ Week 1 Monitoring

**Daily Checks:**
- [ ] No errors in Sentry (if configured)
- [ ] No errors in Vercel logs
- [ ] No errors in Firebase Functions logs
- [ ] PayPal transactions completing successfully
- [ ] Emails sending successfully
- [ ] New users can register
- [ ] New rides being posted
- [ ] Bookings being made

**Metrics to Track:**
```markdown
Day 1-7 Baseline:
- Daily active users
- New signups
- Rides posted
- Bookings made
- Contact unlocks (revenue)
- Error rate
- Page load time

Compare to seller's historical data (if available)
```

---

## 5. Transition Support | دعم المرحلة الانتقالية

### Recommended Support Period: 30 Days

#### Week 1: Active Support
```markdown
Seller Availability: Daily check-ins
Response Time: Within 4 hours
Support Channels: Email + Phone/WhatsApp
Coverage:
- Technical issues
- User questions forwarded
- Payment processing issues
- Any urgent problems
```

#### Week 2-3: Moderate Support
```markdown
Seller Availability: Every 2-3 days
Response Time: Within 24 hours
Support Channels: Email
Coverage:
- Technical issues
- Best practices questions
- Optimization advice
```

#### Week 4: Light Support
```markdown
Seller Availability: As needed
Response Time: Within 48 hours
Support Channels: Email
Coverage:
- Emergency issues only
- Final questions
```

### Support Documentation

**Seller Provides:**
- [ ] Detailed walkthrough video (optional, but helpful)
- [ ] List of known issues and workarounds
- [ ] Common customer questions and answers
- [ ] Contact list of key service providers
- [ ] Emergency procedures document

**Buyer Prepares:**
- [ ] Technical team assigned
- [ ] Support email setup (support@vagvanner.se)
- [ ] Issue tracking system
- [ ] Escalation procedures

---

## 6. Emergency Rollback Plan | خطة الطوارئ

### If Critical Issue Occurs Within 48h of Transfer:

#### Scenario A: Website Down

**Diagnosis:**
```bash
1. Check Vercel status
2. Check Firebase status
3. Check domain DNS
4. Check for recent code changes
```

**Rollback:**
```bash
# If Vercel issue:
1. Vercel Dashboard → Deployments
2. Find last working deployment
3. Click "..." → "Promote to Production"
4. Site restored in 30 seconds

# If DNS issue:
1. Revert DNS to old settings
2. Wait 1-6 hours for propagation

# If Firebase issue:
1. Check Firebase Console → Usage
2. Check if quota exceeded
3. Increase quota or wait for reset
```

#### Scenario B: Payments Not Working

**Diagnosis:**
```bash
1. Check PayPal API credentials
2. Check environment variables in Vercel
3. Test in sandbox mode
```

**Rollback:**
```bash
# Temporary fix:
1. Use seller's PayPal temporarily
2. Update environment variables
3. Redeploy
4. Fix buyer's PayPal in parallel

# OR:
1. Disable unlock feature temporarily
2. Process unlocks manually
3. Fix PayPal issue
4. Re-enable feature
```

#### Scenario C: Database Corruption

**Diagnosis:**
```bash
1. Check Firestore Console for errors
2. Check recent rule changes
3. Check recent function deployments
```

**Rollback:**
```bash
# If recent data issue:
1. Use Firebase export from before transfer
2. Selectively restore affected collections
3. Merge with new data

# If rules issue:
1. Firestore Console → Rules
2. Revert to previous version
3. Publish rules
```

---

## 7. Transfer Checklist Summary | ملخص قائمة النقل

### Before Payment ✅
- [ ] Buyer has read-only access to all systems
- [ ] All code reviewed and understood
- [ ] All environment variables documented
- [ ] Database export created
- [ ] Legal agreement signed

### After Payment, Before Full Transfer ✅
- [ ] 50% payment received (if using installments)
- [ ] Escrow set up (if using escrow)

### Core Transfer ✅
- [ ] GitHub repository transferred
- [ ] Firebase project ownership transferred
- [ ] Vercel project recreated and deployed
- [ ] Domain DNS updated
- [ ] PayPal new account created and configured
- [ ] EmailJS transferred or recreated
- [ ] All environment variables updated
- [ ] Site tested end-to-end

### Post-Transfer ✅
- [ ] All tests passed
- [ ] Monitoring in place
- [ ] Support period activated
- [ ] Seller removed from all systems
- [ ] Final payment released
- [ ] Transfer complete email sent

---

## 8. Contact Information | معلومات الاتصال

### During Transfer

**Seller:**
- Name: [Seller Name]
- Email: [Seller Email]
- Phone: [Seller Phone]
- Availability: [Hours/Days]

**Buyer:**
- Name: [Buyer Name]
- Email: [Buyer Email]
- Phone: [Buyer Phone]
- Technical Contact: [If different]

### After Transfer

**New Owner Support:**
- Email: support@vagvanner.se
- Emergency: [Emergency contact]

---

## 9. Cost Summary | ملخص التكاليف

### One-Time Costs
```
Purchase Price:          [Amount] SEK
Escrow Fee (if used):    [1-3%] SEK
Domain Transfer:         ~200 SEK (if transferring registrar)
Legal Fees (optional):   [Amount] SEK
------------------------------------------
Total One-Time:          [Total] SEK
```

### Recurring Monthly Costs
```
Domain Renewal:          ~23 SEK/month (~280 SEK/year)
Firebase:                ~0-100 SEK/month (usage-based)
Vercel:                  0 SEK (free tier usually sufficient)
PayPal Fees:             ~3.5% per transaction
EmailJS:                 0 SEK (free tier) or ~$15/month
Sentry (optional):       0 SEK (free tier) or ~$26/month
------------------------------------------
Estimated Monthly:       ~50-200 SEK + transaction fees
```

### Notes on Costs:
- Firebase costs scale with usage (database reads/writes, storage)
- PayPal fees: ~3.5% + 3 SEK per transaction
- Most services have free tiers suitable for early stage
- Budget ~500 SEK/month for unexpected costs

---

## 10. Success Criteria | معايير النجاح

### Transfer Considered Successful When:

✅ **Technical:**
- Site loads correctly at vagvanner.se
- All features working (login, create ride, booking, payment)
- No errors in logs for 7 consecutive days
- Payment flow working end-to-end
- Email notifications sending

✅ **Business:**
- Buyer can access all admin functions
- Revenue flowing to buyer's PayPal
- User support requests being handled
- No customer complaints about downtime

✅ **Legal:**
- All assets transferred
- Seller removed from all accounts
- Buyer sole owner of all systems
- Final payment released

---

## 📞 Emergency Contacts

### If Something Goes Very Wrong:

**Vercel Support:**  
Email: support@vercel.com  
Docs: vercel.com/docs

**Firebase Support:**  
Console: firebase.google.com/support  
Paid support available for urgent issues

**PayPal Support:**  
Business: +46 8 121 138 68  
Email: via PayPal dashboard

**Domain Registrar:**  
[Insert current registrar support contact]

---

**Document Version:** 1.0  
**Last Updated:** 2025-10-07  
**Next Review:** After first successful transfer

**Good luck with the transfer! 🚀**  
**بالتوفيق في عملية النقل! 🚀**
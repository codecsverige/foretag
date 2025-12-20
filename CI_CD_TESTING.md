# CI/CD Environment Testing Guide

This guide covers testing Firebase integration in CI/CD environments (GitHub Actions and Vercel).

## GitHub Actions Configuration

### Current Setup

The repository has two workflows:

1. **CI Build** (`.github/workflows/ci.yml`)
   - Runs on: Push to main, Pull requests
   - Steps: Install dependencies, Type check, Build

2. **Firebase Deploy** (`.github/workflows/firebase-deploy.yml`)
   - Runs on: Push to main (when Firebase files change)
   - Steps: Deploy Firestore rules, Deploy Cloud Functions

### Environment Variables in GitHub

#### Required Secrets

Navigate to: `Settings → Secrets and variables → Actions`

Add the following secrets:

| Secret Name | Description | Required For |
|-------------|-------------|--------------|
| `FIREBASE_TOKEN` | Firebase CI token | Deploying rules and functions |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase API key | Building the app |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase auth domain | Building the app |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase project ID | Building the app |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket | Building the app |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase sender ID | Building the app |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase app ID | Building the app |

#### Getting Firebase CI Token

```bash
# Login to Firebase
firebase login

# Generate CI token
firebase login:ci
```

Copy the generated token and add it as `FIREBASE_TOKEN` secret in GitHub.

### Testing CI Build

#### Trigger CI Build

1. **Via Pull Request:**
   - Create a new branch
   - Make any code change
   - Create PR to main
   - CI will run automatically

2. **Via Push to Main:**
   - Merge PR to main
   - CI will run automatically

#### Verify CI Build Success

1. Go to `Actions` tab in GitHub repository
2. Find your workflow run
3. Check that all steps passed:
   - ✅ Checkout code
   - ✅ Setup Node.js
   - ✅ Install dependencies
   - ✅ Type check (npm run build)

#### Expected Behavior

- Build should complete successfully
- Firebase warnings about network are OK (expected in CI)
- No compilation errors
- No type errors

### CI Build Logs to Check

```
✓ Compiled successfully
✓ Generating static pages
✓ Finalizing page optimization

Route (app)                              Size     First Load JS
┌ ○ /                                    172 B          94.1 kB
├ ○ /_not-found                          871 B            88 kB
...
```

---

## Vercel Configuration

### Environment Variables in Vercel

Navigate to: `Project Settings → Environment Variables`

Add the following variables for all environments (Production, Preview, Development):

| Variable Name | Value | Environment |
|---------------|-------|-------------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Your Firebase API key | All |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `bokanara-4797d.firebaseapp.com` | All |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `bokanara-4797d` | All |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | `bokanara-4797d.firebasestorage.app` | All |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | `980354990772` | All |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Your Firebase app ID | All |

### Vercel Deployment

#### Automatic Deployment

Vercel automatically deploys:
- **Production:** When code is merged to main branch
- **Preview:** For every pull request

#### Manual Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to production
vercel --prod

# Deploy preview
vercel
```

### Testing on Vercel

#### 1. Deploy Preview Build

1. Create a pull request
2. Wait for Vercel to build preview
3. Click "Visit Preview" link in PR comments

#### 2. Test Firebase Connection

On preview URL:
1. Navigate to `/skapa`
2. Create a test advertisement
3. Verify it saves to Firestore
4. Check homepage to see new ad

#### 3. Verify Production Build

After merging to main:
1. Wait for production deployment
2. Visit production URL
3. Perform same tests as preview

### Vercel Build Logs to Check

```
Running build in Washington, D.C., USA (East) – iad1
Building...

> bokanara@0.1.0 build
> next build

✓ Compiled successfully
✓ Collecting page data
✓ Generating static pages (9/9)
✓ Finalizing page optimization

Build completed in [time]
```

---

## Environment-Specific Testing

### Development Environment

**Location:** Local machine
**Command:** `npm run dev`
**URL:** `http://localhost:3000`

**Test Checklist:**
- [ ] Firebase initializes successfully
- [ ] Can create advertisements
- [ ] Advertisements appear on homepage
- [ ] Browser console shows no errors
- [ ] Hot reload works correctly

### Production Build (Local)

**Location:** Local machine
**Command:** `npm run build && npm run start`
**URL:** `http://localhost:3000`

**Test Checklist:**
- [ ] Build completes without errors
- [ ] Optimized bundle sizes are reasonable
- [ ] All pages render correctly
- [ ] Firebase integration works
- [ ] Static pages generated successfully

### GitHub Actions (CI)

**Location:** GitHub servers
**Trigger:** Push/PR to main branch
**Purpose:** Validate code compiles and type-checks

**Test Checklist:**
- [ ] Workflow runs successfully
- [ ] All jobs complete
- [ ] No build errors
- [ ] No type errors

### Vercel Preview

**Location:** Vercel edge network
**Trigger:** Pull request created
**URL:** `https://[pr-name]-[project].vercel.app`

**Test Checklist:**
- [ ] Preview deploys successfully
- [ ] Environment variables applied
- [ ] Firebase connection works
- [ ] Can create test advertisements
- [ ] All pages accessible

### Vercel Production

**Location:** Vercel edge network
**Trigger:** Merge to main branch
**URL:** `https://[project].vercel.app` or custom domain

**Test Checklist:**
- [ ] Production deploys successfully
- [ ] Environment variables applied
- [ ] Firebase connection works
- [ ] SSL certificate valid
- [ ] Custom domain configured (if applicable)
- [ ] All features working

---

## Firestore Connection Testing

### Using Validation Script in CI

Add this step to `.github/workflows/ci.yml`:

```yaml
- name: Test Firebase Connection
  run: npm run test:firebase
  env:
    NEXT_PUBLIC_FIREBASE_API_KEY: ${{ secrets.NEXT_PUBLIC_FIREBASE_API_KEY }}
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: ${{ secrets.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN }}
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: ${{ secrets.NEXT_PUBLIC_FIREBASE_PROJECT_ID }}
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: ${{ secrets.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET }}
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: ${{ secrets.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID }}
    NEXT_PUBLIC_FIREBASE_APP_ID: ${{ secrets.NEXT_PUBLIC_FIREBASE_APP_ID }}
```

### Full Validation in CI

Add this step for comprehensive testing:

```yaml
- name: Validate Firebase Integration
  run: npm run validate:firebase
  env:
    NEXT_PUBLIC_FIREBASE_API_KEY: ${{ secrets.NEXT_PUBLIC_FIREBASE_API_KEY }}
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: ${{ secrets.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN }}
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: ${{ secrets.NEXT_PUBLIC_FIREBASE_PROJECT_ID }}
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: ${{ secrets.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET }}
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: ${{ secrets.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID }}
    NEXT_PUBLIC_FIREBASE_APP_ID: ${{ secrets.NEXT_PUBLIC_FIREBASE_APP_ID }}
```

---

## Troubleshooting CI/CD Issues

### Issue: Build fails with "Missing environment variable"

**Solution:**
1. Check that all required secrets are added in GitHub/Vercel
2. Verify secret names match exactly (case-sensitive)
3. Redeploy after adding secrets

### Issue: Firebase connection fails in CI

**Solution:**
1. Verify Firebase project allows connections from CI IPs
2. Check that API key is valid and not restricted
3. Ensure Firestore is in production mode (not test mode)

### Issue: Vercel preview works but production doesn't

**Solution:**
1. Check environment variables are set for "Production" environment
2. Verify domain DNS settings (if using custom domain)
3. Check Vercel deployment logs for errors

### Issue: "FIREBASE_TOKEN invalid or expired"

**Solution:**
1. Generate new token: `firebase login:ci`
2. Update `FIREBASE_TOKEN` secret in GitHub
3. Re-run failed workflow

---

## Security Best Practices

### Environment Variables

✅ **Do:**
- Store sensitive values in secrets (GitHub) or environment variables (Vercel)
- Use different Firebase projects for dev/staging/prod
- Rotate tokens periodically
- Use minimal permissions for CI tokens

❌ **Don't:**
- Commit secrets to repository
- Share tokens in public channels
- Use production credentials in development
- Store secrets in code comments

### Firebase Security

✅ **Do:**
- Keep Firestore rules restrictive
- Validate all input data
- Monitor Firebase usage
- Set up billing alerts
- Enable App Check for production

❌ **Don't:**
- Allow public writes without authentication
- Disable security rules
- Ignore quota warnings
- Skip API key restrictions

---

## Monitoring and Alerts

### GitHub Actions

Set up notifications:
1. Go to `Settings → Notifications`
2. Enable "Actions" notifications
3. Choose notification method (email, mobile, web)

### Vercel

Set up notifications:
1. Go to `Project Settings → Notifications`
2. Enable deployment notifications
3. Add team members to notify

### Firebase

Monitor usage:
1. Firebase Console → Project Overview
2. Check "Usage and billing"
3. Set up budget alerts
4. Monitor Firestore operations

---

## Validation Checklist

### Before Deployment

- [ ] All tests pass locally
- [ ] Build completes successfully
- [ ] No TypeScript errors
- [ ] No linter errors
- [ ] Firebase connection validated
- [ ] Manual testing completed

### After Deployment (Preview)

- [ ] Preview URL accessible
- [ ] Firebase integration works
- [ ] Test advertisement creation
- [ ] Verify homepage display
- [ ] Check browser console (no errors)

### After Deployment (Production)

- [ ] Production URL accessible
- [ ] SSL certificate valid
- [ ] All features working
- [ ] Performance acceptable
- [ ] Firebase quota not exceeded
- [ ] Monitoring enabled

---

## Support Resources

- **GitHub Actions Docs:** https://docs.github.com/en/actions
- **Vercel Docs:** https://vercel.com/docs
- **Firebase CI/CD:** https://firebase.google.com/docs/cli#ci-systems
- **Next.js Deployment:** https://nextjs.org/docs/deployment

---

## Contact

For issues with CI/CD setup, contact:
- Repository maintainer
- DevOps team
- Create GitHub issue with label `ci/cd`

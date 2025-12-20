# BokaNära - Production Deployment Checklist

This checklist ensures the BokaNära application is fully prepared for production deployment. Complete all items marked as **CRITICAL** before launching.

---

## 🚨 CRITICAL - Must Complete Before Launch

### Security

- [ ] **Update Next.js** to latest patched version
  ```bash
  npm install next@latest
  ```
  - Current: 14.2.5 (has security vulnerability)
  - Target: Latest stable (15.x or patched 14.x)

- [ ] **Update Firebase SDK** to latest version
  ```bash
  npm install firebase@latest
  ```
  - Fixes undici vulnerabilities in @firebase packages

- [ ] **Update ESLint** to supported version
  ```bash
  npm install eslint@latest --save-dev
  ```

- [ ] **Remove hard-coded Firebase config** from `lib/firebase.ts`
  - Replace fallback values with proper error handling
  - Ensure all env vars are required

- [ ] **Review and tighten Firestore security rules**
  - Restrict notifications creation to Cloud Functions only
  - Restrict reminders to Cloud Functions only
  - Add data validation rules
  - Add rate limiting where possible

- [ ] **Enable Firebase App Check**
  - Protect backend resources from abuse
  - Configure reCAPTCHA v3

### Environment Configuration

- [ ] **Create production Firebase project**
  - Separate from development project
  - Configure production settings

- [ ] **Set up Vercel environment variables**
  - NEXT_PUBLIC_FIREBASE_API_KEY
  - NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
  - NEXT_PUBLIC_FIREBASE_PROJECT_ID
  - NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
  - NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
  - NEXT_PUBLIC_FIREBASE_APP_ID
  - NEXT_PUBLIC_GA_MEASUREMENT_ID

- [ ] **Configure Cloud Functions environment variables**
  ```bash
  firebase functions:config:set sms.provider="46elks"
  firebase functions:config:set sms.api_key="YOUR_KEY"
  firebase functions:config:set sms.api_secret="YOUR_SECRET"
  firebase functions:config:set sms.sender="BokaNara"
  ```

- [ ] **Set up production domain**
  - Purchase domain (bokanara.se)
  - Configure DNS records
  - Set up Vercel custom domain
  - Enable automatic HTTPS

### GDPR Compliance

- [ ] **Create Privacy Policy page**
  - `/app/privacy/page.tsx`
  - Include all GDPR requirements
  - Link from footer and registration forms

- [ ] **Add Cookie Consent banner**
  - Install cookie consent library
  - Configure cookie categories
  - Get user consent before tracking

- [ ] **Implement data export feature**
  - Allow users to download their data
  - Format: JSON or PDF

- [ ] **Add account deletion feature**
  - UI for users to request deletion
  - Cloud Function to handle deletion
  - Delete all user data across collections

- [ ] **Create Terms of Service**
  - Legal terms and conditions
  - User responsibilities
  - Company responsibilities

### Monitoring & Error Tracking

- [ ] **Set up Sentry for error tracking**
  ```bash
  npm install @sentry/nextjs
  npx @sentry/wizard -i nextjs
  ```
  - Configure error reporting
  - Set up alerts for critical errors
  - Add performance monitoring

- [ ] **Configure uptime monitoring**
  - UptimeRobot or Pingdom
  - Monitor main pages
  - Set up alerts (email, SMS)

- [ ] **Enable Firebase Performance Monitoring**
  ```bash
  npm install firebase-performance
  ```
  - Track page load times
  - Monitor API response times
  - Set up alerts for slow performance

- [ ] **Set up Google Analytics 4**
  - Integrate GA4 code in layout
  - Configure goals and conversions
  - Set up custom events

### Backups & Disaster Recovery

- [ ] **Enable Firestore automated backups**
  - Configure daily backups
  - Set retention period (30 days)
  - Document restoration procedure

- [ ] **Test backup restoration**
  - Restore to test project
  - Verify data integrity
  - Time the process

- [ ] **Create disaster recovery plan**
  - Document all recovery procedures
  - Assign responsibilities
  - Set RTO and RPO targets

### Testing

- [ ] **Complete manual testing of all flows**
  - User registration (email + Google)
  - Company registration
  - Company profile editing
  - Service creation/editing
  - Booking creation
  - Booking confirmation
  - Booking cancellation
  - Review submission
  - Search functionality
  - Mobile responsive testing

- [ ] **Cross-browser testing**
  - Chrome (latest)
  - Firefox (latest)
  - Safari (latest)
  - Edge (latest)
  - Mobile Safari
  - Mobile Chrome

- [ ] **Mobile device testing**
  - iOS (iPhone)
  - Android
  - Different screen sizes
  - Touch interactions

- [ ] **Performance testing**
  - Run Lighthouse audit
  - Check Core Web Vitals
  - Test with slow 3G network
  - Optimize based on results

- [ ] **Load testing**
  - Test with multiple concurrent users
  - Identify bottlenecks
  - Verify Cloud Functions scaling

### SMS Configuration

**DECISION REQUIRED:** Keep or remove SMS feature?

**Option A: Enable SMS (Recommended)**
- [ ] Sign up for 46elks account
- [ ] Fund account
- [ ] Configure API credentials
- [ ] Test SMS sending in production
- [ ] Monitor costs

**Option B: Disable SMS Temporarily**
- [ ] Comment out SMS service code
- [ ] Remove SMS reminders from booking flow
- [ ] Update documentation
- [ ] Plan future SMS integration

---

## ⚠️ HIGH PRIORITY - Launch Soon After

### Email Notifications

- [ ] **Set up email service**
  - SendGrid, AWS SES, or similar
  - Configure sender domain
  - Set up email templates

- [ ] **Implement booking confirmation emails**
  - Send on booking creation
  - Include booking details
  - Add calendar attachment

- [ ] **Implement notification emails**
  - Booking status changes
  - Company messages
  - System notifications

### Testing Infrastructure

- [ ] **Add Jest configuration**
  ```bash
  npm install --save-dev jest @testing-library/react @testing-library/jest-dom
  ```

- [ ] **Write unit tests for critical functions**
  - AuthContext
  - smsService
  - notificationService
  - Booking logic

- [ ] **Add integration tests**
  - Authentication flow
  - Booking flow
  - Company creation

- [ ] **Set up CI/CD pipeline**
  - GitHub Actions workflow
  - Run tests on PR
  - Auto-deploy on merge to main

### Performance Optimization

- [ ] **Replace `<img>` with Next.js `<Image>`**
  - components/company/CompanyCard.tsx
  - All other image instances
  - Configure image domains in next.config.js

- [ ] **Implement caching strategy**
  - Add SWR or React Query
  - Cache Firestore queries
  - Implement stale-while-revalidate

- [ ] **Enable ISR for company pages**
  - Use `revalidate` in getStaticProps
  - Cache company pages
  - Invalidate on updates

- [ ] **Optimize bundle size**
  - Analyze bundle with webpack-bundle-analyzer
  - Code split large components
  - Lazy load non-critical components

### Booking Management

- [ ] **Add booking actions for owners**
  - Confirm booking button
  - Cancel booking button
  - Reschedule booking interface
  - Contact customer button

- [ ] **Add customer booking management**
  - View booking history
  - Cancel booking
  - Request reschedule
  - View booking status

- [ ] **Implement booking conflicts detection**
  - Check for double bookings
  - Show available time slots
  - Prevent overlapping bookings

### Analytics Dashboard

- [ ] **Create owner dashboard**
  - Total bookings
  - Revenue (when payments implemented)
  - Booking trends
  - Customer demographics
  - Service popularity

- [ ] **Add customer dashboard**
  - Booking history
  - Favorite companies
  - Spending summary
  - Loyalty points (future)

### Documentation

- [ ] **Create API documentation**
  - Document Cloud Functions endpoints
  - Request/response formats
  - Error codes
  - Rate limits

- [ ] **Write deployment runbook**
  - Step-by-step deployment process
  - Rollback procedures
  - Common issues and solutions

- [ ] **Create user guides**
  - For company owners
  - For customers
  - FAQ section

---

## 💡 NICE TO HAVE - Post-Launch Enhancements

### Payment Integration

- [ ] **Set up Stripe account**
  - Business verification
  - Connect bank account
  - Configure webhooks

- [ ] **Implement Stripe integration**
  - Premium listing payments
  - Booking fees (if applicable)
  - Subscription management

- [ ] **Add payment UI**
  - Pricing page
  - Checkout flow
  - Payment history

### Advanced Search

- [ ] **Integrate Algolia**
  - Index companies in Algolia
  - Implement search UI
  - Add search filters

- [ ] **Add geolocation search**
  - "Near me" functionality
  - Radius-based search
  - Map view

- [ ] **Implement search analytics**
  - Track search queries
  - Identify popular searches
  - Optimize results

### Calendar Integration

- [ ] **Google Calendar sync**
  - OAuth integration
  - Sync bookings to calendar
  - Handle conflicts

- [ ] **iCal export**
  - Generate .ics files
  - Add to calendar links
  - Calendar subscription

### Multi-language Support

- [ ] **Implement i18n framework**
  - Install next-i18next
  - Extract strings to translation files
  - Create translation workflow

- [ ] **Add English translations**
  - Translate all UI strings
  - Test language switching
  - Verify formatting (dates, currency)

- [ ] **Add Arabic translations**
  - Translate to Arabic
  - Implement RTL layout
  - Test with Arabic users

### Mobile App

- [ ] **Plan mobile app architecture**
  - React Native or Flutter
  - Shared backend (Firebase)
  - Feature parity with web

- [ ] **Design mobile UI/UX**
  - Mobile-first designs
  - Native patterns
  - Platform-specific features

- [ ] **Develop mobile app**
  - iOS app
  - Android app
  - App Store submission

### Progressive Web App (PWA)

- [ ] **Add service worker**
  - Implement offline support
  - Cache static assets
  - Background sync

- [ ] **Add install prompt**
  - Configure web app manifest
  - Custom install prompt
  - Track installations

- [ ] **Enable push notifications**
  - Request permission
  - Send web push
  - Notification actions

---

## 📊 Launch Day Checklist

### Pre-Launch (Day Before)

- [ ] **Final code review**
  - All critical issues resolved
  - No TODO comments in production code
  - All console.logs removed or minimized

- [ ] **Deploy to staging**
  - Test all critical flows
  - Verify environment variables
  - Check external integrations

- [ ] **Performance check**
  - Run Lighthouse audit
  - Verify Core Web Vitals
  - Test page load speeds

- [ ] **Security scan**
  - Run npm audit
  - Check for exposed secrets
  - Verify security headers

- [ ] **Backup current state**
  - Export Firestore data
  - Backup Firebase config
  - Save current deployment

- [ ] **Prepare rollback plan**
  - Document rollback steps
  - Test rollback procedure
  - Assign rollback authority

- [ ] **Alert team**
  - Notify all stakeholders
  - Schedule launch time
  - Ensure availability for issues

### Launch (Deployment Day)

- [ ] **Final staging test**
  - Complete smoke test
  - Verify all integrations
  - Check monitoring systems

- [ ] **Deploy to production**
  - Merge to main branch
  - Verify Vercel deployment
  - Deploy Firebase functions

- [ ] **Post-deployment verification**
  - Test critical paths
  - Verify monitoring is working
  - Check error rates

- [ ] **DNS propagation**
  - Verify custom domain works
  - Test from different locations
  - Check SSL certificate

- [ ] **Monitor for issues**
  - Watch Sentry for errors
  - Monitor Firebase usage
  - Check user feedback

### Post-Launch (First Hours)

- [ ] **Continuous monitoring**
  - Error rates
  - Response times
  - User activity

- [ ] **User feedback collection**
  - Set up feedback form
  - Monitor social media
  - Track support requests

- [ ] **Performance metrics**
  - Page load times
  - Conversion rates
  - Booking completions

- [ ] **Team debrief**
  - Document issues encountered
  - Note improvements for next launch
  - Celebrate success! 🎉

---

## 🔧 Troubleshooting Common Issues

### Build Failures

**Issue:** Next.js build fails
- Check node version (require 18+)
- Clear .next cache: `rm -rf .next`
- Update dependencies: `npm update`

**Issue:** TypeScript errors
- Run type check: `npm run type-check`
- Check for missing types
- Update TypeScript version

### Runtime Errors

**Issue:** Firebase connection errors
- Verify environment variables
- Check Firebase project settings
- Verify Firestore rules

**Issue:** Authentication not working
- Check Firebase Auth configuration
- Verify authorized domains
- Check browser console for errors

**Issue:** SMS not sending
- Verify SMS provider credentials
- Check Cloud Functions logs
- Verify phone number format

### Performance Issues

**Issue:** Slow page loads
- Run Lighthouse audit
- Check bundle size
- Verify CDN is working

**Issue:** Slow database queries
- Check Firestore indexes
- Review query patterns
- Add caching

---

## 📞 Emergency Contacts

### Technical Issues
- **Developer Lead:** [Name/Email]
- **Firebase Support:** firebase.google.com/support
- **Vercel Support:** vercel.com/support

### Business Issues
- **Product Owner:** [Name/Email]
- **Customer Support:** [Email]

### Third-Party Services
- **46elks Support:** support@46elks.com
- **Sentry Support:** support@sentry.io
- **Domain Registrar:** [Contact]

---

## ✅ Sign-Off

Before launching to production, the following stakeholders must approve:

- [ ] **Technical Lead** - All technical requirements met
- [ ] **Product Owner** - Features complete and tested
- [ ] **Legal/Compliance** - GDPR and legal requirements met
- [ ] **Security** - Security audit passed
- [ ] **QA** - All test cases passed

**Launch Date:** ___________________

**Approved By:**
- Technical Lead: _________________ Date: _______
- Product Owner: _________________ Date: _______
- Legal: _________________ Date: _______

---

**Document Version:** 1.0  
**Last Updated:** December 20, 2025  
**Next Review:** Post-launch + 1 week

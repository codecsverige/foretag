# VägVänner - Project Overview
## نظرة عامة على المشروع

**Version:** 0.5.2  
**Last Updated:** 2025-10-07  
**Platform:** Web Application (React.js) + Mobile Ready (Capacitor)  
**Domain:** vagvanner.se

---

## 📋 Table of Contents | جدول المحتويات

1. [Project Description](#project-description)
2. [Technology Stack](#technology-stack)
3. [Architecture](#architecture)
4. [Database Schema](#database-schema)
5. [Revenue Model](#revenue-model)
6. [Payment Flow](#payment-flow)
7. [Key Features](#key-features)
8. [Deployment](#deployment)
9. [Environment Variables](#environment-variables)
10. [Security & Compliance](#security-compliance)

---

## 1. Project Description | وصف المشروع

**VägVänner** is a Swedish ridesharing marketplace that connects drivers and passengers for cost-sharing trips across Sweden.

### Core Concept | المفهوم الأساسي

- **Platform Role:** Contact facilitator only (not a transport provider)
- **Revenue Model:** 10 SEK commission per contact unlock
- **Legal Framework:** Cost-sharing only (Swedish law compliant)
- **User Types:** 
  - Drivers (Förare) - Post available rides
  - Passengers (Passagerare) - Search for rides or post ride requests
  - Bus Companies - Post bus routes (additional feature)

### Key Differentiators | المميزات الرئيسية

✅ 100% Swedish language interface  
✅ GDPR compliant  
✅ Secure payment via PayPal (Authorize → Capture flow)  
✅ Phone verification required  
✅ 48-hour report window with automatic refund  
✅ Modern, responsive UI (Mobile & Desktop)

---

## 2. Technology Stack | المكدس التقني

### Frontend
```javascript
- React.js 18.2.0
- React Router 6.30.1
- TailwindCSS 3.4.4
- React Helmet Async (SEO)
- Fuse.js (Search)
- Lucide React (Icons)
```

### Backend & Services
```javascript
- Firebase 11.10.0
  - Authentication (Google OAuth + Phone)
  - Firestore (Database)
  - Cloud Storage
  - Cloud Messaging (FCM)
  - Cloud Functions (Node.js 18+)
  
- PayPal
  - @paypal/react-paypal-js 8.8.1
  - Payment flow: Authorize → Capture
  
- EmailJS 4.4.1
  - Email notifications
  
- Sentry 7.91.0
  - Error tracking & monitoring
```

### Deployment & Infrastructure
```javascript
- Vercel (Production hosting)
  - Auto-deploy from GitHub main branch
  - Node.js 20+
  - Serverless functions
  
- GitHub (Source control)
  - Repository: codecsverige/vagvanner
  - Branch: main
  
- Firebase Hosting (Disabled)
  - Previously used, now Vercel only
```

### Mobile (Optional)
```javascript
- Capacitor 7.4.3
  - Android support
  - iOS support
  - Push notifications
```

---

## 3. Architecture | المعمارية

### System Architecture | معمارية النظام

```
┌─────────────────────────────────────────────────────────────┐
│                         User (Browser)                       │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────────┐
│              Vercel (Static Hosting + CDN)                   │
│                  React SPA (index.html)                      │
└────────────────────┬────────────────────────────────────────┘
                     │
        ┌────────────┼────────────┬──────────────┐
        ↓            ↓            ↓              ↓
   ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌──────────┐
   │Firebase │  │ PayPal  │  │EmailJS  │  │  Sentry  │
   │ Services│  │   API   │  │   API   │  │   API    │
   └─────────┘  └─────────┘  └─────────┘  └──────────┘
        │
        ├─ Authentication (Google + Phone)
        ├─ Firestore Database
        ├─ Cloud Storage
        ├─ Cloud Messaging (FCM)
        └─ Cloud Functions
```

### Application Flow | تدفق التطبيق

```
User Journey 1: Driver Posts Ride
─────────────────────────────────
1. Sign in (Google OAuth)
2. Verify phone number (SMS OTP)
3. Create ride (/create-ride)
   - Origin, Destination, Date, Time
   - Price, Available seats
   - Car details (optional)
4. Ride published → Firestore "rides" collection
5. Passengers can find and book

User Journey 2: Passenger Books Ride
─────────────────────────────────────
1. Sign in + verify phone
2. Search/browse rides (/search, /home)
3. View ride details (/ride/:id)
4. Click "Book" → /book-ride/:id
5. Fill contact info (name, phone, optional email)
6. Booking created → Firestore "bookings" collection
7. Driver sees booking in /inbox?tab=resor
8. Driver unlocks contact (pays 10 SEK via PayPal)
9. Driver sees passenger phone & email
10. Direct contact outside platform
```

### Folder Structure | هيكل المجلدات

```
vagvanner/
├── public/               # Static files
│   ├── index.html       # Main HTML
│   ├── manifest.json    # PWA manifest
│   ├── legal/           # Static legal pages
│   └── ride/            # SEO ride pages (generated)
│
├── src/
│   ├── App.js           # Main app component
│   ├── index.js         # Entry point
│   │
│   ├── components/      # Reusable UI components
│   │   ├── inbox/       # Inbox-specific components
│   │   ├── rides/       # Ride-specific components
│   │   ├── ui/          # Basic UI elements
│   │   └── ...
│   │
│   ├── pages/           # Page components (routes)
│   │   ├── BookRide.jsx
│   │   ├── CreateRide.jsx
│   │   ├── SearchDynamic.jsx
│   │   ├── UnlockContactPage.jsx
│   │   ├── MinaResor/   # My Rides page
│   │   └── ...
│   │
│   ├── services/        # Business logic & API calls
│   │   ├── notificationService.js
│   │   ├── reportService.js
│   │   ├── accountService.js
│   │   └── ...
│   │
│   ├── utils/           # Utility functions
│   │   ├── booking.js   # Booking logic (COMMISSION constant)
│   │   ├── address.js   # City extraction
│   │   ├── phone.js     # Phone normalization
│   │   └── ...
│   │
│   ├── context/         # React contexts
│   │   ├── AuthContext.jsx
│   │   └── NotificationContext.jsx
│   │
│   ├── hooks/           # Custom React hooks
│   ├── config/          # Configuration files
│   │   ├── env.js       # Environment config
│   │   ├── paypal.js    # PayPal config
│   │   └── legal.js     # Legal info
│   │
│   └── firebase/        # Firebase setup
│       └── firebase.js  # Firebase initialization
│
├── functions/           # Firebase Cloud Functions
│   ├── index.js         # Main functions file
│   └── package.json
│
├── scripts/             # Build & maintenance scripts
│   ├── generate-sitemap.cjs
│   └── generate-ride-pages.cjs
│
├── docs/                # Documentation
├── package.json         # Dependencies
├── vercel.json          # Vercel configuration
├── firebase.json        # Firebase configuration
├── firestore.rules      # Firestore security rules
└── firestore.indexes.json # Firestore indexes

```

---

## 4. Database Schema | هيكل قاعدة البيانات

### Firestore Collections

#### **users** (مستخدمين)
```javascript
{
  userId: string,          // Firebase Auth UID
  email: string,
  displayName: string,
  phoneNumber: string,     // Verified phone (E.164 format)
  photoURL: string,
  createdAt: string,       // ISO timestamp
  role: string,            // "förare" | "passagerare" (informational)
  balance: number          // Future feature
}
```

#### **rides** (رحلات)
```javascript
{
  // Basic Info
  id: string,              // Auto-generated
  userId: string,          // Owner UID
  driverName: string,
  driverEmail: string,
  driverPhone: string,
  
  // Trip Details
  role: string,            // "förare" | "passagerare"
  type: string,            // "offer" | "request"
  origin: string,          // Full address
  destination: string,     // Full address
  date: string,            // YYYY-MM-DD
  departureTime: string,   // HH:MM
  
  // Pricing
  price: number,           // Price in SEK
  costMode: string,        // "fixed_price" | "flexible"
  
  // Capacity (for drivers)
  count: number,           // Available seats
  seatsAvailable: number,
  
  // Recurring trips
  isRecurring: boolean,
  weekdays: string[],      // ["monday", "tuesday", ...]
  
  // Return trip
  isReturn: boolean,
  returnDate: string,
  returnTime: string,
  
  // Preferences
  passengerPreference: string,  // Gender preference
  genderPreference: string,
  conversationLevel: string,
  smokingAllowed: boolean,
  petsAllowed: boolean,
  
  // Car details (for drivers)
  carBrand: string,
  carModel: string,
  carYear: number,
  licensePlate: string,
  carComfort: string,
  driverExperience: string,
  
  // Status
  status: string,          // "active" | "completed" | "cancelled"
  archived: boolean,
  
  // Metadata
  createdAt: string,       // ISO timestamp
  updatedAt: string
}
```

#### **bookings** (حجوزات)
```javascript
{
  // IDs
  id: string,              // booking_${rideId}_${userId}_${timestamp}
  bookingType: string,     // "seat_booking" | "contact_unlock"
  rideId: string,
  userId: string,          // Passenger UID
  counterpartyId: string,  // Driver UID
  
  // Ride snapshot
  rideRole: string,
  ride_origin: string,
  ride_destination: string,
  ride_date: string,
  ride_time: string,
  
  // Passenger info
  passengerName: string,
  passengerEmail: string,   // Optional
  passengerPhone: string,   // Required
  passengerComment: string,
  
  // Driver info
  driverName: string,
  driverEmail: string,
  driverPhone: string,
  
  // Booking details
  seats: number,
  price: number,
  commission: number,       // 0 for initial booking
  
  // Status
  status: string,           // "requested" | "authorized" | "captured" | "voided" | "cancelled"
  
  // Timestamps
  createdAt: number,        // Unix timestamp
  paidAt: number,
  contactUnlockedAt: number,
  cancelledAt: number,
  
  // PayPal info (added after unlock)
  paypal: {
    orderId: string,
    captureId: string,
    status: string,
    amount: number
  }
}
```

#### **contact_unlock** (فتح معلومات الاتصال)
```javascript
{
  rideId: string,
  userId: string,          // Who paid to unlock
  counterpartyId: string,  // Whose contact was unlocked
  paidAt: number,          // Unix timestamp
  createdAt: number,
  
  // Shared info flags
  driverEmailShared: boolean,
  driverPhoneShared: boolean
}
```

#### **alerts** (تنبيهات البحث)
```javascript
{
  userId: string,
  userEmail: string,
  originCity: string,      // Empty for global
  destinationCity: string, // Empty for global
  scope: string,           // "route" | "global"
  active: boolean,
  createdAt: number
}
```

#### **notifications** (إشعارات)
```javascript
{
  userEmail: string,
  userName: string,
  title: string,
  body: string,
  type: string,            // "success" | "info" | "warning" | "error"
  read: boolean,
  sent: boolean,
  createdAt: number
}
```

#### **busRoutes** (خطوط الباصات) - Optional Feature
```javascript
{
  company: string,
  from: string,
  to: string,
  departureAt: string,
  arrivalAt: string,
  price: number,
  currency: string,
  totalSeats: number,
  availableSeats: number,
  amenities: string[],
  bookingUrl: string,
  busNumber: string,
  type: string,            // "express" | "regional" | "local"
  status: string,          // "active" | "cancelled"
  createdBy: string,       // UID of bus company
  createdAt: number
}
```

---

## 5. Revenue Model | نموذج الإيرادات

### Commission Structure

```javascript
// Source: src/utils/booking.js
export const COMMISSION = 10; // SEK

Payment Flow:
1. Booking created → FREE (no payment)
2. Driver unlocks passenger contact → 10 SEK via PayPal
3. Passenger unlocks driver contact → 10 SEK via PayPal
```

### Payment Breakdown

| Action | Cost | Platform Revenue | PayPal Fee (~3.5%) |
|--------|------|------------------|-------------------|
| Create Ride | FREE | 0 SEK | 0 SEK |
| Send Booking Request | FREE | 0 SEK | 0 SEK |
| Unlock Contact | 10 SEK | ~9.65 SEK | ~0.35 SEK |

### Refund Policy

- **48-hour Report Window:** Users can report issues within 48h
- **Automatic Refund:** If reported, payment is voided (if not captured yet)
- **No Refund After 48h:** Payment is captured and finalized

---

## 6. Payment Flow | تدفق الدفع

### PayPal Authorize → Capture Flow

```
Step 1: User clicks "Unlock Contact"
↓
Step 2: PayPal payment modal opens
User authorizes payment (10 SEK)
↓
Step 3: Payment AUTHORIZED (not captured yet)
Money reserved on user's card for 48 hours
↓
Step 4: Contact info revealed to user
↓
Step 5a: No issues → After 48h, automatic CAPTURE
         Platform receives money
↓
Step 5b: User reports issue → VOID authorization
         Money returned to user's card

Technical Implementation:
─────────────────────────
- File: src/config/env.js
- PayPal Mode: "prod" (live payments)
- Intent: "authorize" (not "capture")
- Currency: "SEK"
- Amount: 10 SEK (COMMISSION constant)

Components:
- src/components/PayPalSimple.jsx (Payment button)
- src/pages/UnlockContactPage.jsx (Unlock flow)
- functions/index.js (Scheduled capture - Cloud Function)
```

### Payment States

```
requested → User sent booking
authorized → PayPal authorized (money held)
captured → Money captured by platform (after 48h)
voided → Authorization cancelled (refund)
cancelled → Booking cancelled before payment
failed → Payment failed
```

---

## 7. Key Features | المميزات الرئيسية

### Authentication & Verification ✅
- Google OAuth Sign-in
- Phone number verification (SMS OTP)
- Firebase Authentication
- Session persistence

### Ride Management 🚗
- Create ride offers (drivers)
- Create ride requests (passengers)
- Recurring rides (weekly schedule)
- Return trips
- Search & filter
- Real-time updates

### Booking System 📋
- Send booking requests
- View bookings in Inbox
- Cancel bookings
- Unlock contact information (10 SEK)
- 48-hour report window

### Notifications 🔔
- In-app notifications
- Email notifications (EmailJS)
- Push notifications (FCM) - Optional
- Real-time Firestore listeners

### Search & Discovery 🔍
- City-based search (Fuse.js)
- Date range filters
- Price filters
- Route-based alerts

### SEO Optimization 📈
- Dynamic meta tags (React Helmet)
- Static ride pages generation
- Sitemap.xml
- IndexNow integration
- OpenGraph tags

### Admin Features (Basic) 👨‍💼
- Bus company accounts
- Bus route management
- User management (planned)
- Report handling (planned)

### Legal & Compliance ⚖️
- GDPR compliant
- Privacy policy (Integritetspolicy)
- Terms of service (Användarvillkor)
- Cookie consent
- Data deletion requests

---

## 8. Deployment | النشر

### Production Deployment (Vercel)

**Domain:** https://vagvanner.se  
**Deployment:** Automatic from GitHub

```bash
# Deployment Process
1. Push to main branch → GitHub
2. Vercel auto-detects and builds
3. Build command: npm run build
4. Output: build/ folder
5. Deploy to vagvanner.se

# Manual Deploy (if needed)
vercel --prod
```

### Environment Configuration

**File:** `vercel.json`
```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        }
      ]
    }
  ]
}
```

### Build Settings

- **Framework:** Create React App
- **Node Version:** 20.x
- **Build Command:** `npm run build`
- **Output Directory:** `build`
- **Install Command:** `npm install`

### Firebase Functions

**Deployment:**
```bash
cd functions
npm install
firebase deploy --only functions
```

**Active Functions:**
- Scheduled payment capture (48h after authorization)
- Email notifications
- Data cleanup

---

## 9. Environment Variables | متغيرات البيئة

### Required Variables

**Firebase:**
```bash
REACT_APP_FIREBASE_API_KEY=
REACT_APP_FIREBASE_AUTH_DOMAIN=
REACT_APP_FIREBASE_PROJECT_ID=
REACT_APP_FIREBASE_STORAGE_BUCKET=
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=
REACT_APP_FIREBASE_APP_ID=
REACT_APP_FIREBASE_MEASUREMENT_ID=
```

**PayPal:**
```bash
REACT_APP_PAYPAL_CLIENT_ID_PROD=    # Live PayPal Client ID
REACT_APP_PAYPAL_CLIENT_ID_SANDBOX= # Sandbox Client ID (optional)
```

**EmailJS:**
```bash
REACT_APP_EMAILJS_PUBLIC_KEY=
REACT_APP_EMAILJS_SERVICE_ID=
REACT_APP_EMAILJS_TEMPLATE_ID=
```

**Sentry (Optional):**
```bash
REACT_APP_SENTRY_DSN=
```

**Other:**
```bash
NODE_ENV=production
VERCEL_TOOLBAR=0
```

### Configuration Files

All environment variables are centralized in:
- **Frontend:** `src/config/env.js`
- **Functions:** `functions/.env` (not in repo)

---

## 10. Security & Compliance | الأمان والامتثال

### Firestore Security Rules

**File:** `firestore.rules`

Key Rules:
- Users can only read/write their own data
- Rides are public (read), owners only (write)
- Bookings only visible to parties involved
- Bus routes require special permissions
- No anonymous access (except ride listings)

### GDPR Compliance ✅

**Data Collection:**
- Name, email, phone (with consent)
- Location data (ride origin/destination)
- Payment info (via PayPal, not stored)

**User Rights:**
- Access their data
- Request deletion
- Withdraw consent
- Data portability

**Implementation:**
- Privacy policy: `/integritetspolicy`
- Terms: `/anvandningsvillkor`
- Contact: support email in `src/config/legal.js`

### Security Best Practices

✅ Firebase Authentication  
✅ Firestore Security Rules  
✅ Phone verification required  
✅ PayPal secure checkout  
✅ HTTPS only (enforced by Vercel)  
✅ Input validation  
✅ XSS protection  
✅ CSRF protection (Firebase SDK)  
✅ Rate limiting (basic, in rules)  
✅ Error tracking (Sentry)

---

## 📞 Support & Maintenance

### Key Files for Troubleshooting

- **Errors:** Check Sentry dashboard
- **Logs:** Vercel logs + Firebase Functions logs
- **Database:** Firebase Console → Firestore
- **Payments:** PayPal Dashboard
- **Email:** EmailJS Dashboard

### Common Issues

**Issue:** Phone verification not working  
**Fix:** Check Firebase Phone Auth quota

**Issue:** PayPal errors  
**Fix:** Verify Client ID in environment variables

**Issue:** Email not sending  
**Fix:** Check EmailJS service limits

**Issue:** Build fails  
**Fix:** Check Node version (need 20+)

---

## 📚 Additional Documentation

- `HANDOVER_GUIDE.md` - Ownership transfer guide
- `SALE_PREPARATION_REPORT.md` - Sale preparation checklist
- `README.md` - Development setup
- `docs/` - Various technical docs

---

## 📊 Metrics to Track (Recommended)

**User Metrics:**
- MAU/WAU (Monthly/Weekly Active Users)
- New signups per week
- Phone verification rate

**Ride Metrics:**
- New rides posted per week
- Rides by type (offer/request)
- Most popular routes

**Revenue Metrics:**
- Contact unlocks per week
- Average revenue per user
- PayPal transaction success rate

**Engagement:**
- Booking requests sent
- Booking conversion rate
- User retention (30-day)

---

**Last Updated:** 2025-10-07  
**Version:** 1.0  
**Maintained By:** VägVänner Development Team
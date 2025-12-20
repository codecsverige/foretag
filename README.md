# 🏢 BokaNära

> منصة سويدية للشركات المحلية - اكتشف واحجز الخدمات بسهولة
> 
> En svensk plattform för lokala företag - Hitta och boka tjänster enkelt

---

## 📋 نظرة عامة | Översikt

BokaNära är en plattform som kopplar samman kunder med lokala företag i Sverige. Företag kan lista sina tjänster och kunder kan söka, boka och få SMS-påminnelser.

**الميزات الرئيسية | Huvudfunktioner:**

- 🔍 **Sök företag** - Hitta lokala tjänster efter kategori och stad
- 🏢 **Företagsprofiler** - Fullständiga sidor med tjänster, öppettider, kontakt
- 📅 **Online-bokning** - Boka tid direkt via plattformen
- 📱 **SMS-påminnelser** - Automatiska påminnelser före bokningar
- ⭐ **Recensioner** - Kunder kan lämna omdömen
- 🔐 **Säker inloggning** - Google och e-post/lösenord

---

## 🛠️ التقنيات | Tech Stack

| التقنية | الوصف |
|---------|-------|
| **Next.js 14** | App Router, SSR, SSG |
| **React 18** | UI Components |
| **TypeScript** | Type Safety |
| **Tailwind CSS** | Styling |
| **Firebase Auth** | Authentication |
| **Cloud Firestore** | Database |
| **Firebase Storage** | File Storage |
| **Cloud Functions** | Backend Logic |
| **Vercel** | Hosting |

---

## 📁 هيكل المشروع | Projektstruktur

```
bokanara/
├── app/                    # Next.js App Router pages
│   ├── page.tsx           # Startsida
│   ├── sok/page.tsx       # Söksida
│   ├── skapa/page.tsx     # Skapa annons
│   ├── foretag/[id]/      # Företagssidor
│   ├── login/page.tsx     # Inloggning
│   ├── registrera/page.tsx # Registrering
│   └── konto/page.tsx     # Mitt konto
│
├── components/             # React-komponenter
│   ├── layout/            # Header, Footer
│   ├── company/           # CompanyCard, etc.
│   ├── booking/           # BookingForm
│   └── search/            # CategoryGrid
│
├── services/               # Business Logic
│   ├── analytics.ts       # Google Analytics
│   ├── notificationService.ts # In-app notiser
│   └── smsService.ts      # SMS-påminnelser
│
├── context/               # React Context
│   └── AuthContext.tsx    # Firebase Auth
│
├── lib/                   # Utilities
│   └── firebase.ts        # Firebase config
│
├── functions/             # Cloud Functions
│   ├── index.js           # All functions
│   └── package.json
│
├── firebase.json          # Firebase config
├── firestore.rules        # Security rules
└── firestore.indexes.json # Database indexes
```

---

## 🚀 البدء السريع | Kom igång

### 1. استنساخ المشروع | Klona projektet

```bash
git clone https://github.com/codecsverige/foretag.git
cd foretag/bokanara
```

### 2. تثبيت التبعيات | Installera dependencies

```bash
npm install
```

### 3. إعداد متغيرات البيئة | Konfigurera miljövariabler

```bash
cp .env.example .env.local
# Fyll i dina Firebase-uppgifter
```

### 4. تشغيل الخادم المحلي | Starta dev server

```bash
npm run dev
```

Öppna http://localhost:3000

---

## 🔥 إعداد Firebase | Firebase Setup

### 1. إنشاء مشروع | Skapa projekt

1. Gå till [Firebase Console](https://console.firebase.google.com/)
2. Skapa nytt projekt: `bokanara`
3. Aktivera:
   - **Authentication** → Google + E-post/lösenord
   - **Firestore Database** → Production mode
   - **Storage** → Production mode

### 2. تكوين الويب | Webb-konfiguration

1. Project Settings → Your apps → Web
2. Registrera app: `BokaNära Web`
3. Kopiera konfigurationen till `.env.local`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=xxx
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=xxx
NEXT_PUBLIC_FIREBASE_PROJECT_ID=xxx
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=xxx
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=xxx
NEXT_PUBLIC_FIREBASE_APP_ID=xxx
```

### 3. نشر قواعد Firestore | Deploya regler

```bash
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
```

---

## 📊 قاعدة البيانات | Databasstruktur

### Collections

```
📁 users/
   └── {userId}
       ├── displayName: string
       ├── email: string
       ├── phone?: string
       ├── createdAt: timestamp
       └── role: "user" | "business"

📁 companies/
   └── {companyId}
       ├── name: string
       ├── category: string
       ├── categoryName: string
       ├── city: string
       ├── address?: string
       ├── phone?: string
       ├── email?: string
       ├── website?: string
       ├── description?: string
       ├── services: Array<{name, duration, price}>
       ├── openingHours: Object
       ├── ownerId: string (userId)
       ├── status: "drafted" | "published"
       ├── premium: boolean
       ├── rating?: number
       ├── reviewCount?: number
       └── createdAt: timestamp

📁 bookings/
   └── {bookingId}
       ├── companyId: string
       ├── companyName: string
       ├── customerId: string
       ├── customerName: string
       ├── phone: string
       ├── serviceName: string
       ├── date: string
       ├── time: string
       ├── status: "pending" | "confirmed" | "cancelled"
       ├── smsReminder: boolean
       └── createdAt: timestamp

📁 reviews/
   └── {reviewId}
       ├── companyId: string
       ├── userId: string
       ├── userName: string
       ├── rating: number (1-5)
       ├── text?: string
       └── createdAt: timestamp

📁 notifications/
   └── {notificationId}
       ├── userEmail: string
       ├── title: string
       ├── body: string
       ├── type: "info" | "success" | "warning"
       ├── read: boolean
       └── createdAt: timestamp

📁 reminders/
   └── {reminderId}
       ├── bookingId: string
       ├── toPhone: string
       ├── message: string
       ├── sendAt: timestamp
       ├── status: "pending" | "sent" | "failed"
       └── attempts: number
```

---

## 📱 نظام SMS | SMS-system

### مزودي الخدمة المدعومين | Leverantörer

- **46elks** (Rekommenderat för Sverige)
- **Twilio**
- **Sinch**

### الإعداد | Konfiguration

```bash
# I Cloud Functions miljövariabler:
firebase functions:config:set sms.provider="46elks"
firebase functions:config:set sms.api_key="YOUR_KEY"
firebase functions:config:set sms.api_secret="YOUR_SECRET"
firebase functions:config:set sms.sender="BokaNara"
```

### كيف يعمل | Hur det fungerar

1. Kund bokar tid → Bokning sparas i Firestore
2. Status ändras till "confirmed" → Cloud Function skapar påminnelser
3. 24h före → SMS skickas
4. 2h före → SMS skickas

---

## 🚀 النشر | Deployment

### Vercel

1. Gå till [vercel.com/new](https://vercel.com/new)
2. Importera från GitHub: `codecsverige/foretag`
3. **Root Directory:** `bokanara`
4. Lägg till Environment Variables
5. Deploy!

### Firebase Functions

```bash
cd functions
npm install
firebase deploy --only functions
```

---

## 💰 نموذج الربح | Affärsmodell

| Intäktskälla | Beskrivning |
|--------------|-------------|
| **Premium-listning** | Företag betalar för bättre synlighet |
| **Bokningsavgift** | Liten avgift per genomförd bokning |
| **SMS-påminnelser** | Extra kostnad för SMS-tjänsten |
| **Annonsering** | Sponsrade platser i sökresultat |

---

## 🔄 ما تم نقله من المشروع القديم | Migrerat från VägVänner

| Komponent | Status | Notering |
|-----------|--------|----------|
| Firebase Config | ✅ | Samma projekt kan användas |
| Authentication | ✅ | Google + E-post/lösenord |
| Firestore Rules | ✅ | Anpassade för BokaNära |
| Analytics Service | ✅ | Konverterad till TypeScript |
| Notification Service | ✅ | Anpassad för bokningar |
| SMS Service | ✅ | Ny implementation |
| Cloud Functions | ✅ | Boknings-specifika funktioner |

---

## 📝 أوامر مفيدة | Användbara kommandon

```bash
# Development
npm run dev          # Starta dev server
npm run build        # Bygg för produktion
npm run start        # Kör produktionsbygge

# Firebase
firebase deploy --only firestore:rules
firebase deploy --only functions
firebase emulators:start

# Vercel
vercel dev           # Lokal Vercel dev
vercel --prod        # Deploy till produktion
```

---

## 🔮 الخطط المستقبلية | Framtida utveckling

- [ ] Stripe-betalningar för Premium
- [ ] Admin-dashboard
- [ ] Företagsapp (React Native)
- [ ] Kalender-integration (Google Calendar)
- [ ] Multi-språk support (EN, AR)

---

## 📞 الدعم | Support

- **E-post:** support@bokanara.se
- **GitHub Issues:** [Rapportera problem](https://github.com/codecsverige/foretag/issues)

---

## 📄 الترخيص | Licens

MIT License - Se [LICENSE](./LICENSE)

---

**Byggd med ❤️ i Sverige 🇸🇪**

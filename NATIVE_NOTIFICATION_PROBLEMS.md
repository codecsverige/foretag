# 🔍 Native Notification Problems - Detaljerad Rapport

## ❌ Huvudproblem: Native Notifications Fungerar Inte

---

## 🔴 **Problem 1: Inga Native Projekt**

### Status
```bash
✅ @capacitor/core: Installerad (v5.5.1)
✅ @capacitor/android: Installerad (v5.7.8)
✅ @capacitor/ios: Installerad (v5.7.8)
✅ @capacitor/push-notifications: Installerad (v5.1.0)

❌ android/ mapp: SAKNAS
❌ ios/ mapp: SAKNAS
❌ google-services.json: SAKNAS
```

### Vad betyder det?
Capacitor-paketen är installerade, men **native-projekten har aldrig byggts**. Appen körs fortfarande som en ren webbapp.

### Kommando som behövs
```bash
# Lägg till Android
npx cap add android

# Lägg till iOS
npx cap add ios

# Synka web build till native
npx cap sync
```

---

## 🔴 **Problem 2: Saknade Notification Listeners**

### Plats: `src/utils/pushNotificationHelper.js`

### Nuvarande Kod
```javascript
// ✅ Detta finns (registrerar token)
PushNotifications.addListener('registration', async (token) => {
  await saveFcmTokenForEmail(user.email, token.value, {...});
  resolve(token.value);
});

PushNotifications.addListener('registrationError', (error) => {
  console.error('Native push registration failed:', error);
  resolve(null);
});

// ❌ Detta SAKNAS (tar emot notifications)
// INGEN listener för 'pushNotificationReceived'
// INGEN listener för 'pushNotificationActionPerformed'
```

### Vad händer nu?
1. Token registreras ✅
2. Cloud Function skickar notification ✅
3. Notification når enheten ✅
4. **Men ingen kod lyssnar på den** ❌
5. **Notification visas INTE** ❌

### Vad som behövs
```javascript
// Foreground: när appen är öppen
PushNotifications.addListener('pushNotificationReceived', (notification) => {
  console.log('Push received (foreground):', notification);
  // Visa notification manuellt eller uppdatera UI
});

// Background: när användaren klickar på notification
PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
  console.log('Push action performed:', action);
  // Navigera till rätt sida
});
```

---

## 🔴 **Problem 3: App.js Har Ingen Native Support**

### Plats: `src/App.js`

### Nuvarande Kod
```javascript
// Setup push notifications using the new unified system
const { setupPushNotifications } = await import("./utils/pushNotificationHelper.js");
const { onForegroundFcm } = await import("./firebase/firebase.js");

// ❌ Använder bara Web FCM
const unsubscribe = onForegroundFcm((payload) => {
  handleIncomingNotification(payload);
  notify({ type: 'info', message: `${title}: ${body}` });
});
```

### Problemet
- `onForegroundFcm` är **Web FCM only**
- Fungerar INTE på native apps
- Native apps behöver **Capacitor PushNotifications listeners**

### Vad som behövs
```javascript
// Kolla om native eller web
if (window.Capacitor?.isNativePlatform()) {
  // Setup Capacitor listeners
  const { PushNotifications } = await import('@capacitor/push-notifications');
  
  PushNotifications.addListener('pushNotificationReceived', (notification) => {
    // Handle foreground notification
  });
  
  PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
    // Handle notification tap
  });
} else {
  // Setup Web FCM
  const unsubscribe = onForegroundFcm((payload) => {
    handleIncomingNotification(payload);
  });
}
```

---

## 🔴 **Problem 4: handleIncomingNotification Gör Ingenting för Native**

### Plats: `src/utils/pushNotificationHelper.js` rad 138-160

### Nuvarande Kod
```javascript
export function handleIncomingNotification(payload) {
  const isNative = isNativeApp();
  const isPWA = isInstalledPWA();
  
  if (isNative) {
    // ❌ Denna kommentar är FELAKTIG
    // "الإشعار يظهر تلقائياً من النظام"
    // (Notification visas automatiskt från systemet)
    
    // ❌ Faktiskt: INGEN KOD KÖRS!
    return; // Gör ingenting
  }
  
  // Detta körs bara för Web/PWA
  new Notification(notificationTitle, notificationOptions);
}
```

### Problemet
- Kommentaren säger "notification visas automatiskt"
- Detta är **bara sant för background notifications**
- **Foreground notifications** (app öppen) kräver manuell hantering
- Nuvarande kod **gör ingenting** för native!

---

## 🟢 **Vad Fungerar**

### Backend (Cloud Functions) ✅
```javascript
// functions/index.js rad 610-652
const message = {
  notification: { title: '...', body: '...' },
  data: { route: '/', type: 'info' },
  
  // ✅ Android config finns
  android: {
    notification: {
      icon: 'ic_notification',
      color: '#2563eb',
      defaultSound: true,
      priority: 'high'
    }
  },
  
  // ✅ iOS config finns
  apns: {
    payload: {
      aps: {
        sound: 'default',
        badge: 1,
        contentAvailable: true
      }
    }
  },
  
  // ✅ Web config finns
  webpush: { ... }
};

// ✅ Skickas via admin.messaging().send()
await admin.messaging().send({ token: t, ...message });
```

**Backend är KORREKT konfigurerad** och skickar till alla plattformar!

---

## 📊 Flödesanalys

### Nuvarande Flöde (Web) ✅
```
1. Användare bokar resa
   ↓
2. Cloud Function skapar notification-dokument
   ↓
3. pushOnNotificationCreate triggas
   ↓
4. FCM message skickas till Web token
   ↓
5. onForegroundFcm() fångar meddelandet
   ↓
6. handleIncomingNotification() visar Web notification
   ↓
7. ✅ Användaren ser notifikationen!
```

### Nuvarande Flöde (Native) ❌
```
1. Användare bokar resa
   ↓
2. Cloud Function skapar notification-dokument
   ↓
3. pushOnNotificationCreate triggas
   ↓
4. FCM message skickas till Native token
   ↓
5. ❌ INGEN LISTENER på native-sidan!
   ↓
6. Notification når enheten men...
   ↓
7a. Background: iOS/Android visar automatiskt ✅
7b. Foreground: ❌ INGEN KOD HANTERAR DEN!
   ↓
8. ❌ Användaren ser INGEN notification när appen är öppen
```

---

## 🎯 Sammanfattning av Problem

| Problem | Plats | Effekt |
|---------|-------|--------|
| **1. Inga native projekt** | `/android/`, `/ios/` | Appen körs som web, inte native |
| **2. Saknade listeners** | `pushNotificationHelper.js` | Notifications tas inte emot |
| **3. App.js använder Web FCM** | `App.js` rad 157-170 | Fungerar inte på native |
| **4. handleIncomingNotification gör inget** | `pushNotificationHelper.js` rad 142-144 | Foreground notifications ignoreras |

---

## 🔧 Vad Behöver Fixas (Nästa Steg)

### 1. Bygg Native Projekt
```bash
npx cap add android
npx cap add ios
npx cap sync
```

### 2. Lägg Till Notification Listeners
I `pushNotificationHelper.js`:
- Lägg till `pushNotificationReceived` listener
- Lägg till `pushNotificationActionPerformed` listener

### 3. Uppdatera App.js
- Detektera om native eller web
- Använd rätt listener för varje plattform

### 4. Fixa handleIncomingNotification
- Implementera faktisk logik för native foreground notifications
- Använd Capacitor Local Notifications för att visa notification

### 5. Konfigurera Firebase för Native
- Lägg till `google-services.json` (Android)
- Lägg till `GoogleService-Info.plist` (iOS)
- Konfigurera push capabilities

---

## 📱 Tekniska Detaljer

### Capacitor PushNotifications Events

```typescript
// Registration
'registration' -> { value: string }  // Token mottagen
'registrationError' -> { error: string }  // Registration misslyckades

// Incoming Notifications
'pushNotificationReceived' -> {
  title: string,
  body: string,
  data: any,
  // ... mer
}

// User Action
'pushNotificationActionPerformed' -> {
  actionId: string,
  notification: PushNotification,
  // ... mer
}
```

### Skillnad: Background vs Foreground

**Background (App stängd/minimerad):**
- iOS/Android hanterar automatiskt
- Visas i notification center
- Ingen kod behövs

**Foreground (App öppen):**
- **iOS:** Visas INTE automatiskt (måste hantera manuellt)
- **Android:** Kan visas automatiskt ELLER manuellt
- **Måste** lyssna med `pushNotificationReceived`
- **Måste** visa med Local Notifications eller uppdatera UI

---

## ✅ Slutsats

**Backend:** Fungerar perfekt ✅  
**Web Frontend:** Fungerar perfekt ✅  
**Native Frontend:** Saknar komplett implementation ❌

Huvudproblemet är att **native notification listeners aldrig registreras**, så även om Cloud Function skickar notifikationer korrekt, finns det **ingen kod som tar emot dem** på native-sidan.
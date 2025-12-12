# 🔴 المشكلة: Capacitor Notifications لا تظهر

## 📱 السيناريو
التطبيق مثبت على الهاتف (PWA أو Capacitor app)، لكن الإشعارات **لا تظهر**.

---

## ❌ **المشكلة الرئيسية**

### في `src/App.js` السطر 157-170:

```javascript
// ❌ هذا الكود يستخدم Web FCM فقط!
const unsubscribe = onForegroundFcm((payload) => {
  console.log('📩 Foreground FCM received:', payload);
  handleIncomingNotification(payload);
  notify({ type: 'info', message: `${title}: ${body}` });
});
```

**المشكلة:**
- `onForegroundFcm()` يعمل فقط مع **Web FCM**
- عندما التطبيق مثبت كـ **Capacitor/PWA**، هذا الـ listener **لا يعمل!**
- النتيجة: **لا أحد يستمع للإشعارات!**

---

## 🔍 **التحليل التفصيلي**

### 1. ما يحدث الآن

#### عند تسجيل Token (يعمل ✅)
```javascript
// في setupPushNotifications()
if (nativeApp && window.Capacitor) {
  await PushNotifications.register();
  
  PushNotifications.addListener('registration', async (token) => {
    await saveFcmTokenForEmail(user.email, token.value, {...});
    resolve(token.value);
  });
}
```
- ✅ Token يُسجل في Firestore
- ✅ Platform: "native-app" أو "pwa-installed"

#### عند استقبال Notification (لا يعمل ❌)
```javascript
// في App.js - يستخدم Web FCM فقط!
const unsubscribe = onForegroundFcm((payload) => {
  // ❌ هذا لن يُستدعى أبداً على Capacitor!
});

// ❌ لا يوجد هذا:
PushNotifications.addListener('pushNotificationReceived', (notification) => {
  // يجب أن يكون هنا!
});
```

---

### 2. الفرق بين Web FCM و Capacitor

| الميزة | Web FCM | Capacitor PushNotifications |
|--------|---------|----------------------------|
| **متى يعمل** | متصفح عادي | تطبيق مثبت (PWA/Native) |
| **Listener** | `onMessage(messaging, callback)` | `PushNotifications.addListener()` |
| **Service Worker** | `firebase-messaging-sw.js` | نفسه + Capacitor layer |
| **Foreground** | `onMessage()` | `pushNotificationReceived` |
| **Background** | Service Worker | Native OS |

---

### 3. ما يحدث في Backend (Cloud Function)

```javascript
// functions/index.js - يعمل ✅
const message = {
  notification: { title: '...', body: '...' },
  data: { route: '/', type: 'info' },
  
  android: {...},  // ✅
  apns: {...},     // ✅
  webpush: {...}   // ✅
};

await admin.messaging().send({ token: nativeToken, ...message });
```

- ✅ Cloud Function ترسل الإشعار بشكل صحيح
- ✅ الإشعار يصل للجهاز
- ❌ **لكن لا أحد يستمع له على جانب التطبيق!**

---

## 🎯 **السبب الدقيق**

### الخطوات:
1. مستخدم يثبت التطبيق → `isInstalledPWA()` = `true` ✅
2. Token يُسجل عبر Capacitor ✅
3. Token يُحفظ في Firestore مع `platform: "pwa-installed"` ✅
4. Cloud Function ترسل إشعار للـ token ✅
5. الإشعار يصل للجهاز ✅
6. **App.js يستخدم `onForegroundFcm()`** ❌
7. `onForegroundFcm()` يستمع لـ **Web FCM** فقط ❌
8. **Capacitor notification لا يُلتقط!** ❌
9. **الإشعار لا يظهر!** ❌

---

## 📋 **الكود المفقود**

### في `src/App.js` يجب إضافة:

```javascript
// تحديد نوع المنصة
const isNative = window.Capacitor?.isNativePlatform();
const isPWA = window.matchMedia('(display-mode: standalone)').matches;

if (isNative || isPWA) {
  // ✅ استخدم Capacitor PushNotifications
  const { PushNotifications } = await import('@capacitor/push-notifications');
  
  // Foreground: عندما التطبيق مفتوح
  PushNotifications.addListener('pushNotificationReceived', (notification) => {
    console.log('📩 Push received (Capacitor):', notification);
    
    // عرض الإشعار
    handleIncomingNotification({
      notification: {
        title: notification.title,
        body: notification.body
      },
      data: notification.data
    });
    
    // عرض toast داخل التطبيق
    notify({
      type: 'info',
      message: `${notification.title}: ${notification.body}`
    });
  });
  
  // Background: عندما المستخدم يضغط على الإشعار
  PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
    console.log('🔔 Push action performed:', action);
    
    // التوجيه للصفحة المناسبة
    const route = action.notification?.data?.route || '/';
    navigate(route);
  });
  
} else {
  // ✅ استخدم Web FCM
  const unsubscribe = onForegroundFcm((payload) => {
    handleIncomingNotification(payload);
    notify({ type: 'info', message: `${title}: ${body}` });
  });
  
  window.__fcmUnsubscribe = unsubscribe;
}
```

---

## 🔍 **كيف تتأكد من المشكلة**

### 1. افتح Console في التطبيق المثبت:

```javascript
// تحقق من نوع المنصة
console.log('Capacitor exists:', !!window.Capacitor);
console.log('Is native platform:', window.Capacitor?.isNativePlatform());
console.log('Is PWA:', window.matchMedia('(display-mode: standalone)').matches);

// تحقق من الـ listeners
console.log('FCM handler exists:', !!window.__fcmUnsubscribe);

// ✅ إذا Capacitor موجود لكن __fcmUnsubscribe موجود أيضاً = مشكلة!
// يجب استخدام Capacitor listeners وليس FCM!
```

### 2. تحقق من Firestore:

```javascript
// ابحث في collection: user_fcm_by_email
{
  email: "user@example.com",
  tokens: {
    "some_token_here": 1234567890,
  },
  platform: "pwa-installed",  // أو "native-app"
  deviceType: "pwa"  // أو "native"
}
```

إذا `platform` = "pwa-installed" أو "native-app"، يجب استخدام **Capacitor listeners**!

### 3. تحقق من Cloud Function logs:

```bash
# في Firebase Console -> Functions -> Logs
🔔 New notification created: {...}
Looking for FCM tokens for email: user@example.com
Found 1 FCM tokens for user@example.com
Sending to platform: pwa-installed, device: pwa
✅ Push sent successfully to token: abc123...

# ✅ الإشعار أُرسل بنجاح!
# ❌ لكن التطبيق لا يستمع له!
```

---

## ✅ **الخلاصة**

| المكون | الحالة | المشكلة |
|--------|---------|---------|
| Token Registration | ✅ يعمل | - |
| Cloud Function Send | ✅ يعمل | - |
| Notification Arrives | ✅ يصل | - |
| **App.js Listener** | ❌ خطأ | يستخدم Web FCM بدل Capacitor |
| Notification Display | ❌ لا يعمل | لا أحد يستمع! |

**المشكلة:** `App.js` يستخدم `onForegroundFcm()` للجميع، لكن يجب استخدام **Capacitor PushNotifications listeners** للتطبيقات المثبتة!

---

## 🎯 **الحل المطلوب**

في `src/App.js` السطر 156-173، استبدل:

**من:**
```javascript
const unsubscribe = onForegroundFcm((payload) => {
  // يعمل للـ Web فقط
});
```

**إلى:**
```javascript
if (window.Capacitor?.isNativePlatform() || isPWA) {
  // Capacitor listeners
  PushNotifications.addListener('pushNotificationReceived', ...);
  PushNotifications.addListener('pushNotificationActionPerformed', ...);
} else {
  // Web FCM
  const unsubscribe = onForegroundFcm(...);
}
```

**هذا هو السبب الدقيق!** 🎯
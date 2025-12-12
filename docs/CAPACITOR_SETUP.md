# تحويل VägVänner باستخدام Capacitor

## لماذا Capacitor؟
- يحول تطبيق React الحالي لتطبيق Native
- أقل تغييرات في الكود
- يدعم iOS و Android
- إشعارات أصلية

## الخطوات:

### 1. تثبيت Capacitor
```bash
npm install @capacitor/core @capacitor/cli
npx cap init
```

### 2. إضافة المنصات
```bash
npm install @capacitor/android @capacitor/ios
npx cap add android
npx cap add ios
```

### 3. تثبيت Push Notifications
```bash
npm install @capacitor/push-notifications
```

### 4. تحديث كود الإشعارات
```javascript
// App.js
import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';

const initializePush = async () => {
  if (Capacitor.isNativePlatform()) {
    // طلب الإذن
    await PushNotifications.requestPermissions();
    
    // تسجيل التوكن
    await PushNotifications.register();
    
    // استقبال التوكن
    PushNotifications.addListener('registration', (token) => {
      // حفظ token.value في Firestore
      saveFcmTokenForEmail(user.email, token.value);
    });
    
    // معالجة الإشعارات
    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('Push received: ', notification);
    });
  }
};
```

### 5. البناء والتشغيل
```bash
npm run build
npx cap sync
npx cap open android # يفتح Android Studio
```
# تحويل VägVänner إلى React Native

## المميزات:
- إشعارات أصلية كاملة
- وصول لجميع APIs الهاتف
- أداء أفضل
- تجربة مستخدم أصلية 100%

## الخطوات الأساسية:

### 1. إنشاء مشروع React Native
```bash
npx react-native init VagVannerMobile
cd VagVannerMobile
```

### 2. تثبيت المكتبات المطلوبة
```bash
# Firebase
npm install @react-native-firebase/app @react-native-firebase/messaging

# Navigation
npm install @react-navigation/native @react-navigation/stack

# إشعارات محلية
npm install react-native-push-notification
```

### 3. إعداد Firebase Messaging
```javascript
// App.js
import messaging from '@react-native-firebase/messaging';
import PushNotification from 'react-native-push-notification';

// طلب الإذن
async function requestPermission() {
  const authStatus = await messaging().requestPermission();
  const enabled = authStatus === messaging.AuthorizationStatus.AUTHORIZED;
  
  if (enabled) {
    const token = await messaging().getToken();
    // حفظ التوكن في Firestore
  }
}

// معالجة الإشعارات
messaging().onMessage(async remoteMessage => {
  PushNotification.localNotification({
    title: remoteMessage.notification.title,
    message: remoteMessage.notification.body,
    playSound: true,
    soundName: 'default',
    importance: 'high',
    vibrate: true
  });
});
```

### 4. إعادة استخدام المكونات
يمكنك إعادة استخدام معظم مكونات React الحالية مع تعديلات طفيفة.
// Helper للتعامل مع الإشعارات Native و Web
import { requestFcmPermissionAndToken } from '../firebase/firebase.js';
import { saveFcmTokenForEmail, removeFcmTokenForEmail } from '../services/fcmService.js';

/**
 * كشف إذا كان التطبيق يعمل كـ PWA مثبت
 */
function isInstalledPWA() {
  // التحقق من عدة مؤشرات لمعرفة إذا كان PWA
  return (window.matchMedia('(display-mode: standalone)').matches) ||
         (window.navigator.standalone) || 
         (document.referrer.includes('android-app://')) ||
         (window.matchMedia('(display-mode: fullscreen)').matches) ||
         (window.matchMedia('(display-mode: minimal-ui)').matches);
}

/**
 * كشف إذا كان المستخدم يستخدم Capacitor Native App
 */
function isNativeApp() {
  return window.Capacitor && window.Capacitor.isNativePlatform();
}

export async function setupPushNotifications(user) {
  if (!user?.email) return null;
  
  try {
    const installedPWA = isInstalledPWA();
    const nativeApp = isNativeApp();
    
    // تحديد نوع المنصة
    let platform = 'web-browser';
    if (nativeApp) {
      platform = 'native-app';
    } else if (installedPWA) {
      platform = 'pwa-installed';
    }
    
    // إذا كان تطبيق native أو PWA مثبت، نريد إلغاء تسجيل Chrome tokens
    if (nativeApp || installedPWA) {
      // البحث عن وإزالة أي web-browser tokens قديمة
      await cleanupBrowserTokens(user.email);
    }
    
    // الآن تسجيل التوكن الجديد
    const vapid = "7ZiG9jglP-ie_r-SwVcI-vc8E5LK-vsZW4jqHmPtgBo";
    
    if (nativeApp && window.Capacitor) {
      // Native App - استخدام Capacitor Push Notifications
      const { PushNotifications } = await import('@capacitor/push-notifications');
      
      const permStatus = await PushNotifications.checkPermissions();
      
      if (permStatus.receive === 'prompt') {
        await PushNotifications.requestPermissions();
      }
      
      if (permStatus.receive !== 'granted') {
        return null;
      }
      
      await PushNotifications.register();
      
      return new Promise((resolve) => {
        PushNotifications.addListener('registration', async (token) => {
          await saveFcmTokenForEmail(user.email, token.value, { 
            uid: user.uid, 
            platform: platform,
            deviceType: 'native',
            installedAt: Date.now()
          });
          resolve(token.value);
        });
        
        PushNotifications.addListener('registrationError', (error) => {
          console.error('Native push registration failed:', error);
          resolve(null);
        });
      });
      
    } else {
      // PWA أو Web Browser - استخدام FCM العادي
      console.log('🔧 Setting up Web FCM with VAPID:', vapid.substring(0, 20) + '...');
      const token = await requestFcmPermissionAndToken(vapid);
      
      if (token) {
        console.log('✅ FCM token received:', token.substring(0, 20) + '...');
        const saved = await saveFcmTokenForEmail(user.email, token, { 
          uid: user.uid, 
          platform: platform,
          deviceType: installedPWA ? 'pwa' : 'browser',
          installedAt: Date.now()
        });
        console.log('✅ FCM token saved:', saved);
      } else {
        console.warn('❌ Failed to get FCM token');
      }
      
      return token;
    }
  } catch (error) {
    console.error('Push notification setup failed:', error);
    return null;
  }
}

/**
 * تنظيف التوكنات القديمة من المتصفح عند تثبيت التطبيق
 */
async function cleanupBrowserTokens(email) {
  try {
    const { doc, getDoc, updateDoc } = await import('firebase/firestore');
    const { db } = await import('../firebase/firebase.js');
    
    const normalizedEmail = email.trim().toLowerCase();
    const fcmDocRef = doc(db, 'user_fcm_by_email', normalizedEmail);
    const fcmDoc = await getDoc(fcmDocRef);
    
    if (fcmDoc.exists()) {
      const data = fcmDoc.data();
      const tokens = data.tokens || {};
      const updates = {};
      
      // إزالة أي توكنات من نوع web-browser
      Object.entries(tokens).forEach(([token, timestamp]) => {
        // يمكن تحسين هذا بحفظ metadata مع كل token
        // لكن حالياً سنزيل التوكنات القديمة
        if (typeof timestamp === 'number' && timestamp < Date.now() - 60000) {
          updates[`tokens.${token}`] = null;
        }
      });
      
      if (Object.keys(updates).length > 0) {
        await updateDoc(fcmDocRef, updates);
      }
    }
  } catch (error) {
    console.error('Failed to cleanup browser tokens:', error);
  }
}

// معالج موحد للإشعارات الواردة
export function handleIncomingNotification(payload) {
  const isNative = isNativeApp();
  const isPWA = isInstalledPWA();
  
  if (isNative) {
    // على التطبيق Native: الإشعار يظهر تلقائياً من النظام
    // يمكن إضافة معالجة خاصة هنا إذا لزم الأمر
  } else if (isPWA || !isPWA) {
    // على PWA أو المتصفح: نفس المعالجة الحالية
    const notificationTitle = payload.notification?.title || 'VägVänner';
    const notificationOptions = {
      body: payload.notification?.body || '',
      icon: '/favicon.png',
      badge: '/favicon.png',
      vibrate: [200, 100, 200],
      data: payload.data
    };
    
    if (Notification.permission === 'granted') {
      new Notification(notificationTitle, notificationOptions);
    }
  }
}
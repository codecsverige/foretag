# تحويل VägVänner إلى تطبيق Android باستخدام TWA

## ما هو TWA؟
Trusted Web Activity يسمح بتغليف PWA في تطبيق Android أصلي مع:
- إشعارات أصلية
- رفع على Google Play Store
- لا يظهر شريط المتصفح
- نفس الكود بالضبط

## الخطوات:

### 1. إنشاء مشروع Android Studio
```bash
# تثبيت Android Studio
# إنشاء مشروع جديد "Empty Activity"
```

### 2. إضافة ملف app/build.gradle
```gradle
dependencies {
    implementation 'androidx.browser:browser:1.4.0'
    implementation 'com.google.androidbrowserhelper:androidbrowserhelper:2.4.0'
}
```

### 3. تعديل AndroidManifest.xml
```xml
<activity android:name="com.google.androidbrowserhelper.trusted.LauncherActivity">
    <meta-data android:name="android.support.customtabs.trusted.DEFAULT_URL"
        android:value="https://vagvanner.se" />
    
    <intent-filter>
        <action android:name="android.intent.action.MAIN" />
        <category android:name="android.intent.category.LAUNCHER" />
    </intent-filter>
    
    <intent-filter android:autoVerify="true">
        <action android:name="android.intent.action.VIEW"/>
        <category android:name="android.intent.category.DEFAULT" />
        <category android:name="android.intent.category.BROWSABLE"/>
        <data android:scheme="https"
            android:host="vagvanner.se"/>
    </intent-filter>
</activity>

<!-- إضافة أذونات الإشعارات -->
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
```

### 4. إضافة Digital Asset Links
في `https://vagvanner.se/.well-known/assetlinks.json`:
```json
[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "se.vagvanner.app",
    "sha256_cert_fingerprints": ["YOUR_SHA256_FINGERPRINT"]
  }
}]
```

### 5. تخصيص الإشعارات
سيستخدم التطبيق نفس Firebase Cloud Messaging لكن الإشعارات ستظهر كـ Native.
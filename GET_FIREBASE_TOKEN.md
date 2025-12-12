# 🔑 كيف تحصل على Firebase Token للـ Deploy التلقائي

## المشكلة:
GitHub Actions يحتاج token للـ deploy على Firebase

## الحل (مرة واحدة فقط):

### الخطوة 1: احصل على Token

**من اللابتوب (مرة واحدة):**

```bash
# Install Firebase CLI (إذا لم يكن مثبت)
npm install -g firebase-tools

# Get token
firebase login:ci
```

**سيفتح متصفح:**
- سجل دخول
- سينسخ token تلقائياً

**أو يطبعه في Terminal - انسخه!**

مثال:
```
1//0abc123def456...
```

---

### الخطوة 2: أضف Token لـ GitHub Secrets

1. اذهب لـ: https://github.com/codecsverige/vagvanner/settings/secrets/actions

2. اضغط **"New repository secret"**

3. املأ:
   - Name: `FIREBASE_TOKEN`
   - Value: [الصق الـ token من الخطوة 1]

4. اضغط **"Add secret"**

✅ **تم!**

---

### الخطوة 3: Test

```bash
# Push any change
git commit --allow-empty -m "test: trigger firebase deploy"
git push origin main
```

**افحص:** 
https://github.com/codecsverige/vagvanner/actions

يجب أن ترى deployment يعمل! ✅

---

## 🎉 بعد هذا:

**كل push لـ `main` سيعمل deploy تلقائياً!**

- ✅ تعدل الكود
- ✅ تضغط commit & push
- ✅ GitHub Actions يعمل deploy تلقائياً
- ✅ Notifications تُحدّث تلقائياً

**لا تحتاج لابتوب بعد الآن!** 🚀

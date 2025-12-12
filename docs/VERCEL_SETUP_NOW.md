# 🚨 إعداد Vercel - افعل هذا الآن!

## 1️⃣ افتح Vercel Dashboard:
🔗 https://vercel.com/dashboard

## 2️⃣ اختر مشروع vagvanner

## 3️⃣ اذهب إلى Settings → Git:

### أ) Production Branch:
- **تأكد أنه:** `main`
- إذا لم يكن، غيّره إلى `main`

### ب) Preview Deployments:
- **اختر:** "Don't deploy preview for any branch"
- أو اكتب: `none`
- أو احذف كل شيء

## 4️⃣ اذهب إلى Settings → Domains:

### تحقق من:
- هل `vagvanner.se` موجود؟
  - ✅ نعم → ممتاز
  - ❌ لا → اضغط "Add Domain" وأضف `vagvanner.se`

## 5️⃣ احذف المشاريع المكررة:

### إذا وجدت أكثر من مشروع vagvanner:
1. احتفظ بواحد فقط (الذي له vagvanner.se)
2. احذف الباقي:
   - Project Settings → Delete Project

## 6️⃣ Redeploy من main:

1. في المشروع الصحيح
2. اضغط على آخر deployment
3. اضغط "..." → "Redeploy"
4. اختر "Use existing Build Cache" → No
5. Deploy

## ✅ النتيجة:

بعد هذا:
- Vercel سينشر من main فقط
- لا مزيد من preview deployments
- vagvanner.se سيتحدث مع كل push إلى main

---

## 🎯 من الآن فصاعداً:

```bash
# فقط هذه الأوامر
git add -A
git commit -m "تحديث"
git push origin main

# Vercel ينشر تلقائياً!
```

**لا فروع! لا تعقيدات! فقط main!**
#!/bin/bash

echo "🚀 إصلاح Vercel النهائي"
echo "========================"
echo ""

# التحقق من تثبيت Vercel CLI
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI غير مثبت"
    exit 1
fi

echo "✅ Vercel CLI مثبت"
echo ""

# التحقق من البناء
echo "🔧 فحص حالة البناء..."
if [ ! -d "build" ]; then
    echo "📦 بناء المشروع..."
    npm run build
fi

echo "✅ البناء جاهز"
echo ""

# إرشادات Vercel
echo "🎯 الخطوات التالية:"
echo ""
echo "1. تسجيل الدخول:"
echo "   vercel login"
echo ""
echo "2. فحص المشاريع:"
echo "   vercel list"
echo ""
echo "3. ربط المشروع:"
echo "   vercel link"
echo ""
echo "4. إضافة Domain:"
echo "   vercel domains add vagvanner.se"
echo ""
echo "5. النشر:"
echo "   vercel --prod"
echo ""

# معلومات المشروع
echo "📊 معلومات المشروع:"
echo "- اسم المشروع: samakning-nouveau"
echo "- الإصدار: $(node -p "require('./package.json').version")"
echo "- الفرع: $(git branch --show-current)"
echo "- آخر commit: $(git log -1 --format='%h - %s')"
echo ""

echo "✅ كل شيء جاهز للنشر!"
echo ""
echo "🔗 للمساعدة، راجع: VERCEL_FIX_INSTRUCTIONS.md"
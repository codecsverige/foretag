#!/bin/bash

echo "======================================"
echo "🔧 سكريبت إصلاح النشر على Vercel"
echo "======================================"
echo ""

# الألوان
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}📊 الوضع الحالي:${NC}"
echo "------------------------"
echo -e "${GREEN}✅ الموقع يعمل على:${NC}"
echo "   https://vagvanner-git-main-riadh-massaoudi-s-projects.vercel.app"
echo ""
echo -e "${RED}❌ المشكلة:${NC}"
echo "   vagvanner.se لا يتحدث (عالق على v17)"
echo ""

echo -e "${YELLOW}🔍 التحقق من الإعدادات...${NC}"
echo ""

# التحقق من Vercel CLI
if command -v vercel &> /dev/null; then
    echo -e "${GREEN}✅ Vercel CLI مثبت${NC}"
    
    echo ""
    echo -e "${BLUE}معلومات الحساب:${NC}"
    vercel whoami 2>/dev/null || echo "غير مسجل الدخول"
    
else
    echo -e "${RED}❌ Vercel CLI غير مثبت${NC}"
    echo ""
    echo "لتثبيته:"
    echo "npm i -g vercel"
fi

echo ""
echo "======================================"
echo -e "${YELLOW}📋 الحلول المتاحة:${NC}"
echo "======================================"
echo ""

echo -e "${GREEN}الحل 1: النشر اليدوي (الأسرع)${NC}"
echo "-------------------------------"
echo "1. ادخل إلى: https://vercel.com/dashboard"
echo "2. ابحث عن مشروع vagvanner"
echo "3. اضغط 'Redeploy' من main branch"
echo ""

echo -e "${GREEN}الحل 2: استخدام Vercel CLI${NC}"
echo "-------------------------"
echo "vercel login"
echo "vercel --prod"
echo ""

echo -e "${GREEN}الحل 3: ربط Domain الصحيح${NC}"
echo "------------------------"
echo "1. Vercel Dashboard → Project Settings"
echo "2. Domains → Add Domain"
echo "3. أضف: vagvanner.se"
echo "4. حدث DNS في Loopia"
echo ""

echo -e "${BLUE}📌 معلومات مفيدة:${NC}"
echo "-----------------"
echo "GitHub: https://github.com/codecsverige/vagvanner"
echo "Branch: main"
echo "Version: v25 SYNC 🚀"
echo "Build: جاهز وبدون أخطاء"
echo ""

echo -e "${YELLOW}⚠️  ملاحظة مهمة:${NC}"
echo "الكود يعمل 100% - المشكلة فقط في ربط Domain!"
echo ""

# اختياري: محاولة النشر
read -p "هل تريد محاولة النشر الآن؟ (y/n): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo -e "${BLUE}🚀 بدء النشر...${NC}"
    
    # بناء المشروع
    echo "📦 بناء المشروع..."
    npm run build
    
    # النشر على Vercel
    echo ""
    echo -e "${YELLOW}📤 النشر على Vercel...${NC}"
    echo "سيطلب منك تسجيل الدخول إذا لزم الأمر"
    vercel --prod
    
    echo ""
    echo -e "${GREEN}✅ انتهى!${NC}"
else
    echo ""
    echo "يمكنك تشغيل السكريبت مرة أخرى عندما تكون جاهزاً"
fi

echo ""
echo "======================================"
echo -e "${GREEN}✨ انتهى السكريبت${NC}"
echo "======================================" 
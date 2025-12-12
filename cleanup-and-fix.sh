#!/bin/bash

echo "=========================================="
echo "🧹 سكريبت التنظيف والإصلاح النهائي"
echo "=========================================="
echo ""

# الألوان
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${YELLOW}📊 الوضع الحالي:${NC}"
echo "- 33 فرع في GitHub (كثير جداً!)"
echo "- Vercel ينشر من كل فرع = فوضى"
echo "- main هو الفرع الصحيح للإنتاج"
echo ""

echo -e "${BLUE}🔧 سنقوم بـ:${NC}"
echo "1. حذف الفروع الزائدة"
echo "2. الإبقاء على main فقط"
echo "3. إعداد Vercel للنشر من main"
echo ""

read -p "هل تريد المتابعة؟ (y/n): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
fi

echo ""
echo -e "${GREEN}الخطوة 1: حذف الفروع المحلية الزائدة${NC}"
echo "----------------------------------------"

# حذف الفروع المحلية ما عدا main
git checkout main 2>/dev/null || git checkout -b main
git branch | grep -v "main" | xargs -r git branch -D

echo -e "${GREEN}✅ تم حذف الفروع المحلية${NC}"
echo ""

echo -e "${GREEN}الخطوة 2: حذف الفروع البعيدة${NC}"
echo "----------------------------------------"
echo "سنحذف الفروع التالية من GitHub:"
echo ""

# عرض الفروع التي سنحذفها
git branch -r | grep -v "main\|HEAD" | sed 's/origin\///' | head -20

echo ""
read -p "هل تريد حذف هذه الفروع من GitHub؟ (y/n): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    # حذف الفروع من GitHub
    git branch -r | grep -v "main\|HEAD" | sed 's/origin\///' | while read branch; do
        echo "حذف: $branch"
        git push origin --delete "$branch" 2>/dev/null || echo "تم حذفه مسبقاً"
    done
    echo -e "${GREEN}✅ تم حذف الفروع من GitHub${NC}"
else
    echo -e "${YELLOW}⏭️ تخطي حذف الفروع${NC}"
fi

echo ""
echo -e "${GREEN}الخطوة 3: تحديث main${NC}"
echo "----------------------------------------"

# التأكد من أننا على main
git checkout main
git pull origin main

echo -e "${GREEN}✅ main محدث${NC}"
echo ""

echo -e "${GREEN}الخطوة 4: إعداد Vercel${NC}"
echo "----------------------------------------"
echo ""
echo -e "${YELLOW}📌 الآن افعل هذا يدوياً:${NC}"
echo ""
echo "1. اذهب إلى: https://vercel.com/dashboard"
echo "2. اختر مشروع vagvanner"
echo "3. Settings → Git"
echo "4. Production Branch: تأكد أنه 'main'"
echo "5. Preview Branches: احذف كل شيء أو اكتب 'none'"
echo ""
echo "6. Settings → Domains"
echo "7. تأكد أن vagvanner.se موجود"
echo "8. إذا لم يكن، أضفه"
echo ""
echo -e "${GREEN}✅ بعد هذا، كل push إلى main سينشر على vagvanner.se${NC}"
echo ""

echo -e "${BLUE}📝 ملخص التغييرات:${NC}"
echo "------------------------"
echo "✅ حذف الفروع الزائدة"
echo "✅ main هو الفرع الوحيد"
echo "✅ Vercel سينشر من main فقط"
echo "✅ لا مزيد من preview deployments"
echo ""

echo -e "${GREEN}🎯 من الآن فصاعداً:${NC}"
echo "-------------------"
echo "1. اعمل على main مباشرة"
echo "2. git add -A"
echo "3. git commit -m 'رسالة'"
echo "4. git push origin main"
echo "5. Vercel ينشر تلقائياً على vagvanner.se"
echo ""

echo "=========================================="
echo -e "${GREEN}✨ انتهى التنظيف!${NC}"
echo "=========================================="
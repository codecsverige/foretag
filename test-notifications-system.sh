#!/bin/bash

# Notification System Test Script
# يختبر نظام الإشعارات بالكامل

echo "🧪 Notification System Test"
echo "============================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}📋 فحص نظام الإشعارات:${NC}"
echo ""

# 1. Check Firebase Functions deployment
echo "1️⃣ فحص Firebase Functions..."
echo "   Running: firebase functions:list --project vagvanner"
echo ""

if firebase functions:list --project vagvanner 2>/dev/null | grep -q "matchAlertsOnRideCreate"; then
    echo -e "   ${GREEN}✅ matchAlertsOnRideCreate - Deployed${NC}"
else
    echo -e "   ${RED}❌ matchAlertsOnRideCreate - NOT DEPLOYED${NC}"
    echo -e "   ${YELLOW}⚠️  Run: ./deploy-firebase-functions.sh${NC}"
fi

if firebase functions:list --project vagvanner 2>/dev/null | grep -q "pushOnNotificationCreate"; then
    echo -e "   ${GREEN}✅ pushOnNotificationCreate - Deployed${NC}"
else
    echo -e "   ${RED}❌ pushOnNotificationCreate - NOT DEPLOYED${NC}"
    echo -e "   ${YELLOW}⚠️  Run: ./deploy-firebase-functions.sh${NC}"
fi

echo ""

# 2. Check frontend notification code
echo "2️⃣ فحص Frontend Notification Code..."

if [ -f "src/utils/pushNotificationHelper.js" ]; then
    echo -e "   ${GREEN}✅ pushNotificationHelper.js موجود${NC}"
else
    echo -e "   ${RED}❌ pushNotificationHelper.js مفقود${NC}"
fi

if [ -f "src/services/fcmService.js" ]; then
    echo -e "   ${GREEN}✅ fcmService.js موجود${NC}"
else
    echo -e "   ${RED}❌ fcmService.js مفقود${NC}"
fi

if [ -f "src/services/notificationService.js" ]; then
    echo -e "   ${GREEN}✅ notificationService.js موجود${NC}"
else
    echo -e "   ${RED}❌ notificationService.js مفقود${NC}"
fi

if [ -f "src/services/alertService.js" ]; then
    echo -e "   ${GREEN}✅ alertService.js موجود${NC}"
else
    echo -e "   ${RED}❌ alertService.js مفقود${NC}"
fi

echo ""

# 3. Check Service Worker
echo "3️⃣ فحص Service Worker..."

if [ -f "public/firebase-messaging-sw.js" ]; then
    echo -e "   ${GREEN}✅ firebase-messaging-sw.js موجود${NC}"
else
    echo -e "   ${RED}❌ firebase-messaging-sw.js مفقود${NC}"
fi

echo ""

# 4. Check Firebase config
echo "4️⃣ فحص Firebase Configuration..."

if [ -f ".firebaserc" ]; then
    echo -e "   ${GREEN}✅ .firebaserc موجود${NC}"
    PROJECT=$(cat .firebaserc | grep -o '"default": "[^"]*"' | cut -d'"' -f4)
    echo -e "   ${BLUE}   Project: $PROJECT${NC}"
else
    echo -e "   ${RED}❌ .firebaserc مفقود${NC}"
fi

if [ -f "firebase.json" ]; then
    echo -e "   ${GREEN}✅ firebase.json موجود${NC}"
else
    echo -e "   ${RED}❌ firebase.json مفقود${NC}"
fi

echo ""

# 5. Check Functions dependencies
echo "5️⃣ فحص Functions Dependencies..."

if [ -d "functions/node_modules" ]; then
    echo -e "   ${GREEN}✅ node_modules موجودة${NC}"
    
    # Check critical packages
    if [ -d "functions/node_modules/firebase-admin" ]; then
        echo -e "   ${GREEN}✅ firebase-admin مثبت${NC}"
    fi
    
    if [ -d "functions/node_modules/firebase-functions" ]; then
        echo -e "   ${GREEN}✅ firebase-functions مثبت${NC}"
    fi
else
    echo -e "   ${RED}❌ node_modules مفقودة${NC}"
    echo -e "   ${YELLOW}⚠️  Run: cd functions && npm ci --legacy-peer-deps${NC}"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Summary
echo -e "${BLUE}📊 الملخص:${NC}"
echo ""
echo "✅ = جاهز"
echo "❌ = يحتاج إصلاح"
echo ""
echo -e "${BLUE}📝 الخطوات التالية:${NC}"
echo ""
echo "1. إذا Functions غير deployed:"
echo "   ./deploy-firebase-functions.sh"
echo ""
echo "2. للاختبار الكامل:"
echo "   - افتح https://vagvanner.se"
echo "   - سجل دخول"
echo "   - اضغط 'Skapa bevakning'"
echo "   - من حساب آخر، أنشئ رحلة matching"
echo "   - تحقق من استلام notification"
echo ""
echo "3. فحص Logs على Firebase:"
echo "   https://console.firebase.google.com/project/vagvanner/functions/logs"
echo ""

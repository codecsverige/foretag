#!/bin/bash

# Firebase Functions Deployment Script
# يقوم بنشر Functions الضرورية لعمل Notifications

set -e  # Exit on error

echo "🚀 Firebase Functions Deployment Script"
echo "========================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo -e "${RED}❌ Firebase CLI غير مثبت${NC}"
    echo ""
    echo "لتثبيته:"
    echo "  npm install -g firebase-tools"
    echo ""
    exit 1
fi

echo -e "${GREEN}✅ Firebase CLI مثبت${NC}"

# Check if logged in
if ! firebase projects:list &> /dev/null; then
    echo -e "${YELLOW}⚠️  غير مسجل دخول في Firebase${NC}"
    echo ""
    echo "سجل دخول الآن:"
    firebase login
fi

echo -e "${GREEN}✅ مسجل دخول في Firebase${NC}"

# Check project
echo ""
echo "🔍 التحقق من Firebase project..."
CURRENT_PROJECT=$(firebase use 2>&1 | grep "Active Project" | awk '{print $NF}' || echo "")

if [ -z "$CURRENT_PROJECT" ]; then
    echo -e "${YELLOW}⚠️  لم يتم تحديد project${NC}"
    echo "تحديد project vagvanner..."
    firebase use vagvanner
fi

echo -e "${GREEN}✅ Project: vagvanner${NC}"

# Install dependencies
echo ""
echo "📦 تثبيت dependencies..."
cd functions
npm ci --legacy-peer-deps
cd ..

echo -e "${GREEN}✅ Dependencies مثبتة${NC}"

# Deploy functions
echo ""
echo "🚀 Deploying Functions..."
echo ""
echo "Functions التي سيتم deploy:"
echo "  1. matchAlertsOnRideCreate - يطابق alerts عند إنشاء رحلة جديدة"
echo "  2. pushOnNotificationCreate - يرسل FCM push عند إنشاء notification"
echo ""

# Deploy the critical functions
firebase deploy --only functions:matchAlertsOnRideCreate,pushOnNotificationCreate --project vagvanner

echo ""
echo -e "${GREEN}✅ تم Deploy بنجاح!${NC}"
echo ""
echo "🎉 Notifications الآن تعمل!"
echo ""
echo "📝 كيف تختبر:"
echo "  1. افتح https://vagvanner.se"
echo "  2. سجل دخول"
echo "  3. اضغط 'Skapa bevakning'"
echo "  4. اختر Stockholm → Göteborg"
echo "  5. من حساب آخر، أنشئ رحلة Stockholm → Göteborg"
echo "  6. يجب أن تستلم notification!"
echo ""

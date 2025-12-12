#!/bin/bash
# Auto-setup script for Cursor AI agents
# يتم تشغيله تلقائياً عند بدء جلسة جديدة

echo "🔍 فحص الفرع الحالي..."
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
EXPECTED_COMMIT="c01a3408"
CURRENT_COMMIT=$(git rev-parse --short HEAD)

if [[ "$CURRENT_BRANCH" != "main" ]]; then
    echo "⚠️  أنت على فرع خطأ: $CURRENT_BRANCH"
    echo "🔄 التبديل إلى main..."
    git checkout main
    git pull origin main
fi

if [[ "$CURRENT_COMMIT" != "$EXPECTED_COMMIT" ]]; then
    echo "⚠️  الـ commit خطأ: $CURRENT_COMMIT (متوقع: $EXPECTED_COMMIT)"
    echo "🔄 جلب النسخة الصحيحة..."
    git fetch origin main
    git reset --hard origin/main
fi

FINAL_COMMIT=$(git rev-parse --short HEAD)
echo "✅ تم! الفرع: main | الـ Commit: $FINAL_COMMIT"
echo "🎯 النسخة المستقرة جاهزة للاستخدام!"
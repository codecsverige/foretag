#!/bin/bash
echo "🔄 التبديل إلى النسخة المستقرة..."
git checkout main
git pull origin main
echo "✅ تم! أنت الآن على النسخة المستقرة"
git log --oneline -1
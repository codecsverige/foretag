#!/bin/bash

echo "🚀 Déploiement automatique sur Vercel"
echo "======================================"
echo ""

# Configuration
export VERCEL_ORG_ID="team_HZPzr8qSLnJaKnNJFRl9t9Ul"
export VERCEL_PROJECT_ID="prj_vagvanner_v25_prod"

echo "📦 Build déjà fait..."
echo ""

echo "🌐 Déploiement sur Vercel..."
echo ""

# Déployer avec Vercel CLI sans interaction
npx vercel \
  --prod \
  --yes \
  --name vagvanner-v25-production \
  --build-env CI=false \
  --build-env DISABLE_ESLINT_PLUGIN=true \
  --build-env SKIP_PREFLIGHT_CHECK=true \
  --public

echo ""
echo "✅ Déploiement terminé!"
echo ""
echo "🔗 Votre site sera disponible dans quelques secondes sur:"
echo "   https://vagvanner-v25-production.vercel.app"
echo ""
echo "Pour lier le domaine vagvanner.se, utilisez:"
echo "   vercel domains add vagvanner.se"
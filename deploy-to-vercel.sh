#!/bin/bash

echo "🚀 Manual Vercel Deployment Script"
echo "=================================="
echo ""

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "⚠️  Vercel CLI not found. Installing..."
    npm i -g vercel
fi

echo "📦 Building project..."
npm run build

echo ""
echo "🔄 Deploying to Vercel..."
echo "Please follow the prompts:"
echo ""

# Deploy to Vercel
vercel --prod

echo ""
echo "✅ Deployment complete!"
echo "Check your project at: https://vagvanner.se"
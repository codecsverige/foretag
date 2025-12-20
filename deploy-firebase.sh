#!/bin/bash

# ============================================
# Firebase Deployment Script
# ============================================
# This script deploys Firestore rules and indexes to Firebase
# 
# Prerequisites:
# 1. Firebase CLI installed: npm install -g firebase-tools
# 2. Logged in to Firebase: firebase login
# 3. Project selected: firebase use bokanara-4797d
#
# Usage: ./deploy-firebase.sh
# ============================================

set -e  # Exit on error

echo "🚀 Firebase Deployment Script"
echo "================================"
echo ""

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI not found. Installing..."
    npm install -g firebase-tools
fi

# Check if running in CI environment
if [ -n "$CI" ]; then
    echo "📝 Running in CI environment, using token authentication..."
    # In CI, use token: firebase deploy --token "$FIREBASE_TOKEN"
else
    # Check if user is logged in
    echo "📝 Checking Firebase authentication..."
    if ! firebase login:list &> /dev/null; then
        echo "🔐 Not logged in. Opening browser for authentication..."
        firebase login
    else
        echo "✅ Already logged in to Firebase"
    fi
fi

# Check current project
echo ""
echo "📋 Current Firebase project:"
firebase use

echo ""
read -p "Is this the correct project (bokanara-4797d)? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "🔄 Switching to bokanara-4797d..."
    firebase use bokanara-4797d
fi

# Deploy Firestore rules
echo ""
echo "📤 Deploying Firestore rules..."
firebase deploy --only firestore:rules

# Deploy Firestore indexes
echo ""
echo "📤 Deploying Firestore indexes..."
firebase deploy --only firestore:indexes

echo ""
echo "✅ Firebase deployment completed successfully!"
echo ""
echo "⚠️  IMPORTANT SECURITY NOTE:"
echo "The Firestore rules currently allow anonymous company creation."
echo "This is TEMPORARY for testing purposes."
echo ""
echo "TODO: Update firestore.rules to require authentication when ready:"
echo "  allow create: if isSignedIn() && request.resource.data.ownerId == request.auth.uid;"
echo ""
echo "To deploy Cloud Functions (if needed):"
echo "  cd functions && npm install && firebase deploy --only functions"
echo ""

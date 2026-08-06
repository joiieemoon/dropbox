#!/bin/bash
# Deploy Firebase rules
# Make sure you have Firebase CLI installed: npm install -g firebase-tools

echo "🚀 Deploying Firebase rules..."

# Check if user is logged in
if ! firebase projects:list &>/dev/null; then
    echo "❌ Not logged in to Firebase. Please run: firebase login"
    exit 1
fi

# Deploy Firestore and Storage rules
firebase deploy --only firestore:rules,storage

echo "✅ Rules deployed successfully!"
echo ""
echo "Next steps:"
echo "1. Try uploading a PDF again"
echo "2. The storagePath should now be saved to Firestore"
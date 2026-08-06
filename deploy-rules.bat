@echo off
REM Deploy Firebase rules for Windows
REM Make sure you have Firebase CLI installed: npm install -g firebase-tools

echo 🚀 Deploying Firebase rules...

REM Check if Firebase CLI is installed
firebase --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Firebase CLI not found. Please install it: npm install -g firebase-tools
    pause
    exit /b 1
)

REM Deploy Firestore rules only (no Storage)
firebase deploy --only firestore:rules

echo.
echo ✅ Rules deployed successfully!
echo.
echo Next steps:
echo 1. Try uploading a PDF again
echo 2. The storagePath should now be saved to Firestore
echo.
pause
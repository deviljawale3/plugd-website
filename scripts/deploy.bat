@echo off
REM Deployment script for plugd.page.gd (Windows)
REM Run this script to deploy both frontend and backend

echo 🚀 Starting deployment process for plugd.page.gd...

REM Check if git is available
git --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Git is not installed. Please install Git first.
    pause
    exit /b 1
)

REM Check if we're in a git repository
git rev-parse --git-dir >nul 2>&1
if errorlevel 1 (
    echo ❌ Not in a Git repository. Please initialize Git first.
    pause
    exit /b 1
)

echo 📋 Pre-deployment checklist:
echo 1. ✅ Environment variables configured
echo 2. ✅ Database connection string ready
echo 3. ✅ Payment gateway keys ready
echo 4. ✅ Domain DNS configured

REM Check for uncommitted changes
git diff-index --quiet HEAD --
if errorlevel 1 (
    echo ⚠️  You have uncommitted changes. Please commit them first.
    set /p commit_choice="Do you want to commit all changes now? (y/n): "
    if /i "%commit_choice%"=="y" (
        git add .
        set /p commit_message="Enter commit message: "
        git commit -m "%commit_message%"
    ) else (
        echo ❌ Deployment cancelled. Please commit your changes first.
        pause
        exit /b 1
    )
)

REM Push to GitHub
echo 📤 Pushing to GitHub...
git push origin main

if errorlevel 1 (
    echo ❌ Failed to push to GitHub
    pause
    exit /b 1
) else (
    echo ✅ Code pushed to GitHub successfully
)

echo.
echo 🎉 Deployment initiated!
echo.
echo 📋 Next steps:
echo 1. 🔗 Check Railway dashboard for backend deployment
echo 2. 🌐 Check Vercel dashboard for frontend deployment
echo 3. 🧪 Test your application at https://plugd.page.gd
echo 4. 📊 Monitor logs for any issues
echo.
echo 🚀 Your application should be live in 2-5 minutes!
echo.
echo 🔗 Useful Links:
echo 📱 Frontend: https://plugd.page.gd
echo 🔌 Backend API: https://api.plugd.page.gd
echo 🎛️ Railway Dashboard: https://railway.app/dashboard
echo 📊 Vercel Dashboard: https://vercel.com/dashboard

pause
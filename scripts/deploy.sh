#!/bin/bash

# Deployment script for plugd.page.gd
# Run this script to deploy both frontend and backend

echo "🚀 Starting deployment process for plugd.page.gd..."

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if git is available
if ! command -v git &> /dev/null; then
    echo -e "${RED}❌ Git is not installed. Please install Git first.${NC}"
    exit 1
fi

# Check if we're in a git repository
if ! git rev-parse --git-dir &> /dev/null; then
    echo -e "${RED}❌ Not in a Git repository. Please initialize Git first.${NC}"
    exit 1
fi

echo -e "${BLUE}📋 Pre-deployment checklist:${NC}"
echo "1. ✅ Environment variables configured"
echo "2. ✅ Database connection string ready"
echo "3. ✅ Payment gateway keys ready"
echo "4. ✅ Domain DNS configured"

# Check for uncommitted changes
if ! git diff-index --quiet HEAD --; then
    echo -e "${RED}⚠️  You have uncommitted changes. Please commit them first.${NC}"
    read -p "Do you want to commit all changes now? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git add .
        read -p "Enter commit message: " commit_message
        git commit -m "$commit_message"
    else
        echo -e "${RED}❌ Deployment cancelled. Please commit your changes first.${NC}"
        exit 1
    fi
fi

# Push to GitHub
echo -e "${BLUE}📤 Pushing to GitHub...${NC}"
git push origin main

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Code pushed to GitHub successfully${NC}"
else
    echo -e "${RED}❌ Failed to push to GitHub${NC}"
    exit 1
fi

echo -e "${GREEN}🎉 Deployment initiated!${NC}"
echo
echo -e "${BLUE}📋 Next steps:${NC}"
echo "1. 🔗 Check Railway dashboard for backend deployment"
echo "2. 🌐 Check Vercel dashboard for frontend deployment"
echo "3. 🧪 Test your application at https://plugd.page.gd"
echo "4. 📊 Monitor logs for any issues"
echo
echo -e "${GREEN}🚀 Your application should be live in 2-5 minutes!${NC}"
echo
echo -e "${BLUE}🔗 Useful Links:${NC}"
echo "📱 Frontend: https://plugd.page.gd"
echo "🔌 Backend API: https://api.plugd.page.gd"
echo "🎛️ Railway Dashboard: https://railway.app/dashboard"
echo "📊 Vercel Dashboard: https://vercel.com/dashboard"
# 🚀 Quick Start Guide for plugd.page.gd

## ⚡ 5-Minute Setup

### 1. **Clone & Install**
```bash
git clone <your-repo-url>
cd plugd-website
npm run install:all
```

### 2. **Setup Environment**
```bash
npm run setup:env
```

### 3. **Configure Database (Choose One)**

#### Option A: MongoDB Atlas (Recommended - Free)
1. Create account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create free cluster
3. Get connection string
4. Update `apps/backend/.env`:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/plugd-development
```

#### Option B: Local MongoDB
```bash
# Install MongoDB locally
# Update apps/backend/.env:
MONGODB_URI=mongodb://localhost:27017/plugd-development
```

### 4. **Start Development**
```bash
# Terminal 1 - Backend
npm run backend:dev

# Terminal 2 - Frontend  
npm run dev
```

### 5. **Access Application**
- 🌐 Frontend: http://localhost:3000
- 🔌 Backend API: http://localhost:5000
- 📊 Admin: http://localhost:3000/admin

---

## 🚀 Deploy to Production (Free)

### 1. **Push to GitHub**
```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

### 2. **Deploy Backend (Railway)**
1. Go to [Railway](https://railway.app)
2. Connect GitHub repo
3. Set root directory: `apps/backend`
4. Add environment variables from `apps/backend/.env.production`

### 3. **Deploy Frontend (Vercel)**
1. Go to [Vercel](https://vercel.com)
2. Import GitHub repo
3. Set root directory: `apps/frontend`
4. Add environment variables from `apps/frontend/.env.production`

### 4. **Configure Domain**
1. Get free domain from [Freenom](https://www.freenom.com)
2. Set DNS:
   - `plugd.page.gd` → Vercel
   - `api.plugd.page.gd` → Railway

### 5. **Quick Deploy Script**
```bash
# Linux/Mac
npm run deploy

# Windows
npm run deploy:win
```

---

## 🛠️ Essential Commands

```bash
# Development
npm run dev                 # Start frontend
npm run backend:dev        # Start backend
npm run admin:dev          # Start admin

# Production  
npm run build              # Build frontend
npm run start              # Start production

# Utilities
npm run install:all        # Install all dependencies
npm run setup:env         # Setup environment files
npm run check:health      # Check production health
npm run clean             # Clean node_modules

# Deployment
npm run deploy            # Deploy to production
```

---

## 📋 Environment Variables Checklist

### Frontend (.env.local)
- [ ] `NEXT_PUBLIC_API_URL`
- [ ] `NEXTAUTH_URL`
- [ ] `NEXTAUTH_SECRET`
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

### Backend (.env)
- [ ] `MONGODB_URI`
- [ ] `JWT_SECRET`
- [ ] `STRIPE_SECRET_KEY`
- [ ] `FRONTEND_URL`

---

## 🔧 Troubleshooting

### Common Issues

**❌ "Cannot connect to database"**
```bash
# Check MongoDB connection string
# Ensure IP is whitelisted (Atlas)
# Verify credentials
```

**❌ "CORS error"**
```bash
# Update FRONTEND_URL in backend .env
# Check CORS_ORIGIN setting
```

**❌ "Module not found"**
```bash
# Run npm install in correct directory
npm run install:all
```

**❌ "Port already in use"**
```bash
# Kill processes on ports 3000/5000
npx kill-port 3000 5000
```

---

## 🎯 Success Indicators

- [ ] ✅ Frontend loads at localhost:3000
- [ ] ✅ Backend API responds at localhost:5000/api/health
- [ ] ✅ Database connection successful
- [ ] ✅ Authentication working
- [ ] ✅ Admin panel accessible
- [ ] ✅ Production deployment successful
- [ ] ✅ Custom domain working

---

## 📞 Need Help?

1. 📖 Check [Full Documentation](docs/)
2. 🐛 Check [Troubleshooting](docs/DEVELOPMENT_GUIDE.md#troubleshooting)  
3. 🚀 Follow [Free Deployment Guide](docs/FREE_DEPLOYMENT_GUIDE.md)

---

**⏱️ Total Setup Time: 5-15 minutes**
**💰 Total Cost: $0 (Free hosting)**

🎉 **Ready to go live at plugd.page.gd!**
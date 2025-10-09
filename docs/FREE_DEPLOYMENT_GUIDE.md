# Free Deployment Guide for plugd.page.gd

## 🎯 Objective
Deploy your full-stack eCommerce application completely free using:
- **Frontend**: Vercel (Free)
- **Backend**: Railway (Free) 
- **Database**: MongoDB Atlas (Free)
- **Domain**: Freenom (Free)

---

## 📋 Prerequisites Checklist

- [ ] GitHub account
- [ ] Vercel account
- [ ] Railway account  
- [ ] MongoDB Atlas account
- [ ] Code pushed to GitHub repository

---

## 🔧 Step 1: Repository Setup

### 1.1 Push Code to GitHub
```bash
# Initialize git if not already done
git init

# Add all files
git add .

# Commit changes
git commit -m "Initial deployment-ready structure"

# Add GitHub remote (replace with your repo URL)
git remote add origin https://github.com/yourusername/plugd-website.git

# Push to GitHub
git push -u origin main
```

### 1.2 Verify Repository Structure
Ensure your repository has this structure:
```
plugd-website/
├── apps/
│   ├── frontend/
│   │   ├── src/
│   │   ├── package.json
│   │   ├── next.config.js
│   │   └── .env.production
│   └── backend/
│       ├── src/
│       ├── package.json
│       └── .env.production
├── vercel.json
├── railway.json
└── package.json
```

---

## 🗄️ Step 2: Database Setup (MongoDB Atlas - Free)

### 2.1 Create MongoDB Atlas Account
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Click "Start Free"
3. Sign up with email or Google

### 2.2 Create Free Cluster
1. Choose "Build a Database"
2. Select "Shared" (Free tier)
3. Choose AWS as provider
4. Select region closest to your users
5. Name your cluster: `plugd-cluster`
6. Click "Create Cluster"

### 2.3 Configure Database Access
1. **Database User**:
   - Go to "Database Access"
   - Click "Add New Database User"
   - Username: `plugd-admin`
   - Password: Generate secure password
   - Database User Privileges: "Read and write to any database"
   - Click "Add User"

2. **Network Access**:
   - Go to "Network Access"
   - Click "Add IP Address"
   - Select "Allow Access from Anywhere" (0.0.0.0/0)
   - Click "Confirm"

### 2.4 Get Connection String
1. Go to "Databases"
2. Click "Connect" on your cluster
3. Select "Connect your application"
4. Copy the connection string
5. Replace `<password>` with your database user password
6. Replace `<dbname>` with `plugd-production`

**Example**: `mongodb+srv://plugd-admin:yourpassword@plugd-cluster.xxx.mongodb.net/plugd-production?retryWrites=true&w=majority`

---

## 🚀 Step 3: Backend Deployment (Railway - Free)

### 3.1 Create Railway Account
1. Go to [Railway](https://railway.app)
2. Sign up with GitHub account
3. Connect your GitHub account

### 3.2 Deploy Backend
1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Choose your `plugd-website` repository
4. Railway will auto-detect your project

### 3.3 Configure Backend Service
1. **Root Directory**: Set to `apps/backend`
2. **Build Command**: `cd apps/backend && npm install`
3. **Start Command**: `cd apps/backend && npm start`

### 3.4 Set Environment Variables
In Railway dashboard, go to Variables tab and add:

```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://plugd-admin:yourpassword@plugd-cluster.xxx.mongodb.net/plugd-production?retryWrites=true&w=majority
JWT_SECRET=your-super-secure-jwt-secret-256-bit-minimum
JWT_EXPIRE=7d
FRONTEND_URL=https://plugd.page.gd
CORS_ORIGIN=https://plugd.page.gd
PORT=5000
```

### 3.5 Get Backend URL
1. After deployment, Railway will provide a URL like: `https://your-app-name.up.railway.app`
2. Note this URL - you'll need it for frontend configuration

---

## 🌐 Step 4: Frontend Deployment (Vercel - Free)

### 4.1 Create Vercel Account
1. Go to [Vercel](https://vercel.com)
2. Sign up with GitHub account
3. Connect your GitHub account

### 4.2 Deploy Frontend
1. Click "New Project"
2. Import your `plugd-website` repository
3. **Framework Preset**: Next.js
4. **Root Directory**: `apps/frontend`
5. **Build Command**: `npm run build`
6. **Output Directory**: `.next`
7. **Install Command**: `npm install`

### 4.3 Configure Environment Variables
In Vercel dashboard, go to Settings → Environment Variables:

```env
NEXT_PUBLIC_API_URL=https://your-railway-app.up.railway.app
NEXT_PUBLIC_DOMAIN=plugd.page.gd
NEXT_PUBLIC_FRONTEND_URL=https://plugd.page.gd
NEXTAUTH_URL=https://plugd.page.gd
NEXTAUTH_SECRET=your-nextauth-secret-here
NODE_ENV=production
```

### 4.4 Get Vercel URL
After deployment, Vercel will provide URLs like:
- Production: `https://your-app-name.vercel.app`
- Preview: `https://your-app-name-git-main.vercel.app`

---

## 🔗 Step 5: Domain Setup (Freenom - Free)

### 5.1 Get Free Domain
1. Go to [Freenom](https://www.freenom.com)
2. Search for "plugd.page.gd" 
3. If not available, try:
   - `plugd.tk`
   - `plugd.ml`
   - `plugd.ga`
   - `plugd.cf`
4. Select domain and checkout (Free)

### 5.2 Configure DNS
In Freenom DNS management:

**For Frontend (plugd.page.gd)**:
```
Type: CNAME
Name: @
Target: cname.vercel-dns.com
TTL: 3600
```

**For Backend API (api.plugd.page.gd)**:
```
Type: CNAME  
Name: api
Target: your-railway-app.up.railway.app
TTL: 3600
```

### 5.3 Configure Vercel Custom Domain
1. In Vercel dashboard, go to Settings → Domains
2. Add domain: `plugd.page.gd`
3. Follow Vercel's DNS configuration instructions
4. Wait for SSL certificate to be issued (automatic)

### 5.4 Configure Railway Custom Domain
1. In Railway dashboard, go to Settings → Domains
2. Add custom domain: `api.plugd.page.gd`
3. Update DNS if needed
4. Wait for SSL certificate

---

## ⚙️ Step 6: Final Configuration Updates

### 6.1 Update Backend Environment Variables
In Railway, update the `FRONTEND_URL`:
```env
FRONTEND_URL=https://plugd.page.gd
CORS_ORIGIN=https://plugd.page.gd
```

### 6.2 Update Frontend Environment Variables  
In Vercel, update the API URL:
```env
NEXT_PUBLIC_API_URL=https://api.plugd.page.gd
NEXTAUTH_URL=https://plugd.page.gd
```

### 6.3 Redeploy Services
1. **Railway**: Redeploy backend service
2. **Vercel**: Redeploy frontend (automatic on env change)

---

## 🧪 Step 7: Testing & Verification

### 7.1 Test Backend API
```bash
curl https://api.plugd.page.gd/api/health
```

### 7.2 Test Frontend
1. Visit `https://plugd.page.gd`
2. Check all pages load correctly
3. Test API connectivity
4. Verify authentication works

### 7.3 Test Full Flow
1. Register new user
2. Login
3. Browse products
4. Add to cart
5. Checkout process

---

## 📊 Step 8: Monitoring & Maintenance

### 8.1 Set Up Basic Monitoring
**Vercel Analytics** (Free):
- Enable in Vercel dashboard
- Monitor page views and performance

**Railway Metrics** (Free):
- Monitor CPU, Memory, Network usage
- Check deployment logs

### 8.2 Regular Maintenance
- **Weekly**: Check error logs
- **Monthly**: Update dependencies
- **Quarterly**: Review performance metrics

---

## 💰 Free Tier Limitations

### Vercel (Free Tier)
- ✅ 100GB bandwidth/month
- ✅ Unlimited static sites
- ✅ Custom domains
- ❌ No commercial usage
- ❌ 10 serverless functions max

### Railway (Free Tier)  
- ✅ $5 credit/month
- ✅ Custom domains
- ✅ Auto-deployments
- ❌ ~550 hours/month uptime
- ❌ Sleeps after 30min inactivity

### MongoDB Atlas (Free Tier)
- ✅ 512MB storage
- ✅ Shared cluster
- ✅ No time limit
- ❌ Limited to 3 clusters
- ❌ No advanced features

---

## 🔧 Troubleshooting Common Issues

### Issue 1: "Cannot connect to database"
**Solution**: Check MongoDB connection string and network access

### Issue 2: "CORS error"
**Solution**: Verify CORS_ORIGIN environment variable in backend

### Issue 3: "Next.js build fails"
**Solution**: Check build logs and fix any import/syntax errors

### Issue 4: "Domain not working"
**Solution**: Wait 24-48 hours for DNS propagation

---

## 🎉 Success Checklist

- [ ] Database connected and working
- [ ] Backend API responding at api.plugd.page.gd
- [ ] Frontend loading at plugd.page.gd  
- [ ] Authentication working
- [ ] Payment system configured
- [ ] All pages accessible
- [ ] Mobile responsive
- [ ] SSL certificates active

---

## 📞 Support Resources

- **Vercel Docs**: https://vercel.com/docs
- **Railway Docs**: https://docs.railway.app
- **MongoDB Atlas**: https://docs.atlas.mongodb.com
- **Next.js Docs**: https://nextjs.org/docs

---

**Estimated Setup Time**: 2-4 hours
**Total Cost**: $0.00 (Free!)

🎊 **Congratulations! Your app is now live at plugd.page.gd**
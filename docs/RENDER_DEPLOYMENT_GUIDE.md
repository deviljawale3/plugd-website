# 🚀 Render Deployment Guide for plugd.page.gd

## Quick Fix for Current Error

The error you're seeing is because Render is trying to run the server without proper environment variables. Here's how to fix it:

### 1. **Set Required Environment Variables in Render Dashboard**

Go to your Render service dashboard and add these **required** environment variables:

```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/plugd-production
JWT_SECRET=your-super-secure-jwt-secret-minimum-32-characters
FRONTEND_URL=https://plugd.page.gd
CORS_ORIGIN=https://plugd.page.gd
```

### 2. **Optional Payment Gateway Variables** 
Only add these if you have the credentials (the app will work without them):

```env
RAZORPAY_KEY_ID=rzp_live_your_key_here
RAZORPAY_KEY_SECRET=your_razorpay_secret_here
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_here
PAYPAL_CLIENT_ID=your_paypal_client_id_here
PAYPAL_CLIENT_SECRET=your_paypal_client_secret_here
```

### 3. **Update Render Service Settings**

In your Render dashboard:
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Environment**: `Node`

### 4. **Redeploy**

After adding the environment variables, click "Deploy Latest Commit" or trigger a new deployment.

---

## Complete Render Setup (Fresh Start)

If you want to set up from scratch:

### Step 1: Create Render Account
1. Go to [Render.com](https://render.com)
2. Sign up with GitHub
3. Connect your GitHub repository

### Step 2: Create Web Service
1. Click "New +"
2. Select "Web Service"
3. Choose your `plugd-website` repository
4. Configure:
   - **Name**: `plugd-backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free

### Step 3: Set Environment Variables
Add the required variables from the RENDER_ENV_VARIABLES.txt file.

### Step 4: Deploy
Click "Create Web Service" and wait for deployment.

---

## Free MongoDB Atlas Setup

### 1. Create Atlas Account
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Sign up for free account
3. Create new project

### 2. Create Free Cluster
1. Click "Build a Database"
2. Choose "Shared" (Free)
3. Select AWS provider
4. Choose region closest to your users
5. Name: `plugd-cluster`
6. Click "Create"

### 3. Configure Access
1. **Database User**:
   - Username: `plugd-admin`
   - Password: Generate secure password
   - Role: "Read and write to any database"

2. **Network Access**:
   - Add IP: `0.0.0.0/0` (Allow from anywhere)

### 4. Get Connection String
1. Click "Connect" on your cluster
2. Choose "Connect your application"
3. Copy connection string
4. Replace `<password>` with your password
5. Replace `<dbname>` with `plugd-production`

---

## Environment Variables Explanation

### Required (Minimum to Run)
- `NODE_ENV=production` - Sets Node.js environment
- `MONGODB_URI` - Database connection string
- `JWT_SECRET` - For user authentication (minimum 32 characters)
- `FRONTEND_URL` - Your frontend domain
- `CORS_ORIGIN` - Allowed origins for API calls

### Optional (Payment Gateways)
- `RAZORPAY_*` - For Indian payments (UPI, cards, etc.)
- `STRIPE_*` - For international credit/debit cards
- `PAYPAL_*` - For PayPal payments

**Note**: If payment gateway variables are not provided, those payment methods will be automatically disabled, but Cash on Delivery will still work.

---

## Troubleshooting Common Issues

### ❌ "key_id or oauthToken is mandatory"
**Fix**: Set `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` environment variables, or the service will automatically disable Razorpay.

### ❌ "Cannot connect to database"
**Fix**: Check your `MONGODB_URI` connection string and ensure IP whitelist includes `0.0.0.0/0`.

### ❌ "Build failed"
**Fix**: Ensure your build command is `npm install` and start command is `npm start`.

### ❌ "Port already in use"
**Fix**: Don't set the PORT environment variable - Render sets this automatically.

---

## Testing Your Deployment

### 1. Check Health Endpoint
```bash
curl https://your-render-app.onrender.com/api/health
```

### 2. Expected Response
```json
{
  "success": true,
  "message": "Plugd API is healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "production"
}
```

### 3. Check Available Payment Methods
```bash
curl https://your-render-app.onrender.com/api/payments/methods
```

---

## Cost Breakdown

### Free Tier Limits
- **Render**: Free tier includes 750 hours/month
- **MongoDB Atlas**: 512MB storage (permanently free)
- **Domain**: Use Freenom for free domains

### Render Free Tier Details
- ✅ 750 hours/month (enough for 24/7 with sleep mode)
- ✅ Automatic HTTPS
- ✅ Custom domains
- ⚠️ Sleeps after 15 minutes of inactivity
- ⚠️ Slower cold starts

---

## Production Optimization

### 1. Environment Variables Security
- Use strong, unique passwords
- Rotate JWT secrets regularly
- Use production API keys only

### 2. Database Optimization
- Enable MongoDB connection pooling
- Add database indexes for better performance
- Monitor usage to stay within free tier

### 3. Monitoring
- Set up Render monitoring alerts
- Monitor MongoDB Atlas metrics
- Track API response times

---

## Support & Resources

- **Render Docs**: https://render.com/docs
- **MongoDB Atlas**: https://docs.atlas.mongodb.com
- **Payment Gateways**: 
  - Razorpay: https://razorpay.com/docs
  - Stripe: https://stripe.com/docs
  - PayPal: https://developer.paypal.com

---

**🎉 Your backend should now be running successfully on Render!**

Next step: Deploy your frontend to Vercel using the same process.
# Payment Gateway Setup Guide

This guide will help you set up multiple payment gateways for your e-commerce application.

## Overview

Our application supports the following payment methods:
- **Razorpay** (Primary) - Indian payment gateway
- **Stripe** - International payment gateway
- **PayPal** - Global payment platform
- **Cash on Delivery (COD)** - Offline payment method

## Environment Variables

Add these environment variables to your `.env.local` file:

```bash
# Razorpay Configuration (Primary)
RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key

# PayPal Configuration
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret

# General Configuration
FRONTEND_URL=http://localhost:3000
BRAND_NAME=Your Store Name
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_your_key_id
NEXT_PUBLIC_BRAND_NAME=Your Store Name
```

## 1. Razorpay Setup (Primary Payment Gateway)

### Step 1: Create Razorpay Account
1. Go to [https://razorpay.com](https://razorpay.com)
2. Sign up for a business account
3. Complete KYC verification for live mode

### Step 2: Get API Keys
1. Login to Razorpay Dashboard
2. Go to Settings > API Keys
3. Generate Test/Live API Keys
4. Copy Key ID and Key Secret

### Step 3: Configure Webhooks
1. Go to Settings > Webhooks
2. Add webhook URL: `https://yourdomain.com/api/payments/webhook/razorpay`
3. Select events:
   - `payment.captured`
   - `payment.failed`
   - `order.paid`
4. Copy webhook secret

### Step 4: Update Environment Variables
```bash
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
RAZORPAY_WEBHOOK_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxxxxx
```

### Step 5: Install Dependencies
```bash
npm install razorpay
```

## 2. Stripe Setup

### Step 1: Create Stripe Account
1. Go to [https://stripe.com](https://stripe.com)
2. Sign up for an account
3. Complete account verification

### Step 2: Get API Keys
1. Login to Stripe Dashboard
2. Go to Developers > API keys
3. Copy Publishable key and Secret key

### Step 3: Configure Webhooks
1. Go to Developers > Webhooks
2. Add endpoint: `https://yourdomain.com/api/payments/webhook/stripe`
3. Select events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
4. Copy webhook signing secret

### Step 4: Update Environment Variables
```bash
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Step 5: Install Dependencies
```bash
npm install stripe
```

## 3. PayPal Setup

### Step 1: Create PayPal Developer Account
1. Go to [https://developer.paypal.com](https://developer.paypal.com)
2. Sign up with your PayPal account
3. Create a new application

### Step 2: Get API Credentials
1. In PayPal Developer Dashboard
2. Go to My Apps & Credentials
3. Create new app or use existing
4. Copy Client ID and Client Secret

### Step 3: Configure Webhooks (Optional)
1. Go to Webhooks in your app settings
2. Add webhook URL: `https://yourdomain.com/api/payments/webhook/paypal`
3. Select events:
   - `CHECKOUT.ORDER.COMPLETED`
   - `PAYMENT.CAPTURE.COMPLETED`
   - `PAYMENT.CAPTURE.DENIED`

### Step 4: Update Environment Variables
```bash
PAYPAL_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
PAYPAL_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Step 5: Install Dependencies
```bash
npm install @paypal/checkout-server-sdk
```

## 4. Testing Payment Gateways

### Test Razorpay
**Test Card Numbers:**
- Success: 4111 1111 1111 1111
- Failure: 4000 0000 0000 0002
- CVV: Any 3 digits
- Expiry: Any future date

**Test UPI ID:** success@razorpay

### Test Stripe
**Test Card Numbers:**
- Success: 4242 4242 4242 4242
- Declined: 4000 0000 0000 0002
- CVV: Any 3 digits
- Expiry: Any future date

### Test PayPal
Use PayPal Sandbox accounts:
- Email: sb-buyer@business.example.com
- Password: (provided in sandbox)

## 5. Production Deployment

### Security Checklist
- [ ] Use HTTPS for all payment endpoints
- [ ] Validate webhook signatures
- [ ] Store sensitive keys in environment variables
- [ ] Enable rate limiting on payment endpoints
- [ ] Log all payment transactions
- [ ] Set up monitoring and alerts

### Razorpay Production
1. Complete KYC verification
2. Switch to live API keys
3. Update webhook URLs to production
4. Test with small amounts first

### Stripe Production
1. Activate Stripe account
2. Switch to live API keys
3. Update webhook endpoints
4. Enable fraud protection

### PayPal Production
1. Switch to live environment
2. Update client credentials
3. Test with real transactions

## 6. API Endpoints

### Available Endpoints

#### Get Payment Methods
```
GET /api/payments/methods
```

#### Create Payment Order
```
POST /api/payments/create-order
Body: {
  "orderId": "order_id",
  "gateway": "razorpay|stripe|paypal|cod",
  "amount": 1000,
  "currency": "INR"
}
```

#### Verify Payment
```
POST /api/payments/verify
Body: {
  "gateway": "razorpay",
  "orderId": "order_id",
  // Gateway-specific fields
}
```

#### Process Refund (Admin)
```
POST /api/payments/refund
Body: {
  "orderId": "order_id",
  "amount": 500,
  "reason": "Customer request"
}
```

#### Get Payment History
```
GET /api/payments/history?page=1&limit=10
```

#### Get Payment Statistics (Admin)
```
GET /api/payments/stats?startDate=2024-01-01&endDate=2024-12-31
```

#### Test Gateway Connection (Admin)
```
GET /api/payments/test/razorpay
```

## 7. Frontend Integration

### Checkout Page
The checkout page (`/payment/checkout`) automatically:
- Loads available payment methods
- Displays order summary
- Handles payment processing for all gateways
- Redirects to success/failure pages

### Success Page
The success page (`/payment/success`) shows:
- Payment confirmation
- Order details
- Next steps
- Action buttons (track order, continue shopping)

### Failed Page
The failed page (`/payment/failed`) provides:
- Error details
- Suggested solutions
- Retry payment option
- Support contact information

## 8. Troubleshooting

### Common Issues

#### Razorpay
- **Invalid signature**: Check webhook secret
- **Order creation failed**: Verify API keys
- **Payment not captured**: Check auto-capture settings

#### Stripe
- **Invalid API key**: Verify test/live key usage
- **Webhook signature invalid**: Check endpoint secret
- **Payment requires authentication**: Handle 3D Secure

#### PayPal
- **Client credentials invalid**: Check sandbox/live environment
- **Order approval failed**: Verify redirect URLs
- **Webhook not received**: Check endpoint configuration

### Debug Mode
Enable debug logging by setting:
```bash
NODE_ENV=development
DEBUG=payment:*
```

### Support Contacts
- **Razorpay**: support@razorpay.com
- **Stripe**: support@stripe.com
- **PayPal**: developer-support@paypal.com

## 9. Monitoring and Analytics

### Key Metrics to Track
- Payment success rate by gateway
- Average transaction value
- Failed payment reasons
- Processing time per gateway
- User preference by payment method

### Recommended Tools
- Payment gateway dashboards
- Application monitoring (New Relic, DataDog)
- Error tracking (Sentry)
- Analytics (Google Analytics with enhanced ecommerce)

## 10. Security Best Practices

### Data Protection
- Never store card details on your server
- Use PCI DSS compliant payment gateways
- Implement proper access controls
- Regular security audits

### API Security
- Rate limiting on payment endpoints
- Input validation and sanitization
- CSRF protection
- Webhook signature verification

### Compliance
- PCI DSS compliance
- GDPR compliance for EU customers
- Local regulations (RBI for India)

---

## Quick Start Checklist

- [ ] Set up Razorpay account and get API keys
- [ ] Configure environment variables
- [ ] Install required dependencies
- [ ] Test with test cards/accounts
- [ ] Set up webhooks
- [ ] Test complete payment flow
- [ ] Configure error handling
- [ ] Set up monitoring
- [ ] Deploy to production
- [ ] Switch to live credentials

**Need help?** Contact our development team or refer to the individual gateway documentation.

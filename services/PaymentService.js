const RazorpayService = require('./RazorpayService');
const StripeService = require('./StripeService');
const PayPalService = require('./PayPalService');
const Order = require('../models/Order');
class PaymentService {
constructor() {
this.razorpay = new RazorpayService();
this.stripe = new StripeService();
this.paypal = new PayPalService();
// Default payment gateway priority
this.gatewayPriority = ['razorpay', 'stripe', 'paypal', 'cod'];
}
// Get available payment methods
getAvailablePaymentMethods() {
const methods = [];
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
methods.push({
id: 'razorpay',
name: 'Razorpay',
type: 'gateway',
supported_currencies: ['INR'],
logo: '/images/razorpay-logo.png',
description: 'Pay securely with Credit/Debit Cards, UPI, Net Banking'
});
}
if (process.env.STRIPE_SECRET_KEY) {
methods.push({
id: 'stripe',
name: 'Stripe',
type: 'gateway',
supported_currencies: ['USD', 'EUR', 'GBP', 'INR'],
logo: '/images/stripe-logo.png',
description: 'Pay securely with Credit/Debit Cards'
});
}
if (process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET) {
methods.push({
id: 'paypal',
name: 'PayPal',
type: 'gateway',
supported_currencies: ['USD', 'EUR', 'GBP'],
logo: '/images/paypal-logo.png',
description: 'Pay with your PayPal account'
});

const Razorpay = require('razorpay');
const crypto = require('crypto');
const Order = require('../models/Order');
class RazorpayService {
constructor() {
// Only initialize Razorpay if credentials are available
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
this.razorpay = new Razorpay({
key_id: process.env.RAZORPAY_KEY_ID,
key_secret: process.env.RAZORPAY_KEY_SECRET,
});
this.isEnabled = true;
} else {
console.warn('Razorpay credentials not provided. Razorpay service will be disabled.');
this.razorpay = null;
this.isEnabled = false;
}
}
async createOrder(orderData) {
try {
if (!this.isEnabled) {
return {
success: false,
error: 'Razorpay service is not enabled. Please configure RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.',
};
}
const { amount, currency = 'INR', receipt } = orderData;
const options = {
amount: amount * 100, // Convert to paise
currency,
receipt,
payment_capture: 1,
};
const razorpayOrder = await this.razorpay.orders.create(options);
return {
success: true,
orderId: razorpayOrder.id,
amount: razorpayOrder.amount,
currency: razorpayOrder.currency,
receipt: razorpayOrder.receipt,
status: razorpayOrder.status,
};
} catch (error) {
console.error('Razorpay Order Creation Error:', error);
return {
success: false,
error: error.message,
};
}
}
async verifyPayment(paymentData) {
try {
const {
razorpay_order_id,
razorpay_payment_id,
razorpay_signature,
} = paymentData;
const sign = razorpay_order_id + '|' + razorpay_payment_id;
const expectedSign = crypto
.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
.update(sign.toString())
.digest('hex');
if (razorpay_signature === expectedSign) {
return {
success: true,
paymentId: razorpay_payment_id,
orderId: razorpay_order_id,
};
} else {
return {
success: false,
error: 'Payment verification failed',
};
}
} catch (error) {
console.error('Razorpay Payment Verification Error:', error);
return {
success: false,
error: error.message,
};
}
}
async getPaymentDetails(paymentId) {
try {
const payment = await this.razorpay.payments.fetch(paymentId);
return {
success: true,
payment,
};
} catch (error) {
console.error('Razorpay Get Payment Error:', error);
return {
success: false,
error: error.message,
};
}
}
async refundPayment(paymentId, amount = null) {
try {
const refundData = {
payment_id: paymentId,
};
if (amount) {
refundData.amount = amount * 100; // Convert to paise
}
const refund = await this.razorpay.payments.refund(paymentId, refundData);
return {
success: true,
refund,
};
} catch (error) {
console.error('Razorpay Refund Error:', error);
return {
success: false,
error: error.message,
};
}
}
async createSubscription(subscriptionData) {
try {
const subscription = await this.razorpay.subscriptions.create(subscriptionData);
return {
success: true,
subscription,
};
} catch (error) {
console.error('Razorpay Subscription Error:', error);
return {
success: false,
error: error.message,
};
}
}
// Webhook handler for automatic payment verification
async handleWebhook(webhookBody, webhookSignature) {
try {
const expectedSignature = crypto
.createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
.update(JSON.stringify(webhookBody))
.digest('hex');
if (webhookSignature !== expectedSignature) {
return {
success: false,
error: 'Invalid webhook signature',
};
}
const { event, payload } = webhookBody;
switch (event) {
case 'payment.captured':
await this.updateOrderStatus(payload.payment.entity.order_id, 'paid');
break;
case 'payment.failed':
await this.updateOrderStatus(payload.payment.entity.order_id, 'payment_failed');
break;
default:
console.log('Unhandled webhook event:', event);
}
return {
success: true,
event,
};
} catch (error) {
console.error('Razorpay Webhook Error:', error);
return {
success: false,
error: error.message,
};
}
}
async updateOrderStatus(razorpayOrderId, status) {
try {
await Order.findOneAndUpdate(
{ 'payment.razorpayOrderId': razorpayOrderId },
{ 
'payment.status': status,
'payment.updatedAt': new Date(),
}
);
} catch (error) {
console.error('Order status update error:', error);
}
}
}
module.exports = RazorpayService;

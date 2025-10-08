const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Order = require('../models/Order');

class StripeService {
  constructor() {
    this.stripe = stripe;
  }

  async createPaymentIntent(orderData) {
    try {
      const { amount, currency = 'usd', receipt, metadata = {} } = orderData;
      
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: amount * 100, // Convert to cents
        currency,
        metadata: {
          receipt,
          ...metadata,
        },
        automatic_payment_methods: {
          enabled: true,
        },
      });
      
      return {
        success: true,
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: paymentIntent.status,
      };
    } catch (error) {
      console.error('Stripe Payment Intent Creation Error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async verifyPayment(paymentIntentId) {
    try {
      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);
      
      if (paymentIntent.status === 'succeeded') {
        return {
          success: true,
          paymentId: paymentIntent.id,
          amount: paymentIntent.amount / 100, // Convert back to dollars
          currency: paymentIntent.currency,
          status: paymentIntent.status,
        };
      } else {
        return {
          success: false,
          error: `Payment status: ${paymentIntent.status}`,
          status: paymentIntent.status,
        };
      }
    } catch (error) {
      console.error('Stripe Payment Verification Error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async getPaymentDetails(paymentIntentId) {
    try {
      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);
      return {
        success: true,
        payment: paymentIntent,
      };
    } catch (error) {
      console.error('Stripe Get Payment Error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async refundPayment(paymentIntentId, amount = null) {
    try {
      const refundData = {
        payment_intent: paymentIntentId,
      };
      
      if (amount) {
        refundData.amount = amount * 100; // Convert to cents
      }

      const refund = await this.stripe.refunds.create(refundData);
      
      return {
        success: true,
        refund,
      };
    } catch (error) {
      console.error('Stripe Refund Error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async createSubscription(customerData, priceId) {
    try {
      // Create customer if not exists
      const customer = await this.stripe.customers.create({
        email: customerData.email,
        name: customerData.name,
        metadata: customerData.metadata || {},
      });

      // Create subscription
      const subscription = await this.stripe.subscriptions.create({
        customer: customer.id,
        items: [{ price: priceId }],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
      });

      return {
        success: true,
        subscription,
        clientSecret: subscription.latest_invoice.payment_intent.client_secret,
      };
    } catch (error) {
      console.error('Stripe Subscription Error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async handleWebhook(webhookBody, webhookSignature) {
    try {
      const event = this.stripe.webhooks.constructEvent(
        webhookBody,
        webhookSignature,
        process.env.STRIPE_WEBHOOK_SECRET
      );

      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.updateOrderStatus(event.data.object.metadata.receipt, 'paid');
          break;
        case 'payment_intent.payment_failed':
          await this.updateOrderStatus(event.data.object.metadata.receipt, 'payment_failed');
          break;
        default:
          console.log('Unhandled webhook event type:', event.type);
      }

      return {
        success: true,
        event: event.type,
      };
    } catch (error) {
      console.error('Stripe Webhook Error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async updateOrderStatus(receipt, status) {
    try {
      await Order.findOneAndUpdate(
        { 'payment.receipt': receipt },
        { 
          'payment.status': status,
          'payment.updatedAt': new Date(),
        }
      );
    } catch (error) {
      console.error('Order status update error:', error);
    }
  }

  // Create setup intent for future payments
  async createSetupIntent(customerId) {
    try {
      const setupIntent = await this.stripe.setupIntents.create({
        customer: customerId,
        payment_method_types: ['card'],
      });

      return {
        success: true,
        clientSecret: setupIntent.client_secret,
      };
    } catch (error) {
      console.error('Stripe Setup Intent Error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

module.exports = StripeService;

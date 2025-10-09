const paypal = require('@paypal/checkout-server-sdk');
const Order = require('../models/Order');

class PayPalService {
  constructor() {
    // Configure PayPal environment
    const environment = process.env.NODE_ENV === 'production' 
      ? new paypal.core.LiveEnvironment(
          process.env.PAYPAL_CLIENT_ID, 
          process.env.PAYPAL_CLIENT_SECRET
        )
      : new paypal.core.SandboxEnvironment(
          process.env.PAYPAL_CLIENT_ID, 
          process.env.PAYPAL_CLIENT_SECRET
        );
    
    this.client = new paypal.core.PayPalHttpClient(environment);
  }

  async createOrder(orderData) {
    try {
      const { amount, currency = 'USD', receipt, items = [] } = orderData;
      
      const request = new paypal.orders.OrdersCreateRequest();
      request.prefer('return=representation');
      request.requestBody({
        intent: 'CAPTURE',
        purchase_units: [{
          reference_id: receipt,
          amount: {
            currency_code: currency,
            value: amount.toString(),
            breakdown: {
              item_total: {
                currency_code: currency,
                value: amount.toString()
              }
            }
          },
          items: items.length > 0 ? items.map(item => ({
            name: item.name,
            unit_amount: {
              currency_code: currency,
              value: item.price.toString()
            },
            quantity: item.quantity.toString(),
            category: 'PHYSICAL_GOODS'
          })) : [{
            name: 'Order Item',
            unit_amount: {
              currency_code: currency,
              value: amount.toString()
            },
            quantity: '1',
            category: 'PHYSICAL_GOODS'
          }]
        }],
        application_context: {
          return_url: `${process.env.FRONTEND_URL}/payment/success`,
          cancel_url: `${process.env.FRONTEND_URL}/payment/failed`,
          brand_name: process.env.BRAND_NAME || 'Your Store',
          landing_page: 'BILLING',
          shipping_preference: 'SET_PROVIDED_ADDRESS',
          user_action: 'PAY_NOW'
        }
      });

      const order = await this.client.execute(request);
      
      return {
        success: true,
        orderId: order.result.id,
        status: order.result.status,
        links: order.result.links,
        approvalUrl: order.result.links.find(link => link.rel === 'approve')?.href
      };
    } catch (error) {
      console.error('PayPal Order Creation Error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async captureOrder(orderId) {
    try {
      const request = new paypal.orders.OrdersCaptureRequest(orderId);
      request.requestBody({});
      
      const capture = await this.client.execute(request);
      
      if (capture.result.status === 'COMPLETED') {
        return {
          success: true,
          captureId: capture.result.purchase_units[0].payments.captures[0].id,
          status: capture.result.status,
          orderId: capture.result.id,
          amount: capture.result.purchase_units[0].payments.captures[0].amount
        };
      } else {
        return {
          success: false,
          error: `Capture status: ${capture.result.status}`,
          status: capture.result.status
        };
      }
    } catch (error) {
      console.error('PayPal Order Capture Error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async verifyPayment(orderId) {
    try {
      const request = new paypal.orders.OrdersGetRequest(orderId);
      const order = await this.client.execute(request);
      
      if (order.result.status === 'COMPLETED') {
        return {
          success: true,
          paymentId: order.result.id,
          status: order.result.status,
          amount: order.result.purchase_units[0].amount.value
        };
      } else {
        return {
          success: false,
          error: `Payment status: ${order.result.status}`,
          status: order.result.status
        };
      }
    } catch (error) {
      console.error('PayPal Payment Verification Error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async getOrderDetails(orderId) {
    try {
      const request = new paypal.orders.OrdersGetRequest(orderId);
      const order = await this.client.execute(request);
      
      return {
        success: true,
        order: order.result,
      };
    } catch (error) {
      console.error('PayPal Get Order Error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async refundPayment(captureId, amount = null) {
    try {
      const request = new paypal.payments.CapturesRefundRequest(captureId);
      
      const refundBody = {};
      if (amount) {
        refundBody.amount = {
          currency_code: 'USD',
          value: amount.toString()
        };
      }
      
      request.requestBody(refundBody);
      
      const refund = await this.client.execute(request);
      
      return {
        success: true,
        refund: refund.result,
      };
    } catch (error) {
      console.error('PayPal Refund Error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async handleWebhook(webhookBody, webhookHeaders) {
    try {
      // PayPal webhook verification would go here
      // For now, we'll handle the events directly
      
      const { event_type, resource } = webhookBody;
      
      switch (event_type) {
        case 'CHECKOUT.ORDER.COMPLETED':
          await this.updateOrderStatus(resource.purchase_units[0].reference_id, 'paid');
          break;
        case 'PAYMENT.CAPTURE.COMPLETED':
          await this.updateOrderStatus(resource.custom_id, 'paid');
          break;
        case 'PAYMENT.CAPTURE.DENIED':
          await this.updateOrderStatus(resource.custom_id, 'payment_failed');
          break;
        default:
          console.log('Unhandled PayPal webhook event:', event_type);
      }

      return {
        success: true,
        event: event_type,
      };
    } catch (error) {
      console.error('PayPal Webhook Error:', error);
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

  // Create subscription for recurring payments
  async createSubscription(subscriptionData) {
    try {
      const request = new paypal.subscriptions.SubscriptionsCreateRequest();
      request.requestBody(subscriptionData);
      
      const subscription = await this.client.execute(request);
      
      return {
        success: true,
        subscription: subscription.result,
        approvalUrl: subscription.result.links.find(link => link.rel === 'approve')?.href
      };
    } catch (error) {
      console.error('PayPal Subscription Error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

module.exports = PayPalService;

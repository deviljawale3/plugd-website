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
    }
    
    // Cash on Delivery is always available
    methods.push({
      id: 'cod',
      name: 'Cash on Delivery',
      type: 'offline',
      supported_currencies: ['INR', 'USD'],
      logo: '/images/cod-logo.png',
      description: 'Pay when your order is delivered'
    });
    
    return methods;
  }

  // Create payment order based on gateway
  async createPaymentOrder(orderData) {
    try {
      const { gateway, amount, currency, orderId, items, customerData } = orderData;
      
      // Validate gateway
      if (!this.isGatewaySupported(gateway)) {
        return {
          success: false,
          error: `Payment gateway '${gateway}' is not supported`,
        };
      }
      
      // Generate unique receipt ID
      const receipt = `order_${orderId}_${Date.now()}`;
      
      let result;
      
      switch (gateway) {
        case 'razorpay':
          result = await this.razorpay.createOrder({
            amount,
            currency: currency || 'INR',
            receipt,
          });
          break;
          
        case 'stripe':
          result = await this.stripe.createPaymentIntent({
            amount,
            currency: currency || 'USD',
            receipt,
            metadata: {
              orderId: orderId.toString(),
              customerEmail: customerData?.email || ''
            }
          });
          break;
          
        case 'paypal':
          result = await this.paypal.createOrder({
            amount,
            currency: currency || 'USD',
            receipt,
            items
          });
          break;
          
        case 'cod':
          result = {
            success: true,
            orderId: receipt,
            amount,
            currency,
            status: 'pending',
            paymentMethod: 'cash_on_delivery'
          };
          break;
          
        default:
          return {
            success: false,
            error: `Unsupported gateway: ${gateway}`,
          };
      }
      
      if (result.success) {
        // Update order with payment information
        await this.updateOrderPaymentInfo(orderId, {
          gateway,
          gatewayOrderId: result.orderId || result.paymentIntentId,
          receipt,
          amount,
          currency,
          status: 'pending',
          clientSecret: result.clientSecret,
          approvalUrl: result.approvalUrl
        });
      }
      
      return result;
    } catch (error) {
      console.error('Payment Order Creation Error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Verify payment based on gateway
  async verifyPayment(paymentData) {
    try {
      const { gateway, orderId } = paymentData;
      
      let result;
      
      switch (gateway) {
        case 'razorpay':
          result = await this.razorpay.verifyPayment(paymentData);
          break;
          
        case 'stripe':
          result = await this.stripe.verifyPayment(paymentData.paymentIntentId);
          break;
          
        case 'paypal':
          // First capture the order, then verify
          const captureResult = await this.paypal.captureOrder(paymentData.paypalOrderId);
          if (captureResult.success) {
            result = await this.paypal.verifyPayment(paymentData.paypalOrderId);
          } else {
            result = captureResult;
          }
          break;
          
        case 'cod':
          result = {
            success: true,
            paymentId: paymentData.orderId,
            status: 'pending' // COD payments are confirmed on delivery
          };
          break;
          
        default:
          return {
            success: false,
            error: `Unsupported gateway: ${gateway}`,
          };
      }
      
      if (result.success) {
        // Update order status
        const paymentStatus = gateway === 'cod' ? 'pending' : 'paid';
        await this.updateOrderStatus(orderId, paymentStatus, {
          paymentId: result.paymentId,
          verifiedAt: new Date()
        });
      }
      
      return result;
    } catch (error) {
      console.error('Payment Verification Error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Process refund
  async processRefund(refundData) {
    try {
      const { orderId, amount, reason } = refundData;
      
      // Get order details
      const order = await Order.findById(orderId);
      if (!order) {
        return {
          success: false,
          error: 'Order not found',
        };
      }
      
      const gateway = order.payment.gateway;
      let result;
      
      switch (gateway) {
        case 'razorpay':
          result = await this.razorpay.refundPayment(order.payment.paymentId, amount);
          break;
          
        case 'stripe':
          result = await this.stripe.refundPayment(order.payment.paymentId, amount);
          break;
          
        case 'paypal':
          result = await this.paypal.refundPayment(order.payment.paymentId, amount);
          break;
          
        case 'cod':
          result = {
            success: true,
            refund: {
              id: `refund_${Date.now()}`,
              amount,
              status: 'completed',
              reason
            }
          };
          break;
          
        default:
          return {
            success: false,
            error: `Refund not supported for gateway: ${gateway}`,
          };
      }
      
      if (result.success) {
        // Update order with refund information
        await Order.findByIdAndUpdate(orderId, {
          $push: {
            'payment.refunds': {
              refundId: result.refund.id,
              amount,
              reason,
              status: 'completed',
              processedAt: new Date()
            }
          },
          'payment.refundedAmount': (order.payment.refundedAmount || 0) + amount
        });
      }
      
      return result;
    } catch (error) {
      console.error('Refund Processing Error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Handle webhooks from different gateways
  async handleWebhook(gateway, webhookData, signature) {
    try {
      let result;
      
      switch (gateway) {
        case 'razorpay':
          result = await this.razorpay.handleWebhook(webhookData, signature);
          break;
          
        case 'stripe':
          result = await this.stripe.handleWebhook(webhookData, signature);
          break;
          
        case 'paypal':
          result = await this.paypal.handleWebhook(webhookData, signature);
          break;
          
        default:
          return {
            success: false,
            error: `Webhook not supported for gateway: ${gateway}`,
          };
      }
      
      return result;
    } catch (error) {
      console.error('Webhook Processing Error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Utility methods
  isGatewaySupported(gateway) {
    const supportedGateways = this.getAvailablePaymentMethods().map(method => method.id);
    return supportedGateways.includes(gateway);
  }

  async updateOrderPaymentInfo(orderId, paymentInfo) {
    try {
      await Order.findByIdAndUpdate(orderId, {
        'payment.gateway': paymentInfo.gateway,
        'payment.gatewayOrderId': paymentInfo.gatewayOrderId,
        'payment.receipt': paymentInfo.receipt,
        'payment.amount': paymentInfo.amount,
        'payment.currency': paymentInfo.currency,
        'payment.status': paymentInfo.status,
        'payment.clientSecret': paymentInfo.clientSecret,
        'payment.approvalUrl': paymentInfo.approvalUrl,
        'payment.updatedAt': new Date()
      });
    } catch (error) {
      console.error('Order payment info update error:', error);
    }
  }

  async updateOrderStatus(orderId, status, additionalInfo = {}) {
    try {
      const updateData = {
        'payment.status': status,
        'payment.updatedAt': new Date(),
        ...Object.keys(additionalInfo).reduce((acc, key) => {
          acc[`payment.${key}`] = additionalInfo[key];
          return acc;
        }, {})
      };
      
      await Order.findByIdAndUpdate(orderId, updateData);
    } catch (error) {
      console.error('Order status update error:', error);
    }
  }

  // Get payment statistics
  async getPaymentStats(dateRange = {}) {
    try {
      const matchCondition = {};
      
      if (dateRange.startDate && dateRange.endDate) {
        matchCondition.createdAt = {
          $gte: new Date(dateRange.startDate),
          $lte: new Date(dateRange.endDate)
        };
      }
      
      const stats = await Order.aggregate([
        { $match: matchCondition },
        {
          $group: {
            _id: '$payment.gateway',
            totalOrders: { $sum: 1 },
            totalAmount: { $sum: '$payment.amount' },
            successfulPayments: {
              $sum: {
                $cond: [{ $eq: ['$payment.status', 'paid'] }, 1, 0]
              }
            },
            pendingPayments: {
              $sum: {
                $cond: [{ $eq: ['$payment.status', 'pending'] }, 1, 0]
              }
            },
            failedPayments: {
              $sum: {
                $cond: [{ $eq: ['$payment.status', 'failed'] }, 1, 0]
              }
            }
          }
        },
        { $sort: { totalAmount: -1 } }
      ]);
      
      return {
        success: true,
        stats
      };
    } catch (error) {
      console.error('Payment stats error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = PaymentService;

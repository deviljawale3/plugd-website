const express = require('express');
const router = express.Router();
const PaymentService = require('../services/PaymentService');
const Order = require('../models/Order');
const auth = require('../middleware/auth'); // Assuming you have auth middleware

const paymentService = new PaymentService();

// Get available payment methods
router.get('/methods', async (req, res) => {
  try {
    const methods = paymentService.getAvailablePaymentMethods();
    res.json({
      success: true,
      methods
    });
  } catch (error) {
    console.error('Get payment methods error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get payment methods'
    });
  }
});

// Create payment order
router.post('/create-order', auth, async (req, res) => {
  try {
    const {
      orderId,
      gateway,
      amount,
      currency,
      items,
      customerData
    } = req.body;

    // Validate required fields
    if (!orderId || !gateway || !amount) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: orderId, gateway, amount'
      });
    }

    // Verify order exists and belongs to user
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    if (order.customer.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized access to order'
      });
    }

    const result = await paymentService.createPaymentOrder({
      gateway,
      amount,
      currency,
      orderId,
      items,
      customerData: {
        email: req.user.email,
        name: req.user.name,
        ...customerData
      }
    });

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Create payment order error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create payment order'
    });
  }
});

// Verify payment
router.post('/verify', auth, async (req, res) => {
  try {
    const { gateway, orderId } = req.body;

    // Validate required fields
    if (!gateway || !orderId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: gateway, orderId'
      });
    }

    // Verify order belongs to user
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    if (order.customer.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized access to order'
      });
    }

    const result = await paymentService.verifyPayment(req.body);

    if (result.success) {
      res.json({
        success: true,
        message: 'Payment verified successfully',
        paymentId: result.paymentId
      });
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify payment'
    });
  }
});

// Process refund (Admin only)
router.post('/refund', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    const { orderId, amount, reason } = req.body;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        error: 'Order ID is required'
      });
    }

    const result = await paymentService.processRefund({
      orderId,
      amount,
      reason: reason || 'Admin initiated refund'
    });

    if (result.success) {
      res.json({
        success: true,
        message: 'Refund processed successfully',
        refund: result.refund
      });
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Refund processing error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process refund'
    });
  }
});

// Get payment history for user
router.get('/history', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const orders = await Order.find(
      { customer: req.user.id, 'payment.status': { $exists: true } },
      {
        _id: 1,
        orderNumber: 1,
        totalAmount: 1,
        payment: 1,
        status: 1,
        createdAt: 1
      }
    )
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

    const total = await Order.countDocuments({
      customer: req.user.id,
      'payment.status': { $exists: true }
    });

    res.json({
      success: true,
      payments: orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Payment history error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get payment history'
    });
  }
});

// Get payment statistics (Admin only)
router.get('/stats', auth, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    const { startDate, endDate } = req.query;
    const result = await paymentService.getPaymentStats({
      startDate,
      endDate
    });

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Payment stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get payment statistics'
    });
  }
});

// Webhook endpoints for different gateways

// Razorpay webhook
router.post('/webhook/razorpay', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const result = await paymentService.handleWebhook('razorpay', req.body, signature);
    
    if (result.success) {
      res.status(200).json({ success: true });
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Razorpay webhook error:', error);
    res.status(500).json({ success: false, error: 'Webhook processing failed' });
  }
});

// Stripe webhook
router.post('/webhook/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const signature = req.headers['stripe-signature'];
    const result = await paymentService.handleWebhook('stripe', req.body, signature);
    
    if (result.success) {
      res.status(200).json({ success: true });
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Stripe webhook error:', error);
    res.status(500).json({ success: false, error: 'Webhook processing failed' });
  }
});

// PayPal webhook
router.post('/webhook/paypal', express.json(), async (req, res) => {
  try {
    const headers = req.headers;
    const result = await paymentService.handleWebhook('paypal', req.body, headers);
    
    if (result.success) {
      res.status(200).json({ success: true });
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('PayPal webhook error:', error);
    res.status(500).json({ success: false, error: 'Webhook processing failed' });
  }
});

// Test payment gateway connection
router.get('/test/:gateway', auth, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    const { gateway } = req.params;
    
    // Test the connection to the gateway
    let isConnected = false;
    let message = '';
    
    switch (gateway) {
      case 'razorpay':
        isConnected = !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
        message = isConnected ? 'Razorpay configuration is valid' : 'Razorpay keys not configured';
        break;
      case 'stripe':
        isConnected = !!process.env.STRIPE_SECRET_KEY;
        message = isConnected ? 'Stripe configuration is valid' : 'Stripe secret key not configured';
        break;
      case 'paypal':
        isConnected = !!(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET);
        message = isConnected ? 'PayPal configuration is valid' : 'PayPal credentials not configured';
        break;
      default:
        return res.status(400).json({
          success: false,
          error: 'Unsupported gateway'
        });
    }
    
    res.json({
      success: true,
      gateway,
      isConnected,
      message
    });
  } catch (error) {
    console.error('Gateway test error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to test gateway connection'
    });
  }
});

module.exports = router;

const mongoose = require('mongoose');
const { Schema } = mongoose;

const orderSchema = new Schema({
  orderNumber: {
    type: String,
    required: true,
    unique: true,
    default: function() {
      return 'ORD' + Date.now() + Math.floor(Math.random() * 1000);
    }
  },
  customer: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  customerInfo: {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String
    }
  },
  items: [{
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
    image: String,
    sku: String,
    variant: {
      size: String,
      color: String,
      style: String
    },
    subtotal: { type: Number, required: true }
  }],
  pricing: {
    subtotal: { type: Number, required: true },
    tax: { type: Number, default: 0 },
    shipping: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    total: { type: Number, required: true }
  },
  status: {
    type: String,
    enum: [
      'pending',
      'confirmed', 
      'accepted',
      'processing',
      'shipped',
      'out_for_delivery',
      'delivered',
      'cancelled',
      'refunded',
      'returned'
    ],
    default: 'pending'
  },
  statusHistory: [{
    status: {
      type: String,
      enum: [
        'pending',
        'confirmed',
        'accepted', 
        'processing',
        'shipped',
        'out_for_delivery',
        'delivered',
        'cancelled',
        'refunded',
        'returned'
      ]
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    updatedAt: {
      type: Date,
      default: Date.now
    },
    notes: String,
    reason: String
  }],
  payment: {
    gateway: {
      type: String,
      enum: ['razorpay', 'stripe', 'paypal', 'cod'],
      required: true
    },
    gatewayOrderId: String, // Payment gateway's order ID
    paymentId: String, // Payment gateway's payment/transaction ID
    receipt: String, // Our internal receipt number
    amount: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      default: 'INR'
    },
    status: {
      type: String,
      enum: [
        'pending',
        'processing',
        'paid',
        'failed',
        'cancelled',
        'refunded',
        'partially_refunded'
      ],
      default: 'pending'
    },
    paidAt: Date,
    failedAt: Date,
    failureReason: String,
    clientSecret: String, // For Stripe
    approvalUrl: String, // For PayPal
    refunds: [{
      refundId: String,
      amount: Number,
      reason: String,
      status: {
        type: String,
        enum: ['pending', 'completed', 'failed'],
        default: 'pending'
      },
      processedAt: Date,
      gatewayRefundId: String
    }],
    refundedAmount: {
      type: Number,
      default: 0
    },
    verifiedAt: Date,
    updatedAt: {
      type: Date,
      default: Date.now
    }
  },
  shipping: {
    method: {
      type: String,
      enum: ['standard', 'express', 'overnight', 'pickup'],
      default: 'standard'
    },
    cost: {
      type: Number,
      default: 0
    },
    address: {
      name: String,
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String,
      phone: String
    },
    estimatedDelivery: Date,
    actualDelivery: Date,
    trackingNumber: String,
    carrier: String, // UPS, FedEx, DHL, etc.
    trackingUrl: String,
    notes: String
  },
  notes: {
    customer: String, // Customer notes
    admin: String, // Admin internal notes
    delivery: String // Delivery instructions
  },
  discounts: [{
    code: String,
    type: {
      type: String,
      enum: ['percentage', 'fixed', 'shipping']
    },
    value: Number,
    amount: Number // Calculated discount amount
  }],
  adminActions: [{
    action: {
      type: String,
      enum: [
        'created',
        'accepted',
        'declined',
        'cancelled',
        'shipped',
        'delivered',
        'refunded',
        'notes_updated'
      ]
    },
    performedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    notes: String,
    metadata: Schema.Types.Mixed // For storing additional action-specific data
  }],
  metadata: {
    source: {
      type: String,
      enum: ['web', 'mobile', 'api', 'admin'],
      default: 'web'
    },
    userAgent: String,
    ipAddress: String,
    sessionId: String
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
orderSchema.index({ customer: 1, createdAt: -1 });
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ 'payment.status': 1 });
orderSchema.index({ 'payment.gateway': 1 });
orderSchema.index({ createdAt: -1 });

// Virtual for order age
orderSchema.virtual('orderAge').get(function() {
  return Math.floor((new Date() - this.createdAt) / (1000 * 60 * 60 * 24)); // Days
});

// Virtual for total items count
orderSchema.virtual('totalItems').get(function() {
  return this.items.reduce((total, item) => total + item.quantity, 0);
});

// Virtual for payment method display name
orderSchema.virtual('paymentMethodName').get(function() {
  const methods = {
    razorpay: 'Razorpay',
    stripe: 'Stripe',
    paypal: 'PayPal',
    cod: 'Cash on Delivery'
  };
  return methods[this.payment.gateway] || this.payment.gateway;
});

// Pre-save middleware
orderSchema.pre('save', function(next) {
  // Update payment.updatedAt when payment fields change
  if (this.isModified('payment')) {
    this.payment.updatedAt = new Date();
  }
  
  // Auto-calculate total if items or pricing changes
  if (this.isModified('items') || this.isModified('pricing')) {
    this.pricing.subtotal = this.items.reduce((total, item) => total + item.subtotal, 0);
    this.pricing.total = this.pricing.subtotal + this.pricing.tax + this.pricing.shipping - this.pricing.discount;
  }
  
  next();
});

// Instance methods
orderSchema.methods.addStatusUpdate = function(status, updatedBy, notes = '', reason = '') {
  this.statusHistory.push({
    status,
    updatedBy,
    updatedAt: new Date(),
    notes,
    reason
  });
  this.status = status;
  return this.save();
};

orderSchema.methods.updatePaymentStatus = function(status, additionalData = {}) {
  this.payment.status = status;
  this.payment.updatedAt = new Date();
  
  if (status === 'paid') {
    this.payment.paidAt = new Date();
  } else if (status === 'failed') {
    this.payment.failedAt = new Date();
    if (additionalData.reason) {
      this.payment.failureReason = additionalData.reason;
    }
  }
  
  Object.assign(this.payment, additionalData);
  return this.save();
};

orderSchema.methods.canBeCancelled = function() {
  const cancellableStatuses = ['pending', 'confirmed', 'accepted'];
  return cancellableStatuses.includes(this.status) && 
         this.payment.status !== 'paid';
};

orderSchema.methods.canBeRefunded = function() {
  return this.payment.status === 'paid' && 
         this.status !== 'refunded' &&
         this.payment.refundedAmount < this.payment.amount;
};

// Static methods
orderSchema.statics.getOrderStats = function(dateRange = {}) {
  const matchCondition = {};
  
  if (dateRange.startDate && dateRange.endDate) {
    matchCondition.createdAt = {
      $gte: new Date(dateRange.startDate),
      $lte: new Date(dateRange.endDate)
    };
  }
  
  return this.aggregate([
    { $match: matchCondition },
    {
      $group: {
        _id: {
          status: '$status',
          paymentStatus: '$payment.status'
        },
        count: { $sum: 1 },
        totalAmount: { $sum: '$pricing.total' },
        avgAmount: { $avg: '$pricing.total' }
      }
    },
    { $sort: { '_id.status': 1 } }
  ]);
};

orderSchema.statics.getRecentOrders = function(limit = 10) {
  return this.find()
    .populate('customer', 'name email')
    .populate('items.product', 'name image')
    .sort({ createdAt: -1 })
    .limit(limit);
};

orderSchema.statics.getPendingOrders = function() {
  return this.find({ status: 'pending' })
    .populate('customer', 'name email phone')
    .populate('items.product', 'name image sku')
    .sort({ createdAt: -1 });
};

// Create and export the model
const Order = mongoose.model('Order', orderSchema);
module.exports = Order;

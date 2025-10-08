const mongoose = require('mongoose');

// Order Schema
const orderSchema = new mongoose.Schema({
    // Order Identification
    orderNumber: {
        type: String,
        required: true,
        unique: true,
        uppercase: true
    },
    
    // Customer Information
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Customer is required']
    },
    
    // Order Items
    items: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        productSnapshot: {
            name: String,
            description: String,
            price: Number,
            image: String,
            sku: String
        },
        quantity: {
            type: Number,
            required: true,
            min: 1
        },
        price: {
            type: Number,
            required: true,
            min: 0
        },
        totalPrice: {
            type: Number,
            required: true,
            min: 0
        },
        selectedVariants: {
            color: String,
            size: String,
            material: String
        },
        seller: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    }],
    
    // Pricing
    subtotal: {
        type: Number,
        required: true,
        min: 0
    },
    tax: {
        type: Number,
        default: 0,
        min: 0
    },
    taxRate: {
        type: Number,
        default: 0,
        min: 0,
        max: 1
    },
    shipping: {
        cost: {
            type: Number,
            default: 0,
            min: 0
        },
        method: {
            type: String,
            enum: ['standard', 'express', 'overnight', 'pickup'],
            default: 'standard'
        },
        estimatedDays: {
            min: Number,
            max: Number
        }
    },
    discount: {
        amount: {
            type: Number,
            default: 0,
            min: 0
        },
        code: String,
        type: {
            type: String,
            enum: ['percentage', 'fixed', 'shipping'],
            default: 'percentage'
        }
    },
    total: {
        type: Number,
        required: true,
        min: 0
    },
    currency: {
        type: String,
        default: 'USD',
        enum: ['USD', 'EUR', 'GBP', 'INR', 'CAD', 'AUD']
    },
    
    // Address Information
    shippingAddress: {
        firstName: {
            type: String,
            required: true
        },
        lastName: {
            type: String,
            required: true
        },
        company: String,
        addressLine1: {
            type: String,
            required: true
        },
        addressLine2: String,
        city: {
            type: String,
            required: true
        },
        state: {
            type: String,
            required: true
        },
        postalCode: {
            type: String,
            required: true
        },
        country: {
            type: String,
            required: true
        },
        phone: String
    },
    billingAddress: {
        firstName: String,
        lastName: String,
        company: String,
        addressLine1: String,
        addressLine2: String,
        city: String,
        state: String,
        postalCode: String,
        country: String,
        phone: String,
        sameAsShipping: {
            type: Boolean,
            default: true
        }
    },
    
    // Order Status
    status: {
        type: String,
        enum: [
            'pending',
            'confirmed',
            'processing',
            'shipped',
            'delivered',
            'cancelled',
            'refunded',
            'returned'
        ],
        default: 'pending'
    },
    
    // Payment Information
    payment: {
        status: {
            type: String,
            enum: ['pending', 'completed', 'failed', 'refunded', 'partially_refunded'],
            default: 'pending'
        },
        method: {
            type: String,
            enum: ['razorpay', 'stripe', 'paypal', 'bank_transfer', 'cash_on_delivery'],
            required: true
        },
        transactionId: String,
        paymentId: String,
        razorpayOrderId: String,
        razorpayPaymentId: String,
        razorpaySignature: String,
        stripePaymentIntentId: String,
        paypalPaymentId: String,
        paidAt: Date,
        refundedAt: Date,
        refundAmount: {
            type: Number,
            default: 0
        }
    },
    
    // Tracking Information
    tracking: {
        carrier: String,
        trackingNumber: String,
        trackingUrl: String,
        shippedAt: Date,
        estimatedDelivery: Date,
        actualDelivery: Date,
        updates: [{
            status: String,
            description: String,
            location: String,
            timestamp: {
                type: Date,
                default: Date.now
            }
        }]
    },
    
    // Customer Communication
    notes: {
        customer: String,
        internal: String
    },
    
    // Timestamps
    orderDate: {
        type: Date,
        default: Date.now
    },
    confirmedAt: Date,
    shippedAt: Date,
    deliveredAt: Date,
    cancelledAt: Date,
    
    // Return and Refund
    returnRequest: {
        requested: {
            type: Boolean,
            default: false
        },
        requestedAt: Date,
        reason: String,
        status: {
            type: String,
            enum: ['pending', 'approved', 'rejected', 'completed']
        },
        approvedAt: Date,
        completedAt: Date
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes
orderSchema.index({ customer: 1, orderDate: -1 });
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ 'payment.status': 1 });
orderSchema.index({ orderDate: -1 });
orderSchema.index({ 'items.seller': 1 });

// Virtual for full customer name
orderSchema.virtual('customerName').get(function() {
    return `${this.shippingAddress.firstName} ${this.shippingAddress.lastName}`;
});

// Virtual for order age
orderSchema.virtual('orderAge').get(function() {
    const diffTime = Math.abs(new Date() - this.orderDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
});

// Virtual for items count
orderSchema.virtual('itemsCount').get(function() {
    return this.items.reduce((total, item) => total + item.quantity, 0);
});

// Virtual for can be cancelled
orderSchema.virtual('canBeCancelled').get(function() {
    return ['pending', 'confirmed'].includes(this.status);
});

// Virtual for can be returned
orderSchema.virtual('canBeReturned').get(function() {
    const deliveredDate = this.deliveredAt;
    if (!deliveredDate || this.status !== 'delivered') return false;
    
    const daysSinceDelivery = Math.ceil((new Date() - deliveredDate) / (1000 * 60 * 60 * 24));
    return daysSinceDelivery <= 30; // 30 days return policy
});

// Pre-save middleware to generate order number
orderSchema.pre('save', async function(next) {
    if (this.isNew && !this.orderNumber) {
        const prefix = 'PLG';
        const timestamp = Date.now().toString().slice(-8);
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        this.orderNumber = `${prefix}${timestamp}${random}`;
    }
    next();
});

// Pre-save middleware to calculate totals
orderSchema.pre('save', function(next) {
    // Calculate subtotal
    this.subtotal = this.items.reduce((total, item) => total + item.totalPrice, 0);
    
    // Calculate tax
    this.tax = this.subtotal * this.taxRate;
    
    // Calculate total
    this.total = this.subtotal + this.tax + this.shipping.cost - this.discount.amount;
    
    // Ensure total is not negative
    if (this.total < 0) this.total = 0;
    
    next();
});

// Pre-save middleware to sync billing address
orderSchema.pre('save', function(next) {
    if (this.billingAddress.sameAsShipping) {
        this.billingAddress = {
            ...this.shippingAddress,
            sameAsShipping: true
        };
    }
    next();
});

// Instance method to update status
orderSchema.methods.updateStatus = function(newStatus, notes = '') {
    const oldStatus = this.status;
    this.status = newStatus;
    
    // Set appropriate timestamps
    const now = new Date();
    switch (newStatus) {
        case 'confirmed':
            this.confirmedAt = now;
            break;
        case 'shipped':
            this.shippedAt = now;
            break;
        case 'delivered':
            this.deliveredAt = now;
            break;
        case 'cancelled':
            this.cancelledAt = now;
            break;
    }
    
    if (notes) {
        this.notes.internal = notes;
    }
    
    return this.save();
};

// Instance method to add tracking update
orderSchema.methods.addTrackingUpdate = function(status, description, location = '') {
    this.tracking.updates.push({
        status,
        description,
        location,
        timestamp: new Date()
    });
    
    return this.save();
};

// Instance method to process refund
orderSchema.methods.processRefund = function(amount, reason = '') {
    this.payment.status = amount >= this.total ? 'refunded' : 'partially_refunded';
    this.payment.refundAmount += amount;
    this.payment.refundedAt = new Date();
    
    if (reason) {
        this.notes.internal = `Refund: ${reason}`;
    }
    
    return this.save();
};

// Static method to get orders by customer
orderSchema.statics.findByCustomer = function(customerId, options = {}) {
    return this.find({ customer: customerId })
        .populate('items.product', 'name images price')
        .sort(options.sort || { orderDate: -1 })
        .limit(options.limit || 0);
};

// Static method to get orders by status
orderSchema.statics.findByStatus = function(status, options = {}) {
    return this.find({ status })
        .populate('customer', 'firstName lastName email')
        .populate('items.product', 'name images')
        .sort(options.sort || { orderDate: -1 })
        .limit(options.limit || 0);
};

// Static method to get sales statistics
orderSchema.statics.getSalesStats = function(startDate, endDate) {
    return this.aggregate([
        {
            $match: {
                orderDate: {
                    $gte: startDate,
                    $lte: endDate
                },
                'payment.status': 'completed'
            }
        },
        {
            $group: {
                _id: null,
                totalOrders: { $sum: 1 },
                totalRevenue: { $sum: '$total' },
                avgOrderValue: { $avg: '$total' },
                totalItems: { $sum: { $sum: '$items.quantity' } }
            }
        }
    ]);
};

module.exports = mongoose.model('Order', orderSchema);

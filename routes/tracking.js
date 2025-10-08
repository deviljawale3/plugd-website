const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const { auth } = require('../middleware/auth');
const { query, validationResult } = require('express-validator');
const EmailService = require('../services/EmailService');

class OrderTrackingService {
    // Order status flow
    static statusFlow = {
        'pending': ['processing', 'cancelled'],
        'processing': ['shipped', 'cancelled'],
        'shipped': ['delivered'],
        'delivered': [],
        'cancelled': []
    };
    
    // Generate tracking number
    static generateTrackingNumber() {
        const prefix = 'PLUGD';
        const timestamp = Date.now().toString();
        const random = Math.random().toString(36).substr(2, 6).toUpperCase();
        return `${prefix}${timestamp.slice(-6)}${random}`;
    }
    
    // Calculate estimated delivery date
    static calculateEstimatedDelivery(shippingMethod = 'standard') {
        const now = new Date();
        const deliveryDays = {
            'express': 1,
            'standard': 3,
            'economy': 7
        };
        
        const days = deliveryDays[shippingMethod] || 3;
        const deliveryDate = new Date(now.getTime() + (days * 24 * 60 * 60 * 1000));
        
        return deliveryDate;
    }
    
    // Create tracking timeline
    static createTrackingTimeline(order) {
        const timeline = [];
        
        // Order placed
        timeline.push({
            status: 'Order Placed',
            description: 'Your order has been placed successfully',
            timestamp: order.createdAt,
            completed: true,
            icon: 'fas fa-shopping-cart'
        });
        
        // Payment confirmed
        if (order.paymentStatus === 'completed') {
            timeline.push({
                status: 'Payment Confirmed',
                description: 'Payment has been received and confirmed',
                timestamp: order.paymentConfirmedAt || order.createdAt,
                completed: true,
                icon: 'fas fa-credit-card'
            });
        }
        
        // Order processing
        if (['processing', 'shipped', 'delivered'].includes(order.status)) {
            timeline.push({
                status: 'Processing',
                description: 'Your order is being prepared for shipment',
                timestamp: order.processingStartedAt,
                completed: true,
                icon: 'fas fa-cogs'
            });
        }
        
        // Order shipped
        if (['shipped', 'delivered'].includes(order.status)) {
            timeline.push({
                status: 'Shipped',
                description: `Order shipped via ${order.shippingCarrier || 'courier'}`,
                timestamp: order.shippedAt,
                completed: true,
                icon: 'fas fa-truck',
                trackingNumber: order.trackingNumber
            });
        }
        
        // Out for delivery
        if (order.status === 'delivered') {
            timeline.push({
                status: 'Out for Delivery',
                description: 'Your order is out for delivery',
                timestamp: order.outForDeliveryAt,
                completed: true,
                icon: 'fas fa-shipping-fast'
            });
        }
        
        // Delivered
        if (order.status === 'delivered') {
            timeline.push({
                status: 'Delivered',
                description: 'Order delivered successfully',
                timestamp: order.deliveredAt,
                completed: true,
                icon: 'fas fa-check-circle'
            });
        } else if (!['cancelled'].includes(order.status)) {
            // Expected delivery
            timeline.push({
                status: 'Expected Delivery',
                description: `Estimated delivery: ${order.estimatedDelivery ? new Date(order.estimatedDelivery).toLocaleDateString() : 'TBD'}`,
                timestamp: order.estimatedDelivery,
                completed: false,
                icon: 'fas fa-home',
                estimated: true
            });
        }
        
        // Cancelled
        if (order.status === 'cancelled') {
            timeline.push({
                status: 'Cancelled',
                description: order.cancellationReason || 'Order has been cancelled',
                timestamp: order.cancelledAt,
                completed: true,
                icon: 'fas fa-times-circle',
                error: true
            });
        }
        
        return timeline;
    }
}

// Get order tracking information
router.get('/track/:orderNumber', [
    query('email').optional().isEmail().withMessage('Valid email required for guest tracking')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: errors.array()
            });
        }
        
        const { orderNumber } = req.params;
        const { email } = req.query;
        
        let query = { orderNumber };
        
        // If not authenticated, require email for guest tracking
        if (!req.user) {
            if (!email) {
                return res.status(400).json({
                    success: false,
                    message: 'Email required for guest order tracking'
                });
            }
            query['customer.email'] = email;
        } else {
            // If authenticated, ensure order belongs to user
            query.customer = req.user.id;
        }
        
        const order = await Order.findOne(query)
            .populate('items.product', 'name images price')
            .populate('customer', 'firstName lastName email');
        
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }
        
        // Create tracking timeline
        const timeline = OrderTrackingService.createTrackingTimeline(order);
        
        // Calculate progress percentage
        const completedSteps = timeline.filter(step => step.completed && !step.error).length;
        const totalSteps = timeline.filter(step => !step.estimated && !step.error).length;
        const progressPercentage = Math.round((completedSteps / totalSteps) * 100);
        
        res.json({
            success: true,
            data: {
                order: {
                    orderNumber: order.orderNumber,
                    status: order.status,
                    createdAt: order.createdAt,
                    totalAmount: order.totalAmount,
                    paymentMethod: order.paymentMethod,
                    paymentStatus: order.paymentStatus,
                    shippingAddress: order.shippingAddress,
                    trackingNumber: order.trackingNumber,
                    shippingCarrier: order.shippingCarrier,
                    estimatedDelivery: order.estimatedDelivery,
                    items: order.items
                },
                tracking: {
                    timeline,
                    progressPercentage,
                    currentStatus: order.status,
                    estimatedDelivery: order.estimatedDelivery,
                    trackingNumber: order.trackingNumber,
                    shippingCarrier: order.shippingCarrier,
                    trackingUrl: order.trackingUrl
                }
            }
        });
    } catch (error) {
        console.error('Order tracking error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get order tracking information',
            error: error.message
        });
    }
});

// Update order status (Admin only)
router.patch('/update-status/:orderId', auth, async (req, res) => {
    try {
        // Check admin permission
        if (!['admin', 'superadmin'].includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Admin access required'
            });
        }
        
        const { orderId } = req.params;
        const { status, trackingNumber, shippingCarrier, notes, estimatedDelivery } = req.body;
        
        const order = await Order.findById(orderId).populate('customer');
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }
        
        // Validate status transition
        const allowedNextStatuses = OrderTrackingService.statusFlow[order.status] || [];
        if (!allowedNextStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Cannot change status from ${order.status} to ${status}`
            });
        }
        
        // Update order status
        order.status = status;
        
        // Set timestamp based on status
        const now = new Date();
        switch (status) {
            case 'processing':
                order.processingStartedAt = now;
                break;
            case 'shipped':
                order.shippedAt = now;
                if (trackingNumber) order.trackingNumber = trackingNumber;
                if (shippingCarrier) order.shippingCarrier = shippingCarrier;
                if (!order.trackingNumber) {
                    order.trackingNumber = OrderTrackingService.generateTrackingNumber();
                }
                if (estimatedDelivery) {
                    order.estimatedDelivery = new Date(estimatedDelivery);
                } else {
                    order.estimatedDelivery = OrderTrackingService.calculateEstimatedDelivery();
                }
                break;
            case 'delivered':
                order.deliveredAt = now;
                break;
            case 'cancelled':
                order.cancelledAt = now;
                if (notes) order.cancellationReason = notes;
                break;
        }
        
        // Add status history
        if (!order.statusHistory) order.statusHistory = [];
        order.statusHistory.push({
            status,
            timestamp: now,
            updatedBy: req.user.id,
            notes
        });
        
        await order.save();
        
        // Send notification emails
        try {
            if (status === 'shipped' && order.customer) {
                await EmailService.sendOrderShipped(order, order.customer, {
                    trackingNumber: order.trackingNumber,
                    carrier: order.shippingCarrier,
                    expectedDelivery: order.estimatedDelivery ? order.estimatedDelivery.toLocaleDateString() : 'TBD',
                    trackingUrl: order.trackingUrl || `${process.env.FRONTEND_URL}/track/${order.orderNumber}`
                });
            }
        } catch (emailError) {
            console.error('Email notification failed:', emailError);
            // Don't fail the status update if email fails
        }
        
        console.log(`✅ Order ${order.orderNumber} status updated to ${status}`);
        
        res.json({
            success: true,
            message: `Order status updated to ${status}`,
            data: {
                order: {
                    id: order._id,
                    orderNumber: order.orderNumber,
                    status: order.status,
                    trackingNumber: order.trackingNumber,
                    estimatedDelivery: order.estimatedDelivery
                }
            }
        });
    } catch (error) {
        console.error('Update order status error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update order status',
            error: error.message
        });
    }
});

// Get tracking by tracking number
router.get('/tracking/:trackingNumber', async (req, res) => {
    try {
        const { trackingNumber } = req.params;
        
        const order = await Order.findOne({ trackingNumber })
            .populate('items.product', 'name images')
            .populate('customer', 'firstName lastName');
        
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Tracking number not found'
            });
        }
        
        const timeline = OrderTrackingService.createTrackingTimeline(order);
        
        res.json({
            success: true,
            data: {
                orderNumber: order.orderNumber,
                status: order.status,
                timeline,
                estimatedDelivery: order.estimatedDelivery,
                shippingCarrier: order.shippingCarrier,
                trackingUrl: order.trackingUrl
            }
        });
    } catch (error) {
        console.error('Tracking lookup error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get tracking information',
            error: error.message
        });
    }
});

// Bulk update order statuses (Admin only)
router.patch('/bulk-update', auth, async (req, res) => {
    try {
        // Check admin permission
        if (!['admin', 'superadmin'].includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Admin access required'
            });
        }
        
        const { orderIds, status, notes } = req.body;
        
        if (!Array.isArray(orderIds) || orderIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Order IDs array is required'
            });
        }
        
        const results = {
            updated: [],
            failed: []
        };
        
        for (const orderId of orderIds) {
            try {
                const order = await Order.findById(orderId);
                if (!order) {
                    results.failed.push({ orderId, reason: 'Order not found' });
                    continue;
                }
                
                // Validate status transition
                const allowedNextStatuses = OrderTrackingService.statusFlow[order.status] || [];
                if (!allowedNextStatuses.includes(status)) {
                    results.failed.push({ 
                        orderId, 
                        reason: `Cannot change status from ${order.status} to ${status}` 
                    });
                    continue;
                }
                
                order.status = status;
                
                // Set timestamp based on status
                const now = new Date();
                switch (status) {
                    case 'processing':
                        order.processingStartedAt = now;
                        break;
                    case 'shipped':
                        order.shippedAt = now;
                        if (!order.trackingNumber) {
                            order.trackingNumber = OrderTrackingService.generateTrackingNumber();
                        }
                        if (!order.estimatedDelivery) {
                            order.estimatedDelivery = OrderTrackingService.calculateEstimatedDelivery();
                        }
                        break;
                    case 'delivered':
                        order.deliveredAt = now;
                        break;
                    case 'cancelled':
                        order.cancelledAt = now;
                        if (notes) order.cancellationReason = notes;
                        break;
                }
                
                // Add status history
                if (!order.statusHistory) order.statusHistory = [];
                order.statusHistory.push({
                    status,
                    timestamp: now,
                    updatedBy: req.user.id,
                    notes
                });
                
                await order.save();
                results.updated.push({
                    orderId,
                    orderNumber: order.orderNumber,
                    newStatus: status
                });
                
            } catch (error) {
                results.failed.push({ orderId, reason: error.message });
            }
        }
        
        console.log(`✅ Bulk update completed: ${results.updated.length} updated, ${results.failed.length} failed`);
        
        res.json({
            success: true,
            message: `Bulk update completed: ${results.updated.length} orders updated`,
            data: results
        });
    } catch (error) {
        console.error('Bulk update error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to bulk update orders',
            error: error.message
        });
    }
});

// Get order statistics for admin dashboard
router.get('/stats', auth, async (req, res) => {
    try {
        // Check admin permission
        if (!['admin', 'superadmin'].includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Admin access required'
            });
        }
        
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        
        // Get order statistics
        const stats = await Order.aggregate([
            {
                $facet: {
                    totalOrders: [
                        { $count: 'count' }
                    ],
                    todayOrders: [
                        { $match: { createdAt: { $gte: startOfToday } } },
                        { $count: 'count' }
                    ],
                    weeklyOrders: [
                        { $match: { createdAt: { $gte: startOfWeek } } },
                        { $count: 'count' }
                    ],
                    monthlyOrders: [
                        { $match: { createdAt: { $gte: startOfMonth } } },
                        { $count: 'count' }
                    ],
                    statusBreakdown: [
                        {
                            $group: {
                                _id: '$status',
                                count: { $sum: 1 },
                                totalValue: { $sum: '$totalAmount' }
                            }
                        }
                    ],
                    revenueStats: [
                        {
                            $match: { status: { $ne: 'cancelled' } }
                        },
                        {
                            $group: {
                                _id: null,
                                totalRevenue: { $sum: '$totalAmount' },
                                averageOrderValue: { $avg: '$totalAmount' }
                            }
                        }
                    ]
                }
            }
        ]);
        
        const result = stats[0];
        
        res.json({
            success: true,
            data: {
                totalOrders: result.totalOrders[0]?.count || 0,
                todayOrders: result.todayOrders[0]?.count || 0,
                weeklyOrders: result.weeklyOrders[0]?.count || 0,
                monthlyOrders: result.monthlyOrders[0]?.count || 0,
                statusBreakdown: result.statusBreakdown,
                totalRevenue: result.revenueStats[0]?.totalRevenue || 0,
                averageOrderValue: result.revenueStats[0]?.averageOrderValue || 0
            }
        });
    } catch (error) {
        console.error('Order stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get order statistics',
            error: error.message
        });
    }
});

module.exports = router;

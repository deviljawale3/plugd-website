const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Order = require('../models/Order');
const Review = require('../models/Review');
const { auth, adminAuth } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');

// Validation middleware
const validateUser = [
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('firstName').notEmpty().withMessage('First name is required'),
    body('lastName').notEmpty().withMessage('Last name is required'),
    body('password').optional().isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
];

const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array()
        });
    }
    next();
};

// USERS MANAGEMENT ROUTES

// Get all users with pagination and filtering
router.get('/users', adminAuth, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        
        // Build filter object
        const filter = {};
        if (req.query.role) filter.role = req.query.role;
        if (req.query.status) filter.isActive = req.query.status === 'active';
        if (req.query.search) {
            filter.$or = [
                { firstName: { $regex: req.query.search, $options: 'i' } },
                { lastName: { $regex: req.query.search, $options: 'i' } },
                { email: { $regex: req.query.search, $options: 'i' } }
            ];
        }
        
        // Get users without password field
        const users = await User.find(filter)
            .select('-password')
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 });
        
        // Get total count for pagination
        const total = await User.countDocuments(filter);
        
        // Get additional user stats
        const usersWithStats = await Promise.all(
            users.map(async (user) => {
                const orderCount = await Order.countDocuments({ user: user._id });
                const totalSpent = await Order.aggregate([
                    { $match: { user: user._id, status: 'completed' } },
                    { $group: { _id: null, total: { $sum: '$totalAmount' } } }
                ]);
                
                return {
                    ...user.toObject(),
                    stats: {
                        orderCount,
                        totalSpent: totalSpent.length > 0 ? totalSpent[0].total : 0
                    }
                };
            })
        );
        
        res.json({
            success: true,
            data: {
                users: usersWithStats,
                pagination: {
                    current: page,
                    total: Math.ceil(total / limit),
                    count: users.length,
                    totalItems: total
                }
            }
        });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch users',
            error: error.message
        });
    }
});

// Get single user by ID
router.get('/users/:id', adminAuth, async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        // Get user's orders and reviews
        const orders = await Order.find({ user: user._id })
            .populate('items.product', 'name price images')
            .sort({ createdAt: -1 })
            .limit(10);
        
        const reviews = await Review.find({ user: user._id })
            .populate('product', 'name images')
            .sort({ createdAt: -1 })
            .limit(10);
        
        // Calculate user stats
        const totalOrders = await Order.countDocuments({ user: user._id });
        const totalSpent = await Order.aggregate([
            { $match: { user: user._id, status: 'completed' } },
            { $group: { _id: null, total: { $sum: '$totalAmount' } } }
        ]);
        
        const avgOrderValue = totalOrders > 0 ? (totalSpent.length > 0 ? totalSpent[0].total : 0) / totalOrders : 0;
        
        res.json({
            success: true,
            data: {
                user,
                recentOrders: orders,
                recentReviews: reviews,
                stats: {
                    totalOrders,
                    totalSpent: totalSpent.length > 0 ? totalSpent[0].total : 0,
                    averageOrderValue: avgOrderValue
                }
            }
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch user',
            error: error.message
        });
    }
});

// Create new user
router.post('/users', adminAuth, validateUser, handleValidationErrors, async (req, res) => {
    try {
        const { email, firstName, lastName, password, role, phone, address } = req.body;
        
        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User with this email already exists'
            });
        }
        
        const userData = {
            email,
            firstName,
            lastName,
            role: role || 'customer',
            phone: phone || '',
            address: address || {},
            isActive: true
        };
        
        // Hash password if provided
        if (password) {
            const salt = await bcrypt.genSalt(10);
            userData.password = await bcrypt.hash(password, salt);
        }
        
        const user = new User(userData);
        await user.save();
        
        // Remove password from response
        const userResponse = user.toObject();
        delete userResponse.password;
        
        res.status(201).json({
            success: true,
            message: 'User created successfully',
            data: userResponse
        });
    } catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create user',
            error: error.message
        });
    }
});

// Update user
router.put('/users/:id', adminAuth, validateUser, handleValidationErrors, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        const { email, firstName, lastName, password, role, phone, address, isActive } = req.body;
        
        // Check if email is being changed and if it's already taken
        if (email && email !== user.email) {
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: 'Email already taken by another user'
                });
            }
        }
        
        const updateData = {
            email: email || user.email,
            firstName: firstName || user.firstName,
            lastName: lastName || user.lastName,
            role: role || user.role,
            phone: phone || user.phone,
            address: address || user.address,
            isActive: isActive !== undefined ? isActive : user.isActive,
            updatedAt: new Date()
        };
        
        // Hash new password if provided
        if (password) {
            const salt = await bcrypt.genSalt(10);
            updateData.password = await bcrypt.hash(password, salt);
        }
        
        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        ).select('-password');
        
        res.json({
            success: true,
            message: 'User updated successfully',
            data: updatedUser
        });
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update user',
            error: error.message
        });
    }
});

// Delete user
router.delete('/users/:id', adminAuth, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        // Check if user has orders
        const orderCount = await Order.countDocuments({ user: user._id });
        if (orderCount > 0) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete user with ${orderCount} associated orders. Consider deactivating instead.`
            });
        }
        
        // Delete associated reviews
        await Review.deleteMany({ user: user._id });
        
        await User.findByIdAndDelete(req.params.id);
        
        res.json({
            success: true,
            message: 'User deleted successfully'
        });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete user',
            error: error.message
        });
    }
});

// ORDER MANAGEMENT ROUTES

// Get all orders with pagination and filtering
router.get('/orders', adminAuth, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        
        // Build filter object
        const filter = {};
        if (req.query.status) filter.status = req.query.status;
        if (req.query.paymentStatus) filter.paymentStatus = req.query.paymentStatus;
        if (req.query.dateFrom || req.query.dateTo) {
            filter.createdAt = {};
            if (req.query.dateFrom) filter.createdAt.$gte = new Date(req.query.dateFrom);
            if (req.query.dateTo) filter.createdAt.$lte = new Date(req.query.dateTo + 'T23:59:59.999Z');
        }
        if (req.query.search) {
            filter.$or = [
                { orderNumber: { $regex: req.query.search, $options: 'i' } },
                { 'shippingAddress.firstName': { $regex: req.query.search, $options: 'i' } },
                { 'shippingAddress.lastName': { $regex: req.query.search, $options: 'i' } },
                { 'shippingAddress.email': { $regex: req.query.search, $options: 'i' } }
            ];
        }
        
        // Get orders with populated data
        const orders = await Order.find(filter)
            .populate('user', 'firstName lastName email')
            .populate('items.product', 'name price images')
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 });
        
        // Get total count for pagination
        const total = await Order.countDocuments(filter);
        
        res.json({
            success: true,
            data: {
                orders,
                pagination: {
                    current: page,
                    total: Math.ceil(total / limit),
                    count: orders.length,
                    totalItems: total
                }
            }
        });
    } catch (error) {
        console.error('Get orders error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch orders',
            error: error.message
        });
    }
});

// Get single order by ID
router.get('/orders/:id', adminAuth, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('user', 'firstName lastName email phone')
            .populate('items.product', 'name price images sku');
        
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }
        
        res.json({
            success: true,
            data: order
        });
    } catch (error) {
        console.error('Get order error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch order',
            error: error.message
        });
    }
});

// Update order status
router.put('/orders/:id/status', adminAuth, async (req, res) => {
    try {
        const { status, paymentStatus, trackingNumber, notes } = req.body;
        
        const order = await Order.findById(req.params.id);
        
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }
        
        const updateData = {
            updatedAt: new Date()
        };
        
        if (status) {
            updateData.status = status;
            updateData.statusHistory = [
                ...order.statusHistory,
                {
                    status,
                    timestamp: new Date(),
                    notes: notes || ''
                }
            ];
        }
        
        if (paymentStatus) updateData.paymentStatus = paymentStatus;
        if (trackingNumber) updateData.trackingNumber = trackingNumber;
        
        const updatedOrder = await Order.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        ).populate('user', 'firstName lastName email')
         .populate('items.product', 'name price images');
        
        res.json({
            success: true,
            message: 'Order updated successfully',
            data: updatedOrder
        });
    } catch (error) {
        console.error('Update order error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update order',
            error: error.message
        });
    }
});

// Get order analytics/statistics
router.get('/orders/analytics/stats', adminAuth, async (req, res) => {
    try {
        const { dateFrom, dateTo } = req.query;
        const filter = {};
        
        if (dateFrom || dateTo) {
            filter.createdAt = {};
            if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
            if (dateTo) filter.createdAt.$lte = new Date(dateTo + 'T23:59:59.999Z');
        }
        
        // Get basic statistics
        const totalOrders = await Order.countDocuments(filter);
        const completedOrders = await Order.countDocuments({ ...filter, status: 'completed' });
        const pendingOrders = await Order.countDocuments({ ...filter, status: 'pending' });
        const processingOrders = await Order.countDocuments({ ...filter, status: 'processing' });
        
        // Get revenue statistics
        const revenueStats = await Order.aggregate([
            { $match: { ...filter, status: 'completed' } },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: '$totalAmount' },
                    averageOrderValue: { $avg: '$totalAmount' },
                    count: { $sum: 1 }
                }
            }
        ]);
        
        // Get daily sales for the period
        const dailySales = await Order.aggregate([
            { $match: { ...filter, status: 'completed' } },
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' },
                        day: { $dayOfMonth: '$createdAt' }
                    },
                    revenue: { $sum: '$totalAmount' },
                    orders: { $sum: 1 }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
        ]);
        
        res.json({
            success: true,
            data: {
                overview: {
                    totalOrders,
                    completedOrders,
                    pendingOrders,
                    processingOrders,
                    completionRate: totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0
                },
                revenue: {
                    total: revenueStats.length > 0 ? revenueStats[0].totalRevenue : 0,
                    average: revenueStats.length > 0 ? revenueStats[0].averageOrderValue : 0
                },
                dailySales
            }
        });
    } catch (error) {
        console.error('Get order analytics error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch order analytics',
            error: error.message
        });
    }
});

// REVIEW MANAGEMENT ROUTES

// Get all reviews with pagination and filtering
router.get('/reviews', adminAuth, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        
        // Build filter object
        const filter = {};
        if (req.query.rating) filter.rating = parseInt(req.query.rating);
        if (req.query.status) filter.status = req.query.status;
        if (req.query.product) filter.product = req.query.product;
        if (req.query.search) {
            filter.$or = [
                { comment: { $regex: req.query.search, $options: 'i' } }
            ];
        }
        
        // Get reviews with populated data
        const reviews = await Review.find(filter)
            .populate('user', 'firstName lastName email')
            .populate('product', 'name images')
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 });
        
        // Get total count for pagination
        const total = await Review.countDocuments(filter);
        
        res.json({
            success: true,
            data: {
                reviews,
                pagination: {
                    current: page,
                    total: Math.ceil(total / limit),
                    count: reviews.length,
                    totalItems: total
                }
            }
        });
    } catch (error) {
        console.error('Get reviews error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch reviews',
            error: error.message
        });
    }
});

// Update review status (approve/reject)
router.put('/reviews/:id/status', adminAuth, async (req, res) => {
    try {
        const { status, adminNotes } = req.body;
        
        if (!['approved', 'rejected', 'pending'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status. Must be approved, rejected, or pending'
            });
        }
        
        const review = await Review.findById(req.params.id);
        
        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'Review not found'
            });
        }
        
        const updatedReview = await Review.findByIdAndUpdate(
            req.params.id,
            {
                status,
                adminNotes: adminNotes || review.adminNotes,
                updatedAt: new Date()
            },
            { new: true, runValidators: true }
        ).populate('user', 'firstName lastName email')
         .populate('product', 'name images');
        
        res.json({
            success: true,
            message: 'Review status updated successfully',
            data: updatedReview
        });
    } catch (error) {
        console.error('Update review status error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update review status',
            error: error.message
        });
    }
});

// Delete review
router.delete('/reviews/:id', adminAuth, async (req, res) => {
    try {
        const review = await Review.findById(req.params.id);
        
        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'Review not found'
            });
        }
        
        await Review.findByIdAndDelete(req.params.id);
        
        res.json({
            success: true,
            message: 'Review deleted successfully'
        });
    } catch (error) {
        console.error('Delete review error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete review',
            error: error.message
        });
    }
});

// Get review analytics
router.get('/reviews/analytics/stats', adminAuth, async (req, res) => {
    try {
        const totalReviews = await Review.countDocuments();
        const approvedReviews = await Review.countDocuments({ status: 'approved' });
        const pendingReviews = await Review.countDocuments({ status: 'pending' });
        const rejectedReviews = await Review.countDocuments({ status: 'rejected' });
        
        // Get average rating
        const ratingStats = await Review.aggregate([
            { $match: { status: 'approved' } },
            {
                $group: {
                    _id: null,
                    averageRating: { $avg: '$rating' },
                    count: { $sum: 1 }
                }
            }
        ]);
        
        // Get rating distribution
        const ratingDistribution = await Review.aggregate([
            { $match: { status: 'approved' } },
            {
                $group: {
                    _id: '$rating',
                    count: { $sum: 1 }
                }
            },
            { $sort: { '_id': -1 } }
        ]);
        
        res.json({
            success: true,
            data: {
                overview: {
                    totalReviews,
                    approvedReviews,
                    pendingReviews,
                    rejectedReviews,
                    approvalRate: totalReviews > 0 ? (approvedReviews / totalReviews) * 100 : 0
                },
                rating: {
                    average: ratingStats.length > 0 ? ratingStats[0].averageRating : 0,
                    distribution: ratingDistribution
                }
            }
        });
    } catch (error) {
        console.error('Get review analytics error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch review analytics',
            error: error.message
        });
    }
});

module.exports = router;

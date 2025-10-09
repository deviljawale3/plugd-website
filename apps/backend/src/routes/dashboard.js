const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Order = require('../models/Order');
const Review = require('../models/Review');
const { adminAuth } = require('../middleware/auth');

// Get dashboard overview statistics
router.get('/stats/overview', adminAuth, async (req, res) => {
    try {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
        
        // Current month stats
        const currentStats = await Promise.all([
            Product.countDocuments({ createdAt: { $gte: startOfMonth } }),
            Order.countDocuments({ createdAt: { $gte: startOfMonth } }),
            User.countDocuments({ createdAt: { $gte: startOfMonth } }),
            Order.aggregate([
                { $match: { createdAt: { $gte: startOfMonth }, status: 'completed' } },
                { $group: { _id: null, total: { $sum: '$totalAmount' } } }
            ])
        ]);
        
        // Last month stats for comparison
        const lastMonthStats = await Promise.all([
            Product.countDocuments({ 
                createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } 
            }),
            Order.countDocuments({ 
                createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } 
            }),
            User.countDocuments({ 
                createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } 
            }),
            Order.aggregate([
                { 
                    $match: { 
                        createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth },
                        status: 'completed'
                    }
                },
                { $group: { _id: null, total: { $sum: '$totalAmount' } } }
            ])
        ]);
        
        // Total counts
        const totalStats = await Promise.all([
            Product.countDocuments(),
            Order.countDocuments(),
            User.countDocuments(),
            Order.aggregate([
                { $match: { status: 'completed' } },
                { $group: { _id: null, total: { $sum: '$totalAmount' } } }
            ])
        ]);
        
        // Calculate percentage changes
        const calculateChange = (current, previous) => {
            if (previous === 0) return current > 0 ? 100 : 0;
            return ((current - previous) / previous) * 100;
        };
        
        const currentRevenue = currentStats[3].length > 0 ? currentStats[3][0].total : 0;
        const lastMonthRevenue = lastMonthStats[3].length > 0 ? lastMonthStats[3][0].total : 0;
        const totalRevenue = totalStats[3].length > 0 ? totalStats[3][0].total : 0;
        
        res.json({
            success: true,
            data: {
                products: {
                    total: totalStats[0],
                    thisMonth: currentStats[0],
                    change: calculateChange(currentStats[0], lastMonthStats[0])
                },
                orders: {
                    total: totalStats[1],
                    thisMonth: currentStats[1],
                    change: calculateChange(currentStats[1], lastMonthStats[1])
                },
                users: {
                    total: totalStats[2],
                    thisMonth: currentStats[2],
                    change: calculateChange(currentStats[2], lastMonthStats[2])
                },
                revenue: {
                    total: totalRevenue,
                    thisMonth: currentRevenue,
                    change: calculateChange(currentRevenue, lastMonthRevenue)
                }
            }
        });
    } catch (error) {
        console.error('Get dashboard stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch dashboard statistics',
            error: error.message
        });
    }
});

// Get recent activities
router.get('/activities/recent', adminAuth, async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 20;
        
        // Get recent orders
        const recentOrders = await Order.find()
            .populate('user', 'firstName lastName email')
            .populate('items.product', 'name price')
            .sort({ createdAt: -1 })
            .limit(limit);
        
        // Get recent user registrations
        const recentUsers = await User.find()
            .select('firstName lastName email createdAt role')
            .sort({ createdAt: -1 })
            .limit(limit);
        
        // Get recent product additions
        const recentProducts = await Product.find()
            .populate('category', 'name')
            .sort({ createdAt: -1 })
            .limit(limit);
        
        // Get recent reviews
        const recentReviews = await Review.find()
            .populate('user', 'firstName lastName')
            .populate('product', 'name')
            .sort({ createdAt: -1 })
            .limit(limit);
        
        res.json({
            success: true,
            data: {
                orders: recentOrders,
                users: recentUsers,
                products: recentProducts,
                reviews: recentReviews
            }
        });
    } catch (error) {
        console.error('Get recent activities error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch recent activities',
            error: error.message
        });
    }
});

// Get sales analytics
router.get('/analytics/sales', adminAuth, async (req, res) => {
    try {
        const { period = '30d', startDate, endDate } = req.query;
        
        let dateFilter = {};
        const now = new Date();
        
        if (startDate && endDate) {
            dateFilter = {
                createdAt: {
                    $gte: new Date(startDate),
                    $lte: new Date(endDate + 'T23:59:59.999Z')
                }
            };
        } else {
            switch (period) {
                case '7d':
                    dateFilter.createdAt = { $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) };
                    break;
                case '30d':
                    dateFilter.createdAt = { $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) };
                    break;
                case '90d':
                    dateFilter.createdAt = { $gte: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000) };
                    break;
                case '1y':
                    dateFilter.createdAt = { $gte: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000) };
                    break;
            }
        }
        
        // Daily sales data
        const dailySales = await Order.aggregate([
            { $match: { ...dateFilter, status: 'completed' } },
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' },
                        day: { $dayOfMonth: '$createdAt' }
                    },
                    revenue: { $sum: '$totalAmount' },
                    orders: { $sum: 1 },
                    date: { $first: '$createdAt' }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
        ]);
        
        // Sales by category
        const salesByCategory = await Order.aggregate([
            { $match: { ...dateFilter, status: 'completed' } },
            { $unwind: '$items' },
            {
                $lookup: {
                    from: 'products',
                    localField: 'items.product',
                    foreignField: '_id',
                    as: 'productInfo'
                }
            },
            { $unwind: '$productInfo' },
            {
                $lookup: {
                    from: 'categories',
                    localField: 'productInfo.category',
                    foreignField: '_id',
                    as: 'categoryInfo'
                }
            },
            { $unwind: '$categoryInfo' },
            {
                $group: {
                    _id: '$categoryInfo.name',
                    revenue: { $sum: { $multiply: ['$items.quantity', '$items.price'] } },
                    quantity: { $sum: '$items.quantity' }
                }
            },
            { $sort: { revenue: -1 } }
        ]);
        
        // Top selling products
        const topProducts = await Order.aggregate([
            { $match: { ...dateFilter, status: 'completed' } },
            { $unwind: '$items' },
            {
                $group: {
                    _id: '$items.product',
                    revenue: { $sum: { $multiply: ['$items.quantity', '$items.price'] } },
                    quantity: { $sum: '$items.quantity' }
                }
            },
            {
                $lookup: {
                    from: 'products',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'product'
                }
            },
            { $unwind: '$product' },
            {
                $project: {
                    name: '$product.name',
                    revenue: 1,
                    quantity: 1,
                    image: { $arrayElemAt: ['$product.images.url', 0] }
                }
            },
            { $sort: { revenue: -1 } },
            { $limit: 10 }
        ]);
        
        res.json({
            success: true,
            data: {
                dailySales,
                salesByCategory,
                topProducts
            }
        });
    } catch (error) {
        console.error('Get sales analytics error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch sales analytics',
            error: error.message
        });
    }
});

// Get user analytics
router.get('/analytics/users', adminAuth, async (req, res) => {
    try {
        const { period = '30d' } = req.query;
        
        let dateFilter = {};
        const now = new Date();
        
        switch (period) {
            case '7d':
                dateFilter.createdAt = { $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) };
                break;
            case '30d':
                dateFilter.createdAt = { $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) };
                break;
            case '90d':
                dateFilter.createdAt = { $gte: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000) };
                break;
            case '1y':
                dateFilter.createdAt = { $gte: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000) };
                break;
        }
        
        // User registrations over time
        const userRegistrations = await User.aggregate([
            { $match: dateFilter },
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' },
                        day: { $dayOfMonth: '$createdAt' }
                    },
                    count: { $sum: 1 },
                    date: { $first: '$createdAt' }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
        ]);
        
        // User activity stats
        const activeUsers = await User.countDocuments({
            lastActivity: { $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) }
        });
        
        // User demographics
        const usersByRole = await User.aggregate([
            {
                $group: {
                    _id: '$role',
                    count: { $sum: 1 }
                }
            }
        ]);
        
        // Customer lifetime value
        const customerLTV = await Order.aggregate([
            { $match: { status: 'completed' } },
            {
                $group: {
                    _id: '$user',
                    totalSpent: { $sum: '$totalAmount' },
                    orderCount: { $sum: 1 }
                }
            },
            {
                $group: {
                    _id: null,
                    averageLTV: { $avg: '$totalSpent' },
                    averageOrders: { $avg: '$orderCount' }
                }
            }
        ]);
        
        res.json({
            success: true,
            data: {
                registrations: userRegistrations,
                activeUsers,
                usersByRole,
                customerLTV: customerLTV.length > 0 ? customerLTV[0] : {
                    averageLTV: 0,
                    averageOrders: 0
                }
            }
        });
    } catch (error) {
        console.error('Get user analytics error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch user analytics',
            error: error.message
        });
    }
});

// Get product analytics
router.get('/analytics/products', adminAuth, async (req, res) => {
    try {
        // Product performance
        const productPerformance = await Order.aggregate([
            { $match: { status: 'completed' } },
            { $unwind: '$items' },
            {
                $group: {
                    _id: '$items.product',
                    totalSold: { $sum: '$items.quantity' },
                    revenue: { $sum: { $multiply: ['$items.quantity', '$items.price'] } }
                }
            },
            {
                $lookup: {
                    from: 'products',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'product'
                }
            },
            { $unwind: '$product' },
            {
                $project: {
                    name: '$product.name',
                    totalSold: 1,
                    revenue: 1,
                    inventory: '$product.inventory',
                    price: '$product.price'
                }
            },
            { $sort: { totalSold: -1 } },
            { $limit: 20 }
        ]);
        
        // Low stock products
        const lowStockProducts = await Product.find({
            inventory: { $lt: 10 },
            status: 'active'
        })
        .populate('category', 'name')
        .sort({ inventory: 1 })
        .limit(10);
        
        // Category distribution
        const categoryDistribution = await Product.aggregate([
            {
                $lookup: {
                    from: 'categories',
                    localField: 'category',
                    foreignField: '_id',
                    as: 'categoryInfo'
                }
            },
            { $unwind: '$categoryInfo' },
            {
                $group: {
                    _id: '$categoryInfo.name',
                    count: { $sum: 1 },
                    averagePrice: { $avg: '$price' }
                }
            },
            { $sort: { count: -1 } }
        ]);
        
        // Product status overview
        const statusOverview = await Product.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);
        
        res.json({
            success: true,
            data: {
                productPerformance,
                lowStockProducts,
                categoryDistribution,
                statusOverview
            }
        });
    } catch (error) {
        console.error('Get product analytics error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch product analytics',
            error: error.message
        });
    }
});

// Get system health and performance metrics
router.get('/system/health', adminAuth, async (req, res) => {
    try {
        const dbStats = await Promise.all([
            User.estimatedDocumentCount(),
            Product.estimatedDocumentCount(),
            Order.estimatedDocumentCount(),
            Review.estimatedDocumentCount(),
            Category.estimatedDocumentCount()
        ]);
        
        // Get recent error logs (you might want to implement proper logging)
        const systemStatus = {
            database: {
                status: 'healthy',
                collections: {
                    users: dbStats[0],
                    products: dbStats[1],
                    orders: dbStats[2],
                    reviews: dbStats[3],
                    categories: dbStats[4]
                }
            },
            server: {
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                nodeVersion: process.version
            },
            lastUpdated: new Date()
        };
        
        res.json({
            success: true,
            data: systemStatus
        });
    } catch (error) {
        console.error('Get system health error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch system health',
            error: error.message
        });
    }
});

// Get revenue trends
router.get('/analytics/revenue', adminAuth, async (req, res) => {
    try {
        const { period = 'monthly', year } = req.query;
        const currentYear = year ? parseInt(year) : new Date().getFullYear();
        
        let groupBy, sortBy;
        
        if (period === 'daily') {
            groupBy = {
                year: { $year: '$createdAt' },
                month: { $month: '$createdAt' },
                day: { $dayOfMonth: '$createdAt' }
            };
            sortBy = { '_id.year': 1, '_id.month': 1, '_id.day': 1 };
        } else if (period === 'weekly') {
            groupBy = {
                year: { $year: '$createdAt' },
                week: { $week: '$createdAt' }
            };
            sortBy = { '_id.year': 1, '_id.week': 1 };
        } else {
            groupBy = {
                year: { $year: '$createdAt' },
                month: { $month: '$createdAt' }
            };
            sortBy = { '_id.year': 1, '_id.month': 1 };
        }
        
        const revenueTrends = await Order.aggregate([
            {
                $match: {
                    status: 'completed',
                    createdAt: {
                        $gte: new Date(currentYear, 0, 1),
                        $lt: new Date(currentYear + 1, 0, 1)
                    }
                }
            },
            {
                $group: {
                    _id: groupBy,
                    revenue: { $sum: '$totalAmount' },
                    orders: { $sum: 1 },
                    averageOrderValue: { $avg: '$totalAmount' }
                }
            },
            { $sort: sortBy }
        ]);
        
        res.json({
            success: true,
            data: {
                trends: revenueTrends,
                period,
                year: currentYear
            }
        });
    } catch (error) {
        console.error('Get revenue trends error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch revenue trends',
            error: error.message
        });
    }
});

module.exports = router;

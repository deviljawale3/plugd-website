const User = require('../models/User');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Order = require('../models/Order');
const Review = require('../models/Review');

// Database utility functions
class DatabaseUtils {
    // User utilities
    static async createUser(userData) {
        try {
            const user = new User(userData);
            return await user.save();
        } catch (error) {
            throw new Error(`Failed to create user: ${error.message}`);
        }
    }

    static async findUserByEmail(email) {
        return await User.findByEmail(email);
    }

    static async updateUserProfile(userId, updateData) {
        return await User.findByIdAndUpdate(
            userId,
            { $set: updateData },
            { new: true, runValidators: true }
        ).select('-password');
    }

    // Product utilities
    static async createProduct(productData) {
        try {
            const product = new Product(productData);
            return await product.save();
        } catch (error) {
            throw new Error(`Failed to create product: ${error.message}`);
        }
    }

    static async findProductsByCategory(categoryId, options = {}) {
        const {
            page = 1,
            limit = 12,
            sort = { createdAt: -1 },
            status = 'active'
        } = options;

        const skip = (page - 1) * limit;

        const [products, total] = await Promise.all([
            Product.find({ category: categoryId, status })
                .populate('category', 'name slug')
                .populate('seller', 'firstName lastName')
                .sort(sort)
                .skip(skip)
                .limit(limit),
            Product.countDocuments({ category: categoryId, status })
        ]);

        return {
            products,
            pagination: {
                current: page,
                pages: Math.ceil(total / limit),
                total,
                limit
            }
        };
    }

    static async searchProducts(query, options = {}) {
        const {
            page = 1,
            limit = 12,
            sort = { relevance: -1 },
            filters = {}
        } = options;

        const skip = (page - 1) * limit;
        const searchQuery = {
            $and: [
                { status: 'active' },
                {
                    $or: [
                        { name: { $regex: query, $options: 'i' } },
                        { description: { $regex: query, $options: 'i' } },
                        { tags: { $in: [new RegExp(query, 'i')] } },
                        { brand: { $regex: query, $options: 'i' } }
                    ]
                }
            ]
        };

        // Apply filters
        if (filters.category) {
            searchQuery.$and.push({ category: filters.category });
        }

        if (filters.priceRange) {
            searchQuery.$and.push({
                price: {
                    $gte: filters.priceRange.min || 0,
                    $lte: filters.priceRange.max || Number.MAX_SAFE_INTEGER
                }
            });
        }

        if (filters.brand) {
            searchQuery.$and.push({ brand: { $in: filters.brand } });
        }

        if (filters.rating) {
            searchQuery.$and.push({ 'ratings.average': { $gte: filters.rating } });
        }

        const [products, total] = await Promise.all([
            Product.find(searchQuery)
                .populate('category', 'name slug')
                .populate('seller', 'firstName lastName')
                .sort(sort)
                .skip(skip)
                .limit(limit),
            Product.countDocuments(searchQuery)
        ]);

        return {
            products,
            query,
            pagination: {
                current: page,
                pages: Math.ceil(total / limit),
                total,
                limit
            }
        };
    }

    // Category utilities
    static async createCategory(categoryData) {
        try {
            const category = new Category(categoryData);
            return await category.save();
        } catch (error) {
            throw new Error(`Failed to create category: ${error.message}`);
        }
    }

    static async getCategoryTree() {
        return await Category.find({ isActive: true })
            .populate('children')
            .sort({ level: 1, sortOrder: 1 });
    }

    static async updateCategoryProductCount(categoryId) {
        const count = await Product.countDocuments({ 
            category: categoryId, 
            status: 'active' 
        });
        
        return await Category.findByIdAndUpdate(
            categoryId,
            { productCount: count },
            { new: true }
        );
    }

    // Order utilities
    static async createOrder(orderData) {
        try {
            const order = new Order(orderData);
            return await order.save();
        } catch (error) {
            throw new Error(`Failed to create order: ${error.message}`);
        }
    }

    static async getUserOrders(userId, options = {}) {
        const {
            page = 1,
            limit = 10,
            status,
            sort = { orderDate: -1 }
        } = options;

        const skip = (page - 1) * limit;
        const query = { customer: userId };

        if (status) {
            query.status = status;
        }

        const [orders, total] = await Promise.all([
            Order.find(query)
                .populate('items.product', 'name images price')
                .sort(sort)
                .skip(skip)
                .limit(limit),
            Order.countDocuments(query)
        ]);

        return {
            orders,
            pagination: {
                current: page,
                pages: Math.ceil(total / limit),
                total,
                limit
            }
        };
    }

    static async updateOrderStatus(orderId, status, notes = '') {
        const order = await Order.findById(orderId);
        if (!order) {
            throw new Error('Order not found');
        }

        return await order.updateStatus(status, notes);
    }

    // Review utilities
    static async createReview(reviewData) {
        try {
            // Check if user has already reviewed this product
            const existingReview = await Review.findOne({
                product: reviewData.product,
                customer: reviewData.customer
            });

            if (existingReview) {
                throw new Error('You have already reviewed this product');
            }

            const review = new Review(reviewData);
            return await review.save();
        } catch (error) {
            throw new Error(`Failed to create review: ${error.message}`);
        }
    }

    static async getProductReviews(productId, options = {}) {
        const {
            page = 1,
            limit = 10,
            sort = { createdAt: -1 },
            status = 'approved'
        } = options;

        const skip = (page - 1) * limit;
        const query = { product: productId, status };

        const [reviews, total] = await Promise.all([
            Review.find(query)
                .populate('customer', 'firstName lastName avatar')
                .sort(sort)
                .skip(skip)
                .limit(limit),
            Review.countDocuments(query)
        ]);

        return {
            reviews,
            pagination: {
                current: page,
                pages: Math.ceil(total / limit),
                total,
                limit
            }
        };
    }

    // Analytics utilities
    static async getDashboardStats(userId = null, role = 'admin') {
        try {
            const stats = {};

            if (role === 'admin') {
                // Admin dashboard stats
                const [userCount, productCount, orderCount, reviewCount] = await Promise.all([
                    User.countDocuments({ isActive: true }),
                    Product.countDocuments({ status: 'active' }),
                    Order.countDocuments(),
                    Review.countDocuments({ status: 'approved' })
                ]);

                // Revenue stats
                const revenueStats = await Order.aggregate([
                    { $match: { 'payment.status': 'completed' } },
                    {
                        $group: {
                            _id: null,
                            totalRevenue: { $sum: '$total' },
                            avgOrderValue: { $avg: '$total' },
                            totalOrders: { $sum: 1 }
                        }
                    }
                ]);

                stats.users = userCount;
                stats.products = productCount;
                stats.orders = orderCount;
                stats.reviews = reviewCount;
                stats.revenue = revenueStats[0] || { totalRevenue: 0, avgOrderValue: 0, totalOrders: 0 };

            } else if (role === 'seller' && userId) {
                // Seller dashboard stats
                const [productCount, orderCount] = await Promise.all([
                    Product.countDocuments({ seller: userId, status: 'active' }),
                    Order.countDocuments({ 'items.seller': userId })
                ]);

                // Seller revenue
                const revenueStats = await Order.aggregate([
                    { $match: { 'items.seller': userId, 'payment.status': 'completed' } },
                    { $unwind: '$items' },
                    { $match: { 'items.seller': userId } },
                    {
                        $group: {
                            _id: null,
                            totalRevenue: { $sum: '$items.totalPrice' },
                            totalItems: { $sum: '$items.quantity' }
                        }
                    }
                ]);

                stats.products = productCount;
                stats.orders = orderCount;
                stats.revenue = revenueStats[0] || { totalRevenue: 0, totalItems: 0 };

            } else if (role === 'user' && userId) {
                // User dashboard stats
                const [orderCount, reviewCount, wishlistCount] = await Promise.all([
                    Order.countDocuments({ customer: userId }),
                    Review.countDocuments({ customer: userId }),
                    User.findById(userId).then(user => user?.wishlist?.length || 0)
                ]);

                // User spending
                const spendingStats = await Order.aggregate([
                    { $match: { customer: userId, 'payment.status': 'completed' } },
                    {
                        $group: {
                            _id: null,
                            totalSpent: { $sum: '$total' },
                            avgOrderValue: { $avg: '$total' }
                        }
                    }
                ]);

                stats.orders = orderCount;
                stats.reviews = reviewCount;
                stats.wishlist = wishlistCount;
                stats.spending = spendingStats[0] || { totalSpent: 0, avgOrderValue: 0 };
            }

            return stats;
        } catch (error) {
            throw new Error(`Failed to get dashboard stats: ${error.message}`);
        }
    }

    // Health check utilities
    static async performHealthCheck() {
        try {
            const checks = {
                database: false,
                collections: {},
                indexes: {}
            };

            // Test database connection
            await User.findOne().limit(1);
            checks.database = true;

            // Check collections
            const collections = ['users', 'products', 'categories', 'orders', 'reviews'];
            for (const collection of collections) {
                try {
                    const model = {
                        users: User,
                        products: Product,
                        categories: Category,
                        orders: Order,
                        reviews: Review
                    }[collection];

                    const count = await model.countDocuments();
                    checks.collections[collection] = { status: 'ok', count };
                } catch (error) {
                    checks.collections[collection] = { status: 'error', error: error.message };
                }
            }

            return checks;
        } catch (error) {
            return {
                database: false,
                error: error.message
            };
        }
    }

    // Data cleanup utilities
    static async cleanupOldData(days = 30) {
        const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
        
        try {
            // Remove old pending orders
            const oldOrders = await Order.deleteMany({
                status: 'pending',
                createdAt: { $lt: cutoffDate }
            });

            // Remove draft products older than cutoff
            const oldDrafts = await Product.deleteMany({
                status: 'draft',
                createdAt: { $lt: cutoffDate }
            });

            return {
                deletedOrders: oldOrders.deletedCount,
                deletedDrafts: oldDrafts.deletedCount
            };
        } catch (error) {
            throw new Error(`Failed to cleanup old data: ${error.message}`);
        }
    }
}

module.exports = DatabaseUtils;

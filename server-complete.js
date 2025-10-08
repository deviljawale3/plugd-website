// Complete Server Integration - All Development Phases
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const compression = require('compression');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Import security middleware
const SecurityMiddleware = require('./middleware/security');
const { performanceOptimizer, PerformanceOptimizer } = require('./utils/performance');
const mediaManager = require('./utils/media-manager');
const EmailService = require('./services/EmailService');

// Apply security middleware
SecurityMiddleware.applySecurityMiddleware(app);

// Performance optimizations
app.use(PerformanceOptimizer.compressionMiddleware());
app.use(PerformanceOptimizer.imageOptimization());

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Raw body parsing for webhooks
app.use('/api/payments/webhook/stripe', express.raw({ type: 'application/json' }));
app.use('/api/payments/webhook/razorpay', express.raw({ type: 'application/json' }));

// Static files with optimization
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
    maxAge: '1y',
    etag: true,
    lastModified: true
}));
app.use('/images', express.static(path.join(__dirname, 'public/images'), {
    maxAge: '1y',
    etag: true
}));
app.use('/admin', express.static(path.join(__dirname, 'admin'), {
    maxAge: '1d'
}));

// MongoDB connection with optimization
PerformanceOptimizer.optimizeMongoose(mongoose);
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/plugd_marketplace', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => {
    console.log('✅ Connected to MongoDB');
    // Preload cache after DB connection
    performanceOptimizer.preloadCache();
})
.catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
});

// Import routes
const authRoutes = require('./routes/auth-enhanced');
const userRoutes = require('./routes/users');
const productRoutes = require('./routes/products');
const categoryRoutes = require('./routes/categories');
const orderRoutes = require('./routes/orders');
const paymentRoutes = require('./routes/payments');
const adminRoutes = require('./routes/admin');
const uploadRoutes = require('./routes/upload');
const cartRoutes = require('./routes/cart');
const searchRoutes = require('./routes/search');
const trackingRoutes = require('./routes/tracking');

// Import CMS routes and middleware
const contentRoutes = require('./routes/content');
const managementRoutes = require('./routes/management');
const dashboardRoutes = require('./routes/dashboard');
const { auth, adminAuth } = require('./middleware/auth');

// Import User model for admin authentication
const User = require('./models/User');

// Apply rate limiting to specific route groups
app.use('/api/auth/', SecurityMiddleware.rateLimiters.auth);
app.use('/api/payments/', SecurityMiddleware.rateLimiters.payment);
app.use('/api/admin/', SecurityMiddleware.rateLimiters.admin);
app.use('/api/upload/', SecurityMiddleware.rateLimiters.upload);

// API Routes with caching
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', performanceOptimizer.createCacheMiddleware(300), productRoutes);
app.use('/api/categories', performanceOptimizer.createCacheMiddleware(600), categoryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/search', performanceOptimizer.createCacheMiddleware(180), searchRoutes);
app.use('/api/tracking', trackingRoutes);

// CMS API Routes
app.use('/api/content', contentRoutes);
app.use('/api/management', managementRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Admin authentication routes
app.post('/api/auth/admin-login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        const user = await User.findOne({ email }).select('+password');
        
        if (!user || !user.isActive) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }
        
        if (user.role !== 'admin' && user.role !== 'superadmin') {
            return res.status(403).json({
                success: false,
                message: 'Admin access required'
            });
        }
        
        const isPasswordValid = await bcrypt.compare(password, user.password);
        
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }
        
        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET || 'plugd_marketplace_secret_key_2024',
            { expiresIn: '24h' }
        );
        
        user.lastLogin = new Date();
        await user.save();
        
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 24 * 60 * 60 * 1000
        });
        
        res.json({
            success: true,
            message: 'Login successful',
            data: {
                user: {
                    id: user._id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    role: user.role
                },
                token
            }
        });
    } catch (error) {
        console.error('Admin login error:', error);
        res.status(500).json({
            success: false,
            message: 'Login failed',
            error: error.message
        });
    }
});

// Admin logout route
app.post('/api/auth/admin-logout', auth, (req, res) => {
    res.clearCookie('token');
    res.json({
        success: true,
        message: 'Logout successful'
    });
});

// Get current admin user
app.get('/api/auth/admin-profile', auth, (req, res) => {
    res.json({
        success: true,
        data: {
            user: {
                id: req.user._id,
                email: req.user.email,
                firstName: req.user.firstName,
                lastName: req.user.lastName,
                role: req.user.role,
                lastLogin: req.user.lastLogin
            }
        }
    });
});

// Admin dashboard route
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin', 'index.html'));
});

// Admin sub-routes
app.get('/admin/*', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin', 'index.html'));
});

// User dashboard
app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages', 'user-dashboard.html'));
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        version: process.env.npm_package_version || '2.0.0',
        features: {
            authentication: true,
            payments: true,
            cms: true,
            caching: !!process.env.REDIS_URL,
            emailService: !!process.env.EMAIL_USER,
            fileStorage: !!process.env.CLOUDINARY_CLOUD_NAME || 'local'
        }
    });
});

// Database status endpoint
app.get('/api/db-status', (req, res) => {
    const state = mongoose.connection.readyState;
    const states = {
        0: 'disconnected',
        1: 'connected',
        2: 'connecting',
        3: 'disconnecting'
    };
    
    res.json({
        database: states[state] || 'unknown',
        readyState: state,
        host: mongoose.connection.host,
        name: mongoose.connection.name
    });
});

// Payment system status endpoint
app.get('/api/payment-status', (req, res) => {
    const paymentGateways = {
        razorpay: !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET),
        stripe: !!process.env.STRIPE_SECRET_KEY,
        paypal: !!(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET),
        cod: true
    };
    
    const activeGateways = Object.entries(paymentGateways)
        .filter(([_, isActive]) => isActive)
        .map(([gateway, _]) => gateway);
    
    res.json({
        availableGateways: activeGateways,
        gatewayStatus: paymentGateways,
        totalGateways: activeGateways.length,
        primaryGateway: paymentGateways.razorpay ? 'razorpay' : activeGateways[0] || 'none'
    });
});

// Performance monitoring endpoint
PerformanceOptimizer.createPerformanceEndpoint(app, performanceOptimizer);

// Cache management endpoints
app.get('/api/cache/stats', auth, (req, res) => {
    if (!['admin', 'superadmin'].includes(req.user.role)) {
        return res.status(403).json({ success: false, message: 'Admin access required' });
    }
    
    res.json({
        success: true,
        data: performanceOptimizer.getStats()
    });
});

app.post('/api/cache/clear', auth, async (req, res) => {
    if (!['admin', 'superadmin'].includes(req.user.role)) {
        return res.status(403).json({ success: false, message: 'Admin access required' });
    }
    
    try {
        const { pattern = '*' } = req.body;
        await performanceOptimizer.clearPattern(pattern);
        
        res.json({
            success: true,
            message: 'Cache cleared successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to clear cache',
            error: error.message
        });
    }
});

// Media management endpoints
app.get('/api/media/stats', auth, async (req, res) => {
    if (!['admin', 'superadmin'].includes(req.user.role)) {
        return res.status(403).json({ success: false, message: 'Admin access required' });
    }
    
    try {
        const stats = await mediaManager.getStorageStats();
        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to get media stats',
            error: error.message
        });
    }
});

// Error handling middleware
app.use((error, req, res, next) => {
    // File upload errors
    if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
            success: false,
            message: 'File too large'
        });
    }
    
    if (error.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({
            success: false,
            message: 'Too many files'
        });
    }
    
    next(error);
});

app.use((err, req, res, next) => {
    console.error('Error stack:', err.stack);
    
    // MongoDB validation errors
    if (err.name === 'ValidationError') {
        const errors = Object.values(err.errors).map(e => e.message);
        return res.status(400).json({
            success: false,
            error: 'Validation Error',
            details: errors
        });
    }
    
    // MongoDB duplicate key errors
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        return res.status(400).json({
            success: false,
            error: `${field} already exists`
        });
    }
    
    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            success: false,
            error: 'Invalid token'
        });
    }
    
    // Payment-specific errors
    if (err.type === 'payment_error') {
        return res.status(400).json({
            success: false,
            error: err.message,
            code: err.code
        });
    }
    
    // Default error response
    res.status(err.status || 500).json({
        success: false,
        error: process.env.NODE_ENV === 'production' 
            ? 'Something went wrong' 
            : err.message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// Handle 404 for API routes
app.use('/api/*', (req, res) => {
    res.status(404).json({
        success: false,
        error: 'API endpoint not found',
        requestedPath: req.originalUrl
    });
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        message: 'PLUGD E-commerce Marketplace API - Complete Stack',
        version: '2.0.0',
        environment: process.env.NODE_ENV || 'development',
        features: [
            'User Authentication & Authorization',
            'Product & Category Management',
            'Shopping Cart & Checkout',
            'Multi-Gateway Payment System',
            'Order Management & Tracking',
            'Admin CMS Dashboard',
            'File Upload & Media Management',
            'Email Notification System',
            'Advanced Search & Filtering',
            'Performance Optimization',
            'Security & Rate Limiting',
            'Real-time Order Tracking',
            'Redis Caching',
            'Image Processing'
        ],
        endpoints: {
            health: '/api/health',
            database: '/api/db-status',
            payments: '/api/payment-status',
            performance: '/api/performance',
            auth: '/api/auth',
            users: '/api/users',
            products: '/api/products',
            orders: '/api/orders',
            cart: '/api/cart',
            search: '/api/search',
            tracking: '/api/tracking',
            payments_api: '/api/payments',
            admin: '/api/admin',
            content: '/api/content',
            management: '/api/management',
            dashboard: '/api/dashboard',
            admin_panel: '/admin',
            user_dashboard: '/dashboard'
        },
        documentation: {
            api: '/api/docs',
            admin: '/admin/help',
            deployment: 'See DEPLOYMENT.md',
            setup: 'See .env.production'
        }
    });
});

// Graceful shutdown
const gracefulShutdown = async (signal) => {
    console.log(`${signal} received, shutting down gracefully`);
    
    try {
        // Close server
        server.close(() => {
            console.log('✅ HTTP server closed');
        });
        
        // Close database connection
        await mongoose.connection.close();
        console.log('✅ MongoDB connection closed');
        
        // Close cache connections
        await performanceOptimizer.gracefulShutdown();
        
        // Cleanup temp files
        await mediaManager.cleanupTempFiles();
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error during shutdown:', error);
        process.exit(1);
    }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Cluster setup for production
if (PerformanceOptimizer.setupCluster()) {
    // Start server
    const server = app.listen(PORT, () => {
        console.log(`🚀 PLUGD Marketplace Server running on port ${PORT}`);
        console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`📊 API Documentation: http://localhost:${PORT}`);
        console.log(`❤️  Health Check: http://localhost:${PORT}/api/health`);
        console.log(`💳 Payment Status: http://localhost:${PORT}/api/payment-status`);
        console.log(`⚡ Performance Monitor: http://localhost:${PORT}/api/performance`);
        console.log(`📊 Admin Dashboard: http://localhost:${PORT}/admin`);
        console.log(`👤 User Dashboard: http://localhost:${PORT}/dashboard`);
        console.log(`🔐 Default Admin: admin@plugd.com / admin123`);
        console.log(`✅ All Development Phases Complete - Production Ready!`);
        
        // Test email service connection
        EmailService.testConnection();
        
        // Cleanup temp files on startup
        mediaManager.cleanupTempFiles();
    });
    
    // Set server timeout
    server.timeout = 30000; // 30 seconds
}

module.exports = app;

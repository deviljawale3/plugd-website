// Add these integrations to your existing server.js file

// Import new content management routes and middleware
const contentRoutes = require('./routes/content');
const managementRoutes = require('./routes/management');
const dashboardRoutes = require('./routes/dashboard');
const { auth, adminAuth } = require('./middleware/auth');
const path = require('path');

// Serve static admin files
app.use('/admin', express.static(path.join(__dirname, 'admin')));

// API Routes for Content Management
app.use('/api/content', contentRoutes);
app.use('/api/management', managementRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Admin authentication route
app.post('/api/auth/admin-login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Find user
        const user = await User.findOne({ email }).select('+password');
        
        if (!user || !user.isActive) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }
        
        // Check if user has admin privileges
        if (user.role !== 'admin' && user.role !== 'superadmin') {
            return res.status(403).json({
                success: false,
                message: 'Admin access required'
            });
        }
        
        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }
        
        // Generate JWT token
        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET || 'plugd_marketplace_secret_key_2024',
            { expiresIn: '24h' }
        );
        
        // Update last login
        user.lastLogin = new Date();
        await user.save();
        
        // Set cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
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

// Admin dashboard route (serve the admin interface)
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin', 'index.html'));
});

// Admin sub-routes (for SPA routing)
app.get('/admin/*', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin', 'index.html'));
});

// Error handling middleware for file uploads
app.use((error, req, res, next) => {
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

// Global error handler
app.use((error, req, res, next) => {
    console.error('Global error:', error);
    
    res.status(error.status || 500).json({
        success: false,
        message: error.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
});

// Add this to your package.json dependencies:
/*
{
  "dependencies": {
    "multer": "^1.4.5-lts.1",
    "sharp": "^0.32.6",
    "express-validator": "^7.0.1",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "cookie-parser": "^1.4.6"
  }
}
*/

// Make sure to add cookie-parser middleware before routes:
// app.use(cookieParser());

// Also ensure you have these imports at the top of server.js:
// const bcrypt = require('bcryptjs');
// const jwt = require('jsonwebtoken');
// const cookieParser = require('cookie-parser');
// const User = require('./models/User');

console.log('✅ Content Management System loaded successfully!');
console.log('📊 Admin Dashboard: http://localhost:3000/admin');
console.log('🔐 Default Admin: admin@plugd.com / admin123');

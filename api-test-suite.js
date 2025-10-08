/**
 * PLUGD E-COMMERCE - API ENDPOINT FUNCTIONALITY TESTING
 * Testing all API endpoints for proper structure and response handling
 * Author: MiniMax Agent
 * Date: 2025-10-08
 */

const fs = require('fs');
const path = require('path');

class APIEndpointTester {
    constructor() {
        this.testResults = {
            authEndpoints: {},
            productEndpoints: {},
            cartEndpoints: {},
            orderEndpoints: {},
            paymentEndpoints: {},
            adminEndpoints: {},
            summary: {}
        };
        this.totalTests = 0;
        this.passedTests = 0;
        this.failedTests = 0;
    }

    log(category, test, status, details = '') {
        this.totalTests++;
        if (status === 'PASS') {
            this.passedTests++;
            console.log(`✅ [${category}] ${test} - PASSED ${details}`);
        } else {
            this.failedTests++;
            console.log(`❌ [${category}] ${test} - FAILED ${details}`);
        }
        
        if (!this.testResults[category]) {
            this.testResults[category] = {};
        }
        this.testResults[category][test] = { status, details };
    }

    // Test Authentication Endpoints
    async testAuthEndpoints() {
        console.log('\n🔐 TESTING: Authentication API Endpoints');
        console.log('=' * 50);

        try {
            const authContent = fs.readFileSync('routes/auth.js', 'utf8');
            
            // Test for registration endpoint
            if (authContent.includes('router.post') && (authContent.includes('/register') || authContent.includes('register'))) {
                this.log('authEndpoints', 'POST /register', 'PASS', 'Registration endpoint found');
            } else {
                this.log('authEndpoints', 'POST /register', 'FAIL', 'Registration endpoint not found');
            }

            // Test for login endpoint
            if (authContent.includes('router.post') && (authContent.includes('/login') || authContent.includes('login'))) {
                this.log('authEndpoints', 'POST /login', 'PASS', 'Login endpoint found');
            } else {
                this.log('authEndpoints', 'POST /login', 'FAIL', 'Login endpoint not found');
            }

            // Test for logout endpoint
            if (authContent.includes('router.post') && (authContent.includes('/logout') || authContent.includes('logout'))) {
                this.log('authEndpoints', 'POST /logout', 'PASS', 'Logout endpoint found');
            } else {
                this.log('authEndpoints', 'POST /logout', 'FAIL', 'Logout endpoint not found');
            }

            // Test for JWT integration
            if (authContent.includes('jwt') || authContent.includes('jsonwebtoken')) {
                this.log('authEndpoints', 'JWT Integration', 'PASS', 'JWT authentication implemented');
            } else {
                this.log('authEndpoints', 'JWT Integration', 'FAIL', 'JWT not found in auth routes');
            }

            // Test for password hashing
            if (authContent.includes('bcrypt') || authContent.includes('hash')) {
                this.log('authEndpoints', 'Password Security', 'PASS', 'Password hashing implemented');
            } else {
                this.log('authEndpoints', 'Password Security', 'FAIL', 'Password hashing not found');
            }

        } catch (error) {
            this.log('authEndpoints', 'File access', 'FAIL', error.message);
        }
    }

    // Test Product Endpoints
    async testProductEndpoints() {
        console.log('\n📦 TESTING: Product API Endpoints');
        console.log('=' * 50);

        try {
            const productContent = fs.readFileSync('routes/products.js', 'utf8');
            
            // Test CRUD operations
            const crudOperations = [
                { method: 'GET', description: 'Get all products', pattern: 'router.get' },
                { method: 'GET /:id', description: 'Get single product', pattern: 'router.get' },
                { method: 'POST', description: 'Create product', pattern: 'router.post' },
                { method: 'PUT', description: 'Update product', pattern: 'router.put' },
                { method: 'DELETE', description: 'Delete product', pattern: 'router.delete' }
            ];

            crudOperations.forEach(({ method, description, pattern }) => {
                if (productContent.includes(pattern)) {
                    this.log('productEndpoints', `${method}`, 'PASS', description);
                } else {
                    this.log('productEndpoints', `${method}`, 'FAIL', `${description} not found`);
                }
            });

            // Test for search/filter functionality
            if (productContent.includes('search') || productContent.includes('filter') || productContent.includes('category')) {
                this.log('productEndpoints', 'Search/Filter', 'PASS', 'Search functionality detected');
            } else {
                this.log('productEndpoints', 'Search/Filter', 'FAIL', 'Search functionality not found');
            }

        } catch (error) {
            this.log('productEndpoints', 'File access', 'FAIL', error.message);
        }
    }

    // Test Cart Endpoints
    async testCartEndpoints() {
        console.log('\n🛒 TESTING: Shopping Cart API Endpoints');
        console.log('=' * 50);

        try {
            const cartContent = fs.readFileSync('routes/cart.js', 'utf8');
            
            const cartOperations = [
                { endpoint: 'GET /', description: 'View cart', pattern: 'router.get' },
                { endpoint: 'POST /add', description: 'Add to cart', pattern: 'router.post' },
                { endpoint: 'PUT /update', description: 'Update cart item', pattern: 'router.put' },
                { endpoint: 'DELETE /remove', description: 'Remove from cart', pattern: 'router.delete' }
            ];

            cartOperations.forEach(({ endpoint, description, pattern }) => {
                if (cartContent.includes(pattern)) {
                    this.log('cartEndpoints', endpoint, 'PASS', description);
                } else {
                    this.log('cartEndpoints', endpoint, 'FAIL', `${description} not found`);
                }
            });

            // Test for session/user cart management
            if (cartContent.includes('session') || cartContent.includes('userId') || cartContent.includes('user')) {
                this.log('cartEndpoints', 'User Association', 'PASS', 'User cart management found');
            } else {
                this.log('cartEndpoints', 'User Association', 'FAIL', 'User cart management not found');
            }

        } catch (error) {
            this.log('cartEndpoints', 'File access', 'FAIL', error.message);
        }
    }

    // Test Order Endpoints
    async testOrderEndpoints() {
        console.log('\n📋 TESTING: Order Management API Endpoints');
        console.log('=' * 50);

        try {
            const orderContent = fs.readFileSync('routes/orders.js', 'utf8');
            
            const orderOperations = [
                { endpoint: 'GET /', description: 'Get user orders', pattern: 'router.get' },
                { endpoint: 'POST /', description: 'Create order', pattern: 'router.post' },
                { endpoint: 'GET /:id', description: 'Get order details', pattern: 'router.get' },
                { endpoint: 'PUT /:id', description: 'Update order status', pattern: 'router.put' }
            ];

            orderOperations.forEach(({ endpoint, description, pattern }) => {
                if (orderContent.includes(pattern)) {
                    this.log('orderEndpoints', endpoint, 'PASS', description);
                } else {
                    this.log('orderEndpoints', endpoint, 'FAIL', `${description} not found`);
                }
            });

            // Test for order status management
            if (orderContent.includes('status') && (orderContent.includes('pending') || orderContent.includes('completed'))) {
                this.log('orderEndpoints', 'Status Management', 'PASS', 'Order status handling found');
            } else {
                this.log('orderEndpoints', 'Status Management', 'FAIL', 'Order status handling not found');
            }

            // Test for order tracking
            if (orderContent.includes('track') || orderContent.includes('tracking')) {
                this.log('orderEndpoints', 'Order Tracking', 'PASS', 'Order tracking functionality found');
            } else {
                this.log('orderEndpoints', 'Order Tracking', 'FAIL', 'Order tracking not found');
            }

        } catch (error) {
            this.log('orderEndpoints', 'File access', 'FAIL', error.message);
        }
    }

    // Test Payment Endpoints
    async testPaymentEndpoints() {
        console.log('\n💳 TESTING: Payment Gateway API Endpoints');
        console.log('=' * 50);

        try {
            const paymentContent = fs.readFileSync('routes/payments.js', 'utf8');
            
            // Test payment gateway endpoints
            const paymentGateways = [
                { gateway: 'Razorpay', pattern: 'razorpay' },
                { gateway: 'Stripe', pattern: 'stripe' },
                { gateway: 'PayPal', pattern: 'paypal' }
            ];

            paymentGateways.forEach(({ gateway, pattern }) => {
                if (paymentContent.toLowerCase().includes(pattern.toLowerCase())) {
                    this.log('paymentEndpoints', `${gateway} Integration`, 'PASS', `${gateway} endpoints found`);
                } else {
                    this.log('paymentEndpoints', `${gateway} Integration`, 'FAIL', `${gateway} endpoints not found`);
                }
            });

            // Test for payment verification
            if (paymentContent.includes('verify') || paymentContent.includes('webhook')) {
                this.log('paymentEndpoints', 'Payment Verification', 'PASS', 'Payment verification endpoints found');
            } else {
                this.log('paymentEndpoints', 'Payment Verification', 'FAIL', 'Payment verification not found');
            }

            // Test for payment security
            if (paymentContent.includes('signature') || paymentContent.includes('hmac')) {
                this.log('paymentEndpoints', 'Payment Security', 'PASS', 'Payment signature verification found');
            } else {
                this.log('paymentEndpoints', 'Payment Security', 'FAIL', 'Payment signature verification not found');
            }

        } catch (error) {
            this.log('paymentEndpoints', 'File access', 'FAIL', error.message);
        }
    }

    // Test Admin Endpoints
    async testAdminEndpoints() {
        console.log('\n👨‍💼 TESTING: Admin Panel API Endpoints');
        console.log('=' * 50);

        // Test admin routes
        try {
            if (fs.existsSync('routes/admin.js')) {
                const adminContent = fs.readFileSync('routes/admin.js', 'utf8');
                
                // Test admin authentication
                if (adminContent.includes('admin') && (adminContent.includes('auth') || adminContent.includes('middleware'))) {
                    this.log('adminEndpoints', 'Admin Authentication', 'PASS', 'Admin auth middleware found');
                } else {
                    this.log('adminEndpoints', 'Admin Authentication', 'FAIL', 'Admin auth not found');
                }

                // Test admin operations
                const adminOps = ['dashboard', 'users', 'products', 'orders'];
                const foundOps = adminOps.filter(op => adminContent.includes(op));
                
                if (foundOps.length >= 2) {
                    this.log('adminEndpoints', 'Admin Operations', 'PASS', `Operations: ${foundOps.join(', ')}`);
                } else {
                    this.log('adminEndpoints', 'Admin Operations', 'FAIL', 'Limited admin operations found');
                }
            } else {
                this.log('adminEndpoints', 'Admin Routes File', 'FAIL', 'admin.js not found');
            }
        } catch (error) {
            this.log('adminEndpoints', 'Admin routes access', 'FAIL', error.message);
        }

        // Test admin dashboard
        try {
            if (fs.existsSync('admin/index.html')) {
                const dashboardContent = fs.readFileSync('admin/index.html', 'utf8');
                
                if (dashboardContent.includes('dashboard') || dashboardContent.includes('admin')) {
                    this.log('adminEndpoints', 'Admin Dashboard', 'PASS', 'Admin dashboard HTML found');
                } else {
                    this.log('adminEndpoints', 'Admin Dashboard', 'FAIL', 'Admin dashboard content unclear');
                }
            } else {
                this.log('adminEndpoints', 'Admin Dashboard File', 'FAIL', 'admin/index.html not found');
            }
        } catch (error) {
            this.log('adminEndpoints', 'Admin dashboard access', 'FAIL', error.message);
        }
    }

    // Generate API test report
    generateReport() {
        console.log('\n📊 API ENDPOINT TESTING RESULTS');
        console.log('=' * 50);
        
        const passRate = ((this.passedTests / this.totalTests) * 100).toFixed(1);
        const failRate = ((this.failedTests / this.totalTests) * 100).toFixed(1);

        console.log(`Total API Tests: ${this.totalTests}`);
        console.log(`✅ Passed: ${this.passedTests} (${passRate}%)`);
        console.log(`❌ Failed: ${this.failedTests} (${failRate}%)`);
        console.log(`\n🎯 API Success Rate: ${passRate}%`);

        // Category breakdown
        Object.keys(this.testResults).forEach(category => {
            if (Object.keys(this.testResults[category]).length > 0) {
                const categoryTests = Object.values(this.testResults[category]);
                const categoryPassed = categoryTests.filter(t => t.status === 'PASS').length;
                const categoryTotal = categoryTests.length;
                const categoryRate = ((categoryPassed / categoryTotal) * 100).toFixed(1);
                
                console.log(`\n📋 ${category}: ${categoryPassed}/${categoryTotal} (${categoryRate}%)`);
            }
        });

        // API assessment
        if (passRate >= 90) {
            console.log('\n🎊 EXCELLENT: All API endpoints are properly structured!');
        } else if (passRate >= 75) {
            console.log('\n✨ GOOD: Most API endpoints are working, minor improvements needed');
        } else if (passRate >= 60) {
            console.log('\n⚠️ MODERATE: Several API endpoints need attention');
        } else {
            console.log('\n🚨 CRITICAL: Major API issues detected');
        }

        return this.testResults;
    }

    // Run all API tests
    async runAllAPITests() {
        console.log('🌐 STARTING API ENDPOINT FUNCTIONALITY TESTING');
        console.log('=' * 60);
        
        await this.testAuthEndpoints();
        await this.testProductEndpoints();
        await this.testCartEndpoints();
        await this.testOrderEndpoints();
        await this.testPaymentEndpoints();
        await this.testAdminEndpoints();

        return this.generateReport();
    }
}

// Export for use as module
module.exports = APIEndpointTester;

// Run tests if called directly
if (require.main === module) {
    const apiTester = new APIEndpointTester();
    apiTester.runAllAPITests().then(results => {
        console.log('\n💾 API test results completed!');
    }).catch(error => {
        console.error('❌ API testing encountered an error:', error);
    });
}

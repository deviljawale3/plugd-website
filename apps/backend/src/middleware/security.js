const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cors = require('cors');
const compression = require('compression');

class SecurityMiddleware {
    static rateLimiters = {
        // General API rate limiting
        general: rateLimit({
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 100, // Limit each IP to 100 requests per windowMs
            message: {
                success: false,
                message: 'Too many requests from this IP, please try again later.',
                retryAfter: '15 minutes'
            },
            standardHeaders: true,
            legacyHeaders: false,
            handler: (req, res) => {
                console.log(`⚠️ Rate limit exceeded for IP: ${req.ip}`);
                res.status(429).json({
                    success: false,
                    message: 'Too many requests from this IP, please try again later.',
                    retryAfter: '15 minutes'
                });
            }
        }),

        // Strict rate limiting for authentication
        auth: rateLimit({
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 5, // Only 5 attempts per IP
            message: {
                success: false,
                message: 'Too many authentication attempts, please try again later.',
                retryAfter: '15 minutes'
            },
            skipSuccessfulRequests: true,
            standardHeaders: true,
            legacyHeaders: false
        }),

        // Payment rate limiting (very strict)
        payment: rateLimit({
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 10, // Only 10 payment attempts per IP
            message: {
                success: false,
                message: 'Too many payment requests, please try again later.',
                retryAfter: '15 minutes'
            },
            standardHeaders: true,
            legacyHeaders: false
        }),

        // Admin endpoints (extra strict)
        admin: rateLimit({
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 20, // Only 20 admin requests per IP
            message: {
                success: false,
                message: 'Too many admin requests, please try again later.',
                retryAfter: '15 minutes'
            },
            standardHeaders: true,
            legacyHeaders: false
        }),

        // File upload rate limiting
        upload: rateLimit({
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 30, // Only 30 uploads per IP
            message: {
                success: false,
                message: 'Too many file uploads, please try again later.',
                retryAfter: '15 minutes'
            },
            standardHeaders: true,
            legacyHeaders: false
        })
    };

    static slowDown = {
        // Slow down repeated requests
        general: slowDown({
            windowMs: 15 * 60 * 1000, // 15 minutes
            delayAfter: 50, // Allow 50 requests per windowMs without delay
            delayMs: 500, // Add 500ms delay per request after delayAfter
            maxDelayMs: 10000, // Maximum delay of 10 seconds
        })
    };

    // Configure Helmet for security headers
    static helmetConfig = helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com"],
                scriptSrc: ["'self'", "'unsafe-inline'", "https://checkout.razorpay.com", "https://js.stripe.com"],
                imgSrc: ["'self'", "data:", "https:", "http:"],
                connectSrc: ["'self'", "https://api.razorpay.com", "https://api.stripe.com"],
                fontSrc: ["'self'", "https://cdnjs.cloudflare.com"],
                objectSrc: ["'none'"],
                mediaSrc: ["'self'"],
                frameSrc: ["'self'", "https://js.stripe.com"]
            },
        },
        crossOriginEmbedderPolicy: false,
        crossOriginResourcePolicy: { policy: "cross-origin" }
    });

    // CORS configuration
    static corsConfig = cors({
        origin: function (origin, callback) {
            // Allow requests with no origin (mobile apps, curl, etc.)
            if (!origin) return callback(null, true);
            
            const allowedOrigins = [
                process.env.FRONTEND_URL || 'http://localhost:3000',
                'http://localhost:3000',
                'http://localhost:3001',
                'https://plugd-marketplace.vercel.app',
                'https://plugd.com'
            ];
            
            if (allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                console.log(`❌ CORS blocked origin: ${origin}`);
                callback(new Error('Not allowed by CORS'));
            }
        },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
        maxAge: 86400 // 24 hours
    });

    // Input sanitization middleware
    static sanitizeInput = [
        // Prevent NoSQL injection
        mongoSanitize({
            replaceWith: '_',
            onSanitize: ({ req, key }) => {
                console.log(`⚠️ Potential NoSQL injection blocked: ${key} from IP: ${req.ip}`);
            }
        }),
        
        // Prevent XSS attacks
        xss(),
        
        // Prevent HTTP Parameter Pollution
        hpp({
            whitelist: ['tags', 'categories', 'sort', 'fields'] // Allow arrays for these parameters
        })
    ];

    // Request logging middleware
    static requestLogger = (req, res, next) => {
        const start = Date.now();
        
        // Log request
        console.log(`📥 ${req.method} ${req.path} - IP: ${req.ip} - User-Agent: ${req.get('User-Agent')}`);
        
        // Log response on finish
        res.on('finish', () => {
            const duration = Date.now() - start;
            const status = res.statusCode;
            const statusEmoji = status >= 400 ? '❌' : status >= 300 ? '⚠️' : '✅';
            
            console.log(`📤 ${statusEmoji} ${req.method} ${req.path} - ${status} - ${duration}ms`);
            
            // Log slow requests
            if (duration > 1000) {
                console.log(`🐌 Slow request detected: ${req.method} ${req.path} took ${duration}ms`);
            }
        });
        
        next();
    };

    // API key validation middleware
    static validateApiKey = (req, res, next) => {
        const apiKey = req.header('X-API-Key');
        
        // Skip validation for public endpoints
        const publicEndpoints = ['/health', '/api/products', '/api/categories'];
        if (publicEndpoints.some(endpoint => req.path.startsWith(endpoint))) {
            return next();
        }
        
        if (!apiKey && process.env.REQUIRE_API_KEY === 'true') {
            return res.status(401).json({
                success: false,
                message: 'API key required'
            });
        }
        
        if (apiKey && apiKey !== process.env.API_KEY) {
            console.log(`❌ Invalid API key attempted from IP: ${req.ip}`);
            return res.status(401).json({
                success: false,
                message: 'Invalid API key'
            });
        }
        
        next();
    };

    // Suspicious activity detection
    static suspiciousActivityDetector = (req, res, next) => {
        const suspiciousPatterns = [
            // SQL injection patterns
            /('|(\-\-)|(;)|(\||\|)|(\*|\*))/i,
            // Script injection patterns
            /<script[^>]*>.*?<\/script>/gi,
            // Common attack patterns
            /(union|select|insert|delete|update|drop|exec|script)/i
        ];
        
        const checkString = JSON.stringify(req.body) + req.url + JSON.stringify(req.query);
        
        for (const pattern of suspiciousPatterns) {
            if (pattern.test(checkString)) {
                console.log(`🚨 Suspicious activity detected from IP: ${req.ip} - Pattern: ${pattern} - Request: ${req.method} ${req.path}`);
                
                // Log to security log
                this.logSecurityEvent(req, 'SUSPICIOUS_PATTERN', {
                    pattern: pattern.toString(),
                    content: checkString.substring(0, 500)
                });
                
                return res.status(400).json({
                    success: false,
                    message: 'Request blocked for security reasons'
                });
            }
        }
        
        next();
    };

    // IP whitelist/blacklist middleware
    static ipFilter = (req, res, next) => {
        const clientIP = req.ip;
        
        // Check blacklist
        const blacklistedIPs = (process.env.BLACKLISTED_IPS || '').split(',').filter(ip => ip.trim());
        if (blacklistedIPs.includes(clientIP)) {
            console.log(`🚫 Blacklisted IP attempted access: ${clientIP}`);
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }
        
        // Check whitelist (if enabled)
        const whitelistedIPs = (process.env.WHITELISTED_IPS || '').split(',').filter(ip => ip.trim());
        if (whitelistedIPs.length > 0 && !whitelistedIPs.includes(clientIP)) {
            console.log(`🚫 Non-whitelisted IP attempted access: ${clientIP}`);
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }
        
        next();
    };

    // Security event logger
    static logSecurityEvent(req, eventType, details = {}) {
        const securityLog = {
            timestamp: new Date().toISOString(),
            eventType,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            path: req.path,
            method: req.method,
            userId: req.user?.id || null,
            details
        };
        
        // In production, send to security monitoring service
        console.log('🛡️ Security Event:', JSON.stringify(securityLog));
        
        // TODO: Send to external security monitoring service
        // await securityMonitoring.logEvent(securityLog);
    }

    // Maintenance mode middleware
    static maintenanceMode = (req, res, next) => {
        if (process.env.MAINTENANCE_MODE === 'true') {
            // Allow admin access during maintenance
            if (req.user?.role === 'admin' || req.user?.role === 'superadmin') {
                return next();
            }
            
            return res.status(503).json({
                success: false,
                message: 'Service temporarily unavailable for maintenance',
                retryAfter: process.env.MAINTENANCE_ETA || 'Soon'
            });
        }
        
        next();
    };

    // Apply all security middleware
    static applySecurityMiddleware(app) {
        // Basic security headers
        app.use(this.helmetConfig);
        
        // Compression
        app.use(compression({
            threshold: 1024,
            filter: (req, res) => {
                if (req.headers['x-no-compression']) {
                    return false;
                }
                return compression.filter(req, res);
            }
        }));
        
        // CORS
        app.use(this.corsConfig);
        
        // Request logging
        if (process.env.NODE_ENV !== 'test') {
            app.use(this.requestLogger);
        }
        
        // IP filtering
        app.use(this.ipFilter);
        
        // Maintenance mode
        app.use(this.maintenanceMode);
        
        // Input sanitization
        app.use(this.sanitizeInput);
        
        // Suspicious activity detection
        app.use(this.suspiciousActivityDetector);
        
        // API key validation
        app.use(this.validateApiKey);
        
        // General rate limiting and slow down
        app.use('/api/', this.rateLimiters.general);
        app.use('/api/', this.slowDown.general);
        
        console.log('✅ Security middleware applied successfully');
    }
}

module.exports = SecurityMiddleware;

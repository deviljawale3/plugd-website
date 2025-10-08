const Redis = require('redis');
const NodeCache = require('node-cache');
const compression = require('compression');
const cluster = require('cluster');
const os = require('os');

class PerformanceOptimizer {
    constructor() {
        this.memoryCache = new NodeCache({ stdTTL: 600 }); // 10 minutes default TTL
        this.redisClient = null;
        this.cacheStats = {
            hits: 0,
            misses: 0,
            sets: 0
        };
        
        this.initializeRedis();
    }
    
    // Initialize Redis connection
    async initializeRedis() {
        try {
            if (process.env.REDIS_URL) {
                this.redisClient = Redis.createClient({ url: process.env.REDIS_URL });
                await this.redisClient.connect();
                console.log('✅ Redis connected for caching');
            } else {
                console.log('⚠️ Redis not configured, using in-memory cache only');
            }
        } catch (error) {
            console.error('❌ Redis connection failed:', error.message);
            this.redisClient = null;
        }
    }
    
    // Cache middleware factory
    createCacheMiddleware(ttl = 300) { // 5 minutes default
        return async (req, res, next) => {
            // Skip caching for non-GET requests
            if (req.method !== 'GET') {
                return next();
            }
            
            // Skip caching for authenticated requests (unless explicitly allowed)
            if (req.user && !req.query.cache) {
                return next();
            }
            
            const cacheKey = this.generateCacheKey(req);
            
            try {
                // Try to get from cache
                const cachedData = await this.get(cacheKey);
                
                if (cachedData) {
                    this.cacheStats.hits++;
                    res.setHeader('X-Cache', 'HIT');
                    res.setHeader('X-Cache-Key', cacheKey);
                    return res.json(cachedData);
                }
                
                // If not in cache, intercept response
                this.cacheStats.misses++;
                const originalJson = res.json;
                
                res.json = function(data) {
                    // Cache successful responses
                    if (res.statusCode === 200 && data) {
                        this.set(cacheKey, data, ttl).catch(console.error);
                        this.cacheStats.sets++;
                    }
                    
                    res.setHeader('X-Cache', 'MISS');
                    res.setHeader('X-Cache-Key', cacheKey);
                    originalJson.call(this, data);
                }.bind(this);
                
                next();
            } catch (error) {
                console.error('Cache middleware error:', error);
                next();
            }
        };
    }
    
    // Generate cache key from request
    generateCacheKey(req) {
        const baseKey = `${req.method}:${req.path}`;
        const queryString = new URLSearchParams(req.query).toString();
        const userSegment = req.user ? `user:${req.user.id}` : 'anonymous';
        
        return `api:${baseKey}:${queryString}:${userSegment}`.replace(/[^a-zA-Z0-9:_-]/g, '_');
    }
    
    // Get from cache (Redis or memory)
    async get(key) {
        try {
            if (this.redisClient) {
                const data = await this.redisClient.get(key);
                return data ? JSON.parse(data) : null;
            } else {
                return this.memoryCache.get(key) || null;
            }
        } catch (error) {
            console.error('Cache get error:', error);
            return null;
        }
    }
    
    // Set cache (Redis or memory)
    async set(key, value, ttl = 300) {
        try {
            if (this.redisClient) {
                await this.redisClient.setEx(key, ttl, JSON.stringify(value));
            } else {
                this.memoryCache.set(key, value, ttl);
            }
        } catch (error) {
            console.error('Cache set error:', error);
        }
    }
    
    // Delete from cache
    async del(key) {
        try {
            if (this.redisClient) {
                await this.redisClient.del(key);
            } else {
                this.memoryCache.del(key);
            }
        } catch (error) {
            console.error('Cache delete error:', error);
        }
    }
    
    // Clear cache by pattern
    async clearPattern(pattern) {
        try {
            if (this.redisClient) {
                const keys = await this.redisClient.keys(pattern);
                if (keys.length > 0) {
                    await this.redisClient.del(keys);
                }
            } else {
                // Clear all memory cache (pattern matching not supported)
                this.memoryCache.flushAll();
            }
        } catch (error) {
            console.error('Cache clear pattern error:', error);
        }
    }
    
    // Get cache statistics
    getStats() {
        const hitRate = this.cacheStats.hits + this.cacheStats.misses > 0 
            ? (this.cacheStats.hits / (this.cacheStats.hits + this.cacheStats.misses) * 100).toFixed(2)
            : 0;
            
        return {
            ...this.cacheStats,
            hitRate: `${hitRate}%`,
            memoryKeys: this.memoryCache.keys().length,
            memoryStats: this.memoryCache.getStats()
        };
    }
    
    // Preload cache with common data
    async preloadCache() {
        try {
            console.log('🗕 Preloading cache with common data...');
            
            // Preload categories (assuming this is commonly accessed)
            const Category = require('../models/Category');
            const categories = await Category.find({ isActive: true }).lean();
            await this.set('categories:active', categories, 3600); // 1 hour
            
            // Preload featured products
            const Product = require('../models/Product');
            const featuredProducts = await Product.find({ 
                isActive: true, 
                isFeatured: true 
            }).limit(10).lean();
            await this.set('products:featured', featuredProducts, 1800); // 30 minutes
            
            console.log('✅ Cache preloading completed');
        } catch (error) {
            console.error('Cache preloading failed:', error);
        }
    }
    
    // Database query optimization helpers
    static optimizeQuery(query) {
        // Add lean() for read-only operations
        if (typeof query.lean === 'function') {
            query = query.lean();
        }
        
        // Add appropriate indexes hints could be added here
        return query;
    }
    
    // Image optimization middleware
    static imageOptimization() {
        return (req, res, next) => {
            // Set cache headers for images
            if (req.path.match(/\.(jpg|jpeg|png|gif|svg|webp|ico)$/i)) {
                res.setHeader('Cache-Control', 'public, max-age=31536000, immutable'); // 1 year
                res.setHeader('Expires', new Date(Date.now() + 31536000000).toUTCString());
            }
            
            // Set cache headers for static assets
            if (req.path.match(/\.(css|js|woff|woff2|ttf|eot)$/i)) {
                res.setHeader('Cache-Control', 'public, max-age=86400'); // 1 day
            }
            
            next();
        };
    }
    
    // Compression middleware with optimization
    static compressionMiddleware() {
        return compression({
            // Only compress responses larger than 1kb
            threshold: 1024,
            
            // Compression level (1-9, 6 is default)
            level: 6,
            
            // Filter function to determine what to compress
            filter: (req, res) => {
                // Don't compress images and videos
                if (req.path.match(/\.(jpg|jpeg|png|gif|mp4|mov|avi)$/i)) {
                    return false;
                }
                
                // Don't compress if client doesn't support it
                if (req.headers['x-no-compression']) {
                    return false;
                }
                
                return compression.filter(req, res);
            }
        });
    }
    
    // Memory monitoring
    static monitorMemory() {
        const memUsage = process.memoryUsage();
        const formatBytes = (bytes) => (bytes / 1024 / 1024).toFixed(2) + ' MB';
        
        return {
            rss: formatBytes(memUsage.rss),
            heapTotal: formatBytes(memUsage.heapTotal),
            heapUsed: formatBytes(memUsage.heapUsed),
            external: formatBytes(memUsage.external),
            uptime: Math.floor(process.uptime()),
            cpuUsage: process.cpuUsage()
        };
    }
    
    // Database connection pooling optimization
    static optimizeMongoose(mongoose) {
        // Optimize connection pool
        mongoose.set('maxPoolSize', 10); // Maintain up to 10 socket connections
        mongoose.set('serverSelectionTimeoutMS', 5000); // Keep trying to send operations for 5 seconds
        mongoose.set('socketTimeoutMS', 45000); // Close sockets after 45 seconds of inactivity
        mongoose.set('bufferMaxEntries', 0); // Disable mongoose buffering
        mongoose.set('bufferCommands', false); // Disable mongoose buffering
        
        console.log('✅ Mongoose optimization applied');
    }
    
    // Cluster mode setup for production
    static setupCluster() {
        if (cluster.isMaster && process.env.NODE_ENV === 'production') {
            const numCPUs = os.cpus().length;
            const workers = Math.min(numCPUs, 4); // Max 4 workers
            
            console.log(`📦 Master process ${process.pid} is running`);
            console.log(`🚀 Starting ${workers} workers...`);
            
            // Fork workers
            for (let i = 0; i < workers; i++) {
                cluster.fork();
            }
            
            cluster.on('exit', (worker, code, signal) => {
                console.log(`❌ Worker ${worker.process.pid} died with code ${code} and signal ${signal}`);
                console.log('🔄 Starting a new worker...');
                cluster.fork();
            });
            
            return false; // Don't start the Express app in master
        }
        
        console.log(`🛠️ Worker ${process.pid} started`);
        return true; // Start the Express app in worker
    }
    
    // Performance monitoring endpoint
    static createPerformanceEndpoint(app, optimizer) {
        app.get('/api/performance', (req, res) => {
            const stats = {
                cache: optimizer.getStats(),
                memory: PerformanceOptimizer.monitorMemory(),
                process: {
                    pid: process.pid,
                    platform: process.platform,
                    nodeVersion: process.version,
                    uptime: process.uptime()
                },
                timestamp: new Date().toISOString()
            };
            
            res.json({
                success: true,
                data: stats
            });
        });
    }
    
    // Graceful shutdown with cache cleanup
    async gracefulShutdown() {
        console.log('🛱 Starting graceful shutdown...');
        
        try {
            if (this.redisClient) {
                await this.redisClient.quit();
                console.log('✅ Redis connection closed');
            }
            
            this.memoryCache.close();
            console.log('✅ Memory cache cleared');
            
        } catch (error) {
            console.error('❌ Error during cache cleanup:', error);
        }
    }
}

// Global performance optimizer instance
const performanceOptimizer = new PerformanceOptimizer();

// Export both class and instance
module.exports = {
    PerformanceOptimizer,
    performanceOptimizer
};

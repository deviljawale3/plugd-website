const mongoose = require('mongoose');

// Product Schema
const productSchema = new mongoose.Schema({
    // Basic Information
    name: {
        type: String,
        required: [true, 'Product name is required'],
        trim: true,
        maxlength: [200, 'Product name cannot exceed 200 characters']
    },
    slug: {
        type: String,
        unique: true,
        lowercase: true
    },
    description: {
        type: String,
        required: [true, 'Product description is required'],
        maxlength: [2000, 'Description cannot exceed 2000 characters']
    },
    shortDescription: {
        type: String,
        maxlength: [500, 'Short description cannot exceed 500 characters']
    },
    
    // Categorization
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: [true, 'Product category is required']
    },
    subcategory: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category'
    },
    tags: [{
        type: String,
        trim: true,
        lowercase: true
    }],
    brand: {
        type: String,
        trim: true,
        maxlength: [100, 'Brand name cannot exceed 100 characters']
    },
    
    // Pricing
    price: {
        type: Number,
        required: [true, 'Product price is required'],
        min: [0, 'Price cannot be negative']
    },
    originalPrice: {
        type: Number,
        min: [0, 'Original price cannot be negative']
    },
    currency: {
        type: String,
        default: 'USD',
        enum: ['USD', 'EUR', 'GBP', 'INR', 'CAD', 'AUD']
    },
    discount: {
        percentage: {
            type: Number,
            min: 0,
            max: 100
        },
        amount: {
            type: Number,
            min: 0
        },
        startDate: Date,
        endDate: Date,
        isActive: {
            type: Boolean,
            default: false
        }
    },
    
    // Images and Media
    images: [{
        url: {
            type: String,
            required: true
        },
        alt: String,
        isMain: {
            type: Boolean,
            default: false
        },
        order: {
            type: Number,
            default: 0
        }
    }],
    videos: [{
        url: String,
        thumbnail: String,
        title: String,
        duration: Number
    }],
    
    // Inventory
    sku: {
        type: String,
        unique: true,
        required: [true, 'SKU is required'],
        uppercase: true
    },
    inventory: {
        quantity: {
            type: Number,
            required: [true, 'Inventory quantity is required'],
            min: [0, 'Inventory cannot be negative'],
            default: 0
        },
        reserved: {
            type: Number,
            default: 0,
            min: 0
        },
        lowStockThreshold: {
            type: Number,
            default: 10,
            min: 0
        },
        trackInventory: {
            type: Boolean,
            default: true
        }
    },
    
    // Variations and Options
    variations: [{
        type: {
            type: String,
            required: true,
            enum: ['color', 'size', 'material', 'style', 'weight', 'custom']
        },
        name: {
            type: String,
            required: true
        },
        options: [{
            value: {
                type: String,
                required: true
            },
            label: String,
            price: {
                type: Number,
                default: 0
            },
            inventory: {
                type: Number,
                default: 0
            },
            sku: String,
            image: String
        }]
    }],
    
    // Physical Properties
    dimensions: {
        length: Number,
        width: Number,
        height: Number,
        unit: {
            type: String,
            enum: ['cm', 'inches', 'mm'],
            default: 'cm'
        }
    },
    weight: {
        value: Number,
        unit: {
            type: String,
            enum: ['kg', 'lb', 'g', 'oz'],
            default: 'kg'
        }
    },
    
    // Shipping
    shipping: {
        free: {
            type: Boolean,
            default: false
        },
        cost: {
            type: Number,
            default: 0,
            min: 0
        },
        estimatedDays: {
            min: Number,
            max: Number
        },
        restrictions: [{
            type: String,
            enum: ['international', 'express', 'standard']
        }]
    },
    
    // SEO and Marketing
    seo: {
        title: String,
        description: String,
        keywords: [String],
        canonicalUrl: String
    },
    
    // Reviews and Ratings
    ratings: {
        average: {
            type: Number,
            default: 0,
            min: 0,
            max: 5
        },
        count: {
            type: Number,
            default: 0
        },
        distribution: {
            five: { type: Number, default: 0 },
            four: { type: Number, default: 0 },
            three: { type: Number, default: 0 },
            two: { type: Number, default: 0 },
            one: { type: Number, default: 0 }
        }
    },
    
    // Status and Visibility
    status: {
        type: String,
        enum: ['active', 'inactive', 'draft', 'archived'],
        default: 'draft'
    },
    featured: {
        type: Boolean,
        default: false
    },
    trending: {
        type: Boolean,
        default: false
    },
    newArrival: {
        type: Boolean,
        default: false
    },
    
    // AI and Analytics
    aiTags: [{
        tag: String,
        confidence: {
            type: Number,
            min: 0,
            max: 1
        }
    }],
    searchKeywords: [String],
    relatedProducts: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
    }],
    
    // Seller Information
    seller: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Seller is required']
    },
    
    // Statistics
    views: {
        type: Number,
        default: 0
    },
    clicks: {
        type: Number,
        default: 0
    },
    wishlistCount: {
        type: Number,
        default: 0
    },
    salesCount: {
        type: Number,
        default: 0
    },
    
    // Timestamps
    publishedAt: Date,
    lastUpdated: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes for better performance
productSchema.index({ name: 'text', description: 'text', tags: 'text' });
productSchema.index({ category: 1, status: 1 });
productSchema.index({ seller: 1 });
productSchema.index({ featured: 1, status: 1 });
productSchema.index({ trending: 1, status: 1 });
productSchema.index({ price: 1 });
productSchema.index({ 'ratings.average': -1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ slug: 1 });
productSchema.index({ sku: 1 });

// Virtual for availability
productSchema.virtual('isAvailable').get(function() {
    return this.status === 'active' && this.inventory.quantity > 0;
});

// Virtual for discount percentage
productSchema.virtual('discountPercentage').get(function() {
    if (this.originalPrice && this.price < this.originalPrice) {
        return Math.round(((this.originalPrice - this.price) / this.originalPrice) * 100);
    }
    return 0;
});

// Virtual for main image
productSchema.virtual('mainImage').get(function() {
    const mainImg = this.images.find(img => img.isMain);
    return mainImg ? mainImg.url : (this.images.length > 0 ? this.images[0].url : null);
});

// Virtual for stock status
productSchema.virtual('stockStatus').get(function() {
    if (this.inventory.quantity === 0) return 'out-of-stock';
    if (this.inventory.quantity <= this.inventory.lowStockThreshold) return 'low-stock';
    return 'in-stock';
});

// Pre-save middleware to generate slug
productSchema.pre('save', function(next) {
    if (this.isModified('name') || this.isNew) {
        this.slug = this.name
            .toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim();
    }
    next();
});

// Pre-save middleware to update lastUpdated
productSchema.pre('save', function(next) {
    if (this.isModified() && !this.isNew) {
        this.lastUpdated = Date.now();
    }
    next();
});

// Pre-save middleware to set original price
productSchema.pre('save', function(next) {
    if (this.isNew && !this.originalPrice) {
        this.originalPrice = this.price;
    }
    next();
});

// Instance method to update rating
productSchema.methods.updateRating = function(newRating, oldRating = null) {
    if (oldRating) {
        // Updating existing rating
        this.ratings.distribution[this.getRatingKey(oldRating)]--;
        this.ratings.distribution[this.getRatingKey(newRating)]++;
    } else {
        // New rating
        this.ratings.count++;
        this.ratings.distribution[this.getRatingKey(newRating)]++;
    }
    
    // Recalculate average
    const totalRatings = this.ratings.count;
    const weightedSum = (this.ratings.distribution.five * 5) +
                       (this.ratings.distribution.four * 4) +
                       (this.ratings.distribution.three * 3) +
                       (this.ratings.distribution.two * 2) +
                       (this.ratings.distribution.one * 1);
    
    this.ratings.average = totalRatings > 0 ? (weightedSum / totalRatings) : 0;
    
    return this.save();
};

// Helper method for rating keys
productSchema.methods.getRatingKey = function(rating) {
    const keys = { 5: 'five', 4: 'four', 3: 'three', 2: 'two', 1: 'one' };
    return keys[Math.floor(rating)] || 'one';
};

// Instance method to increment view count
productSchema.methods.incrementViews = function() {
    this.views++;
    return this.save();
};

// Instance method to check if product is on sale
productSchema.methods.isOnSale = function() {
    return this.discount.isActive && 
           this.discount.startDate <= new Date() && 
           this.discount.endDate >= new Date();
};

// Static method to find products by category
productSchema.statics.findByCategory = function(categoryId, options = {}) {
    const query = { category: categoryId, status: 'active' };
    return this.find(query)
        .populate('category seller')
        .sort(options.sort || { createdAt: -1 })
        .limit(options.limit || 0);
};

// Static method to find featured products
productSchema.statics.findFeatured = function(limit = 12) {
    return this.find({ featured: true, status: 'active' })
        .populate('category seller')
        .sort({ createdAt: -1 })
        .limit(limit);
};

// Static method to search products
productSchema.statics.searchProducts = function(query, options = {}) {
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
    
    if (options.category) {
        searchQuery.$and.push({ category: options.category });
    }
    
    if (options.priceRange) {
        searchQuery.$and.push({
            price: {
                $gte: options.priceRange.min || 0,
                $lte: options.priceRange.max || Number.MAX_SAFE_INTEGER
            }
        });
    }
    
    return this.find(searchQuery)
        .populate('category seller')
        .sort(options.sort || { relevance: -1, createdAt: -1 })
        .limit(options.limit || 50);
};

module.exports = mongoose.model('Product', productSchema);

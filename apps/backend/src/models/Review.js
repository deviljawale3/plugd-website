const mongoose = require('mongoose');

// Review Schema
const reviewSchema = new mongoose.Schema({
    // Basic Information
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: [true, 'Product is required']
    },
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Customer is required']
    },
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: [true, 'Order is required']
    },
    
    // Review Content
    rating: {
        type: Number,
        required: [true, 'Rating is required'],
        min: [1, 'Rating must be at least 1'],
        max: [5, 'Rating cannot exceed 5']
    },
    title: {
        type: String,
        required: [true, 'Review title is required'],
        trim: true,
        maxlength: [200, 'Title cannot exceed 200 characters']
    },
    content: {
        type: String,
        required: [true, 'Review content is required'],
        trim: true,
        maxlength: [2000, 'Review content cannot exceed 2000 characters']
    },
    
    // Detailed Ratings
    detailedRatings: {
        quality: {
            type: Number,
            min: 1,
            max: 5
        },
        value: {
            type: Number,
            min: 1,
            max: 5
        },
        shipping: {
            type: Number,
            min: 1,
            max: 5
        },
        service: {
            type: Number,
            min: 1,
            max: 5
        }
    },
    
    // Media
    images: [{
        url: {
            type: String,
            required: true
        },
        alt: String,
        caption: String
    }],
    videos: [{
        url: String,
        thumbnail: String,
        duration: Number
    }],
    
    // Review Status
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'flagged'],
        default: 'pending'
    },
    moderationNotes: String,
    
    // Verification
    isVerifiedPurchase: {
        type: Boolean,
        default: true
    },
    purchaseDate: Date,
    
    // Helpful Votes
    helpful: {
        count: {
            type: Number,
            default: 0
        },
        users: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }]
    },
    
    // Responses
    sellerResponse: {
        content: String,
        respondedAt: Date,
        responder: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    },
    
    // Flags and Reports
    flags: [{
        reason: {
            type: String,
            enum: ['inappropriate', 'spam', 'fake', 'offensive', 'other']
        },
        reportedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        reportedAt: {
            type: Date,
            default: Date.now
        },
        description: String
    }],
    
    // AI Analysis
    sentiment: {
        score: {
            type: Number,
            min: -1,
            max: 1
        },
        label: {
            type: String,
            enum: ['positive', 'negative', 'neutral']
        },
        confidence: {
            type: Number,
            min: 0,
            max: 1
        }
    },
    keywords: [String],
    categories: [String],
    
    // Timestamps
    approvedAt: Date,
    rejectedAt: Date
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes
reviewSchema.index({ product: 1, customer: 1 }, { unique: true }); // One review per customer per product
reviewSchema.index({ product: 1, status: 1, createdAt: -1 });
reviewSchema.index({ customer: 1 });
reviewSchema.index({ rating: 1 });
reviewSchema.index({ status: 1 });
reviewSchema.index({ isVerifiedPurchase: 1 });

// Virtual for review age
reviewSchema.virtual('reviewAge').get(function() {
    const diffTime = Math.abs(new Date() - this.createdAt);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} week${Math.ceil(diffDays / 7) !== 1 ? 's' : ''} ago`;
    if (diffDays < 365) return `${Math.ceil(diffDays / 30)} month${Math.ceil(diffDays / 30) !== 1 ? 's' : ''} ago`;
    return `${Math.ceil(diffDays / 365)} year${Math.ceil(diffDays / 365) !== 1 ? 's' : ''} ago`;
});

// Virtual for helpful percentage
reviewSchema.virtual('helpfulPercentage').get(function() {
    // This would need to be calculated based on total votes (helpful + not helpful)
    // For now, just return a simple metric
    return this.helpful.count > 0 ? Math.min(100, this.helpful.count * 10) : 0;
});

// Virtual for average detailed rating
reviewSchema.virtual('avgDetailedRating').get(function() {
    if (!this.detailedRatings) return this.rating;
    
    const ratings = Object.values(this.detailedRatings).filter(rating => rating != null);
    if (ratings.length === 0) return this.rating;
    
    const sum = ratings.reduce((total, rating) => total + rating, 0);
    return Number((sum / ratings.length).toFixed(1));
});

// Pre-save middleware to set purchase date
reviewSchema.pre('save', async function(next) {
    if (this.isNew && this.order) {
        try {
            const Order = mongoose.model('Order');
            const order = await Order.findById(this.order);
            if (order) {
                this.purchaseDate = order.orderDate;
            }
        } catch (error) {
            // Continue without setting purchase date
        }
    }
    next();
});

// Pre-save middleware to update product rating
reviewSchema.post('save', async function() {
    if (this.status === 'approved') {
        try {
            const Product = mongoose.model('Product');
            const product = await Product.findById(this.product);
            if (product) {
                await product.updateRating(this.rating);
            }
        } catch (error) {
            console.error('Error updating product rating:', error);
        }
    }
});

// Pre-remove middleware to update product rating
reviewSchema.pre('remove', async function(next) {
    if (this.status === 'approved') {
        try {
            const Product = mongoose.model('Product');
            const product = await Product.findById(this.product);
            if (product) {
                // Recalculate rating without this review
                const approvedReviews = await this.constructor.find({
                    product: this.product,
                    status: 'approved',
                    _id: { $ne: this._id }
                });
                
                const totalRating = approvedReviews.reduce((sum, review) => sum + review.rating, 0);
                const avgRating = approvedReviews.length > 0 ? totalRating / approvedReviews.length : 0;
                
                product.ratings.average = avgRating;
                product.ratings.count = approvedReviews.length;
                await product.save();
            }
        } catch (error) {
            console.error('Error updating product rating on review removal:', error);
        }
    }
    next();
});

// Instance method to mark as helpful
reviewSchema.methods.markHelpful = function(userId) {
    if (!this.helpful.users.includes(userId)) {
        this.helpful.users.push(userId);
        this.helpful.count += 1;
        return this.save();
    }
    return Promise.resolve(this);
};

// Instance method to remove helpful vote
reviewSchema.methods.removeHelpful = function(userId) {
    const index = this.helpful.users.indexOf(userId);
    if (index > -1) {
        this.helpful.users.splice(index, 1);
        this.helpful.count = Math.max(0, this.helpful.count - 1);
        return this.save();
    }
    return Promise.resolve(this);
};

// Instance method to add flag
reviewSchema.methods.addFlag = function(reason, reportedBy, description = '') {
    this.flags.push({
        reason,
        reportedBy,
        description
    });
    
    // Auto-flag if too many reports
    if (this.flags.length >= 3 && this.status !== 'flagged') {
        this.status = 'flagged';
    }
    
    return this.save();
};

// Instance method to approve review
reviewSchema.methods.approve = function(moderatorNotes = '') {
    this.status = 'approved';
    this.approvedAt = new Date();
    if (moderatorNotes) {
        this.moderationNotes = moderatorNotes;
    }
    return this.save();
};

// Instance method to reject review
reviewSchema.methods.reject = function(moderatorNotes = '') {
    this.status = 'rejected';
    this.rejectedAt = new Date();
    this.moderationNotes = moderatorNotes;
    return this.save();
};

// Static method to get reviews for product
reviewSchema.statics.findByProduct = function(productId, options = {}) {
    const query = { product: productId };
    
    if (options.status) {
        query.status = options.status;
    } else {
        query.status = 'approved'; // Default to approved reviews
    }
    
    return this.find(query)
        .populate('customer', 'firstName lastName avatar')
        .sort(options.sort || { createdAt: -1 })
        .limit(options.limit || 0);
};

// Static method to get review statistics
reviewSchema.statics.getProductStats = function(productId) {
    return this.aggregate([
        {
            $match: {
                product: mongoose.Types.ObjectId(productId),
                status: 'approved'
            }
        },
        {
            $group: {
                _id: null,
                totalReviews: { $sum: 1 },
                averageRating: { $avg: '$rating' },
                ratingDistribution: {
                    $push: '$rating'
                },
                totalHelpful: { $sum: '$helpful.count' }
            }
        },
        {
            $addFields: {
                ratingCounts: {
                    5: {
                        $size: {
                            $filter: {
                                input: '$ratingDistribution',
                                cond: { $eq: ['$$this', 5] }
                            }
                        }
                    },
                    4: {
                        $size: {
                            $filter: {
                                input: '$ratingDistribution',
                                cond: { $eq: ['$$this', 4] }
                            }
                        }
                    },
                    3: {
                        $size: {
                            $filter: {
                                input: '$ratingDistribution',
                                cond: { $eq: ['$$this', 3] }
                            }
                        }
                    },
                    2: {
                        $size: {
                            $filter: {
                                input: '$ratingDistribution',
                                cond: { $eq: ['$$this', 2] }
                            }
                        }
                    },
                    1: {
                        $size: {
                            $filter: {
                                input: '$ratingDistribution',
                                cond: { $eq: ['$$this', 1] }
                            }
                        }
                    }
                }
            }
        }
    ]);
};

module.exports = mongoose.model('Review', reviewSchema);

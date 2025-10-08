const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// User Schema
const userSchema = new mongoose.Schema({
    // Basic Information
    firstName: {
        type: String,
        required: [true, 'First name is required'],
        trim: true,
        maxlength: [50, 'First name cannot exceed 50 characters']
    },
    lastName: {
        type: String,
        required: [true, 'Last name is required'],
        trim: true,
        maxlength: [50, 'Last name cannot exceed 50 characters']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [8, 'Password must be at least 8 characters'],
        select: false // Don't include password in queries by default
    },
    
    // Profile Information
    avatar: {
        type: String,
        default: 'https://via.placeholder.com/150/00FF7F/FFFFFF?text=User'
    },
    phone: {
        type: String,
        trim: true,
        match: [/^[\+]?[1-9][\d]{0,15}$/, 'Please enter a valid phone number']
    },
    dateOfBirth: {
        type: Date
    },
    gender: {
        type: String,
        enum: ['male', 'female', 'other', 'prefer_not_to_say'],
        default: 'prefer_not_to_say'
    },
    
    // Account Settings
    role: {
        type: String,
        enum: ['user', 'seller', 'admin'],
        default: 'user'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    emailVerificationToken: String,
    emailVerificationExpires: Date,
    
    // Security
    passwordResetToken: String,
    passwordResetExpires: Date,
    passwordChangedAt: Date,
    loginAttempts: {
        type: Number,
        default: 0
    },
    lockUntil: Date,
    
    // Addresses
    addresses: [{
        type: {
            type: String,
            enum: ['home', 'work', 'other'],
            default: 'home'
        },
        isDefault: {
            type: Boolean,
            default: false
        },
        firstName: String,
        lastName: String,
        company: String,
        addressLine1: {
            type: String,
            required: true
        },
        addressLine2: String,
        city: {
            type: String,
            required: true
        },
        state: {
            type: String,
            required: true
        },
        postalCode: {
            type: String,
            required: true
        },
        country: {
            type: String,
            required: true,
            default: 'United States'
        },
        phone: String
    }],
    
    // Shopping Preferences
    preferences: {
        currency: {
            type: String,
            default: 'USD'
        },
        language: {
            type: String,
            default: 'en'
        },
        newsletter: {
            type: Boolean,
            default: true
        },
        promotions: {
            type: Boolean,
            default: true
        },
        recommendations: {
            type: Boolean,
            default: true
        }
    },
    
    // AI & Analytics
    aiProfile: {
        interests: [String],
        preferredCategories: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Category'
        }],
        priceRange: {
            min: { type: Number, default: 0 },
            max: { type: Number, default: 1000 }
        },
        brands: [String],
        colors: [String],
        sizes: [String]
    },
    
    // Shopping History
    wishlist: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
    }],
    cart: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            min: 1,
            default: 1
        },
        selectedVariants: {
            color: String,
            size: String,
            material: String
        },
        addedAt: {
            type: Date,
            default: Date.now
        }
    }],
    
    // Social & Reviews
    socialProfiles: {
        facebook: String,
        twitter: String,
        instagram: String,
        linkedin: String
    },
    
    // Metrics
    totalSpent: {
        type: Number,
        default: 0
    },
    totalOrders: {
        type: Number,
        default: 0
    },
    loyaltyPoints: {
        type: Number,
        default: 0
    },
    
    // Timestamps
    lastLogin: Date,
    registrationDate: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes for better performance
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ 'aiProfile.preferredCategories': 1 });
userSchema.index({ createdAt: -1 });

// Virtual for full name
userSchema.virtual('fullName').get(function() {
    return `${this.firstName} ${this.lastName}`;
});

// Virtual for cart total
userSchema.virtual('cartTotal').get(function() {
    return this.cart.reduce((total, item) => total + (item.quantity * (item.product.price || 0)), 0);
});

// Virtual for account locked status
userSchema.virtual('isLocked').get(function() {
    return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
        // Hash password with cost of 12
        const salt = await bcrypt.genSalt(12);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Pre-save middleware to update passwordChangedAt
userSchema.pre('save', function(next) {
    if (!this.isModified('password') || this.isNew) return next();
    
    this.passwordChangedAt = Date.now() - 1000; // Subtract 1 second to ensure token is created after password change
    next();
});

// Instance method to check password
userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Instance method to generate JWT token
userSchema.methods.generateAuthToken = function() {
    return jwt.sign(
        { 
            id: this._id,
            email: this.email,
            role: this.role
        },
        process.env.JWT_SECRET || 'your-secret-key',
        { 
            expiresIn: process.env.JWT_EXPIRE || '7d'
        }
    );
};

// Instance method to check if password was changed after JWT was issued
userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
    if (this.passwordChangedAt) {
        const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
        return JWTTimestamp < changedTimestamp;
    }
    return false;
};

// Instance method to increment login attempts
userSchema.methods.incrementLoginAttempts = function() {
    // If we have a previous lock that has expired, restart at 1
    if (this.lockUntil && this.lockUntil < Date.now()) {
        return this.updateOne({
            $unset: { lockUntil: 1 },
            $set: { loginAttempts: 1 }
        });
    }
    
    const updates = { $inc: { loginAttempts: 1 } };
    
    // Lock account after 5 failed attempts for 2 hours
    if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
        updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 }; // 2 hours
    }
    
    return this.updateOne(updates);
};

// Instance method to reset login attempts
userSchema.methods.resetLoginAttempts = function() {
    return this.updateOne({
        $unset: { loginAttempts: 1, lockUntil: 1 }
    });
};

// Instance method to add item to cart
userSchema.methods.addToCart = function(productId, quantity = 1, variants = {}) {
    const existingItemIndex = this.cart.findIndex(
        item => item.product.toString() === productId.toString()
    );
    
    if (existingItemIndex > -1) {
        this.cart[existingItemIndex].quantity += quantity;
    } else {
        this.cart.push({
            product: productId,
            quantity,
            selectedVariants: variants
        });
    }
    
    return this.save();
};

// Instance method to remove item from cart
userSchema.methods.removeFromCart = function(productId) {
    this.cart = this.cart.filter(
        item => item.product.toString() !== productId.toString()
    );
    return this.save();
};

// Instance method to clear cart
userSchema.methods.clearCart = function() {
    this.cart = [];
    return this.save();
};

// Static method to find user by email
userSchema.statics.findByEmail = function(email) {
    return this.findOne({ email: email.toLowerCase() });
};

// Static method to find users by role
userSchema.statics.findByRole = function(role) {
    return this.find({ role, isActive: true });
};

module.exports = mongoose.model('User', userSchema);

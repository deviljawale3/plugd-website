const { body, param, query, validationResult } = require('express-validator');

// Common validation patterns
const patterns = {
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    phone: /^[\+]?[0-9]{10,15}$/,
    slug: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    sku: /^[A-Z0-9]{3,20}$/,
    password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/,
    mongoId: /^[a-fA-F0-9]{24}$/,
    url: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/
};

// Custom validators
const customValidators = {
    isMongoId: (value) => {
        return patterns.mongoId.test(value);
    },
    
    isValidEnum: (validValues) => {
        return (value) => {
            return validValues.includes(value);
        };
    },
    
    isValidPrice: (value) => {
        const price = parseFloat(value);
        return !isNaN(price) && price >= 0 && price <= 999999.99;
    },
    
    isValidInventory: (value) => {
        const inventory = parseInt(value);
        return !isNaN(inventory) && inventory >= 0 && inventory <= 999999;
    },
    
    isValidRating: (value) => {
        const rating = parseFloat(value);
        return !isNaN(rating) && rating >= 1 && rating <= 5;
    },
    
    isArrayOfStrings: (value) => {
        if (!Array.isArray(value)) {
            try {
                value = JSON.parse(value);
            } catch (e) {
                return false;
            }
        }
        return Array.isArray(value) && value.every(item => typeof item === 'string');
    },
    
    isValidImageArray: (value) => {
        if (!Array.isArray(value)) {
            try {
                value = JSON.parse(value);
            } catch (e) {
                return false;
            }
        }
        return Array.isArray(value) && value.every(item => 
            item && typeof item === 'object' && item.url && item.alt
        );
    }
};

// User validation rules
const userValidations = {
    create: [
        body('email')
            .isEmail()
            .withMessage('Please provide a valid email address')
            .normalizeEmail(),
        body('firstName')
            .trim()
            .isLength({ min: 2, max: 50 })
            .withMessage('First name must be between 2 and 50 characters')
            .matches(/^[a-zA-Z\s]+$/)
            .withMessage('First name can only contain letters and spaces'),
        body('lastName')
            .trim()
            .isLength({ min: 2, max: 50 })
            .withMessage('Last name must be between 2 and 50 characters')
            .matches(/^[a-zA-Z\s]+$/)
            .withMessage('Last name can only contain letters and spaces'),
        body('password')
            .optional()
            .isLength({ min: 8 })
            .withMessage('Password must be at least 8 characters long')
            .matches(patterns.password)
            .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
        body('role')
            .optional()
            .custom(customValidators.isValidEnum(['customer', 'admin', 'superadmin']))
            .withMessage('Role must be customer, admin, or superadmin'),
        body('phone')
            .optional()
            .matches(patterns.phone)
            .withMessage('Please provide a valid phone number'),
        body('address.street')
            .optional()
            .trim()
            .isLength({ max: 200 })
            .withMessage('Street address must not exceed 200 characters'),
        body('address.city')
            .optional()
            .trim()
            .isLength({ max: 100 })
            .withMessage('City must not exceed 100 characters'),
        body('address.state')
            .optional()
            .trim()
            .isLength({ max: 100 })
            .withMessage('State must not exceed 100 characters'),
        body('address.zipCode')
            .optional()
            .trim()
            .isLength({ min: 5, max: 10 })
            .withMessage('Zip code must be between 5 and 10 characters'),
        body('address.country')
            .optional()
            .trim()
            .isLength({ max: 100 })
            .withMessage('Country must not exceed 100 characters')
    ],
    
    update: [
        param('id')
            .custom(customValidators.isMongoId)
            .withMessage('Invalid user ID'),
        body('email')
            .optional()
            .isEmail()
            .withMessage('Please provide a valid email address')
            .normalizeEmail(),
        body('firstName')
            .optional()
            .trim()
            .isLength({ min: 2, max: 50 })
            .withMessage('First name must be between 2 and 50 characters'),
        body('lastName')
            .optional()
            .trim()
            .isLength({ min: 2, max: 50 })
            .withMessage('Last name must be between 2 and 50 characters'),
        body('isActive')
            .optional()
            .isBoolean()
            .withMessage('isActive must be a boolean value')
    ],
    
    delete: [
        param('id')
            .custom(customValidators.isMongoId)
            .withMessage('Invalid user ID')
    ]
};

// Product validation rules
const productValidations = {
    create: [
        body('name')
            .trim()
            .isLength({ min: 3, max: 200 })
            .withMessage('Product name must be between 3 and 200 characters'),
        body('description')
            .optional()
            .trim()
            .isLength({ max: 2000 })
            .withMessage('Description must not exceed 2000 characters'),
        body('price')
            .custom(customValidators.isValidPrice)
            .withMessage('Price must be a valid positive number up to 999,999.99'),
        body('comparePrice')
            .optional()
            .custom(customValidators.isValidPrice)
            .withMessage('Compare price must be a valid positive number'),
        body('inventory')
            .custom(customValidators.isValidInventory)
            .withMessage('Inventory must be a valid non-negative integer'),
        body('category')
            .custom(customValidators.isMongoId)
            .withMessage('Please provide a valid category ID'),
        body('brand')
            .optional()
            .trim()
            .isLength({ max: 100 })
            .withMessage('Brand must not exceed 100 characters'),
        body('sku')
            .optional()
            .matches(patterns.sku)
            .withMessage('SKU must be 3-20 characters with letters and numbers only'),
        body('weight')
            .optional()
            .isFloat({ min: 0, max: 999999 })
            .withMessage('Weight must be a positive number'),
        body('tags')
            .optional()
            .custom((value) => {
                if (typeof value === 'string') {
                    // Convert comma-separated string to array
                    value = value.split(',').map(tag => tag.trim());
                }
                return customValidators.isArrayOfStrings(value);
            })
            .withMessage('Tags must be an array of strings or comma-separated string'),
        body('status')
            .optional()
            .custom(customValidators.isValidEnum(['active', 'inactive', 'draft']))
            .withMessage('Status must be active, inactive, or draft'),
        body('featured')
            .optional()
            .isBoolean()
            .withMessage('Featured must be a boolean value'),
        body('seoTitle')
            .optional()
            .trim()
            .isLength({ max: 60 })
            .withMessage('SEO title must not exceed 60 characters'),
        body('seoDescription')
            .optional()
            .trim()
            .isLength({ max: 160 })
            .withMessage('SEO description must not exceed 160 characters')
    ],
    
    update: [
        param('id')
            .custom(customValidators.isMongoId)
            .withMessage('Invalid product ID'),
        body('name')
            .optional()
            .trim()
            .isLength({ min: 3, max: 200 })
            .withMessage('Product name must be between 3 and 200 characters'),
        body('price')
            .optional()
            .custom(customValidators.isValidPrice)
            .withMessage('Price must be a valid positive number'),
        body('inventory')
            .optional()
            .custom(customValidators.isValidInventory)
            .withMessage('Inventory must be a valid non-negative integer')
    ],
    
    delete: [
        param('id')
            .custom(customValidators.isMongoId)
            .withMessage('Invalid product ID')
    ],
    
    bulk: [
        body('action')
            .custom(customValidators.isValidEnum(['delete', 'update', 'activate', 'deactivate']))
            .withMessage('Action must be delete, update, activate, or deactivate'),
        body('productIds')
            .isArray({ min: 1 })
            .withMessage('Product IDs must be a non-empty array'),
        body('productIds.*')
            .custom(customValidators.isMongoId)
            .withMessage('Each product ID must be valid')
    ]
};

// Category validation rules
const categoryValidations = {
    create: [
        body('name')
            .trim()
            .isLength({ min: 2, max: 100 })
            .withMessage('Category name must be between 2 and 100 characters'),
        body('description')
            .optional()
            .trim()
            .isLength({ max: 500 })
            .withMessage('Description must not exceed 500 characters'),
        body('slug')
            .optional()
            .matches(patterns.slug)
            .withMessage('Slug must be lowercase letters, numbers, and hyphens only'),
        body('parent')
            .optional()
            .custom((value) => {
                if (value === '') return true;
                return customValidators.isMongoId(value);
            })
            .withMessage('Parent must be a valid category ID'),
        body('sortOrder')
            .optional()
            .isInt({ min: 0, max: 999999 })
            .withMessage('Sort order must be a non-negative integer'),
        body('seoTitle')
            .optional()
            .trim()
            .isLength({ max: 60 })
            .withMessage('SEO title must not exceed 60 characters'),
        body('seoDescription')
            .optional()
            .trim()
            .isLength({ max: 160 })
            .withMessage('SEO description must not exceed 160 characters')
    ],
    
    update: [
        param('id')
            .custom(customValidators.isMongoId)
            .withMessage('Invalid category ID'),
        body('name')
            .optional()
            .trim()
            .isLength({ min: 2, max: 100 })
            .withMessage('Category name must be between 2 and 100 characters')
    ],
    
    delete: [
        param('id')
            .custom(customValidators.isMongoId)
            .withMessage('Invalid category ID')
    ]
};

// Order validation rules
const orderValidations = {
    updateStatus: [
        param('id')
            .custom(customValidators.isMongoId)
            .withMessage('Invalid order ID'),
        body('status')
            .optional()
            .custom(customValidators.isValidEnum(['pending', 'processing', 'shipped', 'delivered', 'cancelled']))
            .withMessage('Status must be pending, processing, shipped, delivered, or cancelled'),
        body('paymentStatus')
            .optional()
            .custom(customValidators.isValidEnum(['pending', 'completed', 'failed', 'refunded']))
            .withMessage('Payment status must be pending, completed, failed, or refunded'),
        body('trackingNumber')
            .optional()
            .trim()
            .isLength({ max: 100 })
            .withMessage('Tracking number must not exceed 100 characters'),
        body('notes')
            .optional()
            .trim()
            .isLength({ max: 500 })
            .withMessage('Notes must not exceed 500 characters')
    ]
};

// Review validation rules
const reviewValidations = {
    updateStatus: [
        param('id')
            .custom(customValidators.isMongoId)
            .withMessage('Invalid review ID'),
        body('status')
            .custom(customValidators.isValidEnum(['approved', 'rejected', 'pending']))
            .withMessage('Status must be approved, rejected, or pending'),
        body('adminNotes')
            .optional()
            .trim()
            .isLength({ max: 500 })
            .withMessage('Admin notes must not exceed 500 characters')
    ],
    
    create: [
        body('product')
            .custom(customValidators.isMongoId)
            .withMessage('Please provide a valid product ID'),
        body('rating')
            .custom(customValidators.isValidRating)
            .withMessage('Rating must be between 1 and 5'),
        body('comment')
            .trim()
            .isLength({ min: 10, max: 1000 })
            .withMessage('Comment must be between 10 and 1000 characters')
    ]
};

// Query validation rules
const queryValidations = {
    pagination: [
        query('page')
            .optional()
            .isInt({ min: 1, max: 10000 })
            .withMessage('Page must be a positive integer between 1 and 10000'),
        query('limit')
            .optional()
            .isInt({ min: 1, max: 100 })
            .withMessage('Limit must be between 1 and 100')
    ],
    
    search: [
        query('search')
            .optional()
            .trim()
            .isLength({ min: 1, max: 100 })
            .withMessage('Search query must be between 1 and 100 characters')
    ],
    
    dateRange: [
        query('dateFrom')
            .optional()
            .isISO8601()
            .withMessage('Date from must be a valid ISO date'),
        query('dateTo')
            .optional()
            .isISO8601()
            .withMessage('Date to must be a valid ISO date')
    ],
    
    analytics: [
        query('period')
            .optional()
            .custom(customValidators.isValidEnum(['7d', '30d', '90d', '1y']))
            .withMessage('Period must be 7d, 30d, 90d, or 1y'),
        query('year')
            .optional()
            .isInt({ min: 2020, max: 2030 })
            .withMessage('Year must be between 2020 and 2030')
    ]
};

// Authentication validation rules
const authValidations = {
    login: [
        body('email')
            .isEmail()
            .withMessage('Please provide a valid email address')
            .normalizeEmail(),
        body('password')
            .isLength({ min: 1 })
            .withMessage('Password is required')
    ],
    
    register: [
        body('email')
            .isEmail()
            .withMessage('Please provide a valid email address')
            .normalizeEmail(),
        body('password')
            .isLength({ min: 8 })
            .withMessage('Password must be at least 8 characters long')
            .matches(patterns.password)
            .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
        body('firstName')
            .trim()
            .isLength({ min: 2, max: 50 })
            .withMessage('First name must be between 2 and 50 characters'),
        body('lastName')
            .trim()
            .isLength({ min: 2, max: 50 })
            .withMessage('Last name must be between 2 and 50 characters')
    ],
    
    resetPassword: [
        body('email')
            .isEmail()
            .withMessage('Please provide a valid email address')
            .normalizeEmail()
    ],
    
    changePassword: [
        body('currentPassword')
            .isLength({ min: 1 })
            .withMessage('Current password is required'),
        body('newPassword')
            .isLength({ min: 8 })
            .withMessage('New password must be at least 8 characters long')
            .matches(patterns.password)
            .withMessage('New password must contain at least one uppercase letter, one lowercase letter, and one number')
    ]
};

// Error handling middleware
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
        const formattedErrors = errors.array().map(error => ({
            field: error.param,
            message: error.msg,
            value: error.value
        }));
        
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: formattedErrors
        });
    }
    
    next();
};

// Sanitization helpers
const sanitizers = {
    // Remove HTML tags and dangerous characters
    sanitizeHtml: (text) => {
        if (!text) return text;
        return text
            .replace(/<script[^>]*>.*<\/script>/gi, '')
            .replace(/<[^>]*>/g, '')
            .trim();
    },
    
    // Sanitize search query
    sanitizeSearchQuery: (query) => {
        if (!query) return query;
        return query
            .replace(/[<>"'&]/g, '')
            .trim()
            .substring(0, 100);
    },
    
    // Generate slug from text
    generateSlug: (text) => {
        if (!text) return '';
        return text
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
    },
    
    // Sanitize filename
    sanitizeFilename: (filename) => {
        if (!filename) return filename;
        return filename
            .replace(/[^a-zA-Z0-9.-]/g, '_')
            .replace(/_{2,}/g, '_')
            .toLowerCase();
    }
};

// Validation middleware factory
const createValidationMiddleware = (validations) => {
    return [...validations, handleValidationErrors];
};

module.exports = {
    patterns,
    customValidators,
    userValidations,
    productValidations,
    categoryValidations,
    orderValidations,
    reviewValidations,
    queryValidations,
    authValidations,
    handleValidationErrors,
    sanitizers,
    createValidationMiddleware
};

const mongoose = require('mongoose');

// Category Schema
const categorySchema = new mongoose.Schema({
    // Basic Information
    name: {
        type: String,
        required: [true, 'Category name is required'],
        trim: true,
        unique: true,
        maxlength: [100, 'Category name cannot exceed 100 characters']
    },
    slug: {
        type: String,
        unique: true,
        lowercase: true
    },
    description: {
        type: String,
        maxlength: [500, 'Description cannot exceed 500 characters']
    },
    
    // Hierarchy
    parent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        default: null
    },
    level: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
    },
    path: {
        type: String,
        default: ''
    },
    
    // Visual Elements
    image: {
        url: String,
        alt: String
    },
    icon: {
        type: String,
        default: '📏'
    },
    color: {
        type: String,
        default: '#00FF7F',
        match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Please provide a valid hex color']
    },
    
    // SEO
    seo: {
        title: String,
        description: String,
        keywords: [String]
    },
    
    // Settings
    isActive: {
        type: Boolean,
        default: true
    },
    featured: {
        type: Boolean,
        default: false
    },
    sortOrder: {
        type: Number,
        default: 0
    },
    
    // Statistics
    productCount: {
        type: Number,
        default: 0
    },
    views: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes
categorySchema.index({ slug: 1 });
categorySchema.index({ parent: 1, isActive: 1 });
categorySchema.index({ level: 1, sortOrder: 1 });
categorySchema.index({ featured: 1, isActive: 1 });

// Virtual for children categories
categorySchema.virtual('children', {
    ref: 'Category',
    localField: '_id',
    foreignField: 'parent'
});

// Virtual for products in this category
categorySchema.virtual('products', {
    ref: 'Product',
    localField: '_id',
    foreignField: 'category'
});

// Pre-save middleware to generate slug
categorySchema.pre('save', function(next) {
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

// Pre-save middleware to set path
categorySchema.pre('save', async function(next) {
    if (this.isModified('parent') || this.isNew) {
        if (this.parent) {
            try {
                const parentCategory = await this.constructor.findById(this.parent);
                if (parentCategory) {
                    this.level = parentCategory.level + 1;
                    this.path = parentCategory.path ? `${parentCategory.path}/${parentCategory._id}` : `${parentCategory._id}`;
                }
            } catch (error) {
                return next(error);
            }
        } else {
            this.level = 0;
            this.path = '';
        }
    }
    next();
});

// Static method to get category tree
categorySchema.statics.getCategoryTree = function() {
    return this.aggregate([
        { $match: { isActive: true } },
        {
            $graphLookup: {
                from: 'categories',
                startWith: '$_id',
                connectFromField: '_id',
                connectToField: 'parent',
                as: 'children',
                maxDepth: 3
            }
        },
        { $match: { parent: null } },
        { $sort: { sortOrder: 1, name: 1 } }
    ]);
};

// Static method to get breadcrumb
categorySchema.statics.getBreadcrumb = async function(categoryId) {
    const category = await this.findById(categoryId);
    if (!category) return [];
    
    const breadcrumb = [category];
    let currentCategory = category;
    
    while (currentCategory.parent) {
        currentCategory = await this.findById(currentCategory.parent);
        if (currentCategory) {
            breadcrumb.unshift(currentCategory);
        } else {
            break;
        }
    }
    
    return breadcrumb;
};

module.exports = mongoose.model('Category', categorySchema);

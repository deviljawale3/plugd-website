const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Product = require('../models/Product');
const Category = require('../models/Category');
const { auth, adminAuth } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../uploads/products');
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed!'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

// Validation middleware
const validateProduct = [
    body('name').notEmpty().withMessage('Product name is required'),
    body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
    body('inventory').isInt({ min: 0 }).withMessage('Inventory must be a non-negative integer'),
    body('category').notEmpty().withMessage('Category is required')
];

const validateCategory = [
    body('name').notEmpty().withMessage('Category name is required'),
    body('slug').optional().isSlug().withMessage('Invalid slug format')
];

// Error handler middleware
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array()
        });
    }
    next();
};

// PRODUCTS ROUTES

// Get all products with pagination and filtering
router.get('/products', auth, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        
        // Build filter object
        const filter = {};
        if (req.query.category) filter.category = req.query.category;
        if (req.query.status) filter.status = req.query.status;
        if (req.query.search) {
            filter.$or = [
                { name: { $regex: req.query.search, $options: 'i' } },
                { description: { $regex: req.query.search, $options: 'i' } },
                { tags: { $in: [new RegExp(req.query.search, 'i')] } }
            ];
        }
        
        // Get products with population
        const products = await Product.find(filter)
            .populate('category', 'name slug')
            .populate('reviews', 'rating')
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 });
        
        // Get total count for pagination
        const total = await Product.countDocuments(filter);
        
        // Calculate average ratings
        const productsWithRatings = products.map(product => {
            const productObj = product.toObject();
            if (productObj.reviews && productObj.reviews.length > 0) {
                const avgRating = productObj.reviews.reduce((sum, review) => sum + review.rating, 0) / productObj.reviews.length;
                productObj.averageRating = Math.round(avgRating * 10) / 10;
            } else {
                productObj.averageRating = 0;
            }
            return productObj;
        });
        
        res.json({
            success: true,
            data: {
                products: productsWithRatings,
                pagination: {
                    current: page,
                    total: Math.ceil(total / limit),
                    count: products.length,
                    totalItems: total
                }
            }
        });
    } catch (error) {
        console.error('Get products error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch products',
            error: error.message
        });
    }
});

// Get single product by ID
router.get('/products/:id', auth, async (req, res) => {
    try {
        const product = await Product.findById(req.params.id)
            .populate('category', 'name slug')
            .populate('reviews');
        
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }
        
        res.json({
            success: true,
            data: product
        });
    } catch (error) {
        console.error('Get product error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch product',
            error: error.message
        });
    }
});

// Create new product
router.post('/products', adminAuth, upload.array('images', 5), validateProduct, handleValidationErrors, async (req, res) => {
    try {
        const productData = {
            name: req.body.name,
            description: req.body.description || '',
            price: parseFloat(req.body.price),
            comparePrice: req.body.comparePrice ? parseFloat(req.body.comparePrice) : null,
            inventory: parseInt(req.body.inventory),
            category: req.body.category,
            brand: req.body.brand || '',
            sku: req.body.sku || '',
            weight: req.body.weight ? parseFloat(req.body.weight) : null,
            dimensions: req.body.dimensions || {},
            tags: req.body.tags ? req.body.tags.split(',').map(tag => tag.trim()) : [],
            status: req.body.status || 'active',
            featured: req.body.featured === 'true' || req.body.featured === true,
            seoTitle: req.body.seoTitle || '',
            seoDescription: req.body.seoDescription || '',
            specifications: req.body.specifications || {},
            images: []
        };
        
        // Handle uploaded images
        if (req.files && req.files.length > 0) {
            productData.images = req.files.map(file => ({
                url: `/uploads/products/${file.filename}`,
                alt: req.body.name,
                filename: file.filename
            }));
        }
        
        // Handle variations if provided
        if (req.body.variations) {
            try {
                productData.variations = JSON.parse(req.body.variations);
            } catch (e) {
                console.error('Invalid variations format:', e);
            }
        }
        
        const product = new Product(productData);
        await product.save();
        
        // Populate the saved product
        await product.populate('category', 'name slug');
        
        res.status(201).json({
            success: true,
            message: 'Product created successfully',
            data: product
        });
    } catch (error) {
        console.error('Create product error:', error);
        
        // Clean up uploaded files if product creation fails
        if (req.files && req.files.length > 0) {
            req.files.forEach(file => {
                fs.unlink(file.path, (err) => {
                    if (err) console.error('Failed to delete file:', err);
                });
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Failed to create product',
            error: error.message
        });
    }
});

// Update product
router.put('/products/:id', adminAuth, upload.array('images', 5), validateProduct, handleValidationErrors, async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }
        
        // Update product data
        const updateData = {
            name: req.body.name,
            description: req.body.description || '',
            price: parseFloat(req.body.price),
            comparePrice: req.body.comparePrice ? parseFloat(req.body.comparePrice) : null,
            inventory: parseInt(req.body.inventory),
            category: req.body.category,
            brand: req.body.brand || '',
            sku: req.body.sku || '',
            weight: req.body.weight ? parseFloat(req.body.weight) : null,
            tags: req.body.tags ? req.body.tags.split(',').map(tag => tag.trim()) : [],
            status: req.body.status || 'active',
            featured: req.body.featured === 'true' || req.body.featured === true,
            seoTitle: req.body.seoTitle || '',
            seoDescription: req.body.seoDescription || '',
            updatedAt: new Date()
        };
        
        // Handle new uploaded images
        if (req.files && req.files.length > 0) {
            const newImages = req.files.map(file => ({
                url: `/uploads/products/${file.filename}`,
                alt: req.body.name,
                filename: file.filename
            }));
            
            // If replacing all images, delete old ones
            if (req.body.replaceImages === 'true') {
                // Delete old image files
                product.images.forEach(image => {
                    if (image.filename) {
                        const filePath = path.join(__dirname, '../uploads/products', image.filename);
                        fs.unlink(filePath, (err) => {
                            if (err) console.error('Failed to delete old image:', err);
                        });
                    }
                });
                updateData.images = newImages;
            } else {
                // Append new images
                updateData.images = [...product.images, ...newImages];
            }
        }
        
        // Handle variations if provided
        if (req.body.variations) {
            try {
                updateData.variations = JSON.parse(req.body.variations);
            } catch (e) {
                console.error('Invalid variations format:', e);
            }
        }
        
        const updatedProduct = await Product.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        ).populate('category', 'name slug');
        
        res.json({
            success: true,
            message: 'Product updated successfully',
            data: updatedProduct
        });
    } catch (error) {
        console.error('Update product error:', error);
        
        // Clean up uploaded files if update fails
        if (req.files && req.files.length > 0) {
            req.files.forEach(file => {
                fs.unlink(file.path, (err) => {
                    if (err) console.error('Failed to delete file:', err);
                });
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Failed to update product',
            error: error.message
        });
    }
});

// Delete product
router.delete('/products/:id', adminAuth, async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }
        
        // Delete associated image files
        product.images.forEach(image => {
            if (image.filename) {
                const filePath = path.join(__dirname, '../uploads/products', image.filename);
                fs.unlink(filePath, (err) => {
                    if (err) console.error('Failed to delete image:', err);
                });
            }
        });
        
        await Product.findByIdAndDelete(req.params.id);
        
        res.json({
            success: true,
            message: 'Product deleted successfully'
        });
    } catch (error) {
        console.error('Delete product error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete product',
            error: error.message
        });
    }
});

// Bulk operations for products
router.post('/products/bulk', adminAuth, async (req, res) => {
    try {
        const { action, productIds, updateData } = req.body;
        
        if (!action || !productIds || !Array.isArray(productIds)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid bulk operation parameters'
            });
        }
        
        let result;
        
        switch (action) {
            case 'delete':
                // Get products to delete their images
                const productsToDelete = await Product.find({ _id: { $in: productIds } });
                
                // Delete image files
                productsToDelete.forEach(product => {
                    product.images.forEach(image => {
                        if (image.filename) {
                            const filePath = path.join(__dirname, '../uploads/products', image.filename);
                            fs.unlink(filePath, (err) => {
                                if (err) console.error('Failed to delete image:', err);
                            });
                        }
                    });
                });
                
                result = await Product.deleteMany({ _id: { $in: productIds } });
                break;
                
            case 'update':
                result = await Product.updateMany(
                    { _id: { $in: productIds } },
                    { ...updateData, updatedAt: new Date() }
                );
                break;
                
            case 'activate':
                result = await Product.updateMany(
                    { _id: { $in: productIds } },
                    { status: 'active', updatedAt: new Date() }
                );
                break;
                
            case 'deactivate':
                result = await Product.updateMany(
                    { _id: { $in: productIds } },
                    { status: 'inactive', updatedAt: new Date() }
                );
                break;
                
            default:
                return res.status(400).json({
                    success: false,
                    message: 'Invalid bulk action'
                });
        }
        
        res.json({
            success: true,
            message: `Bulk ${action} completed successfully`,
            data: result
        });
    } catch (error) {
        console.error('Bulk operation error:', error);
        res.status(500).json({
            success: false,
            message: 'Bulk operation failed',
            error: error.message
        });
    }
});

// CATEGORIES ROUTES

// Get all categories
router.get('/categories', auth, async (req, res) => {
    try {
        const categories = await Category.find()
            .populate('parent', 'name slug')
            .sort({ sortOrder: 1, name: 1 });
        
        // Get product counts for each category
        const categoriesWithCounts = await Promise.all(
            categories.map(async (category) => {
                const productCount = await Product.countDocuments({ category: category._id });
                return {
                    ...category.toObject(),
                    productCount
                };
            })
        );
        
        res.json({
            success: true,
            data: categoriesWithCounts
        });
    } catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch categories',
            error: error.message
        });
    }
});

// Get single category
router.get('/categories/:id', auth, async (req, res) => {
    try {
        const category = await Category.findById(req.params.id)
            .populate('parent', 'name slug');
        
        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }
        
        // Get product count
        const productCount = await Product.countDocuments({ category: category._id });
        
        res.json({
            success: true,
            data: {
                ...category.toObject(),
                productCount
            }
        });
    } catch (error) {
        console.error('Get category error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch category',
            error: error.message
        });
    }
});

// Create new category
router.post('/categories', adminAuth, upload.single('image'), validateCategory, handleValidationErrors, async (req, res) => {
    try {
        const categoryData = {
            name: req.body.name,
            description: req.body.description || '',
            slug: req.body.slug || req.body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            parent: req.body.parent || null,
            sortOrder: parseInt(req.body.sortOrder) || 0,
            isActive: req.body.isActive !== 'false',
            seoTitle: req.body.seoTitle || '',
            seoDescription: req.body.seoDescription || ''
        };
        
        // Handle uploaded image
        if (req.file) {
            categoryData.image = {
                url: `/uploads/categories/${req.file.filename}`,
                alt: req.body.name,
                filename: req.file.filename
            };
        }
        
        const category = new Category(categoryData);
        await category.save();
        
        await category.populate('parent', 'name slug');
        
        res.status(201).json({
            success: true,
            message: 'Category created successfully',
            data: category
        });
    } catch (error) {
        console.error('Create category error:', error);
        
        // Clean up uploaded file if category creation fails
        if (req.file) {
            fs.unlink(req.file.path, (err) => {
                if (err) console.error('Failed to delete file:', err);
            });
        }
        
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Category slug already exists'
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Failed to create category',
            error: error.message
        });
    }
});

// Update category
router.put('/categories/:id', adminAuth, upload.single('image'), validateCategory, handleValidationErrors, async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        
        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }
        
        const updateData = {
            name: req.body.name,
            description: req.body.description || '',
            slug: req.body.slug || req.body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            parent: req.body.parent || null,
            sortOrder: parseInt(req.body.sortOrder) || 0,
            isActive: req.body.isActive !== 'false',
            seoTitle: req.body.seoTitle || '',
            seoDescription: req.body.seoDescription || '',
            updatedAt: new Date()
        };
        
        // Handle new uploaded image
        if (req.file) {
            // Delete old image if exists
            if (category.image && category.image.filename) {
                const oldFilePath = path.join(__dirname, '../uploads/categories', category.image.filename);
                fs.unlink(oldFilePath, (err) => {
                    if (err) console.error('Failed to delete old image:', err);
                });
            }
            
            updateData.image = {
                url: `/uploads/categories/${req.file.filename}`,
                alt: req.body.name,
                filename: req.file.filename
            };
        }
        
        const updatedCategory = await Category.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        ).populate('parent', 'name slug');
        
        res.json({
            success: true,
            message: 'Category updated successfully',
            data: updatedCategory
        });
    } catch (error) {
        console.error('Update category error:', error);
        
        // Clean up uploaded file if update fails
        if (req.file) {
            fs.unlink(req.file.path, (err) => {
                if (err) console.error('Failed to delete file:', err);
            });
        }
        
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Category slug already exists'
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Failed to update category',
            error: error.message
        });
    }
});

// Delete category
router.delete('/categories/:id', adminAuth, async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        
        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }
        
        // Check if category has products
        const productCount = await Product.countDocuments({ category: category._id });
        if (productCount > 0) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete category with ${productCount} associated products`
            });
        }
        
        // Check if category has child categories
        const childCount = await Category.countDocuments({ parent: category._id });
        if (childCount > 0) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete category with ${childCount} child categories`
            });
        }
        
        // Delete associated image file
        if (category.image && category.image.filename) {
            const filePath = path.join(__dirname, '../uploads/categories', category.image.filename);
            fs.unlink(filePath, (err) => {
                if (err) console.error('Failed to delete image:', err);
            });
        }
        
        await Category.findByIdAndDelete(req.params.id);
        
        res.json({
            success: true,
            message: 'Category deleted successfully'
        });
    } catch (error) {
        console.error('Delete category error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete category',
            error: error.message
        });
    }
});

// Category hierarchy endpoint
router.get('/categories/hierarchy/tree', auth, async (req, res) => {
    try {
        const categories = await Category.find({ isActive: true })
            .sort({ sortOrder: 1, name: 1 })
            .lean();
        
        // Build category tree
        const categoryMap = new Map();
        const rootCategories = [];
        
        // First pass: create map of all categories
        categories.forEach(category => {
            categoryMap.set(category._id.toString(), {
                ...category,
                children: []
            });
        });
        
        // Second pass: build hierarchy
        categories.forEach(category => {
            const categoryWithChildren = categoryMap.get(category._id.toString());
            
            if (category.parent) {
                const parent = categoryMap.get(category.parent.toString());
                if (parent) {
                    parent.children.push(categoryWithChildren);
                } else {
                    rootCategories.push(categoryWithChildren);
                }
            } else {
                rootCategories.push(categoryWithChildren);
            }
        });
        
        res.json({
            success: true,
            data: rootCategories
        });
    } catch (error) {
        console.error('Get category hierarchy error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch category hierarchy',
            error: error.message
        });
    }
});

module.exports = router;

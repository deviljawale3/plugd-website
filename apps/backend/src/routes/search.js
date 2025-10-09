const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Category = require('../models/Category');
const { query, validationResult } = require('express-validator');

// Search products
router.get('/products', [
    query('q').optional().isLength({ min: 1, max: 100 }).withMessage('Search query must be 1-100 characters'),
    query('category').optional().isMongoId().withMessage('Invalid category ID'),
    query('minPrice').optional().isFloat({ min: 0 }).withMessage('Minimum price must be positive'),
    query('maxPrice').optional().isFloat({ min: 0 }).withMessage('Maximum price must be positive'),
    query('sortBy').optional().isIn(['name', 'price', 'createdAt', 'rating']).withMessage('Invalid sort field'),
    query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be positive integer'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: errors.array()
            });
        }
        
        const {
            q = '',
            category,
            minPrice,
            maxPrice,
            sortBy = 'createdAt',
            sortOrder = 'desc',
            page = 1,
            limit = 12,
            inStock = true
        } = req.query;
        
        // Build search query
        let searchQuery = {
            isActive: true
        };
        
        // Text search
        if (q) {
            searchQuery.$or = [
                { name: { $regex: q, $options: 'i' } },
                { description: { $regex: q, $options: 'i' } },
                { tags: { $in: [new RegExp(q, 'i')] } }
            ];
        }
        
        // Category filter
        if (category) {
            searchQuery.category = category;
        }
        
        // Price range filter
        if (minPrice || maxPrice) {
            searchQuery.price = {};
            if (minPrice) searchQuery.price.$gte = parseFloat(minPrice);
            if (maxPrice) searchQuery.price.$lte = parseFloat(maxPrice);
        }
        
        // Stock filter
        if (inStock === 'true') {
            searchQuery.stock = { $gt: 0 };
        }
        
        // Build sort object
        const sortObj = {};
        sortObj[sortBy] = sortOrder === 'asc' ? 1 : -1;
        
        // Calculate pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        // Execute search
        const [products, totalCount] = await Promise.all([
            Product.find(searchQuery)
                .populate('category', 'name slug')
                .sort(sortObj)
                .skip(skip)
                .limit(parseInt(limit))
                .select('-__v'),
            Product.countDocuments(searchQuery)
        ]);
        
        // Calculate pagination info
        const totalPages = Math.ceil(totalCount / parseInt(limit));
        const hasNextPage = parseInt(page) < totalPages;
        const hasPrevPage = parseInt(page) > 1;
        
        res.json({
            success: true,
            data: {
                products,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages,
                    totalCount,
                    hasNextPage,
                    hasPrevPage,
                    limit: parseInt(limit)
                },
                filters: {
                    query: q,
                    category,
                    minPrice,
                    maxPrice,
                    sortBy,
                    sortOrder
                }
            }
        });
    } catch (error) {
        console.error('Search products error:', error);
        res.status(500).json({
            success: false,
            message: 'Search failed',
            error: error.message
        });
    }
});

// Get search suggestions
router.get('/suggestions', [
    query('q').isLength({ min: 1, max: 100 }).withMessage('Query required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: errors.array()
            });
        }
        
        const { q } = req.query;
        
        // Get product suggestions
        const productSuggestions = await Product.find({
            isActive: true,
            $or: [
                { name: { $regex: q, $options: 'i' } },
                { tags: { $in: [new RegExp(q, 'i')] } }
            ]
        })
        .select('name')
        .limit(5);
        
        // Get category suggestions
        const categorySuggestions = await Category.find({
            isActive: true,
            name: { $regex: q, $options: 'i' }
        })
        .select('name slug')
        .limit(3);
        
        res.json({
            success: true,
            data: {
                products: productSuggestions.map(p => p.name),
                categories: categorySuggestions.map(c => ({
                    name: c.name,
                    slug: c.slug
                }))
            }
        });
    } catch (error) {
        console.error('Search suggestions error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get suggestions',
            error: error.message
        });
    }
});

// Advanced filters endpoint
router.get('/filters', async (req, res) => {
    try {
        const { category } = req.query;
        
        let matchQuery = { isActive: true };
        if (category) {
            matchQuery.category = category;
        }
        
        // Get price range
        const priceRange = await Product.aggregate([
            { $match: matchQuery },
            {
                $group: {
                    _id: null,
                    minPrice: { $min: '$price' },
                    maxPrice: { $max: '$price' }
                }
            }
        ]);
        
        // Get available categories
        const categories = await Category.find({ isActive: true })
            .select('name slug')
            .sort('name');
        
        // Get popular tags
        const popularTags = await Product.aggregate([
            { $match: matchQuery },
            { $unwind: '$tags' },
            { $group: { _id: '$tags', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 20 }
        ]);
        
        res.json({
            success: true,
            data: {
                priceRange: priceRange[0] || { minPrice: 0, maxPrice: 0 },
                categories,
                popularTags: popularTags.map(tag => tag._id),
                sortOptions: [
                    { value: 'name_asc', label: 'Name (A-Z)' },
                    { value: 'name_desc', label: 'Name (Z-A)' },
                    { value: 'price_asc', label: 'Price (Low to High)' },
                    { value: 'price_desc', label: 'Price (High to Low)' },
                    { value: 'createdAt_desc', label: 'Newest First' },
                    { value: 'rating_desc', label: 'Highest Rated' }
                ]
            }
        });
    } catch (error) {
        console.error('Get filters error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get filters',
            error: error.message
        });
    }
});

module.exports = router;

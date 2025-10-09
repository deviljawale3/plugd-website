const express = require('express');
const Category = require('../models/Category');
const Product = require('../models/Product');
const { authenticate } = require('../middleware/auth');
const router = express.Router();

// @route   GET /api/categories
// @desc    Get all categories
// @access  Public
router.get('/', async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    
    res.json({
      success: true,
      data: categories
    });

  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error fetching categories' 
    });
  }
});

// @route   GET /api/categories/:id
// @desc    Get single category
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    
    if (!category) {
      return res.status(404).json({ 
        success: false, 
        message: 'Category not found' 
      });
    }

    res.json({
      success: true,
      data: category
    });

  } catch (error) {
    console.error('Get category error:', error);
    if (error.name === 'CastError') {
      return res.status(404).json({ 
        success: false, 
        message: 'Category not found' 
      });
    }
    res.status(500).json({ 
      success: false, 
      message: 'Server error fetching category' 
    });
  }
});

// @route   GET /api/categories/:id/products
// @desc    Get products by category
// @access  Public
router.get('/:id/products', async (req, res) => {
  try {
    const { page = 1, limit = 12, sort = 'createdAt', order = 'desc' } = req.query;
    
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ 
        success: false, 
        message: 'Category not found' 
      });
    }

    // Sort options
    const sortOrder = order === 'desc' ? -1 : 1;
    const sortObj = { [sort]: sortOrder };

    // Pagination
    const skip = (page - 1) * limit;

    const products = await Product.find({ category: category.name })
      .sort(sortObj)
      .skip(skip)
      .limit(Number(limit));

    const total = await Product.countDocuments({ category: category.name });

    res.json({
      success: true,
      data: products,
      category: category,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get category products error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error fetching category products' 
    });
  }
});

// @route   POST /api/categories
// @desc    Create new category
// @access  Private (Admin only)
router.post('/', authenticate, async (req, res) => {
  try {
    const { name, description, image } = req.body;

    // Check if category already exists
    const existingCategory = await Category.findOne({ 
      name: new RegExp(`^${name}$`, 'i') 
    });
    
    if (existingCategory) {
      return res.status(400).json({ 
        success: false, 
        message: 'Category already exists' 
      });
    }

    const category = new Category({
      name,
      description,
      image
    });

    const savedCategory = await category.save();

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: savedCategory
    });

  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error creating category' 
    });
  }
});

// @route   PUT /api/categories/:id
// @desc    Update category
// @access  Private (Admin only)
router.put('/:id', authenticate, async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    
    if (!category) {
      return res.status(404).json({ 
        success: false, 
        message: 'Category not found' 
      });
    }

    const { name, description, image } = req.body;

    // Check if another category with the same name exists
    if (name && name !== category.name) {
      const existingCategory = await Category.findOne({ 
        name: new RegExp(`^${name}$`, 'i'),
        _id: { $ne: req.params.id }
      });
      
      if (existingCategory) {
        return res.status(400).json({ 
          success: false, 
          message: 'Category with this name already exists' 
        });
      }
    }

    // Update fields
    if (name) category.name = name;
    if (description) category.description = description;
    if (image) category.image = image;

    const updatedCategory = await category.save();

    res.json({
      success: true,
      message: 'Category updated successfully',
      data: updatedCategory
    });

  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error updating category' 
    });
  }
});

// @route   DELETE /api/categories/:id
// @desc    Delete category
// @access  Private (Admin only)
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    
    if (!category) {
      return res.status(404).json({ 
        success: false, 
        message: 'Category not found' 
      });
    }

    // Check if there are products in this category
    const productsCount = await Product.countDocuments({ category: category.name });
    
    if (productsCount > 0) {
      return res.status(400).json({ 
        success: false, 
        message: `Cannot delete category. ${productsCount} products are still in this category.` 
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
      message: 'Server error deleting category' 
    });
  }
});

// @route   GET /api/categories/stats/summary
// @desc    Get category statistics
// @access  Public
router.get('/stats/summary', async (req, res) => {
  try {
    const categories = await Category.find();
    const categoryStats = [];

    for (const category of categories) {
      const productCount = await Product.countDocuments({ category: category.name });
      categoryStats.push({
        ...category.toObject(),
        productCount
      });
    }

    res.json({
      success: true,
      data: categoryStats
    });

  } catch (error) {
    console.error('Get category stats error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error fetching category statistics' 
    });
  }
});

module.exports = router;

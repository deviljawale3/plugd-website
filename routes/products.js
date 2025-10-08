const express = require('express');
const Product = require('../models/Product');
const { authenticate } = require('../middleware/auth');
const multer = require('multer');
const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// @route   GET /api/products
// @desc    Get all products
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { 
      category, 
      minPrice, 
      maxPrice, 
      search, 
      sort = 'createdAt', 
      order = 'desc',
      page = 1,
      limit = 12 
    } = req.query;

    // Build filter object
    let filter = {};
    
    if (category) {
      filter.category = new RegExp(category, 'i');
    }
    
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }
    
    if (search) {
      filter.$or = [
        { name: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') },
        { category: new RegExp(search, 'i') }
      ];
    }

    // Sort options
    const sortOrder = order === 'desc' ? -1 : 1;
    const sortObj = { [sort]: sortOrder };

    // Pagination
    const skip = (page - 1) * limit;

    const products = await Product.find(filter)
      .sort(sortObj)
      .skip(skip)
      .limit(Number(limit));

    const total = await Product.countDocuments(filter);

    res.json({
      success: true,
      data: products,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error fetching products' 
    });
  }
});

// @route   GET /api/products/:id
// @desc    Get single product
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
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
    if (error.name === 'CastError') {
      return res.status(404).json({ 
        success: false, 
        message: 'Product not found' 
      });
    }
    res.status(500).json({ 
      success: false, 
      message: 'Server error fetching product' 
    });
  }
});

// @route   POST /api/products
// @desc    Create new product
// @access  Private (Admin only)
router.post('/', authenticate, upload.array('images', 5), async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      category,
      brand,
      countInStock,
      specifications
    } = req.body;

    // Check if product with same name exists
    const existingProduct = await Product.findOne({ name });
    if (existingProduct) {
      return res.status(400).json({ 
        success: false, 
        message: 'Product with this name already exists' 
      });
    }

    // Handle image uploads (if any)
    const images = [];
    if (req.files && req.files.length > 0) {
      // In a real app, you'd upload to cloud storage
      // For now, we'll just store placeholder URLs
      req.files.forEach((file, index) => {
        images.push(`/uploads/products/${Date.now()}-${index}-${file.originalname}`);
      });
    }

    const product = new Product({
      name,
      description,
      price: Number(price),
      category,
      brand,
      countInStock: Number(countInStock),
      images,
      specifications: specifications ? JSON.parse(specifications) : {}
    });

    const savedProduct = await product.save();

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: savedProduct
    });

  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error creating product' 
    });
  }
});

// @route   PUT /api/products/:id
// @desc    Update product
// @access  Private (Admin only)
router.put('/:id', authenticate, upload.array('images', 5), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ 
        success: false, 
        message: 'Product not found' 
      });
    }

    const {
      name,
      description,
      price,
      category,
      brand,
      countInStock,
      specifications
    } = req.body;

    // Update fields
    if (name) product.name = name;
    if (description) product.description = description;
    if (price) product.price = Number(price);
    if (category) product.category = category;
    if (brand) product.brand = brand;
    if (countInStock !== undefined) product.countInStock = Number(countInStock);
    if (specifications) product.specifications = JSON.parse(specifications);

    // Handle new image uploads
    if (req.files && req.files.length > 0) {
      const newImages = [];
      req.files.forEach((file, index) => {
        newImages.push(`/uploads/products/${Date.now()}-${index}-${file.originalname}`);
      });
      product.images = [...product.images, ...newImages];
    }

    const updatedProduct = await product.save();

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: updatedProduct
    });

  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error updating product' 
    });
  }
});

// @route   DELETE /api/products/:id
// @desc    Delete product
// @access  Private (Admin only)
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ 
        success: false, 
        message: 'Product not found' 
      });
    }

    await Product.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });

  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error deleting product' 
    });
  }
});

// @route   GET /api/products/categories/list
// @desc    Get all product categories
// @access  Public
router.get('/categories/list', async (req, res) => {
  try {
    const categories = await Product.distinct('category');
    
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

module.exports = router;

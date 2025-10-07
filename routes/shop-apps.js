const express = require('express');
const Product = require('../models/Product');
const App = require('../models/App');
const { authenticate, requireAdmin } = require('../middleware/auth');
const router = express.Router();

// Get available platforms (only installed and active apps)
router.get('/platforms', authenticate, requireAdmin, async (req, res) => {
  try {
    const installedApps = await App.find({ 
      isInstalled: true, 
      isActive: true 
    }).select('name displayName platform icon');

    const platforms = installedApps.map(app => ({
      id: app.platform,
      name: app.displayName,
      icon: app.icon,
      appId: app._id
    }));

    res.json({ platforms });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch available platforms' });
  }
});

// Search products from a specific platform
router.post('/search', authenticate, requireAdmin, async (req, res) => {
  try {
    const { platform, query, limit = 20 } = req.body;

    // Check if the app is installed and active
    const app = await App.findOne({ 
      platform, 
      isInstalled: true, 
      isActive: true 
    });

    if (!app) {
      return res.status(400).json({ 
        error: `${platform} app is not installed or not active. Please install it from the App Store.` 
      });
    }

    // Update last used timestamp
    app.stats.lastUsed = new Date();
    await app.save();

    // Simulate API call to external platform
    const mockProducts = generateMockProducts(platform, query, limit);
    
    res.json({ 
      products: mockProducts,
      platform: app.displayName,
      query,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

// Import products from external platform
router.post('/import', authenticate, requireAdmin, async (req, res) => {
  try {
    const { platform, products } = req.body;

    // Check if the app is installed and active
    const app = await App.findOne({ 
      platform, 
      isInstalled: true, 
      isActive: true 
    });

    if (!app) {
      return res.status(400).json({ 
        error: `${platform} app is not installed. Please install it first.` 
      });
    }

    let imported = 0;
    const errors = [];

    for (const productData of products) {
      try {
        // Check if product already exists
        const existingProduct = await Product.findOne({
          $or: [
            { 'sourceData.external_id': productData.external_id },
            { name: productData.name, source: platform }
          ]
        });

        if (existingProduct) {
          errors.push(`Product "${productData.name}" already exists`);
          continue;
        }

        // Create new product
        const newProduct = new Product({
          name: productData.name,
          description: productData.description,
          price: productData.price,
          image: productData.image,
          category: productData.category || 'Imported',
          source: platform,
          sourceData: {
            external_id: productData.external_id,
            original_url: productData.url,
            imported_at: new Date(),
            app_version: app.version
          },
          inventory: {
            stock: productData.stock || 100,
            sku: `${platform.toUpperCase()}-${productData.external_id}`
          },
          seo: {
            slug: productData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            tags: [platform, productData.category].filter(Boolean)
          }
        });

        await newProduct.save();
        imported++;

      } catch (productError) {
        errors.push(`Failed to import "${productData.name}": ${productError.message}`);
      }
    }

    // Update app statistics
    app.stats.totalImports += imported;
    app.stats.productsCount = await Product.countDocuments({ source: platform });
    app.stats.lastUsed = new Date();
    await app.save();

    res.json({
      message: `Import completed`,
      imported,
      total: products.length,
      errors: errors.length > 0 ? errors : undefined,
      platform: app.displayName
    });

  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({ error: 'Import failed' });
  }
});

// Bulk categorize imported products
router.post('/categorize', authenticate, requireAdmin, async (req, res) => {
  try {
    const { productIds, newCategory } = req.body;

    const result = await Product.updateMany(
      { _id: { $in: productIds } },
      { 
        $set: { 
          category: newCategory,
          updatedAt: new Date()
        }
      }
    );

    res.json({
      message: `${result.modifiedCount} products categorized as "${newCategory}"`,
      modified: result.modifiedCount
    });
  } catch (error) {
    res.status(500).json({ error: 'Categorization failed' });
  }
});

// Get import statistics by platform
router.get('/import-stats', authenticate, requireAdmin, async (req, res) => {
  try {
    const stats = await Product.aggregate([
      {
        $match: { source: { $exists: true, $ne: 'manual' } }
      },
      {
        $group: {
          _id: '$source',
          count: { $sum: 1 },
          totalValue: { $sum: '$price' },
          categories: { $addToSet: '$category' },
          lastImported: { $max: '$createdAt' }
        }
      }
    ]);

    const appsData = await App.find({ isInstalled: true })
      .select('platform displayName stats icon');

    const enrichedStats = stats.map(stat => {
      const app = appsData.find(a => a.platform === stat._id);
      return {
        platform: stat._id,
        displayName: app?.displayName || stat._id,
        icon: app?.icon || '📦',
        productCount: stat.count,
        totalValue: stat.totalValue,
        categories: stat.categories,
        lastImported: stat.lastImported,
        appStats: app?.stats
      };
    });

    res.json({ stats: enrichedStats });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch import statistics' });
  }
});

// Mock product generator for simulation
function generateMockProducts(platform, query, limit) {
  const categories = ['Electronics', 'Fashion', 'Home & Garden', 'Sports', 'Books', 'Health & Beauty'];
  const products = [];

  for (let i = 0; i < limit; i++) {
    const productId = `${platform}_${query}_${i + 1}_${Date.now()}`;
    const category = categories[Math.floor(Math.random() * categories.length)];
    const price = (Math.random() * 200 + 10).toFixed(2);

    products.push({
      external_id: productId,
      name: `${query} ${category} Product ${i + 1}`,
      description: `High-quality ${query.toLowerCase()} product from ${platform}. Perfect for ${category.toLowerCase()} enthusiasts.`,
      price: parseFloat(price),
      image: `https://via.placeholder.com/300x200/${getColorForPlatform(platform)}/ffffff?text=${encodeURIComponent(query + ' ' + (i + 1))}`,
      category,
      stock: Math.floor(Math.random() * 100) + 10,
      url: `https://${platform}.com/product/${productId}`
    });
  }

  return products;
}

function getColorForPlatform(platform) {
  const colors = {
    amazon: 'ff9900',
    ebay: '0064d3',
    aliexpress: 'ff4747',
    shopify: '7ab55c',
    etsy: 'd5641c',
    walmart: '004c91'
  };
  return colors[platform] || '666666';
}

module.exports = router;

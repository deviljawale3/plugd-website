const express = require('express');
const App = require('../models/App');
const Product = require('../models/Product');
const { authenticate, requireAdmin } = require('../middleware/auth');
const router = express.Router();

// Get all available apps (marketplace)
router.get('/marketplace', authenticate, requireAdmin, async (req, res) => {
  try {
    // Initialize default apps if they don't exist
    const defaultApps = [
      {
        name: 'amazon-app',
        displayName: 'Amazon Integration',
        description: 'Import products directly from Amazon marketplace with real-time pricing and inventory sync.',
        icon: '🛒',
        platform: 'amazon',
        version: '2.1.0'
      },
      {
        name: 'ebay-app',
        displayName: 'eBay Marketplace',
        description: 'Connect to eBay to import auction and fixed-price listings with automated bidding features.',
        icon: '🏪',
        platform: 'ebay',
        version: '1.8.5'
      },
      {
        name: 'aliexpress-app',
        displayName: 'AliExpress Dropship',
        description: 'Bulk import from AliExpress with dropshipping automation and supplier management.',
        icon: '🏬',
        platform: 'aliexpress',
        version: '3.0.2'
      },
      {
        name: 'shopify-app',
        displayName: 'Shopify Connect',
        description: 'Sync products between multiple Shopify stores and manage inventory across platforms.',
        icon: '🛍️',
        platform: 'shopify',
        version: '2.5.1'
      },
      {
        name: 'etsy-app',
        displayName: 'Etsy Handmade',
        description: 'Import unique handmade and vintage items from Etsy sellers worldwide.',
        icon: '🎨',
        platform: 'etsy',
        version: '1.4.0'
      },
      {
        name: 'walmart-app',
        displayName: 'Walmart Wholesale',
        description: 'Access Walmart\'s wholesale marketplace for bulk product sourcing and distribution.',
        icon: '🏪',
        platform: 'walmart',
        version: '1.2.3'
      }
    ];

    // Create apps if they don't exist
    for (const appData of defaultApps) {
      await App.findOneAndUpdate(
        { name: appData.name },
        appData,
        { upsert: true, new: true }
      );
    }

    const apps = await App.find().sort({ displayName: 1 });
    res.json({ apps });
  } catch (error) {
    console.error('Marketplace fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch marketplace apps' });
  }
});

// Get installed apps only
router.get('/installed', authenticate, requireAdmin, async (req, res) => {
  try {
    const installedApps = await App.find({ isInstalled: true, isActive: true })
      .sort({ installedAt: -1 });
    res.json({ apps: installedApps });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch installed apps' });
  }
});

// Install an app
router.post('/install/:appId', authenticate, requireAdmin, async (req, res) => {
  try {
    const { appId } = req.params;
    const { configuration } = req.body;

    const app = await App.findById(appId);
    if (!app) {
      return res.status(404).json({ error: 'App not found' });
    }

    if (app.isInstalled) {
      return res.status(400).json({ error: 'App is already installed' });
    }

    app.isInstalled = true;
    app.installedAt = new Date();
    app.isActive = true;
    if (configuration) {
      app.configuration = { ...app.configuration, ...configuration };
    }

    await app.save();

    res.json({ 
      message: 'App installed successfully', 
      app: app.toObject() 
    });
  } catch (error) {
    console.error('App installation error:', error);
    res.status(500).json({ error: 'Failed to install app' });
  }
});

// Uninstall an app
router.post('/uninstall/:appId', authenticate, requireAdmin, async (req, res) => {
  try {
    const { appId } = req.params;
    const { keepProducts } = req.body;

    const app = await App.findById(appId);
    if (!app) {
      return res.status(404).json({ error: 'App not found' });
    }

    if (!app.isInstalled) {
      return res.status(400).json({ error: 'App is not installed' });
    }

    // Count products from this app
    const productCount = await Product.countDocuments({ source: app.platform });

    app.isInstalled = false;
    app.isActive = false;
    app.configuration = {};

    // Optionally remove products from this platform
    if (!keepProducts && productCount > 0) {
      await Product.deleteMany({ source: app.platform });
    }

    await app.save();

    res.json({ 
      message: 'App uninstalled successfully',
      productsRemoved: !keepProducts ? productCount : 0,
      app: app.toObject()
    });
  } catch (error) {
    console.error('App uninstallation error:', error);
    res.status(500).json({ error: 'Failed to uninstall app' });
  }
});

// Update app configuration
router.put('/configure/:appId', authenticate, requireAdmin, async (req, res) => {
  try {
    const { appId } = req.params;
    const { configuration } = req.body;

    const app = await App.findById(appId);
    if (!app) {
      return res.status(404).json({ error: 'App not found' });
    }

    if (!app.isInstalled) {
      return res.status(400).json({ error: 'App must be installed to configure' });
    }

    app.configuration = { ...app.configuration, ...configuration };
    await app.save();

    res.json({ 
      message: 'App configuration updated', 
      app: app.toObject() 
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update app configuration' });
  }
});

// Get app statistics
router.get('/stats', authenticate, requireAdmin, async (req, res) => {
  try {
    const totalApps = await App.countDocuments();
    const installedApps = await App.countDocuments({ isInstalled: true });
    const activeApps = await App.countDocuments({ isInstalled: true, isActive: true });

    // Get product counts by platform
    const platformStats = await Product.aggregate([
      { 
        $match: { 
          source: { $exists: true, $ne: 'manual' } 
        } 
      },
      { 
        $group: { 
          _id: '$source', 
          count: { $sum: 1 } 
        } 
      }
    ]);

    const stats = {
      totalApps,
      installedApps,
      activeApps,
      availableApps: totalApps - installedApps,
      platformStats: platformStats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {})
    };

    res.json({ stats });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch app statistics' });
  }
});

// Toggle app status (activate/deactivate)
router.post('/toggle/:appId', authenticate, requireAdmin, async (req, res) => {
  try {
    const { appId } = req.params;

    const app = await App.findById(appId);
    if (!app) {
      return res.status(404).json({ error: 'App not found' });
    }

    if (!app.isInstalled) {
      return res.status(400).json({ error: 'App must be installed to toggle status' });
    }

    app.isActive = !app.isActive;
    await app.save();

    res.json({ 
      message: `App ${app.isActive ? 'activated' : 'deactivated'} successfully`,
      app: app.toObject()
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to toggle app status' });
  }
});

module.exports = router;

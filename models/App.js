const mongoose = require('mongoose');

const appSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  displayName: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  icon: {
    type: String,
    required: true
  },
  platform: {
    type: String,
    required: true,
    enum: ['amazon', 'ebay', 'aliexpress', 'shopify', 'etsy', 'walmart']
  },
  version: {
    type: String,
    default: '1.0.0'
  },
  isInstalled: {
    type: Boolean,
    default: false
  },
  installedAt: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  },
  configuration: {
    apiKey: String,
    apiSecret: String,
    region: String,
    categories: [String],
    settings: mongoose.Schema.Types.Mixed
  },
  stats: {
    totalImports: {
      type: Number,
      default: 0
    },
    lastUsed: Date,
    productsCount: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('App', appSchema);

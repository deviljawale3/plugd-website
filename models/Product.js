const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    maxlength: 2000
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  originalPrice: {
    type: Number,
    default: function() { return this.price; }
  },
  discount: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  category: {
    type: String,
    required: true,
    enum: ['Electronics', 'Gaming', 'Fashion', 'Home', 'Sports', 'Books', 'Beauty', 'Other']
  },
  subCategory: String,
  brand: String,
  model: String,
  images: [{
    url: String,
    alt: String,
    isPrimary: { type: Boolean, default: false }
  }],
  specifications: {
    type: Map,
    of: String
  },
  inventory: {
    stock: { type: Number, default: 0, min: 0 },
    sku: { type: String, unique: true },
    trackInventory: { type: Boolean, default: true }
  },
  shipping: {
    weight: Number,
    dimensions: {
      length: Number,
      width: Number,
      height: Number
    },
    freeShipping: { type: Boolean, default: false },
    shippingCost: { type: Number, default: 0 }
  },
  seo: {
    metaTitle: String,
    metaDescription: String,
    slug: { type: String, unique: true }
  },
  ratings: {
    average: { type: Number, default: 0, min: 0, max: 5 },
    count: { type: Number, default: 0 }
  },
  tags: [String],
  isActive: { type: Boolean, default: true },
  isFeatured: { type: Boolean, default: false },
  source: {
    imported: { type: Boolean, default: false },
    platform: String,
    externalId: String,
    importedAt: Date
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Generate slug before saving
productSchema.pre('save', function(next) {
  if (this.isModified('name')) {
    this.seo.slug = this.name.toLowerCase()
      .replace(/[^\w ]+/g, '')
      .replace(/ +/g, '-');
  }
  
  // Auto-generate SKU if not provided
  if (!this.inventory.sku) {
    this.inventory.sku = 'PLUG-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5).toUpperCase();
  }
  
  next();
});

// Calculate discounted price
productSchema.virtual('discountedPrice').get(function() {
  return this.discount > 0 ? this.price * (1 - this.discount / 100) : this.price;
});

// Ensure virtual fields are serialized
productSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Product', productSchema);

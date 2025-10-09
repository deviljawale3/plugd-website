# Database Setup for PLUGD Marketplace

This directory contains all database-related files for the PLUGD marketplace application.

## Structure

```
database/
├── connection.js    # Database connection management
├── seeder.js       # Sample data seeding
├── utils.js        # Database utility functions
├── init.js         # Database initialization script
└── README.md       # This file

models/
├── User.js         # User model with authentication
├── Product.js      # Product model with variants
├── Category.js     # Category model with hierarchy
├── Order.js        # Order model with payment tracking
└── Review.js       # Review model with ratings
```

## Quick Start

### 1. Environment Setup

Make sure your `.env` file contains:
```env
MONGODB_URI=mongodb://localhost:27017/plugd_marketplace
# or for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/plugd_marketplace
```

### 2. Initialize Database

```bash
# Seed database with sample data
node database/init.js seed

# Clean and reseed database
node database/init.js reset --confirm true

# Check database health
node database/init.js health

# Show database statistics
node database/init.js stats
```

## Features

### 🔐 User Management
- **Authentication**: Bcrypt password hashing, JWT tokens
- **Roles**: User, Seller, Admin with different permissions
- **Security**: Account locking after failed attempts, email verification
- **Profiles**: Addresses, preferences, shopping history
- **AI Features**: Shopping preferences and recommendations

### 🛍️ Product Management
- **Rich Product Data**: Multiple images, variations (color, size, etc.)
- **Inventory Tracking**: Stock levels, low stock alerts
- **SEO Optimization**: Slugs, meta tags, search keywords
- **AI Integration**: Auto-generated tags, related products
- **Ratings & Reviews**: Comprehensive review system

### 📁 Category System
- **Hierarchical Structure**: Parent-child relationships, unlimited depth
- **Visual Elements**: Icons, colors, featured categories
- **SEO Friendly**: Slugs, breadcrumbs, meta data
- **Performance**: Optimized queries with proper indexing

### 🛒 Order Processing
- **Complete Order Flow**: Cart → Checkout → Payment → Fulfillment
- **Payment Integration**: Razorpay, Stripe, PayPal support
- **Address Management**: Shipping and billing addresses
- **Order Tracking**: Status updates, shipping information
- **Returns & Refunds**: Built-in return request system

### ⭐ Review System
- **Verified Reviews**: Only from actual purchases
- **Detailed Ratings**: Overall + category-specific ratings
- **Media Support**: Images and videos in reviews
- **Moderation**: Approval workflow, flagging system
- **AI Analysis**: Sentiment analysis, keyword extraction

## Database Schema

### Users Collection
```javascript
{
  firstName: String,
  lastName: String,
  email: String (unique),
  password: String (hashed),
  role: ['user', 'seller', 'admin'],
  addresses: [AddressSchema],
  cart: [CartItemSchema],
  wishlist: [ObjectId],
  aiProfile: {
    interests: [String],
    preferredCategories: [ObjectId],
    priceRange: { min: Number, max: Number }
  },
  // ... more fields
}
```

### Products Collection
```javascript
{
  name: String,
  description: String,
  category: ObjectId,
  seller: ObjectId,
  price: Number,
  images: [ImageSchema],
  inventory: {
    quantity: Number,
    lowStockThreshold: Number
  },
  variations: [VariationSchema],
  ratings: {
    average: Number,
    count: Number,
    distribution: Object
  },
  // ... more fields
}
```

### Orders Collection
```javascript
{
  orderNumber: String (unique),
  customer: ObjectId,
  items: [OrderItemSchema],
  total: Number,
  status: ['pending', 'confirmed', 'shipped', 'delivered'],
  payment: {
    method: String,
    status: String,
    transactionId: String
  },
  shippingAddress: AddressSchema,
  tracking: TrackingSchema,
  // ... more fields
}
```

## API Usage Examples

### Using Database Utils

```javascript
const DatabaseUtils = require('./database/utils');

// Search products
const results = await DatabaseUtils.searchProducts('smartphone', {
  page: 1,
  limit: 12,
  filters: {
    category: categoryId,
    priceRange: { min: 100, max: 1000 },
    rating: 4
  }
});

// Get user orders
const orders = await DatabaseUtils.getUserOrders(userId, {
  page: 1,
  limit: 10,
  status: 'delivered'
});

// Create review
const review = await DatabaseUtils.createReview({
  product: productId,
  customer: userId,
  order: orderId,
  rating: 5,
  title: 'Great product!',
  content: 'Really satisfied with this purchase.'
});

// Get dashboard stats
const stats = await DatabaseUtils.getDashboardStats(userId, 'seller');
```

### Direct Model Usage

```javascript
const User = require('./models/User');
const Product = require('./models/Product');

// Create user
const user = new User({
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  password: 'password123'
});
await user.save();

// Find products by category
const products = await Product.findByCategory(categoryId);

// Add item to cart
await user.addToCart(productId, 2, { color: 'red', size: 'L' });
```

## Performance Optimizations

### Indexes
- **Users**: email, role, isActive
- **Products**: category, status, featured, name (text), price
- **Orders**: customer, orderNumber, status, orderDate
- **Reviews**: product + customer (unique), status
- **Categories**: slug, parent, level

### Aggregation Pipelines
- **Sales Analytics**: Revenue, order statistics
- **Product Stats**: Rating distributions, review counts
- **Search**: Full-text search with relevance scoring

## Security Features

- **Password Security**: Bcrypt with salt rounds of 12
- **Account Protection**: Login attempt limiting, account locking
- **Data Validation**: Mongoose validators, schema validation
- **Sensitive Data**: Password excluded from queries by default
- **JWT Security**: Token-based authentication with expiration

## Monitoring & Maintenance

### Health Checks
```bash
# Check database status
node database/init.js health

# View statistics
node database/init.js stats
```

### Data Cleanup
```javascript
// Remove old pending orders and draft products
const result = await DatabaseUtils.cleanupOldData(30); // 30 days
console.log(`Cleaned ${result.deletedOrders} orders and ${result.deletedDrafts} drafts`);
```

## Test Data

The seeder creates:
- **5 Users**: 2 customers, 2 sellers, 1 admin
- **6 Categories**: Electronics, Fashion, Home, Sports, Books, Beauty
- **5 Products**: iPhone, Samsung phone, T-shirt, Security kit, Running shoes
- **1 Order**: Sample completed order with multiple items
- **3 Reviews**: Product reviews from verified purchases

### Test Accounts
- **Customer**: john.doe@example.com / password123
- **Seller**: jane.smith@example.com / password123
- **Admin**: admin@plugd.com / admin123

## MongoDB Best Practices

1. **Use appropriate data types** for better performance
2. **Index frequently queried fields** but avoid over-indexing
3. **Use lean queries** when you don't need full Mongoose documents
4. **Implement pagination** for large result sets
5. **Use aggregation pipelines** for complex queries
6. **Handle errors gracefully** with proper error messages
7. **Validate data** at both schema and application level

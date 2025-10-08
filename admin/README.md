# PLUGD Admin Content Management System

A comprehensive content management system for the PLUGD marketplace with advanced features for managing products, categories, users, orders, and reviews.

## 🌟 Features

### Dashboard & Analytics
- **Real-time Statistics**: Live stats for products, orders, users, and revenue
- **Interactive Charts**: Sales trends, product performance, user analytics
- **Recent Activities**: Monitor latest orders, user registrations, and reviews
- **Revenue Analytics**: Daily, weekly, monthly revenue tracking
- **System Health**: Database status and performance metrics

### Product Management
- **CRUD Operations**: Complete product lifecycle management
- **Image Upload**: Multi-image support with automatic processing
- **Inventory Tracking**: Stock levels with low-stock alerts
- **Categories**: Hierarchical category system
- **Bulk Operations**: Mass update/delete products
- **SEO Optimization**: Meta titles and descriptions
- **Product Variations**: Size, color, material options
- **Advanced Search**: Filter by category, status, price range

### Category Management
- **Hierarchical Structure**: Parent-child category relationships
- **Image Support**: Category banners and thumbnails
- **SEO Features**: Custom slugs and meta data
- **Sort Ordering**: Drag-and-drop category organization
- **Product Count**: Automatic product counting per category

### User Management
- **Role-based Access**: Admin, moderator, customer roles
- **User Analytics**: Registration trends and activity tracking
- **Customer Insights**: Purchase history and lifetime value
- **Account Management**: Activate/deactivate user accounts
- **Advanced Search**: Filter by role, status, registration date

### Order Management
- **Order Tracking**: Complete order lifecycle management
- **Status Updates**: Pending, processing, shipped, delivered
- **Payment Tracking**: Payment status and method tracking
- **Customer Communication**: Order notes and tracking numbers
- **Revenue Analytics**: Sales performance and trends
- **Export Features**: Order data export for reporting

### Review Management
- **Moderation System**: Approve/reject customer reviews
- **Rating Analytics**: Average ratings and distribution
- **Spam Detection**: Filter inappropriate content
- **Product Association**: Reviews linked to specific products
- **Customer Insights**: Review history per customer

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- NPM or Yarn package manager

### Installation

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Setup**
   Create a `.env` file with the following variables:
   ```env
   # Database
   MONGODB_URI=mongodb://localhost:27017/plugd_marketplace
   
   # Authentication
   JWT_SECRET=your_super_secure_jwt_secret_key
   
   # File Upload
   UPLOAD_PATH=./uploads
   MAX_FILE_SIZE=5242880
   
   # Email Configuration
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your_email@gmail.com
   SMTP_PASS=your_app_password
   
   # Payment Gateway
   RAZORPAY_KEY_ID=your_razorpay_key_id
   RAZORPAY_KEY_SECRET=your_razorpay_key_secret
   
   # Other Services
   API_KEYS=api_key_1,api_key_2
   ```

3. **Database Setup**
   ```bash
   # Initialize database with sample data
   node database/init.js seed
   
   # Or start fresh
   node database/init.js create-admin
   ```

4. **Start the Application**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

5. **Access Admin Panel**
   - URL: `http://localhost:3000/admin`
   - Default Admin: `admin@plugd.com`
   - Default Password: `admin123`

## 📁 Project Structure

```
PLUGD/
├── admin/                  # Admin dashboard frontend
│   ├── index.html         # Main admin interface
│   ├── styles/            # CSS styling
│   └── scripts/           # JavaScript functionality
├── database/              # Database configuration
│   ├── connection.js      # MongoDB connection
│   ├── seeder.js         # Sample data seeder
│   └── init.js           # Database initialization
├── models/                # Mongoose schemas
│   ├── User.js           # User model
│   ├── Product.js        # Product model
│   ├── Category.js       # Category model
│   ├── Order.js          # Order model
│   └── Review.js         # Review model
├── routes/                # API endpoints
│   ├── content.js        # Product/Category management
│   ├── management.js     # User/Order/Review management
│   └── dashboard.js      # Analytics and dashboard APIs
├── middleware/            # Express middleware
│   └── auth.js           # Authentication middleware
├── utils/                 # Utility functions
│   └── upload.js         # File upload handling
└── uploads/              # File storage
    ├── products/         # Product images
    ├── categories/       # Category images
    └── users/           # User avatars
```

## 🔧 API Endpoints

### Authentication
```
POST   /api/auth/login     # Admin login
POST   /api/auth/logout    # Admin logout
GET    /api/auth/profile   # Get current user profile
```

### Dashboard
```
GET    /api/dashboard/stats/overview      # Dashboard statistics
GET    /api/dashboard/activities/recent   # Recent activities
GET    /api/dashboard/analytics/sales     # Sales analytics
GET    /api/dashboard/analytics/users     # User analytics
GET    /api/dashboard/analytics/products  # Product analytics
GET    /api/dashboard/system/health       # System health
```

### Product Management
```
GET    /api/content/products              # List products
GET    /api/content/products/:id          # Get product
POST   /api/content/products              # Create product
PUT    /api/content/products/:id          # Update product
DELETE /api/content/products/:id          # Delete product
POST   /api/content/products/bulk         # Bulk operations
```

### Category Management
```
GET    /api/content/categories            # List categories
GET    /api/content/categories/:id        # Get category
POST   /api/content/categories            # Create category
PUT    /api/content/categories/:id        # Update category
DELETE /api/content/categories/:id        # Delete category
GET    /api/content/categories/hierarchy/tree  # Category tree
```

### User Management
```
GET    /api/management/users              # List users
GET    /api/management/users/:id          # Get user
POST   /api/management/users              # Create user
PUT    /api/management/users/:id          # Update user
DELETE /api/management/users/:id          # Delete user
```

### Order Management
```
GET    /api/management/orders             # List orders
GET    /api/management/orders/:id         # Get order
PUT    /api/management/orders/:id/status  # Update order status
GET    /api/management/orders/analytics/stats  # Order analytics
```

### Review Management
```
GET    /api/management/reviews            # List reviews
PUT    /api/management/reviews/:id/status # Update review status
DELETE /api/management/reviews/:id        # Delete review
GET    /api/management/reviews/analytics/stats  # Review analytics
```

## 🎨 Frontend Features

### Responsive Design
- **Mobile-first approach**: Optimized for all screen sizes
- **Modern UI/UX**: Clean, intuitive interface design
- **Dark/Light themes**: Customizable appearance
- **Accessibility**: WCAG 2.1 compliant

### Interactive Elements
- **Real-time updates**: Live data without page refresh
- **Drag & drop**: File uploads and category ordering
- **Advanced filtering**: Multi-criteria search and filtering
- **Bulk selection**: Mass operations on multiple items
- **Modal dialogs**: Smooth popup interfaces

### Data Visualization
- **Chart.js integration**: Beautiful, interactive charts
- **Progress indicators**: Visual progress tracking
- **Statistical widgets**: Key metrics at a glance
- **Export capabilities**: Download reports as PDF/CSV

## 🔒 Security Features

### Authentication & Authorization
- **JWT tokens**: Secure session management
- **Role-based access**: Granular permission system
- **Rate limiting**: Prevent brute force attacks
- **Session validation**: Automatic session expiry

### Data Protection
- **Input validation**: Server-side data validation
- **SQL injection prevention**: Mongoose ODM protection
- **XSS protection**: Content sanitization
- **File upload security**: Type and size validation

### API Security
- **CORS configuration**: Cross-origin request control
- **API key authentication**: External service protection
- **Request logging**: Audit trail for all actions
- **Error handling**: Secure error messages

## 📊 Database Schema

### User Model
```javascript
{
  email: String (unique),
  password: String (hashed),
  firstName: String,
  lastName: String,
  role: String (customer|admin|superadmin),
  phone: String,
  address: Object,
  cart: [CartItem],
  wishlist: [ObjectId],
  isActive: Boolean,
  lastLogin: Date,
  createdAt: Date
}
```

### Product Model
```javascript
{
  name: String,
  description: String,
  price: Number,
  comparePrice: Number,
  inventory: Number,
  category: ObjectId,
  brand: String,
  sku: String,
  images: [ImageObject],
  variations: [VariationObject],
  tags: [String],
  status: String,
  featured: Boolean,
  seoTitle: String,
  seoDescription: String,
  createdAt: Date
}
```

### Order Model
```javascript
{
  orderNumber: String,
  user: ObjectId,
  items: [OrderItem],
  subtotal: Number,
  tax: Number,
  shipping: Number,
  totalAmount: Number,
  status: String,
  paymentStatus: String,
  paymentMethod: String,
  shippingAddress: Object,
  trackingNumber: String,
  statusHistory: [StatusUpdate],
  createdAt: Date
}
```

## 🛠️ Configuration

### File Upload Settings
```javascript
// Maximum file sizes
IMAGE_MAX_SIZE = 5MB
DOCUMENT_MAX_SIZE = 10MB
ARCHIVE_MAX_SIZE = 50MB

// Allowed file types
IMAGE_TYPES = ['jpeg', 'jpg', 'png', 'webp', 'gif']
DOCUMENT_TYPES = ['pdf', 'doc', 'docx']
```

### Image Processing
```javascript
// Automatic image optimization
QUALITY = 85%
MAX_WIDTH = 1200px
MAX_HEIGHT = 800px
THUMBNAIL_SIZE = 200x200px
FORMAT = 'webp' (with JPEG fallback)
```

## 🚦 Development Workflow

### Code Style
- **ESLint**: JavaScript linting
- **Prettier**: Code formatting
- **Conventional Commits**: Commit message standards

### Testing
```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage

# E2E tests
npm run test:e2e
```

### Deployment
```bash
# Build for production
npm run build

# Deploy to staging
npm run deploy:staging

# Deploy to production
npm run deploy:production
```

## 📈 Performance Optimization

### Database
- **Indexing**: Optimized database queries
- **Pagination**: Efficient data loading
- **Caching**: Redis integration for faster responses
- **Connection pooling**: Optimized database connections

### Frontend
- **Lazy loading**: On-demand resource loading
- **Image optimization**: Automatic compression and WebP conversion
- **CDN integration**: Static asset delivery
- **Minification**: Compressed CSS and JavaScript

## 🔧 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   ```bash
   # Check MongoDB status
   sudo systemctl status mongod
   
   # Restart MongoDB
   sudo systemctl restart mongod
   ```

2. **File Upload Errors**
   ```bash
   # Check upload directory permissions
   chmod 755 uploads/
   chown -R node:node uploads/
   ```

3. **Authentication Issues**
   ```bash
   # Reset admin password
   node database/init.js reset-admin
   ```

### Logs
```bash
# Application logs
tail -f logs/app.log

# Error logs
tail -f logs/error.log

# Access logs
tail -f logs/access.log
```

## 🤝 Contributing

1. **Fork the repository**
2. **Create feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit changes**: `git commit -m 'Add amazing feature'`
4. **Push to branch**: `git push origin feature/amazing-feature`
5. **Open Pull Request**

### Development Guidelines
- Follow existing code style
- Write comprehensive tests
- Update documentation
- Use semantic versioning

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

- **Documentation**: [Wiki](https://github.com/plugd/plugd-marketplace/wiki)
- **Issues**: [GitHub Issues](https://github.com/plugd/plugd-marketplace/issues)
- **Discussions**: [GitHub Discussions](https://github.com/plugd/plugd-marketplace/discussions)
- **Email**: support@plugd.com

## 🎯 Roadmap

### Version 2.0
- [ ] Multi-language support
- [ ] Advanced analytics dashboard
- [ ] Email marketing integration
- [ ] Inventory management automation
- [ ] Customer segmentation

### Version 2.1
- [ ] Mobile app admin panel
- [ ] Real-time notifications
- [ ] Advanced reporting
- [ ] Third-party integrations
- [ ] AI-powered recommendations

---

**Built with ❤️ by the PLUGD Team**

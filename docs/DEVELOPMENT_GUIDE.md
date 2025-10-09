# Development Guide

## 🚀 Quick Start

### Prerequisites
- Node.js >= 18.0.0
- npm >= 8.0.0
- MongoDB (local or Atlas)
- Git

### Initial Setup
```bash
# Clone repository
git clone <repository-url>
cd plugd-website

# Install all dependencies
npm run install:all

# Copy environment files
cp apps/frontend/.env.example apps/frontend/.env.local
cp apps/backend/.env.example apps/backend/.env

# Start development servers
npm run dev          # Frontend
npm run backend:dev  # Backend (in another terminal)
```

## 🏗️ Development Workflow

### Branch Strategy
```
main                 # Production-ready code
├── develop         # Development integration
├── feature/*       # Feature development
├── bugfix/*        # Bug fixes
└── hotfix/*        # Production hotfixes
```

### Commit Convention
```
feat: add new product filtering feature
fix: resolve payment gateway timeout issue
docs: update API documentation
style: format code with prettier
refactor: reorganize user service logic
test: add unit tests for auth controller
chore: update dependencies
```

## 🛠️ Development Commands

### Frontend Development
```bash
# Start development server
cd apps/frontend
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run linting
npm run lint

# Run tests
npm run test
```

### Backend Development
```bash
# Start development server
cd apps/backend
npm run dev

# Start production server
npm run start

# Run tests
npm run test

# Database seeding
npm run seed
```

## 📁 Code Organization

### Frontend Structure
```
apps/frontend/src/
├── components/
│   ├── ui/              # Base components
│   │   ├── Button.jsx
│   │   ├── Input.jsx
│   │   └── Modal.jsx
│   ├── forms/           # Form components
│   │   ├── LoginForm.jsx
│   │   └── ProductForm.jsx
│   ├── layout/          # Layout components
│   │   ├── Header.jsx
│   │   ├── Footer.jsx
│   │   └── Sidebar.jsx
│   └── features/        # Feature components
│       ├── auth/
│       ├── products/
│       └── orders/
├── pages/              # Next.js pages
├── styles/             # Styling
├── utils/              # Utilities
└── hooks/              # Custom hooks
```

### Backend Structure
```
apps/backend/src/
├── controllers/        # Request handlers
├── middleware/         # Express middleware
├── models/            # Database models
├── routes/            # Route definitions
├── services/          # Business logic
├── utils/             # Utilities
├── config/            # Configuration
└── server.js          # Entry point
```

## 🎨 Coding Standards

### JavaScript/React Standards
```javascript
// Use functional components with hooks
const ProductCard = ({ product, onAddToCart }) => {
  const [isLoading, setIsLoading] = useState(false);
  
  const handleAddToCart = async () => {
    setIsLoading(true);
    try {
      await onAddToCart(product.id);
    } catch (error) {
      console.error('Failed to add to cart:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="product-card">
      <h3>{product.name}</h3>
      <p>${product.price}</p>
      <button 
        onClick={handleAddToCart}
        disabled={isLoading}
      >
        {isLoading ? 'Adding...' : 'Add to Cart'}
      </button>
    </div>
  );
};
```

### Node.js/Express Standards
```javascript
// Use async/await with proper error handling
const createProduct = async (req, res) => {
  try {
    // Validate input
    const { error } = productSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    // Business logic
    const product = await ProductService.create(req.body);
    
    // Success response
    res.status(201).json({
      success: true,
      data: product,
      message: 'Product created successfully'
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};
```

### Naming Conventions
```javascript
// Variables and functions: camelCase
const userName = 'john_doe';
const calculateTotalPrice = (items) => { };

// Components: PascalCase
const ProductCard = () => { };
const ShoppingCart = () => { };

// Constants: UPPER_SNAKE_CASE
const API_BASE_URL = 'https://api.example.com';
const MAX_RETRY_ATTEMPTS = 3;

// Files and folders: kebab-case
// product-card.jsx
// shopping-cart.jsx
// user-service.js
```

## 🧪 Testing Guidelines

### Frontend Testing
```javascript
// Component testing with React Testing Library
import { render, screen, fireEvent } from '@testing-library/react';
import ProductCard from '../ProductCard';

describe('ProductCard', () => {
  const mockProduct = {
    id: 1,
    name: 'Test Product',
    price: 99.99
  };

  test('renders product information correctly', () => {
    render(<ProductCard product={mockProduct} />);
    
    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText('$99.99')).toBeInTheDocument();
  });

  test('calls onAddToCart when button is clicked', () => {
    const mockOnAddToCart = jest.fn();
    render(
      <ProductCard 
        product={mockProduct} 
        onAddToCart={mockOnAddToCart} 
      />
    );
    
    fireEvent.click(screen.getByText('Add to Cart'));
    expect(mockOnAddToCart).toHaveBeenCalledWith(1);
  });
});
```

### Backend Testing
```javascript
// API testing with Jest and Supertest
const request = require('supertest');
const app = require('../app');

describe('POST /api/products', () => {
  test('should create a new product', async () => {
    const productData = {
      name: 'Test Product',
      price: 99.99,
      description: 'A test product'
    };

    const response = await request(app)
      .post('/api/products')
      .send(productData)
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.name).toBe('Test Product');
  });

  test('should validate required fields', async () => {
    const response = await request(app)
      .post('/api/products')
      .send({})
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('required');
  });
});
```

## 🔧 Environment Configuration

### Frontend Environment Variables
```env
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key
```

### Backend Environment Variables
```env
# .env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/plugd
JWT_SECRET=your-jwt-secret
JWT_EXPIRE=7d

# Payment Gateways
STRIPE_SECRET_KEY=sk_test_...
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=your-secret

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

## 🐛 Debugging

### Frontend Debugging
```javascript
// React Developer Tools
// Install browser extension for component inspection

// Console debugging
console.log('Debug info:', { user, products });

// Error boundaries
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <h1>Something went wrong.</h1>;
    }
    return this.props.children;
  }
}
```

### Backend Debugging
```javascript
// Debug with nodemon and inspect
// Start with: npm run dev:debug

// Logging
const logger = require('./utils/logger');
logger.info('User logged in', { userId: user.id });
logger.error('Database error', error);

// Database debugging
mongoose.set('debug', true); // Enable mongoose query logging
```

## 📊 Performance Optimization

### Frontend Performance
```javascript
// Lazy loading components
const LazyComponent = React.lazy(() => import('./HeavyComponent'));

// Memoization
const ExpensiveComponent = React.memo(({ data }) => {
  const memoizedValue = useMemo(() => {
    return expensiveCalculation(data);
  }, [data]);

  return <div>{memoizedValue}</div>;
});

// Image optimization
import Image from 'next/image';

<Image
  src="/product-image.jpg"
  alt="Product"
  width={300}
  height={200}
  priority={true}
/>
```

### Backend Performance
```javascript
// Database indexing
// In model definition
productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ category: 1, price: 1 });

// Caching
const cache = require('./utils/cache');

const getProducts = async (req, res) => {
  const cacheKey = `products_${req.query.page}_${req.query.category}`;
  
  let products = await cache.get(cacheKey);
  if (!products) {
    products = await Product.find(query);
    await cache.set(cacheKey, products, 300); // 5 minutes
  }
  
  res.json({ success: true, data: products });
};
```

## 🔄 State Management

### Frontend State (Zustand)
```javascript
// stores/useAuthStore.js
import { create } from 'zustand';

const useAuthStore = create((set, get) => ({
  user: null,
  isAuthenticated: false,
  login: async (credentials) => {
    try {
      const response = await api.post('/auth/login', credentials);
      set({ 
        user: response.data.user, 
        isAuthenticated: true 
      });
    } catch (error) {
      throw error;
    }
  },
  logout: () => {
    set({ user: null, isAuthenticated: false });
  }
}));

// Usage in component
const Login = () => {
  const { login, isAuthenticated } = useAuthStore();
  
  const handleSubmit = async (formData) => {
    try {
      await login(formData);
      router.push('/dashboard');
    } catch (error) {
      setError(error.message);
    }
  };
};
```

## 📱 Responsive Design

### Mobile-First Approach
```css
/* Base styles for mobile */
.product-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}

/* Tablet and up */
@media (min-width: 768px) {
  .product-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Desktop and up */
@media (min-width: 1024px) {
  .product-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
```

### Tailwind CSS Responsive Classes
```jsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <div className="p-4 bg-white rounded-lg shadow-md">
    <h3 className="text-lg font-semibold mb-2">Product Name</h3>
    <p className="text-gray-600 text-sm md:text-base">Description</p>
  </div>
</div>
```

## 🚀 Deployment

### Frontend Deployment (Vercel)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd apps/frontend
vercel --prod
```

### Backend Deployment (Railway)
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway deploy
```

## 📋 Checklist for New Features

- [ ] Create feature branch from develop
- [ ] Write tests first (TDD approach)
- [ ] Implement feature following coding standards
- [ ] Update documentation
- [ ] Test locally across different devices
- [ ] Create pull request with description
- [ ] Code review by team member
- [ ] Merge after approval
- [ ] Deploy to staging environment
- [ ] QA testing
- [ ] Deploy to production

---

Happy coding! 🚀
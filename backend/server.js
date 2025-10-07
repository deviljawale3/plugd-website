const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(async () => {
  console.log('✅ MongoDB connected successfully');
  
  // Create default super admin user if not exists
  try {
    const adminExists = await User.findOne({ role: 'super_admin' });
    if (!adminExists) {
      const defaultAdmin = new User({
        name: 'Super Admin',
        email: 'admin@plugd.com',
        password: 'admin123',
        role: 'super_admin'
      });
      await defaultAdmin.save();
      console.log('✅ Default super admin created: admin@plugd.com / admin123');
    }
  } catch (error) {
    console.error('❌ Error creating default admin:', error);
  }
})
.catch(err => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});

// Routes
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const shopAppsRoutes = require('./routes/shop-apps');
const customerRoutes = require('./routes/customers');
const appStoreRoutes = require('./routes/app-store'); // NEW

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/shop-apps', shopAppsRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/app-store', appStoreRoutes); // NEW

// Sample products endpoint
app.get('/api/products', (req, res) => {
  const sampleProducts = [
    {
      _id: "1",
      name: "Premium Headphones",
      description: "High-quality wireless headphones with noise cancellation",
      price: 199.99,
      image: "https://via.placeholder.com/300x200/4facfe/ffffff?text=Premium+Headphones",
      category: "Electronics"
    },
    {
      _id: "2", 
      name: "Smart Watch",
      description: "Advanced fitness tracking and smart notifications",
      price: 299.99,
      image: "https://via.placeholder.com/300x200/ff6b6b/ffffff?text=Smart+Watch",
      category: "Electronics"
    },
    {
      _id: "3",
      name: "Gaming Mouse", 
      description: "Professional gaming mouse with RGB lighting",
      price: 79.99,
      image: "https://via.placeholder.com/300x200/51cf66/ffffff?text=Gaming+Mouse",
      category: "Gaming"
    }
  ];
  
  res.json(sampleProducts);
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

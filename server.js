const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 10000;

// CORS Configuration - Fixed for Vercel
app.use(cors({
  origin: ['https://plugd.page.gd', 'http://localhost:3000', 'https://plugd-website.vercel.app'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// MongoDB Connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
  }
};

// Connect to database
connectDB();

// Sample Product Schema
const productSchema = new mongoose.Schema({
  name: String,
  description: String,
  price: Number,
  image: String,
  category: String,
  inStock: { type: Boolean, default: true }
}, { timestamps: true });

const Product = mongoose.model('Product', productSchema);

// Routes
app.get('/', (req, res) => {
  res.json({ 
    message: "Plugd API is running!", 
    status: "success",
    timestamp: new Date().toISOString() 
  });
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString() 
  });
});

// Get all products
app.get('/api/products', async (req, res) => {
  try {
    const products = await Product.find();
    
    // If no products exist, return sample products
    if (products.length === 0) {
      const sampleProducts = [
        {
          _id: '1',
          name: 'Premium Headphones',
          description: 'High-quality wireless headphones with noise cancellation',
          price: 199.99,
          image: 'https://via.placeholder.com/300x200/4facfe/ffffff?text=Premium+Headphones',
          category: 'Electronics'
        },
        {
          _id: '2',
          name: 'Smart Watch',
          description: 'Advanced fitness tracking and smart notifications',
          price: 299.99,
          image: 'https://via.placeholder.com/300x200/ff6b6b/ffffff?text=Smart+Watch',
          category: 'Electronics'
        },
        {
          _id: '3',
          name: 'Gaming Mouse',
          description: 'Professional gaming mouse with RGB lighting',
          price: 79.99,
          image: 'https://via.placeholder.com/300x200/51cf66/ffffff?text=Gaming+Mouse',
          category: 'Gaming'
        }
      ];
      return res.json(sampleProducts);
    }
    
    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Error fetching products', error: error.message });
  }
});

// Add a new product
app.post('/api/products', async (req, res) => {
  try {
    const product = new Product(req.body);
    await product.save();
    res.status(201).json(product);
  } catch (error) {
    res.status(400).json({ message: 'Error creating product', error: error.message });
  }
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Plugd API running on port ${PORT}`);
  console.log(`🌐 CORS enabled for: plugd.page.gd, localhost:3000, plugd-website.vercel.app`);
});

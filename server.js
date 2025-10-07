const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 10000;

// Middleware
app.use(cors({
  origin: ['https://plugd.page.gd', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json());

// MongoDB Connection
const connectDB = async () => {
  try {
    if (process.env.MONGODB_URI) {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log('✅ MongoDB Connected');
    }
  } catch (error) {
    console.log('MongoDB connection error:', error);
  }
};

connectDB();

// Routes
app.get('/', (req, res) => {
  res.json({ 
    message: 'Plugd API is running!', 
    status: 'success',
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

app.get('/api/products', (req, res) => {
  res.json({ 
    products: [
      { id: 1, name: 'iPhone 15 Pro', price: 999, category: 'Smartphones', image: 'https://via.placeholder.com/300' },
      { id: 2, name: 'MacBook Pro M3', price: 1999, category: 'Laptops', image: 'https://via.placeholder.com/300' },
      { id: 3, name: 'AirPods Pro', price: 249, category: 'Audio', image: 'https://via.placeholder.com/300' },
      { id: 4, name: 'iPad Air', price: 599, category: 'Tablets', image: 'https://via.placeholder.com/300' }
    ],
    total: 4
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Plugd API running on port ${PORT}`);
});

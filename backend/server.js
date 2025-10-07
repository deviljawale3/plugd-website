const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/plugd', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Basic Routes
app.get('/', (req, res) => {
  res.json({ message: 'Plugd API is running!', status: 'success' });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.get('/api/products', (req, res) => {
  res.json({ 
    products: [
      { id: 1, name: 'iPhone 15 Pro', price: 999, category: 'Smartphones' },
      { id: 2, name: 'MacBook Pro', price: 1999, category: 'Laptops' },
      { id: 3, name: 'AirPods Pro', price: 249, category: 'Audio' }
    ]
  });
});

app.listen(PORT, () => {
  console.log(`✅ Plugd API running on port ${PORT}`);
});

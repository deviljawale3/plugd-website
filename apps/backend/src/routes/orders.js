const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Middleware to verify admin token
const verifyAdminToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    req.adminId = decoded.userId;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Get all orders with filters and pagination
router.get('/', verifyAdminToken, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      paymentStatus,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const filter = {};
    
    // Status filter
    if (status && status !== 'all') {
      filter.orderStatus = status;
    }
    
    // Payment status filter
    if (paymentStatus && paymentStatus !== 'all') {
      filter.paymentStatus = paymentStatus;
    }
    
    // Search filter
    if (search) {
      filter.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { 'customerDetails.name': { $regex: search, $options: 'i' } },
        { 'customerDetails.email': { $regex: search, $options: 'i' } }
      ];
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const orders = await Order.find(filter)
      .populate('customer', 'name email')
      .populate('products.productId', 'name image')
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Order.countDocuments(filter);
    
    // Get statistics
    const stats = await Order.aggregate([
      {
        $group: {
          _id: '$orderStatus',
          count: { $sum: 1 },
          totalValue: { $sum: '$pricing.total' }
        }
      }
    ]);

    const statusStats = {
      pending: 0,
      accepted: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
      declined: 0
    };

    stats.forEach(stat => {
      statusStats[stat._id] = {
        count: stat.count,
        totalValue: stat.totalValue
      };
    });

    res.json({
      orders,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalOrders: total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      },
      stats: statusStats
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Get single order details
router.get('/:orderId', verifyAdminToken, async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId)
      .populate('customer', 'name email phone')
      .populate('products.productId')
      .populate('timeline.updatedBy', 'name')
      .lean();

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({ order });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ error: 'Failed to fetch order details' });
  }
});

// Update order status (Accept/Decline/Process/Ship/etc.)
router.patch('/:orderId/status', verifyAdminToken, async (req, res) => {
  try {
    const { status, note, shippingDetails } = req.body;
    
    const validStatuses = ['pending', 'accepted', 'processing', 'shipped', 'delivered', 'cancelled', 'declined'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const updateData = {
      orderStatus: status,
      $push: {
        timeline: {
          status,
          timestamp: new Date(),
          updatedBy: req.adminId,
          note
        }
      }
    };

    // Add shipping details if provided
    if (shippingDetails && status === 'shipped') {
      updateData.shippingDetails = shippingDetails;
    }

    const order = await Order.findByIdAndUpdate(
      req.params.orderId,
      updateData,
      { new: true }
    ).populate('customer', 'name email');

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({ 
      message: `Order ${status} successfully`,
      order
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

// Update admin notes
router.patch('/:orderId/notes', verifyAdminToken, async (req, res) => {
  try {
    const { adminNotes, internalNotes } = req.body;
    
    const updateData = {};
    if (adminNotes !== undefined) updateData['notes.adminNotes'] = adminNotes;
    if (internalNotes !== undefined) updateData['notes.internalNotes'] = internalNotes;

    const order = await Order.findByIdAndUpdate(
      req.params.orderId,
      updateData,
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({ 
      message: 'Notes updated successfully',
      order
    });
  } catch (error) {
    console.error('Error updating notes:', error);
    res.status(500).json({ error: 'Failed to update notes' });
  }
});

// Bulk status update
router.patch('/bulk/status', verifyAdminToken, async (req, res) => {
  try {
    const { orderIds, status, note } = req.body;
    
    const validStatuses = ['accepted', 'declined', 'cancelled', 'processing'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status for bulk update' });
    }

    const updateData = {
      orderStatus: status,
      $push: {
        timeline: {
          status,
          timestamp: new Date(),
          updatedBy: req.adminId,
          note: note || `Bulk ${status} by admin`
        }
      }
    };

    const result = await Order.updateMany(
      { _id: { $in: orderIds } },
      updateData
    );

    res.json({ 
      message: `${result.modifiedCount} orders updated to ${status}`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Error bulk updating orders:', error);
    res.status(500).json({ error: 'Failed to bulk update orders' });
  }
});

// Customer order creation (for testing - this would normally come from frontend)
router.post('/create', async (req, res) => {
  try {
    const {
      customerId,
      products,
      customerDetails,
      paymentMethod = 'razorpay'
    } = req.body;

    // Calculate pricing
    let subtotal = 0;
    const orderProducts = [];

    for (const item of products) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(404).json({ error: `Product ${item.productId} not found` });
      }
      
      const itemTotal = product.price * item.quantity;
      subtotal += itemTotal;
      
      orderProducts.push({
        productId: item.productId,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        image: product.image,
        sku: product.sku
      });
    }

    const tax = subtotal * 0.18; // 18% GST
    const shipping = subtotal > 500 ? 0 : 50; // Free shipping above 500
    const total = subtotal + tax + shipping;

    const order = new Order({
      customer: customerId,
      customerDetails,
      products: orderProducts,
      paymentMethod,
      pricing: {
        subtotal,
        tax,
        shipping,
        total
      },
      timeline: [{
        status: 'pending',
        timestamp: new Date()
      }]
    });

    await order.save();
    await order.populate('customer', 'name email');

    res.status(201).json({
      message: 'Order created successfully',
      order
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

module.exports = router;

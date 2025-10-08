const express = require('express');
const router = express.Router();
const PaymentService = require('../services/PaymentService');
const Order = require('../models/Order');
const auth = require('../middleware/auth'); // Assuming you have auth middleware
const paymentService = new PaymentService();
// Get available payment methods
router.get('/methods', async (req, res) => {
try {
const methods = paymentService.getAvailablePaymentMethods();
res.json({
success: true,
methods
});
} catch (error) {
console.error('Get payment methods error:', error);
res.status(500).json({
success: false,
error: 'Failed to get payment methods'
});
}
});
// Create payment order
router.post('/create-order', auth, async (req, res) => {
try {
const {
orderId,

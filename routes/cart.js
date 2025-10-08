const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const User = require('../models/User');
const Product = require('../models/Product');
const { body, validationResult } = require('express-validator');

// Get user's cart
router.get('/', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).populate({
            path: 'cart.product',
            select: 'name price images stock isActive'
        });
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        // Filter out inactive products
        const activeCartItems = user.cart.filter(item => 
            item.product && item.product.isActive
        );
        
        // Calculate totals
        const subtotal = activeCartItems.reduce((total, item) => 
            total + (item.product.price * item.quantity), 0
        );
        
        res.json({
            success: true,
            data: {
                items: activeCartItems,
                itemCount: activeCartItems.length,
                subtotal,
                total: subtotal // Add shipping/tax logic here if needed
            }
        });
    } catch (error) {
        console.error('Get cart error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch cart',
            error: error.message
        });
    }
});

// Add item to cart
router.post('/', [
    auth,
    body('productId').isMongoId().withMessage('Valid product ID required'),
    body('quantity').isInt({ min: 1, max: 10 }).withMessage('Quantity must be between 1 and 10')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: errors.array()
            });
        }
        
        const { productId, quantity = 1 } = req.body;
        
        // Check if product exists and is active
        const product = await Product.findById(productId);
        if (!product || !product.isActive) {
            return res.status(404).json({
                success: false,
                message: 'Product not found or unavailable'
            });
        }
        
        // Check stock availability
        if (product.stock < quantity) {
            return res.status(400).json({
                success: false,
                message: 'Insufficient stock available'
            });
        }
        
        const user = await User.findById(req.user.id);
        
        // Check if item already exists in cart
        const existingItemIndex = user.cart.findIndex(
            item => item.product.toString() === productId
        );
        
        if (existingItemIndex > -1) {
            // Update quantity
            const newQuantity = user.cart[existingItemIndex].quantity + quantity;
            
            if (newQuantity > product.stock) {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot add more items than available stock'
                });
            }
            
            user.cart[existingItemIndex].quantity = newQuantity;
        } else {
            // Add new item
            user.cart.push({
                product: productId,
                quantity,
                addedAt: new Date()
            });
        }
        
        await user.save();
        
        // Return updated cart
        const updatedUser = await User.findById(req.user.id).populate({
            path: 'cart.product',
            select: 'name price images stock'
        });
        
        res.json({
            success: true,
            message: 'Item added to cart',
            data: {
                cart: updatedUser.cart,
                itemCount: updatedUser.cart.length
            }
        });
    } catch (error) {
        console.error('Add to cart error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add item to cart',
            error: error.message
        });
    }
});

// Update cart item quantity
router.put('/:productId', [
    auth,
    body('quantity').isInt({ min: 0, max: 10 }).withMessage('Quantity must be between 0 and 10')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: errors.array()
            });
        }
        
        const { productId } = req.params;
        const { quantity } = req.body;
        
        const user = await User.findById(req.user.id);
        const cartItemIndex = user.cart.findIndex(
            item => item.product.toString() === productId
        );
        
        if (cartItemIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Item not found in cart'
            });
        }
        
        if (quantity === 0) {
            // Remove item from cart
            user.cart.splice(cartItemIndex, 1);
        } else {
            // Check stock availability
            const product = await Product.findById(productId);
            if (quantity > product.stock) {
                return res.status(400).json({
                    success: false,
                    message: 'Insufficient stock available'
                });
            }
            
            user.cart[cartItemIndex].quantity = quantity;
        }
        
        await user.save();
        
        res.json({
            success: true,
            message: quantity === 0 ? 'Item removed from cart' : 'Cart updated',
            data: {
                itemCount: user.cart.length
            }
        });
    } catch (error) {
        console.error('Update cart error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update cart',
            error: error.message
        });
    }
});

// Remove item from cart
router.delete('/:productId', auth, async (req, res) => {
    try {
        const { productId } = req.params;
        
        const user = await User.findById(req.user.id);
        const initialCartLength = user.cart.length;
        
        user.cart = user.cart.filter(
            item => item.product.toString() !== productId
        );
        
        if (user.cart.length === initialCartLength) {
            return res.status(404).json({
                success: false,
                message: 'Item not found in cart'
            });
        }
        
        await user.save();
        
        res.json({
            success: true,
            message: 'Item removed from cart',
            data: {
                itemCount: user.cart.length
            }
        });
    } catch (error) {
        console.error('Remove from cart error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to remove item from cart',
            error: error.message
        });
    }
});

// Clear entire cart
router.delete('/', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        user.cart = [];
        await user.save();
        
        res.json({
            success: true,
            message: 'Cart cleared successfully'
        });
    } catch (error) {
        console.error('Clear cart error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to clear cart',
            error: error.message
        });
    }
});

module.exports = router;

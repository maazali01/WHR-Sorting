const express = require('express');
const router = express.Router();
const Product = require('../models/Products');
const Order = require('../models/Order');
const { authMiddleware } = require('../middleware/authmiddleware');
const Log = require('../models/Log');
const User = require('../models/Users');
const bcrypt = require('bcryptjs');

// CREATE a new product
router.post('/', async (req, res) => {
  try {
    const { name, price, imageUrl } = req.body;
    if (!name || !price || !imageUrl) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const newProduct = new Product({ name, price, imageUrl });
    const savedProduct = await newProduct.save();
    res.status(201).json(savedProduct);
  } catch (err) {
    console.error('Error creating product:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// READ products with search query
router.get('/', async (req, res) => {
  try {
    const query = req.query.query || ''; // Get the query from URL (default to empty string)

    let products;
    if (query) {
      // If there is a query, search products matching the query
      products = await Product.find({
        name: { $regex: query, $options: 'i' }  // Case-insensitive search
      });
    } else {
      // If no query is provided, return all products
      products = await Product.find();
    }

    if (products.length === 0) {
      return res.status(200).json({ message: 'No products found' });
    }

    res.status(200).json(products);
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/* ------------------ USER endpoints (must be before param product routes) ------------------ */

// POST a new order (requires auth so we can attach user)
router.post('/orders', authMiddleware, async (req, res) => {
  try {
    const { items, total, date } = req.body;
    
    console.log('Creating order for user:', req.user);
    console.log('User ID being saved:', req.user?.id || req.user?._id);
    
    // ✅ Validate stock availability before creating order
    for (const item of items) {
      const product = await Product.findById(item._id);
      
      if (!product) {
        return res.status(404).json({ 
          message: `Product "${item.name}" not found` 
        });
      }
      
      if (product.quantity < item.quantity) {
        return res.status(400).json({ 
          message: `Insufficient stock for "${item.name}". Available: ${product.quantity}, Requested: ${item.quantity}` 
        });
      }
    }
    
    // ✅ Deduct quantities from inventory
    for (const item of items) {
      await Product.findByIdAndUpdate(
        item._id,
        { $inc: { quantity: -item.quantity } }
      );
    }
    
    const userId = req.user?.id || req.user?._id;
    
    const newOrder = new Order({
      items,
      total,
      date: date || new Date().toISOString(),
      user: userId
    });
    
    console.log('Order before save:', newOrder);
    
    const savedOrder = await newOrder.save();
    
    await savedOrder.populate('user', 'username email');
    
    console.log('Order after save with user:', savedOrder);

    // Log the order creation
    try {
      const userDoc = userId ? await User.findById(userId).select('username email') : null;
      await Log.create({
        userId,
        userName: userDoc ? (userDoc.username || userDoc.email || 'user') : 'user',
        type: 'user',
        action: 'CREATE_ORDER',
        details: {
          orderId: savedOrder._id,
          total: savedOrder.total,
          itemsCount: (savedOrder.items || []).length,
          items: (savedOrder.items || []).map(it => ({ name: it.name, qty: it.quantity, price: it.price }))
        }
      });
    } catch (logErr) {
      console.error('Failed to write order creation log:', logErr);
    }

    res.status(201).json({ message: 'Order placed successfully', order: savedOrder });
  } catch (err) {
    console.error('Error placing order:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET orders for authenticated user (authenticated)
router.get('/orders', authMiddleware, async (req, res) => {
  try {
    const uid = req.user?.id;
    if (!uid) return res.status(401).json({ message: 'Unauthorized' });
    const orders = await Order.find({ user: uid }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    console.error('Error fetching user orders:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET authenticated user's profile
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const uid = req.user?.id;
    if (!uid) return res.status(401).json({ message: 'Unauthorized' });
    const user = await User.findById(uid).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error('Error fetching profile:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT update authenticated user's profile
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const uid = req.user?.id;
    if (!uid) return res.status(401).json({ message: 'Unauthorized' });

    const { username, email, password } = req.body;
    const update = {};
    if (username) update.username = username;
    if (email) update.email = email;
    if (password) {
      const salt = await bcrypt.genSalt(10);
      update.password = await bcrypt.hash(password, salt);
    }

    const updated = await User.findByIdAndUpdate(uid, update, { new: true }).select('-password');
    if (!updated) return res.status(404).json({ message: 'User not found' });

    res.json({ message: 'Profile updated', user: updated });
  } catch (err) {
    console.error('Error updating profile:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/* ------------------ PRODUCT param routes (define after user routes) ------------------ */

// READ single product by ID
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.status(200).json(product);
  } catch (err) {
    console.error('Error fetching product:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// UPDATE a product by ID
router.put('/:id', async (req, res) => {
  try {
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.status(200).json(updatedProduct);
  } catch (err) {
    console.error('Error updating product:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE a product by ID
router.delete('/:id', async (req, res) => {
  try {
    const deletedProduct = await Product.findByIdAndDelete(req.params.id);
    if (!deletedProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.status(200).json({ message: 'Product deleted successfully' });
  } catch (err) {
    console.error('Error deleting product:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

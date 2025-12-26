const express = require('express');
const router = express.Router();
const Product = require('../models/Products');
const Log = require('../models/Log');
const User = require('../models/Users');

// POST: Add a new product
router.post('/products', async (req, res) => {
  try {
    const { name, description, price, quantity, category, imageUrl } = req.body;

    if (!name || !description || price == null || quantity == null || !category || !imageUrl) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const newProduct = new Product({ name, description, price, quantity, category, imageUrl });
    const savedProduct = await newProduct.save();

    // Log the creation
    try {
      const userId = req.user?.id || null;
      const userDoc = userId ? await User.findById(userId).select('username email') : null;
      await Log.create({
        userId,
        userName: userDoc ? (userDoc.username || userDoc.email || 'admin') : 'admin',
        type: 'admin',
        action: 'CREATE_PRODUCT',
        details: { productId: savedProduct._id, name: savedProduct.name, price: savedProduct.price, quantity: savedProduct.quantity, category: savedProduct.category }
      });
    } catch (logErr) {
      console.error('Failed to write product creation log:', logErr);
    }

    res.status(201).json(savedProduct);
  } catch (err) {
    console.error('Error adding product:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT: Update a product by ID
router.put('/products/:id', async (req, res) => {
  try {
    // capture previous document to compute diffs for logging
    const prev = await Product.findById(req.params.id).lean();
    if (!prev) return res.status(404).json({ message: 'Product not found' });

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // build changed fields
    const changes = {};
    const fields = ['name','description','price','quantity','category','imageUrl'];
    fields.forEach(f => {
      const before = prev[f];
      const after = updatedProduct[f];
      // handle numbers vs strings by loose inequality
      if ((before == null && after != null) || (before != null && String(before) !== String(after))) {
        changes[f] = { before, after };
      }
    });

    // Log the update
    try {
      const userId = req.user?.id || null;
      const userDoc = userId ? await User.findById(userId).select('username email') : null;
      await Log.create({
        userId,
        userName: userDoc ? (userDoc.username || userDoc.email || 'admin') : 'admin',
        type: 'admin',
        action: 'UPDATE_PRODUCT',
        details: { productId: updatedProduct._id, changes }
      });
    } catch (logErr) {
      console.error('Failed to write product update log:', logErr);
    }

    res.json(updatedProduct);
  } catch (err) {
    console.error('Error updating product:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE: Remove a product by ID
router.delete('/products/:id', async (req, res) => {
  try {
    const deletedProduct = await Product.findByIdAndDelete(req.params.id);
    if (!deletedProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Log deletion
    try {
      const userId = req.user?.id || null;
      const userDoc = userId ? await User.findById(userId).select('username email') : null;
      await Log.create({
        userId,
        userName: userDoc ? (userDoc.username || userDoc.email || 'admin') : 'admin',
        type: 'admin',
        action: 'DELETE_PRODUCT',
        details: { productId: deletedProduct._id, name: deletedProduct.name, category: deletedProduct.category }
      });
    } catch (logErr) {
      console.error('Failed to write product deletion log:', logErr);
    }

    res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    console.error('Error deleting product:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET: Fetch all products
router.get('/products', async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

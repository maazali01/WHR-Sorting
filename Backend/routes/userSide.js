const express = require('express');
const router = express.Router();
const Product = require('../models/Products');
const Order = require('../models/Order');

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

    console.log(query)
    
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

// POST a new order
router.post('/orders', async (req, res) => {
  try {
    const { items, total, date } = req.body;

    const newOrder = new Order({
      items,
      total,
      date: date || new Date().toISOString()
    });

    const savedOrder = await newOrder.save();

    res.status(201).json({ message: 'Order placed successfully', order: savedOrder });
  } catch (err) {
    console.error('Error placing order:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

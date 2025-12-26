import React, { useState, useEffect, useContext, useMemo } from 'react';
import axios from 'axios';
import { FiSearch, FiX } from 'react-icons/fi';
import { CartContext } from './Cartcontext';
import './ProductList.css';

const UserProductList = ({ searchTerm, onSearchChange }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useContext(CartContext);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get('http://localhost:4000/user/products');
        setProducts(response.data && Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Filter products based on search term
  const displayProducts = useMemo(() => {
    if (!searchTerm || !searchTerm.trim()) return products;
    
    const term = searchTerm.toLowerCase();
    return products.filter(product => 
      product.name.toLowerCase().includes(term) ||
      product.description?.toLowerCase().includes(term) ||
      product.category?.toLowerCase().includes(term)
    );
  }, [products, searchTerm]);

  const handleAddToCart = (product) => {
    addToCart(product);
  };

  const handleClearSearch = () => {
    onSearchChange('');
  };

  return (
    <div className="user-product-list">
      {/* Header Section */}
      <div className="products-header-section">
        <h2 className="products-heading">Products</h2>
        
        {/* Modern Search Bar */}
        <div className="desktop-search-container">
          <div className="desktop-search-bar">
            <FiSearch className="search-icon" />
            <input
              type="text"
              className="desktop-search-input"
              placeholder="Search products by name, category, or description..."
              value={searchTerm || ''}
              onChange={(e) => onSearchChange(e.target.value)}
            />
            {searchTerm && (
              <button 
                className="clear-search-btn"
                onClick={handleClearSearch}
                aria-label="Clear search"
              >
                <FiX />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="loading-state">Loading products...</div>
      ) : displayProducts.length === 0 ? (
        <div className="empty-state">
          <p>No products found</p>
          {searchTerm && (
            <button 
              className="clear-search-link"
              onClick={handleClearSearch}
            >
              Clear search to see all products
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="products-grid">
            {displayProducts.map((product) => (
              <div className="user-product-card" key={product._id}>
                {product.imageUrl && (
                  <img src={product.imageUrl} alt={product.name} className="user-product-image" />
                )}
                <div className="user-product-info">
                  <div className="user-product-header">
                    <h3 className="user-product-name">{product.name}</h3>
                    <p className="user-product-price">${product.price}</p>
                  </div>
                  {product.description && (
                    <p className="user-product-description">{product.description}</p>
                  )}
                  
                  {/* ✅ Stock Status Indicator */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                    <span className="user-category-tag">{product.category}</span>
                    <span style={{
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      backgroundColor: product.quantity <= 0 ? '#fee2e2' : '#d1fae5',
                      color: product.quantity <= 0 ? '#991b1b' : '#065f46'
                    }}>
                      {product.quantity <= 0 ? 'Out of Stock' : 'Available'}
                    </span>
                  </div>

                  <button
                    className="userr-add-to-cart-btn"
                    onClick={() => handleAddToCart(product)}
                    disabled={product.quantity <= 0}
                    style={product.quantity <= 0 ? { 
                      opacity: 0.6, 
                      cursor: 'not-allowed',
                      // backgroundColor: '#168110ff'
                    } : {}}
                  >
                    {product.quantity <= 0 ? 'Out of Stock' : 'Add to Cart'}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Search Results Info - Moved Below Products */}
          {searchTerm && (
            <div className="search-results-info">
              Showing {displayProducts.length} {displayProducts.length === 1 ? 'product' : 'products'}
              {searchTerm && ` for "${searchTerm}"`}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default UserProductList;

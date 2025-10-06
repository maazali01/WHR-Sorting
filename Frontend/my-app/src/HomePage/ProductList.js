import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Cookie from 'js-cookie';
import { CartContext } from './Cartcontext';
import './ProductList.css';
import Loader from '../Loader/loader';

const UserProductList = () => {
  const [products, setProducts] = useState([]);
  const [error, setError] = useState(null);
  const { addToCart } = useContext(CartContext);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get('http://localhost:4000/user/products');
        setProducts(response.data);
        setError(null);
      } catch (error) {
        if (error.response) {
          setError(`Error: ${error.response.data.message}`);
        } else {
          setError('Error fetching products. Please try again later.');
        }
        console.error('Error fetching products:', error);
      }
    };

    fetchProducts();
  }, []);

  const handleAddToCart = (product) => {
    const token = Cookie.get('token');
    if (!token) {
      navigate('/Login');
    } else {
      addToCart(product);
    }
  };

  return (
    <div className="user-product-list">
      <h2 className="product-heading">Products</h2>
      {error && <p className="error">{error}</p>}
      
      {products.length > 0 ? (
        <div className="user-product-grid">
          {products.map((product) => (
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
                <span className="user-category-tag">{product.category}</span>


                <button 
                  className="user-add-to-cart-btn" 
                  onClick={() => handleAddToCart(product)}
                >
                  Add to Cart
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div><Loader /></div>
      )}
    </div>
  );
};

export default UserProductList;

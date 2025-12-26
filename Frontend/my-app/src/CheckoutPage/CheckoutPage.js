import React, { useState } from 'react';
import { useCart } from '../HomePage/Cartcontext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Cookies from 'js-cookie';
import './CheckoutPage.css';

const CheckoutPage = () => {
  const { cart, getTotal, clearCart } = useCart();
  const navigate = useNavigate();
  const [showPopup, setShowPopup] = useState(false);
  const [errorPopup, setErrorPopup] = useState({ show: false, message: '' });

  const handleConfirmOrder = async () => {
    if (cart.length === 0) {
      setErrorPopup({ show: true, message: 'Your cart is empty!' });
      setTimeout(() => setErrorPopup({ show: false, message: '' }), 3000);
      return;
    }

    const token = Cookies.get('token');
    if (!token) {
      setErrorPopup({ show: true, message: 'Please log in to place an order.' });
      setTimeout(() => {
        setErrorPopup({ show: false, message: '' });
        navigate('/Login');
      }, 2000);
      return;
    }

    // ✅ Validate stock availability before checkout
    try {
      const stockCheckPromises = cart.map(async (item) => {
        const res = await axios.get(`http://localhost:4000/user/products/${item._id}`);
        const product = res.data;
        
        if (product.quantity < item.quantity) {
          return {
            valid: false,
            name: item.name,
            available: product.quantity,
            requested: item.quantity
          };
        }
        return { valid: true };
      });

      const stockResults = await Promise.all(stockCheckPromises);
      const invalidItems = stockResults.filter(r => !r.valid);

      if (invalidItems.length > 0) {
        const errorMsg = invalidItems.map(item => 
          `${item.name}: Only ${item.available} available, you requested ${item.requested}`
        ).join('\n');
        
        setErrorPopup({ 
          show: true, 
          message: `Some items are out of stock or have insufficient quantity:\n\n${errorMsg}\n\nPlease update your cart.` 
        });
        setTimeout(() => setErrorPopup({ show: false, message: '' }), 5000);
        return;
      }
    } catch (err) {
      console.error('Stock validation error:', err);
      setErrorPopup({ show: true, message: 'Failed to validate stock. Please try again.' });
      setTimeout(() => setErrorPopup({ show: false, message: '' }), 3000);
      return;
    }

    const orderData = {
      items: cart.map(item => ({
        _id: item._id,
        name: item.name,
        category: item.category,
        price: item.price,
        quantity: item.quantity,
        imageUrl: item.imageUrl || '',
      })),
      total: getTotal(),
      date: new Date().toISOString(),
    };

    try {
      const res = await axios.post('http://localhost:4000/user/orders', orderData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 201) {
        setShowPopup(true);
        clearCart();
        setTimeout(() => {
          setShowPopup(false);
          navigate('/my-orders');
        }, 2000);
      }
    } catch (err) {
      console.error('Error placing order:', err);
      if (err.response?.status === 400) {
        setErrorPopup({ 
          show: true, 
          message: err.response.data.message || 'Some items are out of stock. Please update your cart.' 
        });
      } else {
        setErrorPopup({ show: true, message: 'Failed to place order. Please try again.' });
      }
      setTimeout(() => setErrorPopup({ show: false, message: '' }), 3000);
    }
  };

  const handleCancelOrder = () => {
    clearCart();
    navigate('/home');
  };

  return (
    <div className="checkout-wrapper">
      <div className="checkout-container">
        
        <button className="back-btn" onClick={() => navigate(-1)}>← Back</button>

        <h1 className="checkout-title">🛒 Checkout</h1>

        {cart.length > 0 ? (
          <>
            <div className="checkout-items">
              {cart.map(({ id, name, quantity, price, imageUrl }) => (
                <div key={id} className="checkout-item">
                  <div className="item-info">
                    <img
                      src={imageUrl || 'https://via.placeholder.com/60'}
                      alt={name}
                      className="item-img"
                    />
                    <div>
                      <div className="item-name">{name}</div>
                      <div className="item-price">
                        ${price.toFixed(2)} each
                      </div>
                    </div>
                  </div>
                  <div className="item-details">
                    <span>Qty: {quantity}</span>
                    <span className="item-subtotal">
                      ${(price * quantity).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="checkout-total">
              Total: <strong>${getTotal().toFixed(2)}</strong>
            </div>

            <button className="confirm-btn" onClick={handleConfirmOrder}>
              Confirm Order
            </button>

            <button className="cancel-btn" onClick={handleCancelOrder}>
              Cancel Order
            </button>
          </>
        ) : (
          <p>Your cart is empty.</p>
        )}
      </div>

      {/* ✅ Success Popup */}
      {showPopup && (
        <div className="popup-overlay">
          <div className="popup popup-success">
            <h2>✅ Order Confirmed!</h2>
            <p>Redirecting you to orders page...</p>
          </div>
        </div>
      )}

      {/* ✅ Error Popup */}
      {errorPopup.show && (
        <div className="popup-overlay">
          <div className="popup popup-error">
            <h2>❌ Error</h2>
            <p style={{ whiteSpace: 'pre-line' }}>{errorPopup.message}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckoutPage;

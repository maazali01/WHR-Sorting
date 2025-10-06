import React, { useState } from 'react';
import { useCart } from '../HomePage/Cartcontext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './CheckoutPage.css';

const CheckoutPage = () => {
  const { cart, getTotal, clearCart } = useCart();
  const navigate = useNavigate();
  const [showPopup, setShowPopup] = useState(false);

  const handleConfirmOrder = async () => {
    try {
      const orderData = {
        items: cart,
        total: getTotal(),
        date: new Date().toISOString(),
      };

      await axios.post('http://localhost:4000/user/products/orders', orderData);

      clearCart();
      setShowPopup(true);

      // Redirect to /home after 2s
      setTimeout(() => {
        setShowPopup(false);
        navigate('/home');
      }, 2000);
    } catch (err) {
      console.error('Order error:', err);
      alert('Order failed. Try again!');
    }
  };

  // ✅ Cancel Order (clear cart + redirect to home)
  const handleCancelOrder = () => {
    clearCart();
    navigate('/home');
  };

  return (
    <div className="checkout-wrapper">
      <div className="checkout-container">
        
        {/* ✅ Go Back Button */}
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

            {/* ✅ Cancel Order Button */}
            <button className="cancel-btn" onClick={handleCancelOrder}>
              Cancel Order
            </button>
          </>
        ) : (
          <p>Your cart is empty.</p>
        )}
      </div>

      {/* ✅ Order Confirmation Popup */}
      {showPopup && (
        <div className="popup-overlay">
          <div className="popup">
            <h2>✅ Order Confirmed!</h2>
            <p>Redirecting you to Home...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckoutPage;

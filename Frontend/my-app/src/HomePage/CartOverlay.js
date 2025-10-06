import React, { useContext } from 'react';
import { CartContext } from '../HomePage/Cartcontext';
import { useNavigate } from 'react-router-dom';
import './CartOverlay.css';

const CartOverlay = ({ onClose }) => {
  const { cart, clearCart, removeFromCart, getTotal, increaseQuantity, decreaseQuantity } = useContext(CartContext);
  const navigate = useNavigate();

  const handleRemoveItem = (id) => {
    removeFromCart(id);
  };

  const handleCheckout = () => {
    onClose(); 
    navigate('/checkout');
  };

  return (
    <div className="overlay">
      <div className="cart-container">
        <button className="close-button" onClick={onClose}>×</button>
        <h2 className="cart-title">Your Cart</h2>
        <div className="cart-items">
          {cart.length > 0 ? (
            cart.map(item => (
              <div className="cart-item" key={item._id}>
                
                {/* Left side: Image + details */}
                <div className="item-left">
                  <div className="item-image">
                    <img src={item.imageUrl} alt={item.name} className="cart-item-img" />
                  </div>
                  <div className="Cartitem-details">
                    <span className="item-name">{item.name}</span>
                    <div className="item-quantity-price">
                      <div className="item-quantity-control">
                        <button className="qty-btn" onClick={() => decreaseQuantity(item._id)}>-</button>
                        <span className="qty-display">{item.quantity}</span>
                        <button className="qty-btn" onClick={() => increaseQuantity(item._id)}>+</button>
                      </div>
                      <span>${(item.quantity * item.price).toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Right side: remove button */}
                <button className="remove-button" onClick={() => handleRemoveItem(item._id)}>Remove</button>
              </div>
            ))
          ) : (
            <p className="empty-cart-msg">Your cart is empty.</p>
          )}
        </div>

        {cart.length > 0 && (
          <>
            <div className="total">
              Total: <strong>${getTotal().toFixed(2)}</strong>
            </div>
            <div className="cart-actions">
              <button className="clear-cart-button" onClick={clearCart}>Clear Cart</button>
              <button className="checkout-button" onClick={handleCheckout}>Checkout</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CartOverlay;

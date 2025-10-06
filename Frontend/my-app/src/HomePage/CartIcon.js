// CartIcon.js
import React, { useContext, useState } from 'react';
import { CartContext } from './Cartcontext';
import CartOverlay from './CartOverlay';
import './CartIcon.css';

const CartIcon = () => {
  const { cartCount } = useContext(CartContext);
  const [isOverlayVisible, setIsOverlayVisible] = useState(false);

  const toggleOverlay = () => {
    setIsOverlayVisible(prev => !prev);
  };

  // ✅ Proper close handler
  const closeOverlay = () => {
    setIsOverlayVisible(false);
  };

  return (
    <>
      {/* Cart Icon - hidden when overlay is visible */}
      <div
        className={`cart-icon ${isOverlayVisible ? 'hidden' : ''}`}
        onClick={toggleOverlay}
      >
        <i className="fas fa-shopping-cart"></i>
        {cartCount > 0 && <span className="cart-count">{cartCount}</span>}
      </div>

      {/* Overlay */}
      {isOverlayVisible && <CartOverlay onClose={closeOverlay} />}
    </>
  );
};

export default CartIcon;

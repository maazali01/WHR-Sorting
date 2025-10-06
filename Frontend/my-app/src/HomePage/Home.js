// Home.js (or any parent component)
import React from 'react';
import UserProductList from './ProductList';

import CartIcon from './CartIcon.js';
import '@fortawesome/fontawesome-free/css/all.min.css';

const Home = () => {
  return (
    <div className="home">
      <CartIcon />
      <UserProductList />
    </div>
  );
};

export default Home;

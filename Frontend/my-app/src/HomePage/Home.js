import React, { useState } from 'react';
import UserProductList from './ProductList';
import CartIcon from './CartIcon.js';
import '@fortawesome/fontawesome-free/css/all.min.css';
import './Home.css';

const Home = () => {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="home">
      {/* ✅ Page Content */}
      <CartIcon />
      <UserProductList searchTerm={searchTerm} onSearchChange={setSearchTerm} />
    </div>
  );
};

export default Home;

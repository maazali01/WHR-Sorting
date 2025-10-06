import React, { useEffect, useState, useRef, useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { FaSearch, FaUserCircle, FaCog, FaSignOutAlt } from 'react-icons/fa';
import { FiShoppingCart } from 'react-icons/fi';
import axios from 'axios';
import { CartContext } from '../HomePage/Cartcontext';
import { isLoggedIn, logout } from '../utils/auth';
import './navbar.css';
import logo from './logo.PNG';

const Navbar = () => {
  const [logged, setLogged] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchopen, setSearchopen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const location = useLocation();
  const searchRef = useRef(null);
  const dropdownRef = useRef(null);
  const { addToCart, clearCart } = useContext(CartContext);

  // ✅ Detect admin route
  const isAdminRoute = location.pathname.startsWith("/admin");

  // ✅ Show search only on /home
  const showSearch = location.pathname === "/home";

  useEffect(() => {
    setLogged(isLoggedIn());
  }, [location]);

  const handleLogout = () => {
    logout(clearCart);
    setLogged(false);
    setDropdownOpen(false);
  };

  const toggleDropdown = () => setDropdownOpen(prev => !prev);
  const toggleSearch = () => setSearchopen(prev => !prev);

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  // Debounce API call
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchTerm.trim()) {
        fetchSearchResults(searchTerm);
      } else {
        setSearchResults([]);
      }
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const fetchSearchResults = async (term) => {
    try {
      const response = await axios.get('http://localhost:4000/user/products', {
        params: { query: term }
      });
      setSearchResults(response.data);
    } catch (error) {
      console.error('Error fetching search results:', error);
    }
  };

  const handleResultClick = () => {
    setSearchTerm('');
    setSearchResults([]);
    setSearchopen(false);
  };

  const handleAddToCart = (product) => {
    addToCart(product);
  };

  // Close dropdown/search when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        searchRef.current && !searchRef.current.contains(event.target) &&
        dropdownRef.current && !dropdownRef.current.contains(event.target)
      ) {
        handleResultClick();
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ⛔ HIDE Navbar completely on Admin Routes
  if (isAdminRoute) {
    return null; // Nothing rendered
  }

  return (
    <nav className="navBar">
      <div className="logo">
        <Link to="/">
          <img src={logo} alt="Logo" />
        </Link>
      </div>

      <ul className="links">
        {showSearch && (  // ✅ Only render Search on /home
          <SearchContainer ref={searchRef} searchopen={searchopen} style={{ overflow: "visible" }}>
            <SearchIcon onClick={toggleSearch}>
              <FaSearch />
            </SearchIcon>
            {searchopen && (
              <>
                <SearchInput
                  placeholder="Search for products..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                />
                {searchTerm && searchResults.length > 0 && (
                  <SearchResults>
                    {searchResults.map((product) => (
                      <SearchResultItem key={product._id}>
                        <Link to={`/product/${product._id}`} onClick={handleResultClick}>
                          <ProductName>{product.name}</ProductName>
                        </Link>
                        <ProductPrice>${product.price}</ProductPrice>
                        <AddToCartButton onClick={() => handleAddToCart(product)}>
                          Add to Cart
                        </AddToCartButton>
                      </SearchResultItem>
                    ))}
                  </SearchResults>
                )}
              </>
            )}
          </SearchContainer>
        )}

        <li className="link">
          <Link to="/contact-us">Feedback</Link>
        </li>

        {logged ? (
          <li className="user-profile" ref={dropdownRef}>
            <FaUserCircle
              className="profile-icon"
              onClick={toggleDropdown}
            />
            {dropdownOpen && (
              <div className="user-dropdown">
                <Link to="/my-orders" className="dropdown-link" onClick={() => setDropdownOpen(false)}>
                  <FiShoppingCart /> Orders
                </Link>
                <Link to="/edit-profile" className="dropdown-link" onClick={() => setDropdownOpen(false)}>
                  <FaCog /> Profile
                </Link>
                <button onClick={handleLogout} className="dropdown-link">
                  <FaSignOutAlt /> Logout
                </button>
              </div>
            )}
          </li>
        ) : (
          <>
            <li className="link">
              <Link to="/Login">Login</Link>
            </li>
            <li className="link">
              <Link to="/Signup">Sign up</Link>
            </li>
          </>
        )}
      </ul>
    </nav>
  );
};

export default Navbar;

/* ---------- Styled Components ---------- */
const SearchContainer = styled.div`
  position: relative;
  width: ${({ searchopen }) => (searchopen ? '300px' : '35px')};
  height: 35px;
  display: flex;
  align-items: center;
  transition: width 0.4s ease-in-out;
  margin-right: 15px;
  overflow: hidden;
`;

const SearchIcon = styled.div`
  position: absolute;
  right: 0;
  width: 35px;
  height: 35px;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  z-index: 1;

  & > svg {
    font-size: 20px;
    color: ${({ searchopen }) => (searchopen ? '#333' : '#F8F8EC')};
  }
`;

const SearchInput = styled.input`
  width: 100%;
  height: 100%;
  padding: 0 35px 0 15px;
  border: none;
  border-radius: 20px;
  outline: none;
  font-size: 16px;
  color: #333;
  background-color: #fff;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);

  &:focus {
    box-shadow: 0 0 15px rgba(0, 0, 0, 0.2);
  }
`;

const SearchResults = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  width: 100%;
  max-height: 300px;
  background-color: #fff;
  border-radius: 5px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  overflow-y: auto;
  z-index: 2;
`;

const SearchResultItem = styled.div`
  padding: 15px;
  border-bottom: 1px solid #ddd;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: flex-start;

  &:last-child {
    border-bottom: none;
  }

  a {
    text-decoration: none;
    color: #333;
    font-weight: bold;

    &:hover {
      color: #1c364bff;
    }
  }
`;

const ProductName = styled.span`
  font-size: 18px;
  margin-bottom: 5px;
`;

const ProductPrice = styled.span`
  font-size: 16px;
  color: #666;
  margin-bottom: 10px;
`;

const AddToCartButton = styled.button`
  padding: 8px 15px;
  background-color: #231f64ff;
  border: none;
  color: #fff;
  font-size: 14px;
  border-radius: 5px;
  cursor: pointer;

  &:hover {
    background-color: #2857a7ff;
  }
`;

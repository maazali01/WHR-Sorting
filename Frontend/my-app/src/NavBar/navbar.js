import React, { useEffect, useState, useRef, useContext } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FaUserCircle, FaSignOutAlt, FaTimes, FaBars } from 'react-icons/fa';
import { FiShoppingCart, FiGrid, FiHome } from 'react-icons/fi';
import axios from 'axios';
import Cookies from 'js-cookie';
import { CartContext } from '../HomePage/Cartcontext';
import { logout } from '../utils/auth';
import './navbar.css';
import API_URL from '../config/api';

const Navbar = () => {
  const [logged, setLogged] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [username, setUsername] = useState('');
  const [userRole, setUserRole] = useState(null);
  const location = useLocation();
  const dropdownRef = useRef(null);
  const { clearCart } = useContext(CartContext);
  const navigate = useNavigate();

  const isAdminRoute = location.pathname.startsWith("/admin");

  useEffect(() => {
    let mounted = true;

    const verifyAndLoadProfile = async () => {
      const token = Cookies.get('token');
      if (!token) {
        if (mounted) {
          setLogged(false);
          setUsername('');
          setUserRole(null);
        }
        return;
      }

      try {
        const res = await axios.get(`${API_URL}/user/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!mounted) return;
        setLogged(true);
        setUsername(res.data?.username || res.data?.email || '');
        setUserRole(res.data?.role || 'user');
      } catch (err) {
        if (!mounted) return;
        Cookies.remove('token');
        setLogged(false);
        setUsername('');
        setUserRole(null);
      }
    };

    verifyAndLoadProfile();
    const handler = () => verifyAndLoadProfile();
    window.addEventListener('authChanged', handler);
    return () => {
      mounted = false;
      window.removeEventListener('authChanged', handler);
    };
  }, []);

  useEffect(() => {
    const token = Cookies.get('token');
    setLogged(Boolean(token));
  }, [location]);

  const initial = username ? username.charAt(0).toUpperCase() : '';

  const handleLogout = () => {
    logout(clearCart);
    setLogged(false);
    setDropdownOpen(false);
    navigate('/login');
  };

  const toggleDropdown = () => setDropdownOpen(prev => !prev);
  const toggleMenu = () => setMenuOpen(prev => !prev);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (isAdminRoute) return null;

  return (
    <nav className="navBar">
      <div className="logo">
        <Link to="/" onClick={() => setMenuOpen(false)}>
          <img src="/logo.jpg" alt="Logo" />
        </Link>
      </div>

      <div className="hamburger" onClick={toggleMenu}>
        {menuOpen ? <FaTimes /> : <FaBars />}
      </div>

      <ul className={`links ${menuOpen ? 'open' : ''}`}>
        {logged && (
          <li className="link">
            <Link to="/home" className="nav-link home-link" onClick={() => setMenuOpen(false)}>
              <FiHome className="nav-icon" />
              <span>Products</span>
            </Link>
          </li>
        )}

        <li className="link">
          <Link to="/contact-us" className="nav-link" onClick={() => setMenuOpen(false)}>
            Feedback
          </Link>
        </li>

        {logged ? (
          <li className="user-profile" ref={dropdownRef}>
            <div className="profile-inline" onClick={toggleDropdown} title={username || 'User'}>
              <span className="navbar-username">{username || ''}</span>
              <div className="profile-initial">{initial || <FaUserCircle />}</div>
            </div>

            {dropdownOpen && (
              <div className="user-dropdown">
                {userRole === 'admin' ? (
                  <>
                    <Link to="/admin/dashboard" className="dropdown-link" onClick={() => { setDropdownOpen(false); setMenuOpen(false); }}>
                      <FiGrid /> Admin Dashboard
                    </Link>
                    <button onClick={handleLogout} className="dropdown-link">
                      <FaSignOutAlt /> Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link to="/my-dashboard" className="dropdown-link" onClick={() => { setDropdownOpen(false); setMenuOpen(false); }}>
                      <FiGrid /> Dashboard
                    </Link>
                    <Link to="/my-orders" className="dropdown-link" onClick={() => { setDropdownOpen(false); setMenuOpen(false); }}>
                      <FiShoppingCart /> Orders
                    </Link>
                    <button onClick={handleLogout} className="dropdown-link">
                      <FaSignOutAlt /> Logout
                    </button>
                  </>
                )}
              </div>
            )}
          </li>
        ) : (
          <>
            <li className="link">
              <Link to="/Login" className="nav-link login-link" onClick={() => setMenuOpen(false)}>
                Login
              </Link>
            </li>
            <li className="link">
              <Link to="/Signup" className="signup-btn" onClick={() => setMenuOpen(false)}>
                Sign up
              </Link>
            </li>
          </>
        )}
      </ul>
    </nav>
  );
};

export default Navbar;

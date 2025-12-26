// AdminPanel.js
import React, { useEffect, useState } from 'react';
import { useNavigate, Outlet } from 'react-router-dom';
import Cookie from 'js-cookie';
import axios from 'axios';
import Sidebar from './Sidebar';
import './AdminPanel.css';

const AdminPanel = () => {
  const [error, setError] = useState(null);
  const [collapsed, setCollapsed] = useState(false);
  const [darkMode, setDarkMode] = useState(false); // ✅ new state
  const navigate = useNavigate();

  useEffect(() => {
    const token = Cookie.get('token') || localStorage.getItem('token');

    // require token
    if (!token) {
      navigate('/login');
      return;
    }

    // ensure axios sends cookies and token for admin requests
    axios.defaults.withCredentials = true;
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    const fetchProducts = async () => {
      try {
        await axios.get('http://localhost:4000/admin/products');
        setError(null);
      } catch (error) {
        console.error('Error fetching products:', error);
        const status = error?.response?.status;

        if (status === 401) {
          // invalid / expired token -> force login
          setError('Unauthorized: please login again.');
          // clear stored token and redirect
          Cookie.remove('token', { path: '/' });
          localStorage.removeItem('token');
          // notify UI immediately
          try { window.dispatchEvent(new Event('authChanged')); } catch (e) {}
          navigate('/login');
          return;
        }

        if (status === 403) {
          setError('You are not authorized to access this page.');
          navigate('/unauthorized');
        } else {
          setError('Error fetching products. Please try again later.');
        }
      }
    };

    fetchProducts();
  }, [navigate]);

  if (error) return <p className="error">{error}</p>;

  return (
    <div className={`admin-layout ${darkMode ? 'dark-mode' : ''}`}>
      {/* Sidebar with collapse + dark mode toggle */}
      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
      />

      {/* Main content */}
      <main className={`admin-content ${collapsed ? 'full-width' : ''}`}>
        <Outlet />
      </main>
    </div>
  );
};

export default AdminPanel;

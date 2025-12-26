import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import './AdminLogin.css';
import Cookie from 'js-cookie';
import Alert from './popup/view/popup';
import { FiLock, FiUser, FiShield, FiEye, FiEyeOff } from 'react-icons/fi';

const AdminLogin = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const navigate = useNavigate();

  const addAlert = (alert) => {
    const id = Date.now();
    setAlerts((prev) => [...prev, { ...alert, id }]);
  };

  const handleAdminLogin = async (event) => {
    event.preventDefault();

    if (!username || !password) {
      addAlert({ type: 'warning', title: 'Missing Fields', message: 'Username and Password are required.' });
      return;
    }

    try {
      const response = await axios.post(
        'http://localhost:4000/login',
        { username, password },
        { headers: { 'Content-Type': 'application/json' } }
      );

      const { user, token } = response.data;

      // Check if user is admin
      if (user.role !== 'admin') {
        addAlert({ type: 'error', title: 'Access Denied', message: 'Only administrators can access this portal.' });
        return;
      }

      // Persist token
      Cookie.set('token', token, { path: '/', sameSite: 'lax', expires: 1 / 24 });
      localStorage.setItem('token', token);

      axios.defaults.withCredentials = true;
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      try { window.dispatchEvent(new Event('authChanged')); } catch (e) {}

      addAlert({ type: 'success', title: 'Welcome Back', message: 'Redirecting to admin dashboard...' });
      setTimeout(() => {
        navigate('/admin/dashboard', { state: user });
      }, 1500);
    } catch (error) {
      addAlert({ type: 'error', title: 'Login Failed', message: 'Invalid credentials or access denied.' });
    }
  };

  return (
    <>
      <div className="alert-container">
        {alerts.map((a) => (
          <Alert
            key={a.id}
            type={a.type}
            title={a.title}
            message={a.message}
            onClose={() => setAlerts((prev) => prev.filter((al) => al.id !== a.id))}
          />
        ))}
      </div>

      <div className="admin-login-wrapper">
        <div className="admin-login-card">
          {/* Header Section */}
          <div className="admin-login-header">
            <div className="admin-shield-icon">
              <FiShield />
            </div>
            <h2 className="admin-login-title">Admin Portal</h2>
            <p className="admin-login-subtitle">Secure access for administrators only</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleAdminLogin} className="admin-login-form">
            <div className="admin-input-group">
              <label className="admin-input-label">
                <FiUser className="label-icon" />
                Username
              </label>
              <input
                type="text"
                placeholder="Enter admin username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="admin-input"
                autoComplete="username"
              />
            </div>

            <div className="admin-input-group">
              <label className="admin-input-label">
                <FiLock className="label-icon" />
                Password
              </label>
              <div className="admin-password-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter admin password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="admin-input"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>

            <button type="submit" className="admin-login-submit">
              <FiShield />
              Access Admin Panel
            </button>
          </form>

          {/* Footer Links */}
          <div className="admin-login-footer">
            <Link to="/login" className="back-to-user-link">
              ← Back to User Login
            </Link>
          </div>
        </div>

        {/* Background Decoration */}
        <div className="admin-bg-decoration">
          <div className="decoration-circle circle-1"></div>
          <div className="decoration-circle circle-2"></div>
          <div className="decoration-circle circle-3"></div>
        </div>
      </div>
    </>
  );
};

export default AdminLogin;

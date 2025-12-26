import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import './Login.css';
import Cookie from 'js-cookie';
import Alert from './popup/view/popup';
import API_URL from '../config/api';


const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [alerts, setAlerts] = useState([]);
  const navigate = useNavigate();

  const addAlert = (alert) => {
    const id = Date.now();
    setAlerts((prev) => [...prev, { ...alert, id }]);
  };

  const handleLogin = async (event) => {
    event.preventDefault();

    if (!username || !password) {
      addAlert({ type: 'warning', title: 'Missing Fields', message: 'Username and Password are required.' });
      return;
    }
    if (password.length < 6) {
      addAlert({ type: 'warning', title: 'Weak Password', message: 'Password must be at least 6 characters long.' });
      return;
    }

    try {
      const response = await axios.post(
        `${API_URL}/login`,
        { username: username, password },
        { headers: { 'Content-Type': 'application/json' } }
      );

      const { user, token } = response.data;

      // ✅ Redirect admins to admin login page
      if (user.role === 'admin') {
        addAlert({ type: 'warning', title: 'Admin Access', message: 'Please use the Admin Portal to login.' });
        setTimeout(() => {
          navigate('/admin/login');
        }, 2000);
        return;
      }

      Cookie.set('token', token, { path: '/', sameSite: 'lax', expires: 1 / 24 });
      localStorage.setItem('token', token);

      axios.defaults.withCredentials = true;
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      try { window.dispatchEvent(new Event('authChanged')); } catch (e) {}

      addAlert({ type: 'success', title: 'Login Successful', message: 'Redirecting you to the dashboard...' });
      navigate('/home');
    } catch (error) {
      addAlert({ type: 'error', title: 'Login Failed', message: 'Invalid username or password.' });
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `${API_URL}/auth/google`;
  };

  // If backend redirected here after Google OAuth with token in URL, handle it
  useEffect(() => {
    try {
      const parseFromLocation = () => {
        const q = new URLSearchParams(window.location.search);
        let token = q.get('token') || q.get('access_token');
        const role = q.get('role') || q.get('userRole') || null;
        const redirectTo = q.get('redirect') || null;

        // also check hash fragment (#token=...) if backend used fragment
        if (!token && window.location.hash) {
          const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
          token = token || hash.get('token') || hash.get('access_token');
        }

        return { token, role, redirectTo };
      };

      const { token, role, redirectTo } = parseFromLocation();
      if (token) {
        // persist token (cookie + localStorage) and set axios
        Cookie.set('token', token, { path: '/', sameSite: 'lax', expires: 1 / 24 });
        localStorage.setItem('token', token);
        axios.defaults.withCredentials = true;
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        try { window.dispatchEvent(new Event('authChanged')); } catch (e) {}

        // remove token from URL to avoid exposing it
        const url = new URL(window.location.href);
        url.searchParams.delete('token');
        url.searchParams.delete('access_token');
        url.searchParams.delete('role');
        url.searchParams.delete('redirect');
        window.history.replaceState({}, document.title, url.pathname + url.search);

        // navigate based on role or redirect param
        if (redirectTo) {
          navigate(redirectTo);
        } else if (role === 'admin') {
          navigate('/admin/dashboard');
        } else {
          navigate('/home');
        }
      }
    } catch (err) {
      console.warn('OAuth redirect handling failed:', err);
    }
  }, [navigate]);

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

      <div className="login-card">
        <h2 className="login-title">Sign in</h2>
        <p className="login-subtitle">Welcome user, please sign in to continue</p>

        <button onClick={handleGoogleLogin} className="google-button">
          <svg className="google-icon" viewBox="0 0 24 24" width="24" height="24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Sign In With Google
        </button>

        <div className="divider">
          <span>Or</span>
        </div>

        <form onSubmit={handleLogin} className="login-form">
          <label>Username *</label>
          <input
            type="text"
            placeholder="Enter your username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="login-input"
          />

          <label>Password *</label>
          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="login-input"
          />

          <button type="submit" className="login-submit">
            Sign In
          </button>
        </form>

        <div className="auth-links">
          <Link to="/forgot-password">Forgot Password?</Link>
          <p>
            New user? <Link to="/signup">Create an account</Link>
          </p>
        </div>
      </div>
    </>
  );
};

export default LoginPage;

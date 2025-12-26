import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import './Login.css';
import Cookie from 'js-cookie';
import Alert from './popup/view/popup';

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
        'http://localhost:4000/login',
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
    window.location.href = 'http://localhost:4000/auth/google';
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
          <img
            src="https://img.icons8.com/color/24/000000/google-logo.png"
            alt="Google"
            className="google-icon"
          />
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

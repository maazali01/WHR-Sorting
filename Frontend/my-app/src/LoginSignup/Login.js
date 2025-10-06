import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import './Login.css';
import Cookie from 'js-cookie';
import Alert from './popup/view/popup'; // your Alert.js

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [alerts, setAlerts] = useState([]); // array of alerts
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

      const { user } = response.data;
      Cookie.set('token', response.data.token);

      addAlert({ type: 'success', title: 'Login Successful', message: 'Redirecting you to the dashboard...' });
      setTimeout(() => {
        if (user.role === 'admin') navigate('/admin/dashboard', { state: user });
        else navigate('/home');
      }, 2000);
    } catch (error) {
      addAlert({ type: 'error', title: 'Login Failed', message: 'Invalid username or password.' });
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = 'http://localhost:4000/auth/google';
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
          <p>New user? <Link to="/signup">Create an account</Link></p>
        </div>
      </div>
    </>
  );
};

export default LoginPage;

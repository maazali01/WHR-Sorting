import React, { useState } from 'react';
import axios from 'axios';
import { Navigate, Link } from 'react-router-dom';
import './Signup.css';
import Alert from './popup/view/popup'; // your Alert.js

const SignUpPage = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [alerts, setAlerts] = useState([]);
  const [isSignedUp, setIsSignedUp] = useState(false);

  const addAlert = (alert) => {
    const id = Date.now();
    setAlerts((prev) => [...prev, { ...alert, id }]);
  };

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSignUp = async (event) => {
    event.preventDefault();

    if (!username || !email || !password) {
      addAlert({ type: 'warning', title: 'Missing Fields', message: 'All fields are required.' });
      return;
    }
    if (!validateEmail(email)) {
      addAlert({ type: 'warning', title: 'Invalid Email', message: 'Please provide a valid email.' });
      return;
    }
    if (password.length < 6) {
      addAlert({ type: 'warning', title: 'Weak Password', message: 'Password must be at least 6 characters long.' });
      return;
    }

    try {
      const response = await axios.post('http://localhost:4000/register', {
        username,
        email,
        password,
      }, {
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.status === 201) {
        addAlert({ type: 'success', title: 'Account Created', message: 'Redirecting to login page...' });
        setTimeout(() => setIsSignedUp(true), 2000);
      } else {
        addAlert({ type: 'error', title: 'Signup Failed', message: 'Try again later.' });
      }
    } catch (error) {
      addAlert({ type: 'error', title: 'Signup Failed', message: 'User may already exist or server error.' });
    }
  };

  if (isSignedUp) return <Navigate to="/login" />;

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

      <div className="signup-card">
        <h1 className="signup-title">Join Us Today</h1>
        <p className="signup-subtitle">
          Create an account to start exploring products, add to cart, and place orders easily.
        </p>

        <form onSubmit={handleSignUp} className="signup-form">
          <label>Username</label>
          <input
            type="text"
            placeholder="Enter your username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="signup-input"
          />

          <label>Email</label>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="signup-input"
          />

          <label>Password</label>
          <input
            type="password"
            placeholder="Password (min 6 chars)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="signup-input"
          />

          <button type="submit" className="signup-submit">Sign Up</button>
        </form>

        <div className="divider">or</div>

        <div className="auth-links">
          <p>Already have an account? <Link to="/login">Login</Link></p>
        </div>
      </div>
    </>
  );
};

export default SignUpPage;

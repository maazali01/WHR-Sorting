import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { CartProvider } from './HomePage/Cartcontext';
import axios from 'axios';
import Cookie from 'js-cookie';

// Ensure axios sends cookies and include Authorization header when token present
axios.defaults.withCredentials = true;
const bootstrapToken = Cookie.get('token') || localStorage.getItem('token');
if (bootstrapToken) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${bootstrapToken}`;
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <CartProvider>
      <App />
    </CartProvider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

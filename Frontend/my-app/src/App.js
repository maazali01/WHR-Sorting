import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import LoginPage from './LoginSignup/Login';
import SignUpPage from './LoginSignup/Signup';
import Navbar from './NavBar/navbar';
import { CartProvider } from './HomePage/Cartcontext';
import Contact from './Contact/contact';
import Home from './HomePage/Home';
import AdminPanel from './Admin/AdminPanel';
import ProductList from './Admin/ProductList';
import Dashboard from './Admin/Dashboard';
import WebotsViewer from './Admin/Webots';
import Orders from './Admin/Orders';
import CheckoutPage from './CheckoutPage/CheckoutPage';
import Unauthorized from './Unauthorized/Unauthorized';
import LandingPage from './LandingPage/landing';
import AdminSettings from './Admin/settings';

// ✅ Import your User components
import UserOrders from './User/userorders';
import EditProfile from './User/userprofile';

function App() {
  return (
    <div className="container">
      <CartProvider>
        <Router>
          <Navbar />
          <Routes>
            {/* ✅ Default route -> Landing Page */}
            <Route path="/" element={<LandingPage />} />

            {/* ✅ Home */}
            <Route path="/home" element={<Home />} />

            {/* ✅ Auth */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignUpPage />} />
            <Route path="/contact-us" element={<Contact />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/unauthorized" element={<Unauthorized />} />

            {/* ✅ User Pages */}
            <Route path="/my-orders" element={<UserOrders />} />
            <Route path="/edit-profile" element={<EditProfile />} />

            {/* ✅ Admin Routes */}
            <Route path="/admin" element={<AdminPanel />}>
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="products" element={<ProductList />} />
              <Route path="webots" element={<WebotsViewer />} />
              <Route path="orders" element={<Orders />} />
              <Route path="settings" element={<AdminSettings />} />
            </Route>
          </Routes>
        </Router>
      </CartProvider>
    </div>
  );
}

export default App;

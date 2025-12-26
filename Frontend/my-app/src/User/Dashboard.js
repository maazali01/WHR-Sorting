import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import './UserDashboard.css';
import { useNavigate } from 'react-router-dom';
import { 
  FiUser, FiMail, FiLock, FiEdit2, FiX, FiCheck, FiPackage, 
  FiClock, FiDollarSign, FiAlertCircle, FiShield, FiActivity 
} from 'react-icons/fi';
import API_URL from '../config/api';

const API = `${API_URL}/user`;

const UserDashboard = () => {
  const [profile, setProfile] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loadingStates, setLoadingStates] = useState({
    profile: true,
    orders: true
  });
  const [editField, setEditField] = useState(null);
  const [form, setForm] = useState({ username: '', email: '', password: '', confirmPassword: '' });
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [error, setError] = useState('');
  const token = Cookies.get('token');
  const navigate = useNavigate();

  const fetchData = useCallback(async () => {
    if (!token) {
      setError('Unauthorized: Please login.');
      navigate('/login');
      return;
    }

    try {
      const headers = { Authorization: `Bearer ${token}` };
      
      const [pRes, oRes] = await Promise.all([
        axios.get(`${API}/profile`, { headers }),
        axios.get(`${API}/orders`, { headers }),
      ]);
      
      setProfile(pRes.data);
      setForm({ 
        username: pRes.data.username || '', 
        email: pRes.data.email || '', 
        password: '', 
        confirmPassword: '' 
      });
      setOrders(Array.isArray(oRes.data) ? oRes.data : []);
      setError('');

      // Progressive loading
      setTimeout(() => setLoadingStates(prev => ({ ...prev, profile: false })), 100);
      setTimeout(() => setLoadingStates(prev => ({ ...prev, orders: false })), 200);
    } catch (err) {
      console.error('Failed to load dashboard data', err);
      if (err.response?.status === 401) {
        setError('Session expired. Please login again.');
        navigate('/login');
      } else {
        setError('Failed to load dashboard data.');
      }
      setLoadingStates({ profile: false, orders: false });
    }
  }, [token, navigate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const saveProfile = async (e) => {
    e?.preventDefault();
    try {
      const payload = {};
      
      if (editField === 'username') {
        if (!form.username.trim()) return alert('Username required');
        if (form.username === profile?.username) return alert('No change made');
        payload.username = form.username;
      } else if (editField === 'email') {
        if (!form.email.trim()) return alert('Email required');
        if (form.email === profile?.email) return alert('No change made');
        payload.email = form.email;
      } else if (editField === 'password') {
        if (!form.password) return alert('Password required');
        if (form.password.length < 6) return alert('Password must be at least 6 characters');
        if (form.password !== form.confirmPassword) return alert('Passwords do not match');
        payload.password = form.password;
      }

      await axios.put(`${API}/profile`, payload, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      
      alert('Profile updated successfully');
      setEditField(null);
      setForm((f) => ({ ...f, password: '', confirmPassword: '' }));
      fetchData();
    } catch (err) {
      console.error('Update failed', err);
      alert(err.response?.data?.message || 'Update failed');
    }
  };

  if (error && !profile) {
    return (
      <div className={`user-dashboard ${profile?.role === 'admin' ? 'admin-theme' : 'user-theme'}`}>
        <div className="warning-banner">
          <FiAlertCircle />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  const isAdmin = profile?.role === 'admin';
  const totalSpend = orders.reduce((s, o) => s + (o.total || 0), 0);
  const totalOrders = orders.length;
  const pendingOrders = orders.filter(o => o.status === 'pending').length;

  return (
    <div className={`user-dashboard ${isAdmin ? 'admin-theme' : 'user-theme'}`}>
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <div className="header-icon">
            {isAdmin ? <FiShield /> : <FiUser />}
          </div>
          <div className="header-text">
            <h1>{isAdmin ? 'Admin Profile & Settings' : 'My Dashboard'}</h1>
            <p>{isAdmin ? 'Manage your admin account settings' : 'View your profile and order history'}</p>
          </div>
        </div>
      </header>

      {/* Error Banner */}
      {error && (
        <div className="warning-banner">
          <FiAlertCircle />
          <span>{error}</span>
        </div>
      )}

      {/* Stats Cards (User only) */}
      {!isAdmin && (
        <div className="stats-grid">
          {loadingStates.profile || loadingStates.orders ? (
            <div className="loading-section">
              <div className="loading-text">Loading statistics...</div>
            </div>
          ) : (
            <>
              <div className="stat-card">
                <div className="stat-icon">
                  <FiPackage />
                </div>
                <div className="stat-content">
                  <div className="stat-label">Total Orders</div>
                  <div className="stat-valuee">{totalOrders}</div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">
                  <FiClock />
                </div>
                <div className="stat-content">
                  <div className="stat-label">Pending Orders</div>
                  <div className="stat-valuee">{pendingOrders}</div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">
                  <FiDollarSign />
                </div>
                <div className="stat-content">
                  <div className="stat-label">Total Spend</div>
                  <div className="stat-valuee">${totalSpend.toFixed(2)}</div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">
                  <FiActivity />
                </div>
                <div className="stat-content">
                  <div className="stat-label">Account Type</div>
                  <div className="stat-valuee">{profile?.role || 'User'}</div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Main Content */}
      <div className={`dashboard-main ${isAdmin ? 'admin-layout' : 'user-layout'}`}>
        {/* Profile Section */}
        <div className="profile-card">
          <div className="card-header">
            <h3>
              <FiUser className="section-icon" />
              Profile Settings
            </h3>
          </div>

          {loadingStates.profile ? (
            <div className="loading-section">
              <div className="loading-text">Loading profile...</div>
            </div>
          ) : profile?.googleId ? (
            <div className="profile-content">
              <div className="profile-field-group">
                <div className="profile-field">
                  <div className="field-icon-wrapper">
                    <FiUser />
                  </div>
                  <div className="field-content">
                    <div className="field-label">Username</div>
                    <div className="field-value">{profile?.username}</div>
                  </div>
                </div>

                <div className="profile-field">
                  <div className="field-icon-wrapper">
                    <FiMail />
                  </div>
                  <div className="field-content">
                    <div className="field-label">Email</div>
                    <div className="field-value">{profile?.email}</div>
                  </div>
                </div>
              </div>

              <div className="google-notice">
                <FiAlertCircle />
                <span>This account is managed via Google Sign-In. Update your profile in your Google account.</span>
              </div>
            </div>
          ) : !editField ? (
            <div className="profile-content">
              <div className="profile-field-group">
                <div className="profile-field">
                  <div className="field-icon-wrapper">
                    <FiUser />
                  </div>
                  <div className="field-content">
                    <div className="field-label">Username</div>
                    <div className="field-value">{profile?.username}</div>
                  </div>
                </div>

                <div className="profile-field">
                  <div className="field-icon-wrapper">
                    <FiMail />
                  </div>
                  <div className="field-content">
                    <div className="field-label">Email</div>
                    <div className="field-value">{profile?.email}</div>
                  </div>
                </div>

                {isAdmin && (
                  <div className="profile-field">
                    <div className="field-icon-wrapper">
                      <FiShield />
                    </div>
                    <div className="field-content">
                      <div className="field-label">Role</div>
                      <div className="field-value admin-badge">Administrator</div>
                    </div>
                  </div>
                )}
              </div>

              <button className="btn-edit-profile" onClick={() => setEditField('menu')}>
                <FiEdit2 /> Edit Profile
              </button>
            </div>
          ) : editField === 'menu' ? (
            <div className="edit-menu">
              <button className="edit-option" onClick={() => setEditField('username')}>
                <FiUser /> Edit Username
              </button>
              <button className="edit-option" onClick={() => setEditField('email')}>
                <FiMail /> Edit Email
              </button>
              <button className="edit-option" onClick={() => setEditField('password')}>
                <FiLock /> Change Password
              </button>
              <button className="btn-cancel" onClick={() => setEditField(null)}>
                <FiX /> Cancel
              </button>
            </div>
          ) : (
            <form className="edit-form" onSubmit={saveProfile}>
              {editField === 'username' && (
                <div className="form-group">
                  <label>
                    <FiUser className="input-icon" />
                    Username
                  </label>
                  <input 
                    name="username" 
                    value={form.username} 
                    onChange={handleChange} 
                    placeholder="Enter new username"
                    autoFocus
                  />
                </div>
              )}

              {editField === 'email' && (
                <div className="form-group">
                  <label>
                    <FiMail className="input-icon" />
                    Email
                  </label>
                  <input 
                    type="email"
                    name="email" 
                    value={form.email} 
                    onChange={handleChange} 
                    placeholder="Enter new email"
                    autoFocus
                  />
                </div>
              )}

              {editField === 'password' && (
                <>
                  <div className="form-group">
                    <label>
                      <FiLock className="input-icon" />
                      New Password
                    </label>
                    <input 
                      type="password"
                      name="password" 
                      value={form.password} 
                      onChange={handleChange} 
                      placeholder="Enter new password"
                      autoFocus
                    />
                  </div>
                  <div className="form-group">
                    <label>
                      <FiLock className="input-icon" />
                      Confirm Password
                    </label>
                    <input 
                      type="password"
                      name="confirmPassword" 
                      value={form.confirmPassword} 
                      onChange={handleChange} 
                      placeholder="Confirm new password"
                    />
                  </div>
                </>
              )}

              <div className="form-actions">
                <button className="btn-save" type="submit">
                  <FiCheck /> Save Changes
                </button>
                <button className="btn-cancel" type="button" onClick={() => setEditField(null)}>
                  <FiX /> Cancel
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Orders Section (User only) */}
        {!isAdmin && (
          <div className="orders-card">
            <div className="card-header">
              <h3>
                <FiPackage className="section-icon" />
                Recent Orders
              </h3>
            </div>

            {loadingStates.orders ? (
              <div className="loading-section">
                <div className="loading-text">Loading orders...</div>
              </div>
            ) : orders.length === 0 ? (
              <div className="empty-state">
                <FiPackage className="empty-icon" />
                <p>No orders yet</p>
                <button className="btn-primary" onClick={() => navigate('/home')}>
                  Start Shopping
                </button>
              </div>
            ) : (
              <div className="orders-list">
                {orders.slice(0, 5).map(order => {
                  const items = order.items || [];
                  return (
                    <div key={order._id} className="order-item">
                      <div className="order-header">
                        <div className="order-id">
                          <FiPackage />
                          #{order._id.slice(-8).toUpperCase()}
                        </div>
                        <div className="order-status">
                          <span className={`status-badge ${order.status}`}>
                            {order.status}
                          </span>
                        </div>
                      </div>

                      <div className="order-body">
                        <div className="order-items-preview">
                          {items.slice(0, 2).map((item, idx) => (
                            <div key={idx} className="item-preview">
                              <div className="item-image">
                                {item.imageUrl ? (
                                  <img src={item.imageUrl} alt={item.name} />
                                ) : (
                                  <FiPackage />
                                )}
                              </div>
                              <div className="item-info">
                                <div className="item-name">{item.name}</div>
                                <div className="item-qty">Qty: {item.quantity}</div>
                              </div>
                            </div>
                          ))}
                          {items.length > 2 && (
                            <div className="items-more">
                              +{items.length - 2} more
                            </div>
                          )}
                        </div>

                        <div className="order-footer">
                          <div className="order-meta">
                            <span className="order-total">
                              <FiDollarSign />
                              ${order.total?.toFixed(2)}
                            </span>
                            <span className="order-date">
                              <FiClock />
                              {new Date(order.createdAt || order.date).toLocaleDateString()}
                            </span>
                          </div>
                          <button 
                            className="btn-view-order" 
                            onClick={() => setSelectedOrder(order)}
                          >
                            View Details
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {orders.length > 5 && (
              <div className="card-footer">
                <button className="btn-view-all" onClick={() => navigate('/my-orders')}>
                  View All Orders →
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Order Details</h3>
              <button className="modal-close" onClick={() => setSelectedOrder(null)}>
                <FiX />
              </button>
            </div>

            <div className="modal-body">
              <div className="order-detail-row">
                <span className="detail-label">Order ID:</span>
                <span className="detail-value">{selectedOrder._id}</span>
              </div>
              <div className="order-detail-row">
                <span className="detail-label">Status:</span>
                <span className={`status-badge ${selectedOrder.status}`}>
                  {selectedOrder.status}
                </span>
              </div>
              <div className="order-detail-row">
                <span className="detail-label">Total:</span>
                <span className="detail-value">${selectedOrder.total?.toFixed(2)}</span>
              </div>
              <div className="order-detail-row">
                <span className="detail-label">Date:</span>
                <span className="detail-value">
                  {new Date(selectedOrder.createdAt || selectedOrder.date).toLocaleString()}
                </span>
              </div>

              <h4 className="items-title">Order Items</h4>
              <div className="modal-items-list">
                {(selectedOrder.items || []).map((item, idx) => (
                  <div key={idx} className="modal-item">
                    <div className="modal-item-info">
                      <span className="modal-item-name">{item.name}</span>
                      <span className="modal-item-qty">Qty: {item.quantity}</span>
                    </div>
                    <span className="modal-item-price">
                      ${((item.price || 0) * (item.quantity || 0)).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDashboard;

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import Skeleton from '../Loader/loader';
import './UserOrders.css';
import { FiPackage, FiClock, FiDollarSign, FiX } from 'react-icons/fi';

const API = 'http://localhost:4000/user';

const UserOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const token = Cookies.get('token');

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API}/orders`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setOrders(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error('Failed to fetch orders', err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [token]);

  const getStatusBadge = (status) => {
    const colors = {
      Pending: { bg: '#FEF3C7', color: '#92400E' },
      Confirmed: { bg: '#DBEAFE', color: '#1E40AF' },
      Completed: { bg: '#D1FAE5', color: '#065F46' },
      Failed: { bg: '#FEE2E2', color: '#991B1B' }
    };
    const style = colors[status] || colors.Pending;
    return (
      <span style={{
        background: style.bg,
        color: style.color,
        padding: '4px 12px',
        borderRadius: '12px',
        fontSize: '0.8rem',
        fontWeight: 600
      }}>
        {status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="user-orders-page">
        <Skeleton type="order" count={3} />
      </div>
    );
  }

  return (
    <div className="user-orders-page">
      <header className="orders-header">
        <h2><FiPackage className="header-icon" /> My Orders</h2>
        <p className="orders-subtitle">Track and manage your orders</p>
      </header>

      {orders.length === 0 ? (
        <div className="empty-orders">
          <FiPackage style={{ fontSize: '4rem', color: '#d1d5db' }} />
          <p>No orders yet</p>
        </div>
      ) : (
        <div className="orders-grid">
          {orders.map(order => (
            <div key={order._id} className="order-card-full">
              <div className="order-card-header">
                <div className="order-id">
                  <FiPackage className="order-icon" />
                  Order #{String(order._id).slice(-8)}
                </div>
                {getStatusBadge(order.status)}
              </div>

              <div className="order-meta-row">
                <div className="meta-item">
                  <FiClock className="meta-icon" />
                  <span>{new Date(order.createdAt || order.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
                <div className="meta-item">
                  <FiDollarSign className="meta-icon" />
                  <span className="order-total">${order.total?.toFixed(2)}</span>
                </div>
              </div>

              <div className="order-products">
                {(order.items || []).slice(0, 3).map((item, idx) => (
                  <div key={idx} className="product-item">
                    <div className="product-image">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} />
                      ) : (
                        <div className="product-placeholder">
                          <FiPackage />
                        </div>
                      )}
                    </div>
                    <div className="product-info">
                      <div className="product-name">{item.name}</div>
                      <div className="product-details">
                        <span>Qty: {item.quantity}</span>
                        <span>${(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                ))}
                {(order.items || []).length > 3 && (
                  <div className="more-items">
                    +{(order.items || []).length - 3} more item{(order.items || []).length - 3 > 1 ? 's' : ''}
                  </div>
                )}
              </div>

              <div className="order-actions">
                <button className="btn-view" onClick={() => setSelectedOrder(order)}>
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="modal-box-order" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Order Details</h3>
              <button className="close-btn" onClick={() => setSelectedOrder(null)}>
                <FiX />
              </button>
            </div>
            <div className="modal-content-order">
              <div className="modal-info-row">
                <div className="info-item">
                  <div className="info-label">Order ID</div>
                  <div className="info-value">{selectedOrder._id}</div>
                </div>
                <div className="info-item">
                  <div className="info-label">Status</div>
                  <div className="info-value">{getStatusBadge(selectedOrder.status)}</div>
                </div>
              </div>
              <div className="modal-info-row">
                <div className="info-item">
                  <div className="info-label">Order Date</div>
                  <div className="info-value">{new Date(selectedOrder.createdAt || selectedOrder.date).toLocaleString()}</div>
                </div>
                <div className="info-item">
                  <div className="info-label">Total</div>
                  <div className="info-value total-highlight">${selectedOrder.total?.toFixed(2)}</div>
                </div>
              </div>

              <h4 style={{ marginTop: 20, marginBottom: 12 }}>Order Items</h4>
              <div className="modal-products-list">
                {(selectedOrder.items || []).map((item, idx) => (
                  <div key={idx} className="modal-product-item">
                    <div className="modal-product-image">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} />
                      ) : (
                        <div className="modal-product-placeholder">
                          <FiPackage />
                        </div>
                      )}
                    </div>
                    <div className="modal-product-info">
                      <div className="modal-product-name">{item.name}</div>
                      <div className="modal-product-details">
                        Quantity: {item.quantity} × ${item.price?.toFixed(2)}
                      </div>
                    </div>
                    <div className="modal-product-total">
                      ${(item.quantity * item.price).toFixed(2)}
                    </div>
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

export default UserOrders;

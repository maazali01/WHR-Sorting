import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './UserComponents.css';

const UserOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await axios.get('http://localhost:4000/user/orders', { withCredentials: true });
        setOrders(res.data);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  if (loading) return <div className="user-card loading-card">Loading orders...</div>;

  return (
    <div className="user-card user-orders-card">
      <h2 className="user-card-title">My Orders</h2>
      {orders.length === 0 ? (
        <p className="no-orders">No orders found.</p>
      ) : (
        <div className="orders-list">
          {orders.map(order => (
            <div key={order._id} className="order-card">
              <h4 className="order-id">Order #{order._id.slice(-5)}</h4>
              <p className="order-status">
                Status: <span className={`status-badge ${order.status}`}>{order.status}</span>
              </p>
              <p className="order-total">Total: ${order.total}</p>
              <ul className="order-items">
                {order.items.map(item => (
                  <li key={item.productId} className="order-item">
                    {item.name} – {item.quantity} × ${item.price}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserOrders;

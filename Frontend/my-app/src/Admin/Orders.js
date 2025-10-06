import React, { useEffect, useState } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import Loader from "../Loader/loader";
import "./Orders.css";

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = Cookies.get("token");

    if (!token) {
      setError("Unauthorized: No token found. Please login as admin.");
      setLoading(false);
      return;
    }

    const fetchOrders = async () => {
      try {
        const res = await axios.get("http://localhost:4000/admin/orders", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setOrders(res.data);
      } catch (err) {
        console.error("Error fetching orders:", err);
        setError("Failed to fetch orders. Unauthorized or server error.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  // Handle send order to Webots
  const sendToWebots = async (orderId) => {
    try {
      const token = Cookies.get("token");
      await axios.post(
        `http://localhost:4000/admin/orders/${orderId}/send-webots`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      alert(`Order ${orderId} sent to Webots successfully!`);
    } catch (err) {
      console.error("Error sending to Webots:", err);
      alert("Failed to send order to Webots.");
    }
  };

  if (loading) return <div className="orders-loading"><Loader /></div>;
  if (error) return <div className="orders-error">{error}</div>;

  return (
    <div className="orders-container">
      <h2 className="orders-title">Orders Dashboard</h2>

      {orders.length === 0 ? (
        <p className="no-orders">No orders found.</p>
      ) : (
        <div className="orders-list">
          <div className="orders-header">
            <span>Order ID</span>
            <span>Status</span>
            <span>Item Name</span>
            <span>Quantity</span>
            <span>Total</span>
            <span>Date</span>
            <span>Priority</span>
            <span>Action</span>
          </div>

          {orders.map((order) => (
            <div key={order._id} className="order-row">
              <span className="order-id">{order._id}</span>
              <span>
                <span
                  className={`status-badge ${order.status.toLowerCase()}`}
                >
                  {order.status}
                </span>
              </span>

              {/* Items Names */}
              <span className="order-items">
                {order.items.map((item, index) => (
                  <div key={index}>{item.name}</div>
                ))}
              </span>

              {/* Items Quantities */}
              <span className="order-quantities">
                {order.items.map((item, index) => (
                  <div key={index}>x{item.quantity}</div>
                ))}
              </span>

              <span className="order-total">${order.total}</span>
              <span className="order-date">
                {new Date(order.date).toLocaleString()}
              </span>
              <span>
                <select
                  className="priority-select"
                  defaultValue="Normal"
                  onChange={(e) =>
                    console.log(`Priority for ${order._id}:`, e.target.value)
                  }
                >
                  <option value="Low">Low</option>
                  <option value="Normal">Normal</option>
                  <option value="High">High</option>
                </select>
              </span>
              <span>
                <button
                  className="send-btn"
                  onClick={() => sendToWebots(order._id)}
                >
                  Send to Webots
                </button>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Orders;

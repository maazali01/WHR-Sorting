import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { FiPackage, FiClock, FiCheckCircle, FiAlertCircle, FiTrendingUp, FiSearch, FiFilter, FiCalendar, FiUser, FiDollarSign, FiTrash2, FiX } from "react-icons/fi";
import "./Orders.css";

const Orders = () => {
	const [orders, setOrders] = useState([]);
	const [loadingStates, setLoadingStates] = useState({
		stats: true,
		filters: true,
		orders: true
	});
	const [error, setError] = useState("");
	const [searchTerm, setSearchTerm] = useState("");
	const [statusFilter, setStatusFilter] = useState("all");
	const [priorityFilter, setPriorityFilter] = useState("all");
	const [expandedOrder, setExpandedOrder] = useState(null);
	const [deletingOrderId, setDeletingOrderId] = useState(null);
	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const [orderToDelete, setOrderToDelete] = useState(null);
	const [deleteSuccess, setDeleteSuccess] = useState(false);
	const [deleteError, setDeleteError] = useState("");

	useEffect(() => {
		const token = Cookies.get("token");
		if (!token) {
			setError("Unauthorized: No token found. Please login as admin.");
			setLoadingStates({ stats: false, filters: false, orders: false });
			return;
		}

		const fetchOrders = async () => {
			try {
				const headers = { Authorization: `Bearer ${token}` };
				// Get the list (may be summary)
				const res = await axios.get("http://localhost:4000/admin/orders", { headers });
				const list = Array.isArray(res.data) ? res.data : [];

				// For any order missing items or user, fetch detailed version in parallel
				const detailPromises = list.map(async (o) => {
					// if items/user present, keep as-is
					if ((Array.isArray(o.items) && o.items.length > 0) || (o.user && (o.user.username || o.user.email))) {
						return o;
					}
					try {
						const det = await axios.get(`http://localhost:4000/admin/orders/${o._id}`, { headers });
						return det.data || o;
					} catch (err) {
						// fallback to original order on error
						console.debug(`Order detail fetch failed for ${o._id}:`, err?.message || err);
						return o;
					}
				});

				const resolved = await Promise.all(detailPromises);
				setOrders(resolved);

				// simple progressive UI timing (no per-order loading)
				setTimeout(() => setLoadingStates(prev => ({ ...prev, stats: false })), 100);
				setTimeout(() => setLoadingStates(prev => ({ ...prev, filters: false })), 200);
				setTimeout(() => setLoadingStates(prev => ({ ...prev, orders: false })), 300);
			} catch (err) {
				console.error("Error fetching orders:", err);
				setError("Failed to fetch orders. Unauthorized or server error.");
				setLoadingStates({ stats: false, filters: false, orders: false });
			}
		};

		fetchOrders();
	}, []);

	// --- Helpers to decide what to show (no per-order loading) ---
	const hasUserInfo = (order) => !!(order && order.user && (order.user.username || order.user.email));
	const itemsPresent = (order) => Array.isArray(order?.items) && order.items.length > 0;

	const getCustomerDisplay = (order) => {
		if (hasUserInfo(order)) return order.user.username || order.user.email;
		return "—";
	};

	const getItemsDisplay = (order) => {
		if (itemsPresent(order)) return `${order.items.length} item(s)`;
		return "—";
	};

  // Calculate statistics
  const stats = useMemo(() => {
    const total = orders.length;
    const pending = orders.filter(o => o.status.toLowerCase() === 'pending').length;
    const completed = orders.filter(o => o.status.toLowerCase() === 'completed').length;
    const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
    
    return { total, pending, completed, totalRevenue };
  }, [orders]);

  // Filter orders
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      // ✅ Add safety checks for undefined properties
      const items = order.items || [];
      const user = order.user || {};
      
      const matchesSearch = 
        order._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.username || user.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        items.some(item => (item.name || '').toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesStatus = statusFilter === 'all' || (order.status || '').toLowerCase() === statusFilter.toLowerCase();
      const matchesPriority = priorityFilter === 'all' || (order.priority || 'normal').toLowerCase() === priorityFilter.toLowerCase();
      
      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [orders, searchTerm, statusFilter, priorityFilter]);

  const toggleOrderExpand = (orderId) => {
		setExpandedOrder(expandedOrder === orderId ? null : orderId);
	};

  const handleDeleteOrder = async (orderId, e) => {
    e.stopPropagation();
    
    const token = Cookies.get("token");
    if (!token) {
      setDeleteError("Unauthorized: Please login as admin.");
      return;
    }

    setDeletingOrderId(orderId);

    try {
      await axios.delete(`http://localhost:4000/admin/orders/${orderId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setOrders(orders.filter (order => order._id !== orderId));
      
      if (expandedOrder === orderId) {
        setExpandedOrder(null);
      }

      setDeleteSuccess(true);
      setShowDeleteModal(false);
      setOrderToDelete(null);

      // Hide success message after 3 seconds
      setTimeout(() => {
        setDeleteSuccess(false);
      }, 3000);
    } catch (err) {
      console.error("Error deleting order:", err);
      setDeleteError(err.response?.data?.message || "Failed to delete order. Please try again.");
      
      // Hide error message after 5 seconds
      setTimeout(() => {
        setDeleteError("");
      }, 5000);
    } finally {
      setDeletingOrderId(null);
    }
  };

  const openDeleteModal = (order, e) => {
    e.stopPropagation();
    setOrderToDelete(order);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setOrderToDelete(null);
    setDeleteError("");
  };

  const getStatusIcon = (status) => {
    switch (status.toLowerCase()) {
      case 'completed': return <FiCheckCircle />;
      case 'pending': return <FiClock />;
      case 'processing': return <FiTrendingUp />;
      default: return <FiAlertCircle />;
    }
  };

  const getPriorityLabel = (priority) => {
    if (priority === 1) return 'Fast';
    if (priority === 0) return 'Normal';
    // Fallback for old string values
    return String(priority || 'Normal').charAt(0).toUpperCase() + String(priority || 'normal').slice(1);
  };

  const getPriorityClass = (priority) => {
    if (priority === 1) return 'urgent';
    if (priority === 0) return 'normal';
    // Fallback for old string values
    return String(priority || 'normal').toLowerCase();
  };

  if (error) return <div className="orders-error"><FiAlertCircle /> {error}</div>;

  return (
    <div className="orders-container">
      {/* Page Header - Always visible immediately */}
      <header className="orders-headerr">
        <div className="header-content">
          <div className="header-icon">
            <FiPackage />
          </div>
          <div className="header-text">
            <h1>Orders Management</h1>
            <p>Manage and track all customer orders and transactions</p>
          </div>
        </div>
      </header>

      {/* Statistics Cards - Lazy load */}
      <div className="stats-grid">
        {loadingStates.stats ? (
          <div className="loading-section">
            <div className="loading-text">Loading statistics...</div>
          </div>
        ) : (
          <>
            <div className="stat-card total">
              <div className="stat-icon">
                <FiPackage />
              </div>
              <div className="stat-content">
                <span className="stat-label">Total Orders</span>
                <span className="stat-value">{stats.total}</span>
              </div>
            </div>

            <div className="stat-card pending">
              <div className="stat-icon">
                <FiClock />
              </div>
              <div className="stat-content">
                <span className="stat-label">Pending</span>
                <span className="stat-value">{stats.pending}</span>
              </div>
            </div>

            <div className="stat-card completed">
              <div className="stat-icon">
                <FiCheckCircle />
              </div>
              <div className="stat-content">
                <span className="stat-label">Completed</span>
                <span className="stat-value">{stats.completed}</span>
              </div>
            </div>

            <div className="stat-card revenue">
              <div className="stat-icon">
                <FiDollarSign />
              </div>
              <div className="stat-content">
                <span className="stat-label">Total Revenue</span>
                <span className="stat-value">${stats.totalRevenue.toFixed(2)}</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Filters Section - Lazy load */}
      {loadingStates.filters ? (
        <div className="loading-section">
          <div className="loading-text">Loading filters...</div>
        </div>
      ) : (
        <div className="filters-section">
          <div className="search-box">
            <FiSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search by Order ID, User, or Item..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="filter-group">
            <div className="filter-item">
              <FiFilter className="filter-icon" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div className="filter-item">
              <FiTrendingUp className="filter-icon" />
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Priority</option>
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Orders List */}
      {loadingStates.orders ? (
        <div className="loading-section">
          <div className="loading-text">Loading orders...</div>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="no-orders">
          <FiPackage className="no-orders-icon" />
          <p>No orders found</p>
        </div>
      ) : (
        <div className="orders-grid">
          {filteredOrders.map((order) => {
            // safety checks
            const items = order.items || [];
            const user = order.user || {};

            return (
              <div
                key={order._id}
                className={`order-cardd ${expandedOrder === order._id ? 'expanded' : ''}`}
                onClick={() => toggleOrderExpand(order._id)}
              >
                {/* Order Header */}
                <div className="order-card-header">
                  <div className="order-main-info">
                    <span className={`status-badge ${(order.status || 'pending').toLowerCase()}`}>
                      {getStatusIcon(order.status || 'pending')}
                      {order.status || 'Pending'}
                    </span>
                    <span className={`priority-badge ${getPriorityClass(order.priority)}`}>
                      {getPriorityLabel(order.priority)}
                    </span>
                  </div>
                  <div className="order-actions">
                    <button
                      className="deletee-btn"
                      onClick={(e) => openDeleteModal(order, e)}
                      disabled={deletingOrderId === order._id}
                      title="Delete Order"
                    >
                      {deletingOrderId === order._id ? (
                        <span className="deleting-spinner">⏳</span>
                      ) : (
                        <FiTrash2 />
                      )}
                    </button>
                  </div>
                </div>

                <div className="order-id-section">
                  <span className="order-id-label">Order ID</span>
                  <span className="order-idd">{String(order._id).slice(-8).toUpperCase()}</span>
                </div>

                {/* Order Summary */}
                <div className="order-summary">
                  <div className="summary-item">
                    <FiUser className="summary-icon" />
                    <div className="summary-content">
                      <span className="summary-label">Customer</span>
                      <span className="summary-value">
                        {getCustomerDisplay(order)}
                      </span>
                    </div>
                  </div>

                  <div className="summary-item">
                    <FiPackage className="summary-icon" />
                    <div className="summary-content">
                      <span className="summary-label">Items</span>
                      <span className="summary-value">{getItemsDisplay(order)}</span>
                    </div>
                  </div>

                  <div className="summary-item">
                    <FiDollarSign className="summary-icon" />
                    <div className="summary-content">
                      <span className="summary-label">Total</span>
                      <span className="summary-value">${order.total || 0}</span>
                    </div>
                  </div>

                  <div className="summary-item">
                    <FiCalendar className="summary-icon" />
                    <div className="summary-content">
                      <span className="summary-label">Date</span>
                      <span className="summary-value">
                        {order.date ? new Date(order.date).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedOrder === order._id && (
                  <div className="order-details">
                    <div className="details-section">
                      <h4 className="details-title">Order Items</h4>
                      <div className="items-list">
                        {items.length > 0 ? (
                          items.map((item, index) => (
                            <div key={index} className="item-row">
                              <span className="item-namee">{item.name || 'Unknown Item'}</span>
                              <span className="item-quantity">Qty: {item.quantity || 0}</span>
                              {item.price != null && (
                                <span className="item-pricee">${((item.price || 0) * (item.quantity || 0)).toFixed(2)}</span>
                              )}
                            </div>
                          ))
                        ) : (
                          <div className="item-row">
                            <span className="item-namee">No items found</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="details-section">
                      <h4 className="details-title">Additional Information</h4>
                      <div className="info-grid">
                        <div className="info-itemm">
                          <span className="info-labell">Full Order ID:</span>
                          <span className="info-valuee">{order._id}</span>
                        </div>
                        <div className="info-itemm">
                          <span className="info-labell">Order Date:</span>
                          <span className="info-valuee">
                            {order.date ? new Date(order.date).toLocaleString() : 'N/A'}
                          </span>
                        </div>
                        {user.email && (
                          <div className="info-itemm">
                            <span className="info-labell">Email:</span>
                            <span className="info-valuee">{user.email}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && orderToDelete && (
        <div className="modal-overlay" onClick={closeDeleteModal}>
          <div className="modal-delete" onClick={(e) => e.stopPropagation()}>
            <div className="modal-delete-header">
              <div className="modal-delete-icon-wrapper">
                <FiTrash2 className="modal-delete-icon" />
              </div>
              <button className="modal-close-btn" onClick={closeDeleteModal}>
                <FiX />
              </button>
            </div>
            
            <div className="modal-delete-content">
              <h3 className="modal-delete-title">Delete Order?</h3>
              <p className="modal-delete-text">
                Are you sure you want to delete order{" "}
                <strong>#{orderToDelete._id.slice(-8).toUpperCase()}</strong>?
                <br />
                <span className="modal-delete-warning">
                  This action cannot be undone.
                </span>
              </p>
              
              <div className="modal-delete-details">
                <div className="detail-row">
                  <span className="detail-label">Customer:</span>
                  <span className="detail-value">
                    {orderToDelete.user?.username || orderToDelete.user?.email || '—'}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Total:</span>
                  <span className="detail-value">${orderToDelete.total}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Items:</span>
                  <span className="detail-value">
                    {Array.isArray(orderToDelete.items) ? `${orderToDelete.items.length} item(s)` : '—'}
                  </span>
                </div>
              </div>

              {deleteError && (
                <div className="modal-error">
                  <FiAlertCircle /> {deleteError}
                </div>
              )}
            </div>
            
            <div className="modal-delete-actions">
              <button 
                className="modal-btn modal-btn-cancel" 
                onClick={closeDeleteModal}
                disabled={deletingOrderId === orderToDelete._id}
              >
                Cancel
              </button>
              <button 
                className="modal-btn modal-btn-delete" 
                onClick={(e) => handleDeleteOrder(orderToDelete._id, e)}
                disabled={deletingOrderId === orderToDelete._id}
              >
                {deletingOrderId === orderToDelete._id ? (
                  <>
                    <span className="btn-spinner"></span>
                    Deleting...
                  </>
                ) : (
                  <>
                    <FiTrash2 />
                    Delete Order
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Toast */}
      {deleteSuccess && (
        <div className="toast toast-success">
          <FiCheckCircle className="toast-icon" />
          <span>Order deleted successfully!</span>
        </div>
      )}

      {/* Error Toast (for global errors) */}
      {deleteError && !showDeleteModal && (
        <div className="toast toast-error">
          <FiAlertCircle className="toast-icon" />
          <span>{deleteError}</span>
        </div>
      )}
    </div>
  );
};

export default Orders;

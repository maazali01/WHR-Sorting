import React, { useEffect, useRef, useCallback, useState } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import Skeleton from "../Loader/loader";
import { FiPlayCircle, FiStopCircle, FiPackage, FiClock, FiZap, FiActivity, FiTerminal, FiAlertCircle, FiCheckCircle, FiInfo, FiX, FiTrendingUp, FiUser } from "react-icons/fi";
import "./Webots.css";
import API_URL from '../config/api';

const WEBOTS_SCRIPT_SRC = "https://cyberbotics.com/wwi/R2025a/WebotsView.js";
const DEFAULT_THUMBNAIL =
  "https://cyberbotics.com/wwi/R2025a/images/loading/default_thumbnail.png";

// singletons to persist across re-renders and route changes
let webotsViewInstance = null;
let disconnectTimeout = null;

const WebotsViewer = () => {
  const connectBtnRef = useRef(null);
  const webotsContainerRef = useRef(null);
  const logsPollingRef = useRef(null);
  const logsCardRef = useRef(null);

  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [pendingOrders, setPendingOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [priorityMap, setPriorityMap] = useState({});
  const [logs, setLogs] = useState([]);
  const [autoScroll, setAutoScroll] = useState(true);
  const [showControlsGuide, setShowControlsGuide] = useState(false);
  const [teleopActive, setTeleopActive] = useState(false);
  
  // ✅ Add toast notification state
  const [toast, setToast] = useState({ show: false, message: '', type: 'info', details: null });
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [orderModalData, setOrderModalData] = useState(null);

  // Load Webots script once
  useEffect(() => {
    if (window.__WEBOTS_SCRIPT_LOADED || typeof window.Enum !== "undefined") {
      setScriptLoaded(true);
      return;
    }

    const script = document.createElement("script");
    script.src = WEBOTS_SCRIPT_SRC;
    script.type = "module";
    script.onload = () => {
      try {
        window.__WEBOTS_SCRIPT_LOADED = true;
      } catch (e) {}
      setScriptLoaded(true);
    };
    script.onerror = () => {
      console.error("Failed to load Webots script:", WEBOTS_SCRIPT_SRC);
    };
    document.body.appendChild(script);
  }, []);

  // Disconnect logic
  const disconnectWebots = useCallback(async () => {
    try {
      // 🛑 Stop backend Webots process
      await axios.post(`${API_URL}/webots/stop`);

      // ✅ Properly close and remove the webots-view element
      if (webotsViewInstance) {
        if (typeof webotsViewInstance.close === "function") {
          webotsViewInstance.close();
        }
        // Remove from DOM to ensure clean state
        if (webotsViewInstance.parentNode) {
          webotsViewInstance.parentNode.removeChild(webotsViewInstance);
        }
      }

      setIsConnected(false);
      setTeleopActive(false);
      setShowControlsGuide(false);
      if (disconnectTimeout) clearTimeout(disconnectTimeout);
      disconnectTimeout = null;
      setLoading(false);
    } catch (err) {
      console.warn("Error stopping Webots:", err);
    }
  }, []);

  // Connect logic
  const connectToWebots = useCallback(async () => {
    if (!connectBtnRef.current || !webotsViewInstance) return;

    const webotsUrl = "ws://localhost:1234";
    const streamingMode = "w3d";
    const broadcast = false;

    try {
      setLoading(true);

      // 🟢 Step 1: Start Webots backend process
      const token = Cookies.get("token");
      await axios.post(
        `${API_URL}/webots/start`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // 🕐 Step 2: Wait a few seconds to allow Webots to launch
      await new Promise((r) => setTimeout(r, 5000));

      // 🟢 Step 3: Connect Webots viewer
      webotsViewInstance.connect(
        webotsUrl,
        streamingMode,
        broadcast,
        false,
        -1,
        DEFAULT_THUMBNAIL
      );

      webotsViewInstance.onready = () => {
        setLoading(false);
        setIsConnected(true);

        if (disconnectTimeout) clearTimeout(disconnectTimeout);
        disconnectTimeout = setTimeout(() => {
          console.log("Auto disconnect after 1h inactivity");
          disconnectWebots();
        }, 60 * 60 * 1000);
      };

      webotsViewInstance.ondisconnect = () => {
        setIsConnected(false);
        if (disconnectTimeout) clearTimeout(disconnectTimeout);
        disconnectTimeout = null;
        setLoading(false);
      };

      webotsViewInstance.onerror = (err) => {
        console.error("Webots viewer error:", err);
        alert("Connection error / missing file. Check server or console logs.");
        disconnectWebots();
      };
    } catch (err) {
      console.error("Error starting Webots or connecting:", err);
      alert(
        "Failed to start Webots. Ensure Webots is installed and path is correct."
      );
      setLoading(false);
    }
  }, [disconnectWebots]);

  // Create <webots-view> once
  useEffect(() => {
    if (!scriptLoaded) return;

    // ✅ Only create if not already exists in DOM
    if (!webotsViewInstance || !webotsViewInstance.parentNode) {
      const element = document.createElement("webots-view");
      element.setAttribute("thumbnail", DEFAULT_THUMBNAIL);
      element.style.width = "100%";
      element.style.height = "100%";
      webotsViewInstance = element;
    }

    if (
      webotsContainerRef.current &&
      webotsViewInstance.parentNode !== webotsContainerRef.current
    ) {
      webotsContainerRef.current.appendChild(webotsViewInstance);
    }

    if (connectBtnRef.current) {
      connectBtnRef.current.onclick = connectToWebots;
    }

    return () => {
      if (disconnectTimeout) clearTimeout(disconnectTimeout);
    };
  }, [scriptLoaded, connectToWebots]);

  // Handle global admin logout
  useEffect(() => {
    const handleLogout = () => disconnectWebots();
    window.addEventListener("adminLogout", handleLogout);
    return () => window.removeEventListener("adminLogout", handleLogout);
  }, [disconnectWebots]);

  // Fetch pending orders
  const fetchPendingOrders = useCallback(async () => {
    setLoadingOrders(true);
    try {
      const token = Cookies.get("token");
      const res = await axios.get(`${API_URL}/admin/orders/pending`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const list = Array.isArray(res.data) ? res.data : [];
      
      console.log('📦 Fetched pending orders:', list);
      
      setPendingOrders(list);
      const map = {};
      list.forEach((o) => {
        // Convert numeric priority to label for UI
        const priorityLabel = o.priority === 1 ? "Fast" : "Normal";
        map[o._id] = priorityLabel;
      });
      setPriorityMap(map);
    } catch (err) {
      console.error("Error fetching pending orders:", err);
    } finally {
      setLoadingOrders(false);
    }
  }, []); // ✅ Empty deps - token is fetched inside

  useEffect(() => {
    fetchPendingOrders();
  }, [fetchPendingOrders]);

  // Fetch logs from backend
  const fetchLogs = useCallback(async () => {
    try {
      const token = Cookies.get("token");
      const res = await axios.get(`${API_URL}/webots/logs`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const logData = Array.isArray(res.data) ? res.data : [];
      setLogs(logData);
    } catch (err) {
      console.error("Error fetching logs:", err);
    }
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    if (autoScroll && logsCardRef.current) {
      logsCardRef.current.scrollTop = logsCardRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  // Poll logs when connected
  useEffect(() => {
    if (isConnected) {
      fetchLogs();
      logsPollingRef.current = setInterval(fetchLogs, 2000);
    } else {
      if (logsPollingRef.current) {
        clearInterval(logsPollingRef.current);
        logsPollingRef.current = null;
      }
    }

    return () => {
      if (logsPollingRef.current) {
        clearInterval(logsPollingRef.current);
      }
    };
  }, [isConnected, fetchLogs]);

// ✅ COMPLETE FIXED sendToWebots function
// Replace your existing sendToWebots function with this:

  const sendToWebots = async (orderId) => {
    try {
      const token = Cookies.get("token");
      const priorityLabel = priorityMap[orderId] || "Normal";
      const priority = priorityLabel === "Fast" ? 1 : 0;
      
      console.log(`📤 Sending order ${orderId} with priority: ${priority} (${priorityLabel})`);
      
      const res = await axios.post(
        `${API_URL}/webots/send-order/${orderId}`,
        { priority },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (res.data && res.data.success) {
        // Remove order from pending list
        setPendingOrders((prev) => prev.filter((o) => o._id !== orderId));
        setPriorityMap((m) => {
          const copy = { ...m };
          delete copy[orderId];
          return copy;
        });
        
        console.log(`✅ Order assigned successfully:`, res.data);
        
        // Show success modal with details
        setOrderModalData({
          orderId: res.data.orderId,
          motion: res.data.motion,
          crate: res.data.crateNumber,
          products: res.data.products || [],
          totalProducts: res.data.totalProducts || 0,
          priority: res.data.details?.priority || 'Normal',
          customer: res.data.details?.customer || 'N/A'
        });
        setShowOrderModal(true);
        
        // Also show toast
        showToast(
          `Order ${res.data.orderId} sent to Webots successfully!`,
          'success',
          `Motion ${res.data.motion} → Crate ${res.data.crateNumber}`
        );
        
        // Refresh orders
        fetchPendingOrders();
      } else {
        const errorMsg = res.data?.message || "Failed to assign order.";
        console.error(`❌ Assignment failed:`, errorMsg);
        showToast(errorMsg, 'error');
      }
    } catch (err) {
      console.error("❌ Error assigning order:", err);
      
      const errorMsg = err.response?.data?.message || err.message || "Failed to assign order.";
      const helpMsg = err.response?.data?.help || "";
      
      let toastMessage = errorMsg;
      let toastDetails = null;
      
      if (helpMsg) {
        toastDetails = helpMsg;
      }
      
      if (errorMsg.includes('Webots is not running')) {
        toastDetails = 'Please connect to Webots first by clicking the "Connect" button.';
      }
      
      showToast(toastMessage, 'error', toastDetails, 8000);
    }
  };

  const onPriorityChange = (orderId, value) => {
    setPriorityMap((m) => ({ ...m, [orderId]: value }));
  };

  const clearLogs = async () => {
    try {
      const token = Cookies.get("token");
      await axios.delete(`${API_URL}/webots/logs`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLogs([]);
    } catch (err) {
      console.error("Error clearing logs:", err);
    }
  };

  const getLogIcon = (type) => {
    switch (type) {
      case 'error':
        return <FiAlertCircle className="log-icon error" />;
      case 'success':
        return <FiCheckCircle className="log-icon success" />;
      case 'info':
        return <FiInfo className="log-icon info" />;
      default:
        return <FiTerminal className="log-icon default" />;
    }
  };

  // ✅ Toast notification helper
  const showToast = (message, type = 'info', details = null, duration = 5000) => {
    setToast({ show: true, message, type, details });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'info', details: null });
    }, duration);
  };

  const activateTeleoperation = async () => {
    if (!isConnected) {
      showToast("Please connect to Webots first!", 'warning');
      return;
    }

    try {
      const token = Cookies.get("token");
      const res = await axios.post(
        `${API_URL}/webots/teleoperation/activate`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        setTeleopActive(true);
        setShowControlsGuide(true);
        showToast("Manual control mode activated", 'success', 'Use keyboard to control the robot');
      } else {
        showToast(res.data.message || "Failed to activate teleoperation mode.", 'error');
      }
    } catch (err) {
      console.error("Error activating teleoperation:", err);
      showToast(err.response?.data?.message || "Failed to activate teleoperation mode.", 'error');
    }
  };

  const deactivateTeleoperation = async () => {
    try {
      const token = Cookies.get("token");
      const res = await axios.post(
        `${API_URL}/webots/teleoperation/deactivate`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        setTeleopActive(false);
        setShowControlsGuide(false);
        showToast("Automatic sorting mode resumed", 'success', 'YOLO controller activated');
      } else {
        showToast(res.data.message || "Failed to deactivate teleoperation mode.", 'error');
      }
    } catch (err) {
      console.error("Error deactivating teleoperation:", err);
      showToast(err.response?.data?.message || "Failed to deactivate teleoperation mode.", 'error');
    }
  };

  return (
    <div className="webots-page">
      {/* Header Section */}
      <div className="webots-page-header">
        <div className="header-left">
          <div className="webots-logo">
            <img
              src="https://cyberbotics.com/assets/images/webots.png"
              alt="Webots"
            />
          </div>
          <div className="header-text">
            <h1 className="page-title">Webots Simulation</h1>
            <p className="page-subtitle">Live warehouse robot control and monitoring</p>
          </div>
        </div>
        
        <div className="header-right">
          <div className="connection-status">
            <span className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}></span>
            <span className="status-text">{isConnected ? 'Connected' : 'Disconnected'}</span>
          </div>
          
          {!isConnected ? (
            <button 
              ref={connectBtnRef}
              onClick={connectToWebots}
              className="control-btn connect-btn"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="btn-spinner"></div>
                  Connecting...
                </>
              ) : (
                <>
                  <FiPlayCircle />
                  Connect
                </>
              )}
            </button>
          ) : (
            <>
              {!teleopActive ? (
                <button 
                  onClick={activateTeleoperation}
                  className="control-btn teleop-btn"
                >
                  <FiTerminal />
                  Manual Controls
                </button>
              ) : (
                <button 
                  onClick={deactivateTeleoperation}
                  className="control-btn deactivate-btn"
                >
                  <FiZap />
                  Resume Auto Mode
                </button>
              )}
              <button 
                onClick={disconnectWebots}
                className="control-btn disconnect-btn"
              >
                <FiStopCircle />
                Disconnect
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="webots-content">
        {/* Viewer Section */}
        <div className="viewer-section">
          <div className="section-header">
            <FiActivity className="section-icon" />
            <h2>Live Simulation View</h2>
          </div>
          
          <div className="viewer-card">
            <div className="viewer-wrapper" ref={webotsContainerRef}>
              {!isConnected && !loading && (
                <div className="viewer-placeholder">
                  <img
                    src="https://cyberbotics.com/assets/images/webots.png"
                    alt="Webots"
                    className="placeholder-logo"
                  />
                  <h3>Connect to Start Simulation</h3>
                  <p>Click the connect button to start the Webots warehouse simulation</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Logs + Orders */}
        <div className="right-column">
          {/* Processing Logs Section */}
          <div className="logs-section">
            <div className="section-header">
              <FiTerminal className="section-icon" />
              <h2>Processing Logs</h2>
              <div className="logs-controls">
                <label className="auto-scroll-toggle">
                  <input
                    type="checkbox"
                    checked={autoScroll}
                    onChange={(e) => setAutoScroll(e.target.checked)}
                  />
                  <span>Auto-scroll</span>
                </label>
                <button onClick={clearLogs} className="clear-logs-btn" title="Clear logs">
                  Clear
                </button>
              </div>
            </div>

            <div className="logs-card" ref={logsCardRef}>
              {logs.length === 0 ? (
                <div className="empty-logs">
                  <FiTerminal className="empty-icon" />
                  <p>No logs yet</p>
                  <span>Logs will appear here when simulation is running</span>
                </div>
              ) : (
                <div className="logs-list">
                  {logs.map((log, index) => (
                    <div key={index} className={`log-entry ${log.type || 'default'}`}>
                      {getLogIcon(log.type)}
                      <div className="log-content">
                        <span className="log-timestamp">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                        <span className="log-message">{log.message}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Pending Orders Section */}
          <div className="orders-section">
            <div className="section-header">
              <FiPackage className="section-icon" />
              <h2>Pending Orders Queue</h2>
              <span className="orders-count">{pendingOrders.length}</span>
            </div>

            <div className="orders-cardd">
              {loadingOrders ? (
                <div className="orders-loading">
                  <Skeleton type="table" count={3} />
                </div>
              ) : pendingOrders.length === 0 ? (
                <div className="empty-orders">
                  <FiPackage className="empty-icon" />
                  <h3>No Pending Orders</h3>
                  <p>All orders have been processed</p>
                </div>
              ) : (
                <div className="orders-list">
                  {pendingOrders.map((order) => (
                    <div key={order._id} className="order-item">
                      <div className="order-header">
                        <div className="order-id">
                          <FiPackage className="order-icon" />
                          <span>#{String(order._id).slice(-8).toUpperCase()}</span>
                        </div>
                        <div className="order-totall">${order.total.toFixed(2)}</div>
                      </div>

                      {/* ✅ Display User Name */}
                      <div className="order-user-info">
                        <span className="user-label">Customer:</span>
                        <span className="user-name">
                          {order.user?.username || order.user?.email || 'Guest'}
                        </span>
                      </div>

                      <div className="order-items">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="item-detail">
                            <span className="item-name">{item.name}</span>
                            <span className="item-qty">×{item.quantity}</span>
                          </div>
                        ))}
                      </div>

                      {/* ✅ Show crate assignment if order is processing */}
                      {order.crateNumber && (
                        <div className="crate-assignment">
                          <span className="crate-icon">📦</span>
                          <span className="crate-label">Assigned to Crate {order.crateNumber}</span>
                        </div>
                      )}

                      <div className="order-actions">
                        <div className="priority-selector">
                          <FiClock className="priority-icon" />
                          <select
                            value={priorityMap[order._id] || "Normal"}
                            onChange={(e) => onPriorityChange(order._id, e.target.value)}
                            className="priority-select"
                          >
                            <option value="Normal">Normal</option>
                            <option value="Fast">Fast</option>
                          </select>
                        </div>
                        
                        <button
                          onClick={() => sendToWebots(order._id)}
                          className="send-btn"
                        >
                          <FiZap />
                          Start Processing
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ✅ Toast Notification */}
      {toast.show && (
        <div className={`toast-notification toast-${toast.type}`}>
          <div className="toast-icon">
            {toast.type === 'success' && <FiCheckCircle />}
            {toast.type === 'error' && <FiAlertCircle />}
            {toast.type === 'warning' && <FiAlertCircle />}
            {toast.type === 'info' && <FiInfo />}
          </div>
          <div className="toast-content">
            <div className="toast-message">{toast.message}</div>
            {toast.details && <div className="toast-details">{toast.details}</div>}
          </div>
          <button className="toast-close" onClick={() => setToast({ show: false, message: '', type: 'info', details: null })}>
            <FiX />
          </button>
        </div>
      )}

      {/* ✅ Order Success Modal */}
      {showOrderModal && orderModalData && (
        <div className="modal-overlay" onClick={() => setShowOrderModal(false)}>
          <div className="order-success-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header success">
              <div className="modal-icon-wrapper">
                <FiCheckCircle className="success-icon" />
              </div>
              <button className="modal-close-btn" onClick={() => setShowOrderModal(false)}>
                <FiX />
              </button>
            </div>
            
            <div className="modal-contentt">
              <h3 className="modal-title">Order Sent to Webots!</h3>
              <p className="modal-subtitle">Status: In Transit 🚚</p>
              
              <div className="order-details-grid">
                <div className="detail-card">
                  <div className="detail-icon">
                    <FiPackage />
                  </div>
                  <div className="detail-info">
                    <span className="detail-label">Order ID</span>
                    <span className="detail-value">{orderModalData.orderId}</span>
                  </div>
                </div>

                <div className="detail-card">
                  <div className="detail-icon">
                    <FiTrendingUp />
                  </div>
                  <div className="detail-info">
                    <span className="detail-label">Priority</span>
                    <span className="detail-value">{orderModalData.priority}</span>
                  </div>
                </div>

                <div className="detail-card">
                  <div className="detail-icon">
                    <FiZap />
                  </div>
                  <div className="detail-info">
                    <span className="detail-label">Motion</span>
                    <span className="detail-value">Motion {orderModalData.motion}</span>
                  </div>
                </div>

                <div className="detail-card">
                  <div className="detail-icon">
                    <FiPackage />
                  </div>
                  <div className="detail-info">
                    <span className="detail-label">Destination</span>
                    <span className="detail-value">Crate {orderModalData.crate}</span>
                  </div>
                </div>
              </div>

              <div className="products-section">
                <h4>Products ({orderModalData.totalProducts} items)</h4>
                <div className="products-list">
                  {orderModalData.products.map((product, idx) => (
                    <div key={idx} className="product-chip">
                      <FiPackage />
                      {product}
                    </div>
                  ))}
                </div>
              </div>

              <div className="customer-info">
                <FiUser />
                <span>Customer: {orderModalData.customer}</span>
              </div>

              <div className="modal-message">
                <FiActivity />
                <p>
                  🤖 Robot will automatically detect and sort all {orderModalData.totalProducts} products 
                  using Motion {orderModalData.motion} to Crate {orderModalData.crate}.
                </p>
              </div>
            </div>

            <div className="modal-footer">
              <button className="modal-btn modal-btn_primary" onClick={() => setShowOrderModal(false)}>
                <FiCheckCircle />
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Keyboard Controls Guide Modal */}
      {showControlsGuide && (
        <div className="modal-overlay" onClick={() => setShowControlsGuide(false)}>
          <div className="controls-modal" onClick={(e) => e.stopPropagation()}>
            <div className="controls-header">
              <h3>🎮 UR5e Manual Control Active</h3>
              <button 
                className="close-modal-btn" 
                onClick={() => setShowControlsGuide(false)}
              >
                ×
              </button>
            </div>
            
            <div className="controls-content">
              <div className="controls-section">
                <h4>Joint Controls</h4>
                <div className="controls-grid">
                  <div className="control-item">
                    <span className="key-badge">Q / A</span>
                    <span className="control-desc">Shoulder Pan +/−</span>
                  </div>
                  <div className="control-item">
                    <span className="key-badge">W / S</span>
                    <span className="control-desc">Shoulder Lift +/−</span>
                  </div>
                  <div className="control-item">
                    <span className="key-badge">E / D</span>
                    <span className="control-desc">Elbow +/−</span>
                  </div>
                  <div className="control-item">
                    <span className="key-badge">R / F</span>
                    <span className="control-desc">Wrist 1 +/−</span>
                  </div>
                  <div className="control-item">
                    <span className="key-badge">T / G</span>
                    <span className="control-desc">Wrist 2 +/−</span>
                  </div>
                  <div className="control-item">
                    <span className="key-badge">Y / H</span>
                    <span className="control-desc">Wrist 3 +/−</span>
                  </div>
                </div>
              </div>

              <div className="controls-section">
                <h4>Gripper Controls</h4>
                <div className="controls-grid">
                  <div className="control-item">
                    <span className="key-badge">O</span>
                    <span className="control-desc">Open Gripper</span>
                  </div>
                  <div className="control-item">
                    <span className="key-badge">P</span>
                    <span className="control-desc">Close Gripper</span>
                  </div>
                </div>
              </div>

              <div className="controls-note">
                <FiInfo />
                <p>Focus on the Webots 3D window to use keyboard controls</p>
              </div>
            </div>

            <div className="controls-footer">
              <button 
                className="resume-auto-btn" 
                onClick={deactivateTeleoperation}
              >
                <FiZap />
                Resume Automatic Mode
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WebotsViewer;

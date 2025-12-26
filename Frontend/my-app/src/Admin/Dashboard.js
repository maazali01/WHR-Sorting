// src/Admin/Dashboard.js
import React, { useEffect, useState } from "react";
import Cookie from "js-cookie";
import "./Dashboard.css";
import {
  BarChart as ReBarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area
} from "recharts";
import { 
  FiPackage, FiShoppingCart, FiDollarSign, FiUsers, 
  FiTrendingUp, FiActivity, FiAlertCircle 
} from "react-icons/fi";

const API_BASE = "http://localhost:4000/admin";

const Dashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [loadingStates, setLoadingStates] = useState({
    kpis: true,
    charts: true,
    tables: true
  });
  const [warn, setWarn] = useState(null);

  useEffect(() => {
    let cancelled = false;
    
    const loadData = async () => {
      setWarn(null);

      const token = Cookie.get("token");
      if (!token) {
        setWarn("Unauthorized: admin token not found. Please login.");
        setLoadingStates({ kpis: false, charts: false, tables: false });
        return;
      }

      try {
        const headers = { Authorization: `Bearer ${token}` };

        // ✅ Fetch all data in parallel for faster loading
        const [analyticsRes, ordersRes, productsRes] = await Promise.all([
          fetch(`${API_BASE}/analytics`, { credentials: "include", headers }),
          fetch(`${API_BASE}/orders?limit=6`, { credentials: "include", headers }),
          fetch(`${API_BASE}/top-products?limit=6`, { credentials: "include", headers })
        ]);

        if (!analyticsRes.ok) {
          if (analyticsRes.status === 401) throw new Error("Unauthorized");
          throw new Error("analytics endpoint not available");
        }

        const [analyticsData, orders, top] = await Promise.all([
          analyticsRes.json(),
          ordersRes.ok ? ordersRes.json() : [],
          productsRes.ok ? productsRes.json() : []
        ]);

        if (!cancelled) {
          setAnalytics(analyticsData);
          setRecentOrders(orders);
          setTopProducts(top);

          // ✅ Faster progressive loading - reduced delays
          setTimeout(() => setLoadingStates(prev => ({ ...prev, kpis: false })), 100);
          setTimeout(() => setLoadingStates(prev => ({ ...prev, charts: false })), 200);
          setTimeout(() => setLoadingStates(prev => ({ ...prev, tables: false })), 300);
        }
      } catch (e) {
        console.error("Dashboard fetch error:", e);
        if (String(e).toLowerCase().includes("unauthorized")) {
          setWarn("Unauthorized: invalid or expired admin token. Please login.");
        } else {
          setWarn("⚠ Backend not reachable.");
        }
        setLoadingStates({ kpis: false, charts: false, tables: false });
      }
    };

    loadData();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="dashboard-wrap">
      {/* Header - Always visible */}
      <header className="dashboard-header">
        <div className="header-content">
          <div className="header-icon">
            <FiActivity />
          </div>
          <div className="header-text">
            <h1>Dashboard Overview</h1>
            <p>Real-time insights into your warehouse operations and key metrics</p>
          </div>
        </div>
      </header>

      {/* Warning Banner */}
      {warn && (
        <div className="warning-banner">
          <FiAlertCircle />
          <span>{warn}</span>
        </div>
      )}

      {/* KPI Cards - Progressive load */}
      <section className="kpi-grid">
        {loadingStates.kpis ? (
          <div className="loading-section">
            <div className="loading-text">Loading statistics...</div>
          </div>
        ) : analytics ? (
          <>
            <KPICard 
              icon={<FiPackage />}
              title="Total Products"
              value={analytics.productsCount}
              color="#667eea"
            />
            <KPICard 
              icon={<FiShoppingCart />}
              title="Total Orders"
              value={analytics.ordersCount}
              color="#f093fb"
            />
            <KPICard 
              icon={<FiDollarSign />}
              title="Revenue"
              value={formatCurrency(analytics.revenue)}
              color="#43e97b"
            />
            <KPICard 
              icon={<FiUsers />}
              title="Active Users"
              value={analytics.activeUsers}
              color="#4facfe"
            />
          </>
        ) : null}
      </section>

      {/* Charts Grid - Progressive load */}
      {loadingStates.charts ? (
        <div className="loading-section">
          <div className="loading-text">Loading charts...</div>
        </div>
      ) : analytics ? (
        <section className="charts-grid">
          {/* Revenue Trend */}
          <div className="chart-card">
            <div className="chart-header">
              <h3>Revenue Trend (Last 7 Days)</h3>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={analytics.revenueTrend}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#667eea" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#667eea" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="day" stroke="#8b92a8" />
                <YAxis stroke="#8b92a8" />
                <Tooltip 
                  contentStyle={{ background: 'rgba(26, 26, 46, 0.95)', border: '1px solid rgba(102, 126, 234, 0.2)', borderRadius: '8px', color: '#e0e3eb' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#667eea" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorRevenue)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Orders by Category */}
          <div className="chart-card">
            <div className="chart-header">
              <h3>Orders by Category</h3>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <ReBarChart data={Object.entries(analytics.ordersByCategory).map(([name, value]) => ({ name, value }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="name" stroke="#8b92a8" />
                <YAxis stroke="#8b92a8" />
                <Tooltip 
                  contentStyle={{ background: 'rgba(26, 26, 46, 0.95)', border: '1px solid rgba(102, 126, 234, 0.2)', borderRadius: '8px', color: '#e0e3eb' }}
                />
                <Bar dataKey="value" fill="#10b981" radius={[8, 8, 0, 0]} />
              </ReBarChart>
            </ResponsiveContainer>
          </div>

          {/* Product Distribution */}
          <div className="chart-card full-width">
            <div className="chart-header">
              <h3>Product Distribution by Category</h3>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie 
                  data={Object.entries(analytics.productsByCategory).map(([name, value]) => ({ name, value }))} 
                  dataKey="value" 
                  nameKey="name" 
                  cx="50%" 
                  cy="50%" 
                  outerRadius={90}
                  innerRadius={50}
                  label
                >
                  {Object.entries(analytics.productsByCategory).map((entry, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: 'rgba(26, 26, 46, 0.95)', border: '1px solid rgba(102, 126, 234, 0.2)', borderRadius: '8px', color: '#e0e3eb' }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </section>
      ) : null}

      {/* Data Tables Section - Progressive load */}
      {loadingStates.tables ? (
        <div className="loading-section">
          <div className="loading-text">Loading tables...</div>
        </div>
      ) : (
        <section className="data-section">
          {/* Recent Orders */}
          <div className="data-card">
            <div className="section-header">
              <FiShoppingCart className="section-icon" />
              <h2>Recent Orders</h2>
              <span className="data-count">{recentOrders.length}</span>
            </div>
            <RecentOrdersTable orders={recentOrders} />
          </div>

          {/* Top Products */}
          <div className="data-card">
            <div className="section-header">
              <FiTrendingUp className="section-icon" />
              <h2>Top Selling Products</h2>
              <span className="data-count">{topProducts.length}</span>
            </div>
            <TopProductsList items={topProducts} />
          </div>
        </section>
      )}
    </div>
  );
};

// KPI Card Component
const KPICard = ({ icon, title, value, color }) => (
  <div className="kpi-card">
    <div className="kpi-icon" style={{ background: `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)` }}>
      {icon}
    </div>
    <div className="kpi-content">
      <div className="kpi-info">
        <div className="kpi-title">{title}</div>
        <div className="kpi-value">{value}</div>
      </div>
    </div>
  </div>
);

const formatCurrency = (n) =>
  typeof n === "number"
    ? n.toLocaleString(undefined, { style: "currency", currency: "USD" })
    : n;

const RecentOrdersTable = ({ orders }) => {
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="orders-table">
      <table>
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Total</th>
            <th>Status</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {orders.length === 0 ? (
            <tr>
              <td colSpan="4" style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
                No recent orders found.
              </td>
            </tr>
          ) : (
            orders.map((o, index) => {
              const orderId = o.orderId || o._id || o.id || `Order-${index + 1}`;
              const statusValue = (o.status || 'pending').toLowerCase().trim();
              
              return (
                <tr key={o._id || o.id || index}>
                  <td>{orderId}</td>
                  <td>{o.total != null ? formatCurrency(o.total) : 'N/A'}</td>
                  <td>
                    <span className={`status ${statusValue}`}>
                      {o.status || 'Pending'}
                    </span>
                  </td>
                  <td>{formatDate(o.date || o.createdAt)}</td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};

const TopProductsList = ({ items }) => (
  <ul className="top-products">
    {items.length === 0 ? (
      <li className="empty-state">
        <span>No products data available</span>
      </li>
    ) : (
      items.map((p, i) => (
        <li key={p._id}>
          <div className="product-name">
            <span className="product-rank">{i + 1}</span>
            <span>{p.name}</span>
          </div>
          <span className="sold">{p.sold} sold</span>
        </li>
      ))
    )}
  </ul>
);

const COLORS = ["#667eea", "#10b981", "#f59e0b", "#ef4444", "#06b6d4", "#8b5cf6"];

export default Dashboard;

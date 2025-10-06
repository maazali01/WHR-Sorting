// src/Admin/Dashboard.js
import React, { useEffect, useState } from "react";
import Loader from "../Loader/loader";
import "./Dashboard.css";
import {
  LineChart as ReLineChart,
  Line,
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
  ResponsiveContainer
} from "recharts";

const API_BASE = "http://localhost:4000/admin";

const Dashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [warn, setWarn] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function loadData() {
      setLoading(true);
      setWarn(null);
      try {
        const resA = await fetch(`${API_BASE}/analytics`, {
          credentials: "include",
        });
        if (!resA.ok) throw new Error("analytics endpoint not available");
        const analyticsData = await resA.json();

        const resO = await fetch(`${API_BASE}/orders?limit=6`, {
          credentials: "include",
        });
        const orders = resO.ok ? await resO.json() : [];

        const resP = await fetch(`${API_BASE}/top-products?limit=6`, {
          credentials: "include",
        });
        const top = resP.ok ? await resP.json() : [];

        if (!cancelled) {
          setAnalytics(analyticsData);
          setRecentOrders(orders);
          setTopProducts(top);
        }
      } catch (e) {
        console.error("Dashboard fetch error:", e);
        setWarn("⚠ Backend not reachable.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadData();
    return () => { cancelled = true; };
  }, []);

  if (!analytics) return <div className="dashboard-wrap"><Loader /></div>;

  const data = analytics;

  return (
    <div className="dashboard-wrap">
      <header className="dashboard-header">
        <h1>Admin Analytics</h1>
        <p className="sub">Overview — Key Metrics & Recent Activity</p>
      </header>

      {warn && <div className="warn">{warn}</div>}

      <section className="kpi-row">
        <KpiCard title="Total Products" value={data.productsCount} />
        <KpiCard title="Total Orders" value={data.ordersCount} />
        <KpiCard title="Revenue" value={formatCurrency(data.revenue)} />
        <KpiCard title="Active Users" value={data.activeUsers} />
      </section>

      <section className="charts-row">
        <div className="card chart-card">
          <h3>Revenue Trend (7 days)</h3>
          <RevenueLineChart data={data.revenueTrend} />
        </div>
        <div className="card chart-card">
          <h3>Orders by Category</h3>
          <OrdersBarChart data={data.ordersByCategory} />
        </div>
        <div className="card chart-card">
          <h3>Product Distribution</h3>
          <DonutChart data={data.productsByCategory} />
        </div>
      </section>

      <section className="lists-row">
        <div className="card list-card">
          <h3>Recent Orders</h3>
          <RecentOrdersTable orders={recentOrders} loading={loading} />
        </div>
        <div className="card list-card">
          <h3>Top Products</h3>
          <TopProductsList items={topProducts} />
        </div>
      </section>
    </div>
  );
};

const KpiCard = ({ title, value }) => (
  <div className="kpi-card">
    <div className="kpi-title">{title}</div>
    <div className="kpi-value">{value}</div>
  </div>
);

const formatCurrency = (n) =>
  typeof n === "number"
    ? n.toLocaleString(undefined, { style: "currency", currency: "USD" })
    : n;

const RevenueLineChart = ({ data }) => (
  <ResponsiveContainer width="100%" height={250}>
    <ReLineChart data={data}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="day" />
      <YAxis />
      <Tooltip />
      <Legend />
      <Line type="monotone" dataKey="value" stroke="#6366F1" strokeWidth={2} />
    </ReLineChart>
  </ResponsiveContainer>
);

const OrdersBarChart = ({ data }) => {
  const formatted = Object.entries(data).map(([name, value]) => ({ name, value }));
  return (
    <ResponsiveContainer width="100%" height={250}>
      <ReBarChart data={formatted}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="value" fill="#31C48D" radius={[6, 6, 0, 0]} />
      </ReBarChart>
    </ResponsiveContainer>
  );
};

const DonutChart = ({ data }) => {
  const formatted = Object.entries(data).map(([name, value]) => ({ name, value }));
  const colors = ["#31C48D", "#6366F1", "#F59E0B", "#EF4444"];
  return (
    <ResponsiveContainer width="100%" height={250}>
      <PieChart>
        <Pie data={formatted} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} innerRadius={60} label>
          {formatted.map((entry, index) => (
            <Cell key={index} fill={colors[index % colors.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
};

const RecentOrdersTable = ({ orders, loading }) => (
  <div className="orders-table">
    {loading ? (
      <p>Loading...</p>
    ) : (
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Total</th>
            <th>Status</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o._id}>
              <td>{o._id}</td>
              <td>{formatCurrency(o.total)}</td>
              <td><span className={`status ${o.status.toLowerCase()}`}>{o.status}</span></td>
              <td>{o.date}</td>
            </tr>
          ))}
        </tbody>
      </table>
    )}
  </div>
);

const TopProductsList = ({ items }) => (
  <ul className="top-products">
    {items.map((p, i) => (
      <li key={p._id}>
        <span>{i + 1}. {p.name}</span>
        <span className="sold">{p.sold} sold</span>
      </li>
    ))}
  </ul>
);

export default Dashboard;

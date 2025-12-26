import React, { useEffect, useState } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { 
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, 
  BarChart, Bar, PieChart, Pie, Cell, Legend, AreaChart, Area 
} from 'recharts';
import { 
  FiActivity, FiBattery, FiTrendingUp, FiCpu, FiPackage, 
  FiClock, FiZap, FiTruck, FiCheckCircle, FiAlertTriangle, FiAlertCircle 
} from "react-icons/fi";
import './Analytics.css';
import API_URL from '../config/api';

const API = `${API_URL}/admin`;

const Analytics = () => {
  const [data, setData] = useState(null);
  const [loadingStates, setLoadingStates] = useState({
    kpis: true,
    robots: true,
    charts: true,
    stats: true
  });
  const [error, setError] = useState(null);
  const [usingMockData, setUsingMockData] = useState(false);
  const token = Cookies.get('token');

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!token) {
        setError("Unauthorized: No token found. Please login as admin.");
        setData(getMockData());
        setUsingMockData(true);
        setLoadingStates({ kpis: false, robots: false, charts: false, stats: false });
        return;
      }

      try {
        const res = await axios.get(`${API}/analytics/detailed`, { 
          headers: { Authorization: `Bearer ${token}` } 
        });
        
        setData(res.data);
        setError(null);
        setUsingMockData(false);
        
        // ✅ Faster progressive loading - reduced delays
        setTimeout(() => setLoadingStates(prev => ({ ...prev, kpis: false })), 100);
        setTimeout(() => setLoadingStates(prev => ({ ...prev, robots: false })), 200);
        setTimeout(() => setLoadingStates(prev => ({ ...prev, charts: false })), 300);
        setTimeout(() => setLoadingStates(prev => ({ ...prev, stats: false })), 400);
      } catch (err) {
        console.error('Fetch analytics failed', err);
        
        // ✅ Determine error type and set appropriate message
        if (err.response?.status === 401) {
          setError("Unauthorized: Please login as admin.");
        } else if (err.response?.status === 403) {
          setError("Access denied: Admin privileges required.");
        } else if (err.code === 'ECONNABORTED' || err.message.includes('timeout')) {
          setError("Request timeout: Server is taking too long to respond.");
        } else if (err.message.includes('Network Error')) {
          setError("Network error: Unable to reach the server.");
        } else {
          setError("Failed to load analytics data. Showing sample data.");
        }
        
        // ✅ Use mock data on error
        setData(getMockData());
        setUsingMockData(true);
        
        // Still show progressive loading with mock data
        setTimeout(() => setLoadingStates(prev => ({ ...prev, kpis: false })), 100);
        setTimeout(() => setLoadingStates(prev => ({ ...prev, robots: false })), 200);
        setTimeout(() => setLoadingStates(prev => ({ ...prev, charts: false })), 300);
        setTimeout(() => setLoadingStates(prev => ({ ...prev, stats: false })), 400);
      }
    };
    
    fetchAnalytics();
  }, [token]);

  const analyticsData = data || getMockData();

  return (
    <div className="analytics-page">
      {/* Header - Always visible */}
      <header className="analytics-header">
        <div className="header-content">
          <div className="header-icon">
            <FiActivity />
          </div>
          <div className="header-text">
            <h1>Warehouse Analytics</h1>
            <p>Real-time insights into robot performance, orders, and operations</p>
          </div>
        </div>
      </header>

      {/* Error/Warning Banner */}
      {error && (
        <div className={`warning-banner ${usingMockData ? 'mock-data' : 'error'}`}>
          <FiAlertCircle />
          <span>{error} {usingMockData && "(Displaying sample data)"}</span>
        </div>
      )}

      {/* KPI Cards - Progressive load */}
      <section className="kpi-grid">
        {loadingStates.kpis ? (
          <div className="loading-section">
            <div className="loading-text">Loading statistics...</div>
          </div>
        ) : (
          <>
            <KPICard 
              icon={<FiPackage />}
              title="Total Orders"
              value={analyticsData.totalOrders}
              trend="+12.5%"
              color="#667eea"
            />
            <KPICard 
              icon={<FiCheckCircle />}
              title="Completed"
              value={analyticsData.completedOrders}
              trend="+8.3%"
              color="#10b981"
            />
            <KPICard 
              icon={<FiClock />}
              title="Pending"
              value={analyticsData.pendingOrders}
              trend="-5.2%"
              color="#f59e0b"
            />
            <KPICard 
              icon={<FiAlertTriangle />}
              title="Failed"
              value={analyticsData.failedOrders}
              trend="-15.1%"
              color="#ef4444"
            />
            <KPICard 
              icon={<FiCpu />}
              title="System Uptime"
              value={analyticsData.systemUptime}
              subtitle="Last 24h"
              color="#8b5cf6"
            />
            <KPICard 
              icon={<FiZap />}
              title="Avg Processing Time"
              value={analyticsData.avgProcessingTime}
              subtitle="Per order"
              color="#06b6d4"
            />
          </>
        )}
      </section>

      {/* Robot Status Section - Progressive load */}
      <section className="robots-section">
        <div className="section-header">
          <FiTruck className="section-icon" />
          <h2>Robot Fleet Status</h2>
        </div>
        {loadingStates.robots ? (
          <div className="loading-section">
            <div className="loading-text">Loading robot data...</div>
          </div>
        ) : (
          <div className="robots-grid">
            {analyticsData.robots.map((robot, idx) => (
              <RobotCard key={idx} robot={robot} />
            ))}
          </div>
        )}
      </section>

      {/* Charts Grid - Progressive load */}
      {loadingStates.charts ? (
        <div className="loading-section">
          <div className="loading-text">Loading charts...</div>
        </div>
      ) : (
        <section className="charts-grid">
          {/* Orders Trend */}
          <div className="chart-card full-width">
            <div className="chart-header">
              <h3>Orders Trend (Last 7 Days)</h3>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={analyticsData.ordersTrend}>
                <defs>
                  <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
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
                  dataKey="orders" 
                  stroke="#667eea" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorOrders)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Performance Metrics */}
          <div className="chart-card">
            <div className="chart-header">
              <h3>Robot Performance</h3>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={analyticsData.robotPerformance}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="robot" stroke="#8b92a8" />
                <YAxis stroke="#8b92a8" />
                <Tooltip 
                  contentStyle={{ background: 'rgba(26, 26, 46, 0.95)', border: '1px solid rgba(102, 126, 234, 0.2)', borderRadius: '8px', color: '#e0e3eb' }}
                />
                <Bar dataKey="efficiency" fill="#10b981" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Order Distribution */}
          <div className="chart-card">
            <div className="chart-header">
              <h3>Order Status Distribution</h3>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie 
                  data={analyticsData.orderDistribution} 
                  dataKey="value" 
                  nameKey="name" 
                  cx="50%" 
                  cy="50%" 
                  outerRadius={90}
                  innerRadius={50}
                  label
                >
                  {analyticsData.orderDistribution.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: 'rgba(26, 26, 46, 0.95)', border: '1px solid rgba(102, 126, 234, 0.2)', borderRadius: '8px', color: '#e0e3eb' }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Battery Levels */}
          <div className="chart-card">
            <div className="chart-header">
              <h3>Robot Battery Levels</h3>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={analyticsData.batteryLevels} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis type="number" stroke="#8b92a8" domain={[0, 100]} />
                <YAxis type="category" dataKey="robot" stroke="#8b92a8" />
                <Tooltip 
                  contentStyle={{ background: 'rgba(26, 26, 46, 0.95)', border: '1px solid rgba(102, 126, 234, 0.2)', borderRadius: '8px', color: '#e0e3eb' }}
                />
                <Bar dataKey="battery" fill="#10b981" radius={[0, 8, 8, 0]}>
                  {analyticsData.batteryLevels.map((entry, index) => (
                    <Cell key={index} fill={getBatteryColor(entry.battery)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Hourly Activity */}
          <div className="chart-card full-width">
            <div className="chart-header">
              <h3>Hourly Activity (Today)</h3>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={analyticsData.hourlyActivity}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="hour" stroke="#8b92a8" />
                <YAxis stroke="#8b92a8" />
                <Tooltip 
                  contentStyle={{ background: 'rgba(26, 26, 46, 0.95)', border: '1px solid rgba(102, 126, 234, 0.2)', borderRadius: '8px', color: '#e0e3eb' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="orders" 
                  stroke="#667eea" 
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#667eea' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      {/* Stats Cards - Progressive load */}
      {loadingStates.stats ? (
        <div className="loading-section">
          <div className="loading-text">Loading performance metrics...</div>
        </div>
      ) : (
        <section className="stats-section">
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
              <FiTrendingUp />
            </div>
            <div className="stat-content">
              <div className="stat-label">Processing Efficiency</div>
              <div className="stat-value">{analyticsData.processingEfficiency}%</div>
              <div className="stat-subtitle">+5.2% from last week</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
              <FiCheckCircle />
            </div>
            <div className="stat-content">
              <div className="stat-label">Success Rate</div>
              <div className="stat-value">{analyticsData.successRate}%</div>
              <div className="stat-subtitle">Last 30 days</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}>
              <FiClock />
            </div>
            <div className="stat-content">
              <div className="stat-label">Avg Cycle Time</div>
              <div className="stat-value">{analyticsData.avgCycleTime}s</div>
              <div className="stat-subtitle">Per pick & place</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)' }}>
              <FiBattery />
            </div>
            <div className="stat-content">
              <div className="stat-label">Fleet Battery Avg</div>
              <div className="stat-value">{analyticsData.fleetBatteryAvg}%</div>
              <div className="stat-subtitle">All robots</div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

// KPI Card Component
const KPICard = ({ icon, title, value, subtitle, trend, color }) => (
  <div className="kpi-card">
    <div className="kpi-icon" style={{ background: `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)` }}>
      {icon}
    </div>
    <div className="kpi-content">
      <div className="kpi-info">
        <div className="kpi-title">{title}</div>
        <div className="kpi-value">{value}</div>
        {subtitle && <div className="kpi-subtitle">{subtitle}</div>}
        {trend && <div className={`kpi-trend ${trend.startsWith('+') ? 'positive' : 'negative'}`}>{trend}</div>}
      </div>
    </div>
  </div>
);

// Robot Card Component
const RobotCard = ({ robot }) => (
  <div className={`robot-card ${robot.status.toLowerCase()}`}>
    <div className="robot-header">
      <div className="robot-icon">
        <FiTruck />
      </div>
      <div className="robot-info">
        <div className="robot-name">{robot.name}</div>
        <div className="robot-model">{robot.model}</div>
      </div>
      <div className={`robot-status-badge ${robot.status.toLowerCase()}`}>
        {robot.status}
      </div>
    </div>
    
    <div className="robot-metrics">
      <div className="metric">
        <FiBattery className="metric-icon" />
        <div className="metric-content">
          <div className="metric-label">Battery</div>
          <div className="metric-value">{robot.battery}%</div>
        </div>
      </div>
      
      <div className="metric">
        <FiPackage className="metric-icon" />
        <div className="metric-content">
          <div className="metric-label">Tasks Today</div>
          <div className="metric-value">{robot.tasksToday}</div>
        </div>
      </div>
      
      <div className="metric">
        <FiClock className="metric-icon" />
        <div className="metric-content">
          <div className="metric-label">Uptime</div>
          <div className="metric-value">{robot.uptime}</div>
        </div>
      </div>
    </div>

    <div className="battery-bar">
      <div 
        className="battery-fill" 
        style={{ 
          width: `${robot.battery}%`,
          background: getBatteryColor(robot.battery)
        }}
      />
    </div>
  </div>
);

// Helper Functions
const getBatteryColor = (level) => {
  if (level >= 70) return '#10b981';
  if (level >= 40) return '#f59e0b';
  return '#ef4444';
};

const getMockData = () => ({
  totalOrders: 1247,
  completedOrders: 1089,
  pendingOrders: 124,
  failedOrders: 34,
  systemUptime: "99.8%",
  avgProcessingTime: "45s",
  processingEfficiency: 94.5,
  successRate: 96.8,
  avgCycleTime: 23,
  fleetBatteryAvg: 78,
  
  robots: [
    { name: "UR5e-01", model: "UR5e Cobot", status: "Active", battery: 87, tasksToday: 156, uptime: "8.5h" },
    { name: "UR5e-02", model: "UR5e Cobot", status: "Active", battery: 92, tasksToday: 143, uptime: "7.2h" },
    { name: "YouBot-01", model: "KUKA YouBot", status: "Charging", battery: 34, tasksToday: 98, uptime: "5.3h" },
    { name: "YouBot-02", model: "KUKA YouBot", status: "Active", battery: 76, tasksToday: 112, uptime: "6.8h" },
  ],

  ordersTrend: [
    { day: "Mon", orders: 178 },
    { day: "Tue", orders: 195 },
    { day: "Wed", orders: 210 },
    { day: "Thu", orders: 188 },
    { day: "Fri", orders: 225 },
    { day: "Sat", orders: 156 },
    { day: "Sun", orders: 95 },
  ],

  robotPerformance: [
    { robot: "UR5e-01", efficiency: 96 },
    { robot: "UR5e-02", efficiency: 94 },
    { robot: "YouBot-01", efficiency: 89 },
    { robot: "YouBot-02", efficiency: 92 },
  ],

  orderDistribution: [
    { name: "Completed", value: 1089, color: "#10b981" },
    { name: "Pending", value: 124, color: "#f59e0b" },
    { name: "Failed", value: 34, color: "#ef4444" },
  ],

  batteryLevels: [
    { robot: "UR5e-01", battery: 87 },
    { robot: "UR5e-02", battery: 92 },
    { robot: "YouBot-01", battery: 34 },
    { robot: "YouBot-02", battery: 76 },
  ],

  hourlyActivity: [
    { hour: "00:00", orders: 12 },
    { hour: "04:00", orders: 8 },
    { hour: "08:00", orders: 45 },
    { hour: "12:00", orders: 68 },
    { hour: "16:00", orders: 52 },
    { hour: "20:00", orders: 28 },
  ],
});

export default Analytics;

// Sidebar.js
import React, { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { LuLogs } from "react-icons/lu";
import {
  FiGrid,
  FiBox,
  FiCpu,
  FiShoppingBag,
  FiLogOut,
  FiChevronLeft,
  FiChevronRight,
  FiUsers,
  FiBarChart2,
  FiLayers,
} from "react-icons/fi";
import { logout } from "../utils/auth";
import axios from "axios";
import Cookies from "js-cookie";
import "./Sidebar.css";
import API_URL from '../config/api';

const Sidebar = ({ collapsed, setCollapsed }) => {
  const [username, setUsername] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    const loadProfile = async () => {
      try {
        const token = Cookies.get("token");
        if (!token) return;
        const res = await axios.get(`${API_URL}/user/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!cancelled)
          setUsername(res.data?.username || res.data?.email || "Admin");
      } catch (err) {
        // fallback
      }
    };
    loadProfile();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleLogout = () => {
    logout();
    window.location.href = "/login"; // ✅ Already navigates to /login
  };

  const goToDashboard = () => {
    navigate("/my-dashboard");
  };

  const initial = username ? username.charAt(0).toUpperCase() : "A";

  return (
    <aside className={`admin-sidebar ${collapsed ? "collapsed" : ""}`}>
      {/* Toggle Button */}
      <div className="toggle-btn" onClick={() => setCollapsed(!collapsed)}>
        <span className="sidebar-title">WHR-Sorting</span>
        {collapsed ? (
          <FiChevronRight className="icon" />
        ) : (
          <FiChevronLeft className="icon" />
        )}
      </div>

      {/* Sidebar Menu */}
      <nav>
        <ul>
          <li>
            <NavLink
              to="/admin/dashboard"
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              <FiGrid className="icon" />
              <span className="link-text">Dashboard</span>
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/admin/analytics"
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              <FiBarChart2 className="icon" />
              <span className="link-text">Analytics & Reports</span>
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/admin/users"
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              <FiUsers className="icon" />
              <span className="link-text">User Management</span>
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/admin/products"
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              <FiBox className="icon" />
              <span className="link-text">Products</span>
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/admin/webots"
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              <FiCpu className="icon" />
              <span className="link-text">Webots</span>
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/admin/ai-models"
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              <FiLayers className="icon" />
              <span className="link-text">AI Model Management</span>
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/admin/orders"
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              <FiShoppingBag className="icon" />
              <span className="link-text">Orders</span>
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/admin/logs"
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              <LuLogs className="icon" />
              <span className="link-text">Logs</span>
            </NavLink>
          </li>
        </ul>
      </nav>

      {/* Bottom Section */}
      <div className="bottom-section">
        <div className="logout-section">
          <button className="logout-btn" onClick={handleLogout}>
            <FiLogOut className="icon" />
            <span className="link-text">Logout</span>
          </button>
        </div>

        <div className="admin-profile" onClick={goToDashboard}>
          <div className="admin-avatar">
            <span className="initial">{initial}</span>
          </div>
          <div className="profile-info">
            <h4>{username || "Admin"}</h4>
            <p>Administrator</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;

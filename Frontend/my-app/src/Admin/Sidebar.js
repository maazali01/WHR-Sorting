// Sidebar.js
import React from "react";
import { NavLink } from "react-router-dom";
import {
  FiGrid,
  FiBox,
  FiCpu,
  FiShoppingBag,
  FiUser,
  FiLogOut,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";
import { logout } from "../utils/auth";
import "./Sidebar.css";

const Sidebar = ({ collapsed, setCollapsed }) => {
  const handleLogout = () => {
    logout();
    window.location.href = "/login";
  };

  const goToSettings = () => {
    window.location.href = "/admin/settings";
  };

  return (
    <aside className={`admin-sidebar ${collapsed ? "collapsed" : ""}`}>
    {/* Toggle Button */}
    <div className="toggle-btn" onClick={() => setCollapsed(!collapsed)}>
      <span className="sidebar-title">WHR-Sorting</span>
      {collapsed ? (
      <FiChevronRight size={20} />
        ) : (
      <FiChevronLeft size={20} />
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
              <FiGrid size={18} />
              <span className="link-text">Dashboard</span>
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/admin/products"
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              <FiBox size={18} />
              <span className="link-text">Products</span>
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/admin/webots"
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              <FiCpu size={18} />
              <span className="link-text">Webots</span>
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/admin/orders"
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              <FiShoppingBag size={18} />
              <span className="link-text">Orders</span>
            </NavLink>
          </li>
        </ul>
      </nav>

      {/* Bottom Section */}
      <div className="bottom-section">
        <div className="logout-section">
          <button className="logout-btn" onClick={handleLogout}>
            <FiLogOut size={18} />
            <span className="link-text">Logout</span>
          </button>
        </div>

        <div className="admin-profile" onClick={goToSettings}>
          <div className="admin-avatar">
            <FiUser size={20} />
          </div>
          <div className="profile-info">
            <h4>Admin</h4>
            <p>Administrator</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;

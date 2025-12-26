import React, { useEffect, useState } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import "./UserManagement.css";
import { FiUsers, FiTrash2, FiAlertCircle } from "react-icons/fi";

const API = "http://localhost:4000/admin";

const UserManagement = () => {
  const [localUsers, setLocalUsers] = useState([]);
  const [googleUsers, setGoogleUsers] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loadingStates, setLoadingStates] = useState({
    stats: true,
    tables: true,
  });
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");

  const token = Cookies.get("token");

  useEffect(() => {
    if (!token) {
      setError("Unauthorized: No token found. Please login as admin.");
      setLoadingStates({ stats: false, tables: false });
      return;
    }

    const loadData = async () => {
      try {
        const headers = { Authorization: `Bearer ${token}` };

        // ✅ Fetch all data in parallel
        const [summaryRes, usersRes] = await Promise.all([
          axios.get(`${API}/users/summary`, { headers }),
          axios.get(`${API}/users`, { headers }),
        ]);

        setSummary(summaryRes.data || null);
        const usersData = usersRes.data || {};
        setLocalUsers(Array.isArray(usersData.localUsers) ? usersData.localUsers : []);
        setGoogleUsers(Array.isArray(usersData.googleUsers) ? usersData.googleUsers : []);
        setError("");

        // ✅ Faster progressive loading - reduced delays
        setTimeout(() => setLoadingStates((prev) => ({ ...prev, stats: false })), 100);
        setTimeout(() => setLoadingStates((prev) => ({ ...prev, tables: false })), 200);
      } catch (e) {
        console.error("Failed to load user data:", e);

        if (e.response?.status === 401) {
          setError("Unauthorized: Please login as admin.");
        } else if (e.response?.status === 403) {
          setError("Access denied: Admin privileges required.");
        } else {
          setError("Failed to load user data.");
        }

        setLoadingStates({ stats: false, tables: false });
      }
    };

    loadData();
  }, [token]);

  const remove = async (id) => {
    if (!window.confirm("Delete this user?")) return;
    try {
      setBusyId(id);
      const headers = { Authorization: `Bearer ${token}` };
      await axios.delete(`${API}/users/${id}`, { headers });

      // Refresh data after deletion
      const [summaryRes, usersRes] = await Promise.all([
        axios.get(`${API}/users/summary`, { headers }),
        axios.get(`${API}/users`, { headers }),
      ]);

      setSummary(summaryRes.data || null);
      const usersData = usersRes.data || {};
      setLocalUsers(Array.isArray(usersData.localUsers) ? usersData.localUsers : []);
      setGoogleUsers(Array.isArray(usersData.googleUsers) ? usersData.googleUsers : []);
    } catch (e) {
      console.error(e);
      alert("Delete failed.");
    } finally {
      setBusyId(null);
    }
  };

  if (error && !localUsers.length && !googleUsers.length) {
    return (
      <div className="user-management-page">
        <div className="warning-banner">
          <FiAlertCircle />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="user-management-page">
      {/* Header - Always visible */}
      <header className="um-header">
        <div className="header-content">
          <div className="header-icon">
            <FiUsers />
          </div>
          <div className="header-text">
            <h1>User Management</h1>
            <p>Manage site users, monitor activity, and control access</p>
          </div>
        </div>
      </header>

      {/* Error Banner */}
      {error && (
        <div className="warning-banner">
          <FiAlertCircle />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Cards - Progressive load */}
      <div className="um-kpi-grid">
        {loadingStates.stats ? (
          <div className="loading-section">
            <div className="loading-text">Loading statistics...</div>
          </div>
        ) : summary ? (
          <>
            <div className="kpi-card card-active">
              <div className="kpi-icon">
                <FiUsers />
              </div>
              <div className="kpi-content">
                <div className="kpi-info">
                  <div className="kpi-title">Active Users</div>
                  <div className="kpi-value">{summary.active}</div>
                </div>
              </div>
            </div>

            <div className="kpi-card card-admin">
              <div className="kpi-icon">
                <FiUsers />
              </div>
              <div className="kpi-content">
                <div className="kpi-info">
                  <div className="kpi-title">Administrators</div>
                  <div className="kpi-value">{summary.admins}</div>
                </div>
              </div>
            </div>

            <div className="kpi-card card-recent">
              <div className="kpi-icon">
                <FiUsers />
              </div>
              <div className="kpi-content">
                <div className="kpi-info">
                  <div className="kpi-title">Recent Signups</div>
                  <div className="kpi-value">{summary.recentSignups}</div>
                </div>
              </div>
            </div>

            <div className="kpi-card card-total">
              <div className="kpi-icon">
                <FiUsers />
              </div>
              <div className="kpi-content">
                <div className="kpi-info">
                  <div className="kpi-title">Total Users</div>
                  <div className="kpi-value">{summary.total}</div>
                </div>
              </div>
            </div>
          </>
        ) : null}
      </div>

      {/* Tables - Progressive load */}
      {loadingStates.tables ? (
        <div className="loading-section">
          <div className="loading-text">Loading user data...</div>
        </div>
      ) : (
        <>
          {/* Site (local) users */}
          <div className="um-table-section">
            <div className="table-header">
              <h3>
                <FiUsers /> Site Users
              </h3>
            </div>
            <div className="um-table-wrapper">
              <table className="um-table">
                <thead>
                  <tr>
                    <th>Username</th>
                    <th>Email</th>
                    <th>Orders</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {localUsers.map((u) => (
                    <tr key={u._id}>
                      <td>{u.username}</td>
                      <td>{u.email}</td>
                      <td>{u.ordersCount ?? 0}</td>
                      <td>
                        <span className={`status-badge ${u.blocked ? "blocked" : "active"}`}>
                          {u.blocked ? "Blocked" : "Active"}
                        </span>
                      </td>
                      <td>
                        <div className="um-actions">
                          <button
                            className="um-btn delete"
                            onClick={() => remove(u._id)}
                            disabled={busyId === u._id}
                            title="Delete user"
                          >
                            <FiTrash2 /> {busyId === u._id ? "Deleting..." : "Delete"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {localUsers.length === 0 && (
                    <tr>
                      <td colSpan={5} className="um-empty">
                        No site users found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Google authenticated users */}
          <div className="um-table-section">
            <div className="table-header">
              <h3>
                <FiUsers /> Google Auth Users
              </h3>
            </div>
            <div className="um-table-wrapper">
              <table className="um-table">
                <thead>
                  <tr>
                    <th>Username</th>
                    <th>Email</th>
                    <th>Orders</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {googleUsers.map((u) => (
                    <tr key={u._id}>
                      <td>{u.username}</td>
                      <td>{u.email}</td>
                      <td>{u.ordersCount ?? 0}</td>
                      <td>
                        <span className={`status-badge ${u.blocked ? "blocked" : "active"}`}>
                          {u.blocked ? "Blocked" : "Active"}
                        </span>
                      </td>
                      <td>
                        <div className="um-actions">
                          <button
                            className="um-btn delete"
                            onClick={() => remove(u._id)}
                            disabled={busyId === u._id}
                            title="Delete user"
                          >
                            <FiTrash2 /> {busyId === u._id ? "Deleting..." : "Delete"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {googleUsers.length === 0 && (
                    <tr>
                      <td colSpan={5} className="um-empty">
                        No Google auth users found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default UserManagement;

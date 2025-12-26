import React, { useEffect, useState } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { FiFileText, FiDownload, FiAlertCircle } from "react-icons/fi";
import "./Logs.css";

const API = "http://localhost:4000/admin";

const Logs = () => {
  const [logs, setLogs] = useState([]);
  const [loadingStates, setLoadingStates] = useState({
    filters: true,
    logs: true
  });
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({ action: "", type: "admin", from: "", to: "" });
  const [pageInfo, setPageInfo] = useState({ page: 1, limit: 50, total: 0 });
  const [selected, setSelected] = useState(null);
  const token = Cookies.get("token");

  const fetchLogs = async (opts = {}) => {
    setLoadingStates({ filters: true, logs: true });
    try {
      const params = { page: pageInfo.page, limit: pageInfo.limit, ...filters, ...opts };
      const res = await axios.get(`${API}/logs`, { params, headers: { Authorization: `Bearer ${token}` } });
      setLogs(res.data.logs || []);
      setPageInfo(prev => ({ ...prev, total: res.data.total || 0, page: res.data.page || prev.page }));

      // Progressive loading
      setTimeout(() => setLoadingStates(prev => ({ ...prev, filters: false })), 300);
      setTimeout(() => setLoadingStates(prev => ({ ...prev, logs: false })), 600);
    } catch (err) {
      console.error("Error fetching logs:", err);
      setError("Failed to load logs.");
      setLoadingStates({ filters: false, logs: false });
    }
  };

  useEffect(() => {
    if (!token) {
      setError("Unauthorized: No token found.");
      setLoadingStates({ filters: false, logs: false });
      return;
    }
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageInfo.page, pageInfo.limit]);

  const onFilter = () => {
    setPageInfo(prev => ({ ...prev, page: 1 }));
    fetchLogs({ page: 1 });
  };

  const exportCsv = async () => {
    try {
      const params = { ...filters, export: 'csv' };
      const res = await axios.get(`${API}/logs`, { params, headers: { Authorization: `Bearer ${token}` }, responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `logs-${new Date().toISOString().slice(0,10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export failed:", err);
      alert("Export failed");
    }
  };

  const deleteLog = async (id) => {
    if (!window.confirm("Delete this log?")) return;
    try {
      await axios.delete(`${API}/logs/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      fetchLogs();
    } catch (err) {
      console.error(err);
      alert("Delete failed");
    }
  };

  const formatDetailsSummary = (log) => {
    const d = log.details || {};
    switch ((log.action || '').toUpperCase()) {
      case 'CREATE_PRODUCT':
        return `Created product "${d.name || d.productId}" (id:${d.productId || ''}) price:${d.price ?? ''} qty:${d.quantity ?? ''}`;
      case 'UPDATE_PRODUCT': {
        const changes = d.changes || {};
        const parts = Object.keys(changes).map(f => {
          const b = changes[f].before;
          const a = changes[f].after;
          return `${f}: ${b ?? '—'} → ${a ?? '—'}`;
        });
        return parts.length ? `Updated product ${d.productId || ''}: ${parts.join('; ')}` : 'Updated product';
      }
      case 'DELETE_PRODUCT':
        return `Deleted product "${d.name || ''}" (id:${d.productId || ''})`;
      case 'CREATE_ORDER':
        return `Order ${d.orderId || ''}: ${d.itemsCount || 0} items — total $${d.total ?? '0'}`;
      case 'CONFIRM_ORDER':
        return `Confirmed order ${d.orderId || ''} (was ${d.prevStatus})`;
      case 'SEND_TO_WEBOTS':
        return `Sent order ${d.orderId || ''} to Webots (priority: ${d.priority || 'Normal'})`;
      case 'SORT_RESULT':
        return `Sort ${d.success ? 'SUCCESS' : 'FAIL'} — duration ${d.durationSec ? d.durationSec + 's' : 'N/A'}`;
      case 'ROBOT_STATUS':
        return `Robot active ${d.activeSeconds ?? (log.meta?.totalActiveSeconds ?? 0)}s idle ${d.idleSeconds ?? (log.meta?.totalIdleSeconds ?? 0)}s`;
      default:
        // fallback: if details is object show small JSON snippet
        if (typeof d === 'object') {
          const s = JSON.stringify(d);
          return s.length > 120 ? s.slice(0, 120) + '…' : s || '';
        }
        return String(d || '');
    }
  };

  if (error) {
    return (
      <div className="logs-page">
        <div className="warning-banner">
          <FiAlertCircle />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="logs-page">
      {/* Modern Header - Always visible */}
      <header className="logs-header-modern">
        <div className="header-content">
          <div className="header-icon">
            <FiFileText />
          </div>
          <div className="header-text">
            <h1>System Logs</h1>
            <p>Monitor and track all system activities and admin actions</p>
          </div>
          <button className="btn-export" onClick={exportCsv}>
            <FiDownload />
            Export CSV
          </button>
        </div>
      </header>

      {/* Filters - Lazy load */}
      {loadingStates.filters ? (
        <div className="loading-section">
          <div className="loading-text">Loading filters...</div>
        </div>
      ) : (
        <div className="logs-filters">
          <input placeholder="Action" value={filters.action} onChange={e => setFilters({...filters, action: e.target.value})} />
          <select value={filters.type} onChange={e => setFilters({...filters, type: e.target.value})}>
            <option value="">All Types</option>
            <option value="admin">Admin</option>
            <option value="robot">Robot</option>
            <option value="system">System</option>
          </select>
          <input type="date" value={filters.from} onChange={e => setFilters({...filters, from: e.target.value})} />
          <input type="date" value={filters.to} onChange={e => setFilters({...filters, to: e.target.value})} />
          <button className="btn primary" onClick={onFilter}>Filter</button>
        </div>
      )}

      {/* Logs Table - Lazy load */}
      {loadingStates.logs ? (
        <div className="loading-section">
          <div className="loading-text">Loading logs...</div>
        </div>
      ) : (
        <div className="logs-table-wrap">
          <table className="logs-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>User</th>
                <th>Type</th>
                <th>Action</th>
                <th>Details</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {logs.map(l => (
                <tr key={l._id}>
                  <td>{new Date(l.timestamp).toLocaleString()}</td>
                  <td>{l.userName || 'system'}</td>
                  <td>{l.type}</td>
                  <td>{l.action}</td>
                  <td className="details-cell" title={typeof l.details === 'object' ? JSON.stringify(l.details) : String(l.details)}>
                    {formatDetailsSummary(l)}
                  </td>
                  <td className="row-actions">
                    <button className="btn small" onClick={() => setSelected(l)}>View</button>
                    <button className="btn danger small" onClick={() => deleteLog(l._id)}>Delete</button>
                  </td>
                </tr>
              ))}
              {logs.length === 0 && <tr><td colSpan="6" style={{ textAlign:'center', padding:20 }}>No logs</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {/* details modal */}
      {selected && (
        <div className="modal-overlay" role="dialog" aria-modal="true" onClick={() => setSelected(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Log Details</h3>
              <button className="close-btnn" onClick={() => setSelected(null)}>x</button>
            </div>
            <div className="modal-contentt">
              <pre className="log-json">{JSON.stringify(selected, null, 2)}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Logs;

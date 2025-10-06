// AdminSettings.js
import React from "react";
import "./settings.css";

const AdminSettings = () => {
  return (
    <div className="settings-container">
      <h2 className="settings-title">⚙️Admin</h2>
      <form className="settings-form">
        <div className="form-group">
          <label>Change Username</label>
          <input type="text" placeholder="Enter new username" />
        </div>

        <div className="form-group">
          <label>Change Email</label>
          <input type="email" placeholder="Enter new email" />
        </div>

        <div className="form-group">
          <label>Change Password</label>
          <input type="password" placeholder="Enter new password" />
        </div>

        <div className="form-group">
          <label>Confirm Password</label>
          <input type="password" placeholder="Confirm new password" />
        </div>

        <button type="submit" className="save-btn">Save Changes</button>
      </form>
    </div>
  );
};

export default AdminSettings;

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './UserComponents.css';
import API_URL from '../config/api';

const EditProfile = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get(`${API_URL}/user/profile`, { withCredentials: true });
        setFormData({
          username: res.data.username,
          email: res.data.email,
          password: ''
        });
        setLoading(false);
      } catch (err) {
        console.error(err);
        setErrorMsg('Failed to load profile.');
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const handleChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      await axios.put(`${API_URL}/user/profile`, formData, { withCredentials: true });
      setSuccessMsg('Profile updated successfully.');
      setErrorMsg('');
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to update profile.');
    }
  };

  if (loading) return <div className="user-card loading-card">Loading...</div>;

  return (
    <div className="user-card edit-profile-card">
      <h2 className="user-card-title">Edit Profile</h2>
      {successMsg && <div className="message success-message">{successMsg}</div>}
      {errorMsg && <div className="message error-message">{errorMsg}</div>}
      <form onSubmit={handleSubmit} className="user-form">
        <div className="form-group">
          <label className="form-label">Username</label>
          <input
            className="form-input"
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Email</label>
          <input
            className="form-input"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label className="form-label">New Password (optional)</label>
          <input
            className="form-input"
            type="password"
            name="password"
            placeholder="Leave blank to keep same"
            value={formData.password}
            onChange={handleChange}
          />
        </div>

        <button type="submit" className="btn-primary">Save Changes</button>
      </form>
    </div>
  );
};

export default EditProfile;

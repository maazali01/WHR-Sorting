// LandingPage.js
import React from "react";
import { useNavigate } from "react-router-dom";
import "./landing.css";
import armImage from "./arm.jpg"; // adjust path if needed

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="landing">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1>WHR-Sorting System</h1>
          <p>
            An intelligent warehouse automation system powered by Webots and the
            UR5e robotic arm. Users place orders online, and our virtual
            warehouse robot sorts and processes them in real-time.
          </p>
          <button className="cta-btn" onClick={() => navigate("/home")}>
            Start Shopping
          </button>
        </div>
        <div className="hero-image">
          <img src={armImage} alt="UR5e Robot Arm" />
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <h2>How It Works</h2>
        <div className="features-grid">
          <div className="feature-card">
            <i className="fas fa-shopping-cart"></i>
            <h3>User Orders</h3>
            <p>
              Customers browse and place orders via the online shopping
              interface.
            </p>
          </div>
          <div className="feature-card">
            <i className="fas fa-robot"></i>
            <h3>Robot Sorting</h3>
            <p>
              A UR5e robot with a 3F gripper and sensors sorts products inside a
              Webots-based warehouse.
            </p>
          </div>
          <div className="feature-card">
            <i className="fas fa-warehouse"></i>
            <h3>Virtual Warehouse</h3>
            <p>
              The virtual environment mimics a real warehouse, enabling smooth
              automation and visualization.
            </p>
          </div>
          <div className="feature-card">
            <i className="fas fa-chart-line"></i>
            <h3>Analytics</h3>
            <p>
              Admins track completed, pending, and failed orders with live
              system insights.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <p>
          © 2025 WHR-Sorting System | Developed as Final Year Project (MERN +
          Webots + UR5e)
        </p>
      </footer>
    </div>
  );
};

export default LandingPage;

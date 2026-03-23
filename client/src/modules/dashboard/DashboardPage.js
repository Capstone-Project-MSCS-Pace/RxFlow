import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.js";
import { ROUTES } from "../../config/routes.js";
import "./DashboardPage.css";

const DashboardPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate(ROUTES.LOGIN);
  };

  const stats = ["New Prescriptions", "In Process", "Ready", "Low Stock"];

  return (
    <div className="dashboard-container">
      {/* Top Bar */}
      <div className="dashboard-topbar">
        <h2>RxFlow Dashboard</h2>
        <div>
          <span style={{ marginRight: "1rem" }}>Welcome, {user?.fullname}</span>
          <button onClick={handleLogout}>Logout</button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-cards">
        {stats.map((item, index) => (
          <div className="stats-card" key={index}>
            <h3>{item}</h3>
            <p>0</p>
          </div>
        ))}
      </div>

      {/* Main Sections */}
      <div className="main-sections">
        {/* Prescription Queue */}
        <div className="main-section">
          <h3>Prescription Queue</h3>
          <p>Queue data will appear here...</p>
        </div>

        {/* Inventory Alerts */}
        <div className="main-section">
          <h3>Inventory Alerts</h3>
          <p>No alerts right now</p>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
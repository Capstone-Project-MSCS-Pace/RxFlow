import React from "react";
import { useNavigate } from "react-router-dom";
import AppSidebar from "../../components/AppSidebar.js";
import { useAuth } from "../../context/AuthContext.js";
import { ROUTES } from "../../config/routes.js";
import "../dashboard/DashboardPage.css";

const PrescriptionsPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  return (
    <div className="dashboard-layout">
      <AppSidebar />

      <div className="main-content">
        <header className="header">
          <h2>Prescriptions</h2>
          <div className="header-right">
            <ProfileDropdown user={user} logout={logout} navigate={navigate} />
          </div>
        </header>

        <div className="content">
          <div className="card">
            <h3>Prescription Workspace</h3>
            <p>Prescription intake, queue management, and fulfillment tools will live here.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const ProfileDropdown = ({ user, logout, navigate }) => {
  const [open, setOpen] = React.useState(false);
  const dropdownRef = React.useRef();

  React.useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="profile-wrapper" ref={dropdownRef}>
      <div className="profile-mini" onClick={() => setOpen(!open)}>
        {user?.fullname?.charAt(0)}
      </div>
      {open && (
        <div className="dropdown">
          <p className="dropdown-name">{user?.fullname}</p>
          <p className="dropdown-email">{user?.email}</p>
          <div className="dropdown-divider" />
          <button onClick={() => navigate(ROUTES.PROFILE)}>View Profile</button>
          <button onClick={logout}>Logout</button>
        </div>
      )}
    </div>
  );
};

export default PrescriptionsPage;

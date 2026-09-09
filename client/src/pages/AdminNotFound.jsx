import React from 'react';
import { Link } from 'react-router-dom';
import '../css/AdminNotFound.css';

const AdminNotFound = () => {
  return (
    <div className="admin-not-found-container">
      <div className="admin-not-found-content">
        <h1 className="admin-not-found-title">404</h1>
        <h2 className="admin-not-found-subtitle">Admin Page Not Found</h2>
        <p className="admin-not-found-text">
          The requested administration page does not exist or you do not have permission to view it.
        </p>
        <Link to="/admin-dashboard" className="admin-not-found-btn">Back to Dashboard</Link>
      </div>
    </div>
  );
};

export default AdminNotFound;

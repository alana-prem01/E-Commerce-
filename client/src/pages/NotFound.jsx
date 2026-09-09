import React from 'react';
import { Link } from 'react-router-dom';
import '../css/NotFound.css';

const NotFound = () => {
  return (
    <div className="not-found-container">
      <div className="not-found-content">
        <h1 className="not-found-title">404</h1>
        <h2 className="not-found-subtitle">Page Not Found</h2>
        <p className="not-found-text">
          We can't seem to find the page you're looking for. It might have been removed, renamed, or did not exist in the first place.
        </p>
        <Link to="/" className="not-found-btn">Back to Home</Link>
      </div>
    </div>
  );
};

export default NotFound;

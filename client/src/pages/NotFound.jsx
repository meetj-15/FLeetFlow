import React from 'react';
import { Link } from 'react-router-dom';
import './ErrorPage.css';

const NotFound = () => {
  return (
    <div className="error-page">
      <div className="error-content">
        <h1 className="error-code">404</h1>
        <h2 className="error-title">Page Not Found</h2>
        <p className="error-message">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link to="/dashboard" className="error-btn">
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
};

export default NotFound;

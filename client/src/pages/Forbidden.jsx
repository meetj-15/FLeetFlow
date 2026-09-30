import React from 'react';
import { Link } from 'react-router-dom';
import './ErrorPage.css';

const Forbidden = () => {
  return (
    <div className="error-page">
      <div className="error-content">
        <h1 className="error-code">403</h1>
        <h2 className="error-title">Access Denied</h2>
        <p className="error-message">
          You don't have permission to access this page. Please contact your administrator if you believe this is a mistake.
        </p>
        <Link to="/dashboard" className="error-btn">
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
};

export default Forbidden;

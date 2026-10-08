import React from 'react';
import './PageLoader.css';

/**
 * PageLoader Component
 * Displays a loading spinner with optional message
 * 
 * @param {string} message - Optional loading message
 * @param {boolean} fullScreen - Whether to show as full-screen overlay
 */
const PageLoader = ({ message = 'Loading...', fullScreen = false }) => {
  return (
    <div className={`page-loader ${fullScreen ? 'fullscreen' : ''}`}>
      <div className="loader-content">
        <div className="spinner"></div>
        {message && <p className="loader-message">{message}</p>}
      </div>
    </div>
  );
};

export default PageLoader;

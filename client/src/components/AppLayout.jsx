import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getNavigationByRole } from '../utils/constants';
import './AppLayout.css';

const AppLayout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const navigation = user ? getNavigationByRole(user.role) : [];

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <h1 className="sidebar-logo">
             {sidebarOpen && 'FleetFlow'}
          </h1>
        </div>

        <nav className="sidebar-nav">
          {navigation.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              {sidebarOpen && <span className="nav-label">{item.label}</span>}
            </Link>
          ))}
        </nav>

        <button
          className="sidebar-toggle"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {sidebarOpen ? '◀' : '▶'}
        </button>
      </aside>

      {/* Main Content */}
      <div className="main-content">
        {/* Top Bar */}
        <header className="topbar">
          <div className="topbar-left">
            <h2 className="page-title">
              {navigation.find(item => item.path === location.pathname)?.label || 'FleetFlow'}
            </h2>
          </div>

          <div className="topbar-right">
            <div className="user-info">
              <div className="user-avatar">
                {user?.name?.substring(0, 2).toUpperCase()}
              </div>
              <div className="user-details">
                <div className="user-name">{user?.name}</div>
                <div className="user-role">{user?.role}</div>
              </div>
            </div>

            <button className="btn-logout" onClick={logout} title="Logout">
               Logout
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;

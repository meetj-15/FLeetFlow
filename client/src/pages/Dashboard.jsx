import React from 'react';
import { useAuth } from '../context/AuthContext';
import { UserRoles } from '../utils/constants';
import FleetManagerDashboard from './dashboards/FleetManagerDashboard';
import DriverDashboard from './dashboards/DriverDashboard';
import SafetyOfficerDashboard from './dashboards/SafetyOfficerDashboard';
import FinancialAnalystDashboard from './dashboards/FinancialAnalystDashboard';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="dashboard-loading">
        <div className="spinner" />
        <p>Loading...</p>
      </div>
    );
  }

  // Route to role-specific dashboard
  switch (user.role) {
    case UserRoles.FLEET_MANAGER:
      return <FleetManagerDashboard />;
    case UserRoles.DRIVER:
      return <DriverDashboard />;
    case UserRoles.SAFETY_OFFICER:
      return <SafetyOfficerDashboard />;
    case UserRoles.FINANCIAL_ANALYST:
      return <FinancialAnalystDashboard />;
    default:
      return (
        <div className="dashboard-error">
          <p>Invalid user role: {user.role}</p>
        </div>
      );
  }
};

export default Dashboard;

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';
import RoleRoute from './routes/RoleRoute';
import { UserRoles } from './utils/constants';

// Layout
import AppLayout from './components/AppLayout';

// Public Pages
import Login from './pages/Login';
import NotFound from './pages/NotFound';
import Forbidden from './pages/Forbidden';

// Protected Pages
import Dashboard from './pages/Dashboard';
import Vehicles from './pages/Vehicles';
import Drivers from './pages/Drivers';
import Trips from './pages/Trips';
import Maintenance from './pages/Maintenance';
import Fuel from './pages/Fuel';
import Expenses from './pages/Expenses';

const { FLEET_MANAGER, DRIVER, SAFETY_OFFICER, FINANCIAL_ANALYST } = UserRoles;

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/forbidden" element={<Forbidden />} />

          {/* Protected Routes */}
          <Route path="/" element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="/dashboard" replace />} />

            {/* All authenticated users */}
            <Route path="dashboard" element={<Dashboard />} />

            {/* Fleet Manager only */}
            <Route path="vehicles" element={
              <RoleRoute allowedRoles={[FLEET_MANAGER]}>
                <Vehicles />
              </RoleRoute>
            } />

            {/* Fleet Manager + Safety Officer */}
            <Route path="drivers" element={
              <RoleRoute allowedRoles={[FLEET_MANAGER, SAFETY_OFFICER]}>
                <Drivers />
              </RoleRoute>
            } />

            {/* Fleet Manager + Driver */}
            <Route path="trips" element={
              <RoleRoute allowedRoles={[FLEET_MANAGER, DRIVER]}>
                <Trips />
              </RoleRoute>
            } />

            {/* Fleet Manager + Safety Officer */}
            <Route path="maintenance" element={
              <RoleRoute allowedRoles={[FLEET_MANAGER, SAFETY_OFFICER]}>
                <Maintenance />
              </RoleRoute>
            } />

            {/* Fleet Manager + Driver */}
            <Route path="fuel" element={
              <RoleRoute allowedRoles={[FLEET_MANAGER, DRIVER]}>
                <Fuel />
              </RoleRoute>
            } />

            {/* Fleet Manager + Financial Analyst */}
            <Route path="expenses" element={
              <RoleRoute allowedRoles={[FLEET_MANAGER, FINANCIAL_ANALYST]}>
                <Expenses />
              </RoleRoute>
            } />
          </Route>

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

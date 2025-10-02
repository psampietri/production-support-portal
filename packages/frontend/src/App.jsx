import React from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import theme from '../styles/theme';
import { NotificationProvider } from './context/onboarding/NotificationContext';

// New Layouts
import AdminPortalLayout from './layouts/AdminPortalLayout';
import UserPortalLayout from './layouts/UserPortalLayout';

// Pages
import LoginPage from './pages/onboarding/LoginPage';
import KpiDashboard from './pages/kpi/KpiDashboard';
import AdminOnboardingDashboard from './pages/onboarding/admin/Dashboard';
import UserOnboardingDashboard from './pages/onboarding/user/Dashboard';
import ManageUsers from './pages/onboarding/admin/ManageUsers';
import ManageTemplates from './pages/onboarding/admin/ManageTemplates';
import OnboardingInstanceDetail from './pages/onboarding/admin/OnboardingInstanceDetail';
import EmailTemplates from './pages/onboarding/admin/EmailTemplates';
import AuditLogs from './pages/onboarding/admin/AuditLogs';

// A component to protect routes based on user role
const ProtectedRoute = ({ allowedRoles }) => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!user.role || !allowedRoles.includes(user.role)) {
        // Redirect them to the login page if they don't have access
        return <Navigate to="/login" replace />;
    }
    return <Outlet />;
};

// A component to handle the initial redirect
const Root = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.role === 'admin') {
        return <Navigate to="/admin" replace />;
    }
    if (user.role === 'user') {
        return <Navigate to="/user" replace />;
    }
    return <Navigate to="/login" replace />;
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <NotificationProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          
          {/* Admin Routes */}
          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
              <Route path="/admin" element={<AdminPortalLayout />}>
                  <Route index element={<Navigate to="dashboard" replace />} />
                  <Route path="dashboard" element={<AdminOnboardingDashboard />} />
                  <Route path="users" element={<ManageUsers />} />
                  <Route path="templates" element={<ManageTemplates />} />
                  <Route path="onboarding/:instanceId" element={<OnboardingInstanceDetail />} />
                  <Route path="email-templates" element={<EmailTemplates />} />
                  <Route path="audit-logs" element={<AuditLogs />} />
                  <Route path="kpis" element={<KpiDashboard />} />
              </Route>
          </Route>

          {/* User Routes */}
          <Route element={<ProtectedRoute allowedRoles={['user', 'admin']} />}>
              <Route path="/user" element={<UserPortalLayout />}>
                  <Route index element={<Navigate to="onboarding" replace />} />
                  <Route path="onboarding" element={<UserOnboardingDashboard />} />
              </Route>
          </Route>
          
          {/* Root path will redirect based on role */}
          <Route path="/" element={<Root />} />
        </Routes>
      </NotificationProvider>
    </ThemeProvider>
  );
}

export default App;
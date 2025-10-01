import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import theme from '../styles/theme'; // Use the new unified theme
import { NotificationProvider } from './context/onboarding/NotificationContext';

// Layouts
import PortalLayout from './layouts/PortalLayout';
import UserLayout from './layouts/onboarding/UserLayout';

// Pages
// import LoginPage from './pages/onboarding/LoginPage';
import KpiDashboard from './pages/kpi/KpiDashboard';

// Onboarding Pages (imported from their new subdirectories)
import AdminOnboardingDashboard from './pages/onboarding/admin/Dashboard';
import UserOnboardingDashboard from './pages/onboarding/user/Dashboard';
import ManageUsers from './pages/onboarding/admin/ManageUsers';
import ManageTemplates from './pages/onboarding/admin/ManageTemplates';
import OnboardingInstanceDetail from './pages/onboarding/admin/OnboardingInstanceDetail';
import EmailTemplates from './pages/onboarding/admin/EmailTemplates';
import AuditLogs from './pages/onboarding/admin/AuditLogs';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <NotificationProvider>
        <Routes>
          {/* Auth Route */}
          {/* <Route path="/login" element={<LoginPage />} /> */}

          {/* Main Portal Route with Shared Layout */}
          <Route path="/portal" element={<PortalLayout />}>
            {/* Default to KPI Dashboard */}
            <Route index element={<Navigate to="kpis" replace />} />
            
            {/* KPI Section */}
            <Route path="kpis" element={<KpiDashboard />} />
            
            {/* Onboarding Admin Section */}
            <Route path="onboarding/dashboard" element={<AdminOnboardingDashboard />} />
            <Route path="onboarding/users" element={<ManageUsers />} />
            <Route path="onboarding/templates" element={<ManageTemplates />} />
            <Route path="onboarding/instance/:instanceId" element={<OnboardingInstanceDetail />} />
            <Route path="onboarding/email-templates" element={<EmailTemplates />} />
            <Route path="onboarding/audit-logs" element={<AuditLogs />} />
          </Route>

          {/* User-Facing Onboarding Route */}
          <Route path="/onboarding" element={<UserLayout />}>
            <Route index element={<UserOnboardingDashboard />} />
          </Route>
          
          {/* Redirect base URL to the login page as a fallback */}
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </NotificationProvider>
    </ThemeProvider>
  );
}

export default App;
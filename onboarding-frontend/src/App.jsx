import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import theme from './styles/theme';
import LoginPage from './pages/LoginPage';
import AdminLayout from './layouts/AdminLayout';
import UserLayout from './layouts/UserLayout';
import AdminDashboard from './pages/admin/Dashboard';
import UserDashboard from './pages/user/Dashboard';
import ManageUsers from './pages/admin/ManageUsers';
import ManageTemplates from './pages/admin/ManageTemplates';
import OnboardingInstanceDetail from './pages/admin/OnboardingInstanceDetail';
import EmailTemplates from './pages/admin/EmailTemplates';
import AuditLogs from './pages/admin/AuditLogs'; // Import the new page
import { NotificationProvider } from './context/NotificationContext';

const App = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <NotificationProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="dashboard" />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="users" element={<ManageUsers />} />
            <Route path="templates" element={<ManageTemplates />} />
            <Route path="onboarding/:instanceId" element={<OnboardingInstanceDetail />} />
            <Route path="email-templates" element={<EmailTemplates />} />
            <Route path="audit-logs" element={<AuditLogs />} /> {/* Add the new route */}
          </Route>

          <Route path="/" element={<UserLayout />}>
            <Route index element={<UserDashboard />} />
          </Route>
        </Routes>
      </NotificationProvider>
    </ThemeProvider>
  );
}

export default App;
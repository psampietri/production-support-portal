import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import PortalLayout from './layouts/PortalLayout';
import OnboardingAdminLayout from './layouts/OnboardingAdminLayout';
import OnboardingDashboard from './pages/onboarding/OnboardingDashboard';
import ManageTemplates from './pages/admin/ManageTemplates';
import ManageUsers from './pages/admin/ManageUsers';
import KpiDashboard from './pages/kpi/KpiDashboard';
import VulnerabilityDashboard from './pages/vulnerability/VulnerabilityDashboard';
import LoginPage from './pages/LoginPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/portal" element={<PortalLayout />}>
          {/* Onboarding Section with its own admin layout */}
          <Route path="onboarding" element={<OnboardingAdminLayout />}>
            <Route path="dashboard" element={<OnboardingDashboard />} />
            <Route path="templates" element={<ManageTemplates />} />
            <Route path="users" element={<ManageUsers />} />
          </Route>
          
          {/* Other Portal Sections */}
          <Route path="kpis" element={<KpiDashboard />} />
          <Route path="vulnerabilities" element={<VulnerabilityDashboard />} />
        </Route>
        
        {/* Default route */}
        <Route path="/" element={<Navigate to="/portal/onboarding/dashboard" />} />
      </Routes>
    </Router>
  );
}

export default App;
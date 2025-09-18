import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import PortalLayout from '../src/layouts/PortalLayout';
import KpiDashboard from '../src/pages/kpi/KpiDashboard';


function App() {
  return (
    <Routes>
      {/* Redirect base URL to the KPI Dashboard by default */}
      <Route path="/" element={<Navigate to="/portal/kpis" replace />} />

      {/* All main portal pages will now use the PortalLayout */}
      <Route path="/portal" element={<PortalLayout />}>
        <Route path="kpis" element={<KpiDashboard />} />
        {/* Add routes for other future pages here */}
      </Route>
      
      {/* You can add other top-level routes like LoginPage here if needed */}
      {/* <Route path="/login" element={<LoginPage />} /> */}
    </Routes>
  );
}

export default App;
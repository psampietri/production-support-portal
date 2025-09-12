import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { Box, Tabs, Tab } from '@mui/material';

const OnboardingAdminLayout = () => {
  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={location.pathname}>
          <Tab label="Dashboard" value="/portal/onboarding/dashboard" component={NavLink} to="/portal/onboarding/dashboard" />
          <Tab label="Manage Templates" value="/portal/onboarding/templates" component={NavLink} to="/portal/onboarding/templates" />
          <Tab label="Manage Users" value="/portal/onboarding/users" component={NavLink} to="/portal/onboarding/users" />
        </Tabs>
      </Box>
      <Box sx={{ p: 3 }}>
        <Outlet />
      </Box>
    </Box>
  );
};

export default OnboardingAdminLayout;
import React from 'react';
import { NavLink, Outlet } from 'react-router-dom'; // Ensure NavLink is imported
import { Box, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Toolbar, Typography, CssBaseline, AppBar } from '@mui/material';
import AssessmentIcon from '@mui/icons-material/Assessment';
import SecurityIcon from '@mui/icons-material/Security';
import DashboardIcon from '@mui/icons-material/Dashboard';

const drawerWidth = 240;

const PortalLayout = () => {
  const menuItems = [
    { text: 'Onboarding', path: '/portal/onboarding/dashboard', icon: <DashboardIcon /> },
    { text: 'KPI Dashboard', path: '/portal/kpis', icon: <AssessmentIcon /> },
    { text: 'Vulnerabilities', path: '/portal/vulnerabilities', icon: <SecurityIcon /> },
  ];

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        {/* ... AppBar content remains the same */}
      </AppBar>
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto' }}>
          <List>
            {menuItems.map((item) => (
              <ListItem key={item.text} disablePadding>
                {/* FIXED: Added sx prop to style the active link */}
                <ListItemButton
                  component={NavLink}
                  to={item.path}
                  sx={{
                    '&.active': {
                      backgroundColor: 'action.hover',
                      borderRight: 3,
                      borderColor: 'primary.main',
                    },
                  }}
                >
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
};

export default PortalLayout;
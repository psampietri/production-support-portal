import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
    Box, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText,
    Toolbar, Typography, CssBaseline, AppBar, Avatar, Menu, MenuItem, Divider,
    IconButton // <<< FIX: IconButton is now imported
} from '@mui/material';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';

const drawerWidth = 240;

const UserPortalLayout = () => {
    const navigate = useNavigate();
    const [anchorEl, setAnchorEl] = useState(null);
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    const handleMenu = (event) => setAnchorEl(event.currentTarget);
    const handleClose = () => setAnchorEl(null);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    const goToAdminDashboard = () => {
        navigate('/admin');
        handleClose();
    };

    return (
        <Box sx={{ display: 'flex' }}>
            <CssBaseline />
            <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
                <Toolbar>
                    <Typography variant="h6" noWrap sx={{ flexGrow: 1 }}>
                        User Portal
                    </Typography>
                    <IconButton onClick={handleMenu} sx={{ p: 0 }}>
                        <Avatar sx={{ bgcolor: 'secondary.main' }}>
                            {user.name ? user.name[0].toUpperCase() : 'U'}
                        </Avatar>
                    </IconButton>
                    <Menu
                        anchorEl={anchorEl}
                        open={Boolean(anchorEl)}
                        onClose={handleClose}
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                    >
                        <MenuItem disabled>
                            <ListItemText primaryTypographyProps={{ fontWeight: 'bold' }}>
                                {user.name}
                            </ListItemText>
                        </MenuItem>
                        <Divider />
                        {user.role === 'admin' && (
                            <MenuItem onClick={goToAdminDashboard}>
                                <ListItemIcon><AdminPanelSettingsIcon fontSize="small" /></ListItemIcon>
                                <ListItemText>Admin Dashboard</ListItemText>
                            </MenuItem>
                        )}
                        <MenuItem onClick={handleLogout}>
                            <ListItemIcon><ExitToAppIcon fontSize="small" /></ListItemIcon>
                            <ListItemText>Logout</ListItemText>
                        </MenuItem>
                    </Menu>
                </Toolbar>
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
                        <ListItem disablePadding>
                            <ListItemButton component={NavLink} to="/user/onboarding" sx={{ '&.active': { backgroundColor: 'action.selected' } }}>
                                <ListItemIcon><AccountCircleIcon /></ListItemIcon>
                                <ListItemText primary="My Onboarding" />
                            </ListItemButton>
                        </ListItem>
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

export default UserPortalLayout;
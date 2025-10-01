import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { 
    Box, AppBar, Toolbar, Typography, IconButton, Menu, MenuItem, Avatar, Divider,
    ListItemIcon, ListItemText
} from '@mui/material';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';

const UserLayout = () => {
    const navigate = useNavigate();
    const [anchorEl, setAnchorEl] = useState(null);
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    const handleMenu = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

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
            <AppBar position="fixed">
                <Toolbar>
                    <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
                        Onboarding Portal
                    </Typography>
                    <div>
                        <IconButton
                            size="large"
                            onClick={handleMenu}
                            color="inherit"
                        >
                            <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
                                {user.name ? user.name[0].toUpperCase() : 'U'}
                            </Avatar>
                        </IconButton>
                        <Menu
                            id="menu-appbar"
                            anchorEl={anchorEl}
                            anchorOrigin={{
                                vertical: 'bottom',
                                horizontal: 'right',
                            }}
                            keepMounted
                            transformOrigin={{
                                vertical: 'top',
                                horizontal: 'right',
                            }}
                            open={Boolean(anchorEl)}
                            onClose={handleClose}
                        >
                            <MenuItem disabled>
                                <Typography variant="body2">
                                    Signed in as <strong>{user.name}</strong>
                                </Typography>
                            </MenuItem>
                            <Divider />
                            {user.role === 'admin' && (
                                <MenuItem onClick={goToAdminDashboard}>
                                    <ListItemIcon>
                                        <AdminPanelSettingsIcon fontSize="small" color="primary" />
                                    </ListItemIcon>
                                    <ListItemText>Admin Dashboard</ListItemText>
                                </MenuItem>
                            )}
                            <Divider />
                            <MenuItem onClick={handleLogout}>
                                <ListItemIcon>
                                    <ExitToAppIcon fontSize="small" color="primary" />
                                </ListItemIcon>
                                <ListItemText>Logout</ListItemText>
                            </MenuItem>
                        </Menu>
                    </div>
                </Toolbar>
            </AppBar>
            <Box component="main" sx={{ flexGrow: 1, p: 3, marginTop: '64px' }}>
                <Outlet />
            </Box>
        </Box>
    );
};

export default UserLayout;
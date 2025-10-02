import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
    Box, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText,
    Toolbar, Typography, CssBaseline, AppBar, Divider, Collapse, IconButton,
    Avatar, Menu, MenuItem
} from '@mui/material';
import AssessmentIcon from '@mui/icons-material/Assessment';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import AssignmentIcon from '@mui/icons-material/Assignment';
import EmailIcon from '@mui/icons-material/Email';
import HistoryIcon from '@mui/icons-material/History';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';

const drawerWidth = 240;

const CollapsibleNavItem = ({ primary, icon, children }) => {
    const [open, setOpen] = React.useState(true);
    const handleClick = () => setOpen(!open);

    return (
        <>
            <ListItemButton onClick={handleClick}>
                <ListItemIcon>{icon}</ListItemIcon>
                <ListItemText primary={primary} />
                {open ? <ExpandLess /> : <ExpandMore />}
            </ListItemButton>
            <Collapse in={open} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                    {children}
                </List>
            </Collapse>
        </>
    );
};

const NavItem = ({ text, path, icon }) => (
    <ListItem disablePadding>
        <ListItemButton
            component={NavLink}
            to={path}
            sx={{ pl: 4, '&.active': { backgroundColor: 'action.selected' } }}
        >
            <ListItemIcon>{icon}</ListItemIcon>
            <ListItemText primary={text} />
        </ListItemButton>
    </ListItem>
);

const AdminPortalLayout = () => {
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

    const switchToUserView = () => {
        navigate('/user/onboarding');
        handleClose();
    };

    const onboardingMenuItems = [
        { text: 'Dashboard', path: '/admin/dashboard', icon: <DashboardIcon /> },
        { text: 'Manage Users', path: '/admin/users', icon: <PeopleIcon /> },
        { text: 'Manage Templates', path: '/admin/templates', icon: <AssignmentIcon /> },
        { text: 'Email Templates', path: '/admin/email-templates', icon: <EmailIcon /> },
        { text: 'Audit Logs', path: '/admin/audit-logs', icon: <HistoryIcon /> },
    ];

    return (
        <Box sx={{ display: 'flex' }}>
            <CssBaseline />
            <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
                <Toolbar>
                    <Typography variant="h6" noWrap sx={{ flexGrow: 1 }}>
                        Admin Portal
                    </Typography>
                    <IconButton onClick={handleMenu} sx={{ p: 0 }}>
                        <Avatar sx={{ bgcolor: 'secondary.main' }}>
                            {user.name ? user.name[0].toUpperCase() : 'A'}
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
                        <MenuItem onClick={switchToUserView}>
                            <ListItemIcon><AccountCircleIcon fontSize="small" /></ListItemIcon>
                            <ListItemText>My Onboarding</ListItemText>
                        </MenuItem>
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
                        <CollapsibleNavItem primary="Onboarding" icon={<DashboardIcon />}>
                            {onboardingMenuItems.map((item) => <NavItem key={item.text} {...item} />)}
                        </CollapsibleNavItem>
                        <Divider sx={{ my: 1 }} />
                        <NavItem text="KPI Dashboard" path="/admin/kpis" icon={<AssessmentIcon />} />
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

export default AdminPortalLayout;
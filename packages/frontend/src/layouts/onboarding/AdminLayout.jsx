import React, { useState } from 'react';
import { Outlet, Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import { 
    Box, AppBar, Toolbar, Typography, IconButton, Menu, MenuItem, Avatar, Divider,
    Tabs, Tab, Container, ListItemIcon, ListItemText
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import AssignmentIcon from '@mui/icons-material/Assignment';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import EmailIcon from '@mui/icons-material/Email';
import HistoryIcon from '@mui/icons-material/History';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import NotificationCenter from '../../components/onboarding/NotificationCenter';

const navItems = [
    { text: 'Dashboard', icon: <DashboardIcon color="primary" />, path: '/admin/dashboard' },
    { text: 'Manage Users', icon: <PeopleIcon color="primary" />, path: '/admin/users' },
    { text: 'Manage Templates', icon: <AssignmentIcon color="primary" />, path: '/admin/templates' },
    { text: 'Email Templates', icon: <EmailIcon color="primary" />, path: '/admin/email-templates' },
    { text: 'Audit Logs', icon: <HistoryIcon color="primary" />, path: '/admin/audit-logs' },
];

const AdminLayout = () => {
    const location = useLocation();
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
    
    const goToUserDashboard = () => {
        navigate('/');
        handleClose();
    };

    // Find the current tab index based on the URL path
    const currentTab = navItems.findIndex(item => location.pathname.startsWith(item.path));

    return (
        <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', color: 'text.primary' }}>
            <AppBar position="static" color="transparent" elevation={0} sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Toolbar>
                    <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
                        Admin Portal
                    </Typography>
                    
                    <NotificationCenter />
                    
                    <div>
                        <IconButton
                            size="large"
                            onClick={handleMenu}
                            color="inherit"
                        >
                            <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
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
                            <MenuItem onClick={goToUserDashboard}>
                                <ListItemIcon>
                                    <AccountCircleIcon fontSize="small" color="primary"/>
                                </ListItemIcon>
                                <ListItemText>My Onboarding</ListItemText>
                            </MenuItem>
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
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <header className="text-center mb-6">
                    <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
                        Onboarding Automation Tool
                    </Typography>
                    <Typography color="text.secondary" sx={{ mt: 1 }}>
                        Create, track, and analyze your team's onboarding progress.
                    </Typography>
                </header>
                
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
                    <Tabs 
                        value={currentTab === -1 ? false : currentTab} 
                        indicatorColor="primary"
                        textColor="primary"
                    >
                        {navItems.map((item, index) => (
                            <Tab 
                                key={item.text}
                                icon={item.icon}
                                iconPosition="start"
                                label={item.text}
                                component={RouterLink}
                                to={item.path}
                                sx={{
                                    textTransform: 'none',
                                    fontWeight: 600
                                }}
                            />
                        ))}
                    </Tabs>
                </Box>
                
                <main>
                    <Outlet />
                </main>
            </Container>
        </Box>
    );
};

export default AdminLayout;
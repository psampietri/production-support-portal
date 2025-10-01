import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
    Box, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText,
    Toolbar, Typography, CssBaseline, AppBar, Divider, Collapse
} from '@mui/material';

// Icons
import AssessmentIcon from '@mui/icons-material/Assessment';
import SecurityIcon from '@mui/icons-material/Security';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import AssignmentIcon from '@mui/icons-material/Assignment';
import EmailIcon from '@mui/icons-material/Email';
import HistoryIcon from '@mui/icons-material/History';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import AccountCircleIcon from '@mui/icons-material/AccountCircle'; // For user dashboard link

const drawerWidth = 240;

// Helper component for nested navigation
const CollapsibleNavItem = ({ primary, icon, children }) => {
    const [open, setOpen] = React.useState(true); // Default to open
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

const NavItem = ({ text, path, icon, isNested = true }) => (
    <ListItem disablePadding>
        <ListItemButton
            component={NavLink}
            to={path}
            sx={{
                '&.active': {
                    backgroundColor: 'action.selected',
                    borderLeft: 3,
                    borderColor: 'primary.main',
                },
                pl: isNested ? 4 : 2, // Indent nested items
            }}
        >
            <ListItemIcon>{icon}</ListItemIcon>
            <ListItemText primary={text} />
        </ListItemButton>
    </ListItem>
);


const PortalLayout = () => {
    // Define navigation structure
    const menuItems = {
        kpi: [
            { text: 'KPI Dashboard', path: '/portal/kpis', icon: <AssessmentIcon /> },
            { text: 'Vulnerabilities', path: '/portal/vulnerabilities', icon: <SecurityIcon /> },
        ],
        onboarding: [
            { text: 'Admin Dashboard', path: '/portal/onboarding/dashboard', icon: <DashboardIcon /> },
            { text: 'Manage Users', path: '/portal/onboarding/users', icon: <PeopleIcon /> },
            { text: 'Manage Templates', path: '/portal/onboarding/templates', icon: <AssignmentIcon /> },
            { text: 'Email Templates', path: '/portal/onboarding/email-templates', icon: <EmailIcon /> },
            { text: 'Audit Logs', path: '/portal/onboarding/audit-logs', icon: <HistoryIcon /> },
        ]
    };

    return (
        <Box sx={{ display: 'flex' }}>
            <CssBaseline />
            <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
                <Toolbar>
                    <Typography variant="h6" noWrap component="div">
                        Production Support Portal
                    </Typography>
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
                        <CollapsibleNavItem primary="KPIs" icon={<AssessmentIcon />}>
                            {menuItems.kpi.map((item) => <NavItem key={item.text} {...item} />)}
                        </CollapsibleNavItem>

                        <Divider sx={{ my: 1 }} />

                        <CollapsibleNavItem primary="Onboarding" icon={<DashboardIcon />}>
                            {menuItems.onboarding.map((item) => <NavItem key={item.text} {...item} />)}
                        </CollapsibleNavItem>

                        <Divider sx={{ my: 1 }} />
                        
                        {/* Direct link to user's personal onboarding view */}
                        <NavItem text="My Onboarding" path="/onboarding" icon={<AccountCircleIcon />} isNested={false} />

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


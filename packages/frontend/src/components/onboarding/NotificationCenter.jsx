import React, { useState, useEffect, useRef } from 'react';
import { 
    Badge, IconButton, Menu, MenuItem, List, ListItem, ListItemText, 
    Typography, Divider, Box, Tooltip, ListItemIcon, Button
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import CloseIcon from '@mui/icons-material/Close';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import InfoIcon from '@mui/icons-material/Info';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import api from '../services/api';

const NotificationCenter = () => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [anchorEl, setAnchorEl] = useState(null);
    const open = Boolean(anchorEl);
    const pollInterval = useRef(null);
    
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const userId = currentUser.id;
    
    const fetchNotifications = async () => {
        if (!userId) return;
        
        try {
            const notificationsRes = await api.get(`/notifications/user/${userId}?limit=10`);
            setNotifications(Array.isArray(notificationsRes.data) ? notificationsRes.data : []);
            
            const unreadRes = await api.get(`/notifications/user/${userId}/unread`);
            setUnreadCount(unreadRes.data.count);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    };
    
    useEffect(() => {
        if (userId) {
            fetchNotifications();
            
            // Poll for new notifications every 60 seconds
            pollInterval.current = setInterval(fetchNotifications, 60000);
        }
        
        return () => {
            if (pollInterval.current) {
                clearInterval(pollInterval.current);
            }
        };
    }, [userId]);
    
    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };
    
    const handleClose = () => {
        setAnchorEl(null);
    };
    
    const handleNotificationClick = async (notification) => {
        if (!notification.is_read) {
            try {
                await api.put(`/notifications/${notification.id}/read`, { userId });
                fetchNotifications();
                
                // If there's a related entity, navigate to it
                if (notification.related_entity_type && notification.related_entity_id) {
                    // Handle navigation based on entity type
                    // This is a simplified example - extend based on your app's needs
                    switch (notification.related_entity_type) {
                        case 'onboarding_instance':
                            window.location.href = `/admin/onboarding/${notification.related_entity_id}`;
                            break;
                        case 'user':
                            window.location.href = `/admin/users?highlight=${notification.related_entity_id}`;
                            break;
                        default:
                            break;
                    }
                }
            } catch (error) {
                console.error('Error marking notification as read:', error);
            }
        }
    };
    
    const handleMarkAllAsRead = async () => {
        try {
            await api.put(`/notifications/user/${userId}/read-all`);
            fetchNotifications();
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
        }
    };
    
    const getNotificationIcon = (type) => {
        switch (type) {
            case 'info':
                return <InfoIcon color="info" />;
            case 'warning':
                return <WarningIcon color="warning" />;
            case 'error':
                return <ErrorOutlineIcon color="error" />;
            case 'success':
                return <CheckCircleIcon color="success" />;
            default:
                return <InfoIcon color="info" />;
        }
    };
    
    const formatNotificationTime = (timestamp) => {
        const now = new Date();
        const notifTime = new Date(timestamp);
        const diffInHours = Math.abs(now - notifTime) / 36e5;
        
        if (diffInHours < 1) {
            const diffInMinutes = Math.round(diffInHours * 60);
            return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
        } else if (diffInHours < 24) {
            const hours = Math.floor(diffInHours);
            return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
        } else {
            return notifTime.toLocaleDateString();
        }
    };

    return (
        <>
            <Tooltip title="Notifications">
                <IconButton
                    color="inherit"
                    onClick={handleClick}
                    size="large"
                >
                    <Badge badgeContent={unreadCount} color="error">
                        <NotificationsIcon />
                    </Badge>
                </IconButton>
            </Tooltip>
            
            <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                PaperProps={{
                    elevation: 0,
                    sx: {
                        overflow: 'visible',
                        filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
                        mt: 1.5,
                        width: 360,
                        maxHeight: 450,
                        '& .MuiMenu-list': {
                            padding: 0,
                        },
                    },
                }}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
                <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6">Notifications</Typography>
                    <Box>
                        {unreadCount > 0 && (
                            <Tooltip title="Mark all as read">
                                <IconButton size="small" onClick={handleMarkAllAsRead}>
                                    <DoneAllIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                        )}
                        <Tooltip title="Close">
                            <IconButton size="small" onClick={handleClose}>
                                <CloseIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    </Box>
                </Box>
                <Divider />
                
                {notifications.length === 0 ? (
                    <Box sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                            No notifications
                        </Typography>
                    </Box>
                ) : (
                    <List sx={{ p: 0 }}>
                        {notifications.map((notification) => (
                            <React.Fragment key={notification.id}>
                                <ListItem 
                                    button 
                                    alignItems="flex-start"
                                    onClick={() => handleNotificationClick(notification)}
                                    sx={{
                                        bgcolor: notification.is_read ? 'transparent' : 'action.hover',
                                    }}
                                >
                                    <ListItemIcon>
                                        {getNotificationIcon(notification.type)}
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={notification.title}
                                        secondary={
                                            <>
                                                <Typography
                                                    sx={{ display: 'inline' }}
                                                    component="span"
                                                    variant="body2"
                                                    color="text.primary"
                                                >
                                                    {notification.message}
                                                </Typography>
                                                <Typography
                                                    component="span"
                                                    variant="caption"
                                                    color="text.secondary"
                                                    sx={{ display: 'block', mt: 0.5 }}
                                                >
                                                    {formatNotificationTime(notification.created_at)}
                                                </Typography>
                                            </>
                                        }
                                    />
                                </ListItem>
                                <Divider />
                            </React.Fragment>
                        ))}
                        <Box sx={{ p: 1, textAlign: 'center' }}>
                            <Button 
                                size="small" 
                                onClick={() => {
                                    handleClose();
                                    // Could navigate to a full notification page here
                                }}
                            >
                                View All
                            </Button>
                        </Box>
                    </List>
                )}
            </Menu>
        </>
    );
};

export default NotificationCenter;
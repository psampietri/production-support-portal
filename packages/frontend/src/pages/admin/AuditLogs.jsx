import React, { useState, useEffect } from 'react';
import {
    Container, Typography, Paper, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, TextField, Box, Grid, IconButton, Button,
    FormControl, InputLabel, Select, MenuItem, Tooltip, CircularProgress,
    Collapse, Card, CardContent
} from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import RefreshIcon from '@mui/icons-material/Refresh';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CloseIcon from '@mui/icons-material/Close';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFnsV3';
import { format } from 'date-fns';
import auditService from '../../services/auditService';
import { useNotification } from '../../context/NotificationContext';

const AuditLogs = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        userId: '',
        action: '',
        entityType: '',
        entityId: '',
        dateFrom: null,
        dateTo: null
    });
    const [selectedLog, setSelectedLog] = useState(null);
    const [showFilters, setShowFilters] = useState(false);
    const { showNotification } = useNotification();
    
    const fetchLogs = async () => {
        try {
            setLoading(true);
            
            // Prepare filters
            const apiFilters = { ...filters };
            if (apiFilters.dateFrom) {
                apiFilters.dateFrom = format(apiFilters.dateFrom, "yyyy-MM-dd'T'00:00:00.000'Z'");
            }
            if (apiFilters.dateTo) {
                apiFilters.dateTo = format(apiFilters.dateTo, "yyyy-MM-dd'T'23:59:59.999'Z'");
            }
            
            const data = await auditService.getAuditLogs(apiFilters);
            setLogs(data);
        } catch (err) {
            console.error('Error fetching audit logs:', err);
            showNotification('Failed to load audit logs', 'error');
        } finally {
            setLoading(false);
        }
    };
    
    useEffect(() => {
        fetchLogs();
    }, []);
    
    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };
    
    const handleDateChange = (name, value) => {
        setFilters(prev => ({ ...prev, [name]: value }));
    };
    
    const handleApplyFilters = () => {
        fetchLogs();
    };
    
    const handleClearFilters = () => {
        setFilters({
            userId: '',
            action: '',
            entityType: '',
            entityId: '',
            dateFrom: null,
            dateTo: null
        });
    };
    
    const handleViewDetails = (log) => {
        setSelectedLog(log);
    };
    
    const handleCloseDetails = () => {
        setSelectedLog(null);
    };
    
    const formatDateTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString();
    };
    
    const getActionColor = (action) => {
        switch (action.toLowerCase()) {
            case 'create':
                return '#4caf50';  // Green
            case 'update':
                return '#2196f3';  // Blue
            case 'delete':
                return '#f44336';  // Red
            case 'execute':
                return '#ff9800';  // Orange
            default:
                return '#757575';  // Grey
        }
    };
    
    const getEntityTypeIcon = (entityType) => {
        switch (entityType.toLowerCase()) {
            case 'user':
                return '👤';
            case 'template':
                return '📝';
            case 'onboarding':
                return '🚀';
            case 'task':
                return '✅';
            case 'notification':
                return '🔔';
            default:
                return '📄';
        }
    };

    return (
        <Container maxWidth="lg">
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4">Audit Logs</Typography>
                <Box>
                    <Tooltip title="Toggle Filters">
                        <IconButton onClick={() => setShowFilters(!showFilters)}>
                            <FilterListIcon />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Refresh">
                        <IconButton onClick={fetchLogs}>
                            <RefreshIcon />
                        </IconButton>
                    </Tooltip>
                </Box>
            </Box>
            
            <Collapse in={showFilters}>
                <Paper sx={{ p: 2, mb: 3 }}>
                    <Typography variant="h6" gutterBottom>Filters</Typography>
                    <Grid container spacing={2}>
                        <Grid xs={12} sm={6} md={3}>
                            <TextField
                                fullWidth
                                label="User ID"
                                name="userId"
                                value={filters.userId}
                                onChange={handleFilterChange}
                                size="small"
                                type="number"
                            />
                        </Grid>
                        <Grid xs={12} sm={6} md={3}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Action</InputLabel>
                                <Select
                                    name="action"
                                    value={filters.action}
                                    label="Action"
                                    onChange={handleFilterChange}
                                >
                                    <MenuItem value="">All Actions</MenuItem>
                                    <MenuItem value="create">Create</MenuItem>
                                    <MenuItem value="update">Update</MenuItem>
                                    <MenuItem value="delete">Delete</MenuItem>
                                    <MenuItem value="execute">Execute</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid xs={12} sm={6} md={3}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Entity Type</InputLabel>
                                <Select
                                    name="entityType"
                                    value={filters.entityType}
                                    label="Entity Type"
                                    onChange={handleFilterChange}
                                >
                                    <MenuItem value="">All Types</MenuItem>
                                    <MenuItem value="user">User</MenuItem>
                                    <MenuItem value="template">Template</MenuItem>
                                    <MenuItem value="onboarding">Onboarding</MenuItem>
                                    <MenuItem value="task">Task</MenuItem>
                                    <MenuItem value="notification">Notification</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid xs={12} sm={6} md={3}>
                            <TextField
                                fullWidth
                                label="Entity ID"
                                name="entityId"
                                value={filters.entityId}
                                onChange={handleFilterChange}
                                size="small"
                                type="number"
                            />
                        </Grid>
                        <LocalizationProvider dateAdapter={AdapterDateFns}>
                            <Grid xs={12} sm={6} md={3}>
                                <DatePicker
                                    label="From Date"
                                    value={filters.dateFrom}
                                    onChange={(newValue) => handleDateChange('dateFrom', newValue)}
                                    renderInput={(params) => <TextField {...params} size="small" fullWidth />}
                                />
                            </Grid>
                            <Grid xs={12} sm={6} md={3}>
                                <DatePicker
                                    label="To Date"
                                    value={filters.dateTo}
                                    onChange={(newValue) => handleDateChange('dateTo', newValue)}
                                    renderInput={(params) => <TextField {...params} size="small" fullWidth />}
                                />
                            </Grid>
                        </LocalizationProvider>
                        <Grid xs={12} sm={12} md={6}>
                            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                                <Button variant="outlined" onClick={handleClearFilters}>
                                    Clear
                                </Button>
                                <Button variant="contained" onClick={handleApplyFilters}>
                                    Apply Filters
                                </Button>
                            </Box>
                        </Grid>
                    </Grid>
                </Paper>
            </Collapse>
            
            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                    <CircularProgress />
                </Box>
            ) : (
                <Paper>
                    <TableContainer>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Time</TableCell>
                                    <TableCell>User</TableCell>
                                    <TableCell>Action</TableCell>
                                    <TableCell>Entity</TableCell>
                                    <TableCell>Details</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {logs.length > 0 ? (
                                    logs.map((log) => (
                                        <TableRow key={log.id} hover>
                                            <TableCell>{formatDateTime(log.created_at)}</TableCell>
                                            <TableCell>{log.user_name || `User ID: ${log.user_id}`}</TableCell>
                                            <TableCell>
                                                <Box
                                                    component="span"
                                                    sx={{
                                                        display: 'inline-block',
                                                        bgcolor: getActionColor(log.action),
                                                        color: 'white',
                                                        p: '3px 8px',
                                                        borderRadius: 1,
                                                        textTransform: 'capitalize'
                                                    }}
                                                >
                                                    {log.action}
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                <Tooltip title={log.entity_type}>
                                                    <Typography>
                                                        {getEntityTypeIcon(log.entity_type)} {log.entity_id}
                                                    </Typography>
                                                </Tooltip>
                                            </TableCell>
                                            <TableCell>
                                                <IconButton size="small" onClick={() => handleViewDetails(log)}>
                                                    <VisibilityIcon fontSize="small" />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={5} align="center">
                                            No audit logs found
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>
            )}
            
            {/* Details Dialog */}
            {selectedLog && (
                <Card sx={{ position: 'fixed', bottom: 20, right: 20, width: 400, maxWidth: '90vw', zIndex: 1000 }}>
                    <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                            <Typography variant="h6">Log Details</Typography>
                            <IconButton size="small" onClick={handleCloseDetails}>
                                <CloseIcon fontSize="small" />
                            </IconButton>
                        </Box>
                        
                        <Typography><strong>ID:</strong> {selectedLog.id}</Typography>
                        <Typography><strong>User:</strong> {selectedLog.user_name || `ID: ${selectedLog.user_id}`}</Typography>
                        <Typography><strong>Action:</strong> {selectedLog.action}</Typography>
                        <Typography><strong>Entity Type:</strong> {selectedLog.entity_type}</Typography>
                        <Typography><strong>Entity ID:</strong> {selectedLog.entity_id}</Typography>
                        <Typography><strong>Time:</strong> {formatDateTime(selectedLog.created_at)}</Typography>
                        <Typography><strong>IP Address:</strong> {selectedLog.ip_address}</Typography>
                        
                        {selectedLog.details && (
                            <Box sx={{ mt: 2 }}>
                                <Typography variant="subtitle2">Details:</Typography>
                                <Box 
                                    sx={{ 
                                        p: 1, 
                                        bgcolor: '#f5f5f5', 
                                        borderRadius: 1,
                                        maxHeight: 200,
                                        overflow: 'auto'
                                    }}
                                >
                                    <pre style={{ margin: 0 }}>
                                        {JSON.stringify(selectedLog.details, null, 2)}
                                    </pre>
                                </Box>
                            </Box>
                        )}
                    </CardContent>
                </Card>
            )}
        </Container>
    );
};

export default AuditLogs;
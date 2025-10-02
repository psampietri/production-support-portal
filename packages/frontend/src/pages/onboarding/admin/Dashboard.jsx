import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Container, Typography, Grid, Paper, Box, Button, Modal, FormControl,
    InputLabel, Select, MenuItem, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, CircularProgress, Dialog, DialogActions,
    DialogContent, DialogContentText, DialogTitle, Tabs, Tab,
    TextField, InputAdornment, IconButton, Card, CardContent
} from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import AssignmentIcon from '@mui/icons-material/Assignment';
import BarChartIcon from '@mui/icons-material/BarChart';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import Chip from '@mui/material/Chip';
import TimerIcon from '@mui/icons-material/Timer';
import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumber';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, 
    ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import api from '../../../services/api';
import { useNotification } from '../../../context/onboarding/NotificationContext';

const style = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 400,
    bgcolor: 'background.paper',
    boxShadow: 24,
    p: 4,
    borderRadius: 1
};

// Colors for charts
const COLORS = ['#FA5A50', '#000050', '#FAB9FF', '#B4DCFA'];

const StatCard = ({ title, value, icon, trend = null, trendValue = null }) => (
    <Paper 
        elevation={0}
        sx={{ 
            p: 2, 
            display: 'flex', 
            alignItems: 'center', 
            height: '100%', 
        }}
    >
        <Box sx={{ mr: 2, color: 'primary.main' }}>
            {React.cloneElement(icon, { sx: { fontSize: 40, color: 'primary.main' } })}
        </Box>
        <Box sx={{ flexGrow: 1 }}>
            <Typography color="text.secondary">{title}</Typography>
            <Box sx={{ display: 'flex', alignItems: 'baseline' }}>
                <Typography variant="h5" sx={{ color: 'text.primary' }}>{value}</Typography>
                {trend && (
                    <Box 
                        sx={{ 
                            ml: 1, 
                            display: 'flex', 
                            alignItems: 'center',
                            color: trend === 'up' ? 'success.main' : 'error.main'
                        }}
                    >
                        {trend === 'up' ? <TrendingUpIcon fontSize="small" /> : <TrendingDownIcon fontSize="small" />}
                        <Typography variant="caption" sx={{ ml: 0.5 }}>
                            {trendValue}
                        </Typography>
                    </Box>
                )}
            </Box>
        </Box>
    </Paper>
);

const AdminDashboard = () => {
    const [stats, setStats] = useState({ 
        activeOnboardings: 0, 
        totalUsers: 0,
        completionRate: 0,
        averageCompletionTime: 'N/A', 
        taskLeadTime: 'N/A',
        ticketLeadTime: 'N/A'
    });
    const [instances, setInstances] = useState([]);
    const [filteredInstances, setFilteredInstances] = useState([]);
    const [users, setUsers] = useState([]);
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [assignment, setAssignment] = useState({ userId: '', templateId: '' });
    const [tabValue, setTabValue] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [chartData, setChartData] = useState({
        taskTypeDistribution: [],
        completionTrend: [],
        statusDistribution: []
    });
    
    const navigate = useNavigate();
    const { showNotification } = useNotification();

    const fetchData = async () => {
        try {
            setLoading(true);
            const [instancesRes, usersRes, templatesRes, kpisRes, chartsRes] = await Promise.all([
                api.get('/api/onboarding/instances'),
                api.get('/api/users'),
                api.get('/api/templates/onboarding'),
                api.get('/api/analytics/kpis'),
                api.get('/api/analytics/charts')
            ]);
            
            const instancesData = instancesRes.data;
            setInstances(instancesData);
            setFilteredInstances(instancesData);
            setUsers(usersRes.data);
            setTemplates(templatesRes.data);
            
            setStats({
                activeOnboardings: kpisRes.data.activeOnboardings,
                totalUsers: kpisRes.data.totalUsers,
                averageCompletionTime: kpisRes.data.averageCompletionTime || 'N/A',
                completionRate: kpisRes.data.completionRate || 0,
                taskLeadTime: kpisRes.data.taskLeadTime || 'N/A',
                ticketLeadTime: kpisRes.data.ticketLeadTime || 'N/A'
            });
            
            setChartData(chartsRes.data);
            
        } catch (err) {
            showNotification('Failed to load dashboard data.', 'error');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);
    
    useEffect(() => {
        let filtered = [...instances];
        
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(inst => 
                inst.user_name.toLowerCase().includes(term) || 
                inst.template_name.toLowerCase().includes(term) ||
                inst.admin_name.toLowerCase().includes(term)
            );
        }
        
        if (statusFilter !== 'all') {
            filtered = filtered.filter(inst => inst.status === statusFilter);
        }
        
        setFilteredInstances(filtered);
    }, [searchTerm, statusFilter, instances]);

    const handleOpenModal = () => setModalOpen(true);
    const handleCloseModal = () => setModalOpen(false);
    const handleOpenDialog = () => setDialogOpen(true);
    const handleCloseDialog = () => setDialogOpen(false);
    const handleTabChange = (event, newValue) => setTabValue(newValue);

    const handleAssignmentChange = (e) => {
        setAssignment({ ...assignment, [e.target.name]: e.target.value });
    };

    const handleConfirmAssignment = (e) => {
        e.preventDefault();
        if (assignment.userId && assignment.templateId) {
            handleOpenDialog();
        } else {
            showNotification("Please select a user and a template.", 'warning');
        }
    };

    const handleAssignOnboarding = async () => {
        handleCloseDialog();
        try {
            const currentUser = JSON.parse(localStorage.getItem('user'));
            await api.post('/api/onboarding/instances', {
                userId: assignment.userId,
                templateId: assignment.templateId,
                assignedBy: currentUser.id
            });
            handleCloseModal();
            showNotification('Onboarding assigned successfully!', 'success');
            fetchData(); // Refresh data
        } catch (err) {
            showNotification('Failed to assign onboarding.', 'error');
            console.error(err);
        }
    };

    const handleRowClick = (instanceId) => {
        navigate(`/admin/onboarding/${instanceId}`);
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Container maxWidth="lg">
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} md={3}>
                    <StatCard 
                        title="Active Onboardings" 
                        value={stats.activeOnboardings} 
                        icon={<AssignmentIcon />} 
                    />
                </Grid>
                <Grid item xs={12} md={3}>
                    <StatCard 
                        title="Total Users" 
                        value={stats.totalUsers} 
                        icon={<PeopleIcon />} 
                    />
                </Grid>
                <Grid item xs={12} md={3}>
                    <StatCard 
                        title="Avg. Onboarding Time" 
                        value={stats.averageCompletionTime} 
                        icon={<BarChartIcon />} 
                    />
                </Grid>
                <Grid item xs={12} md={3}>
                    <StatCard 
                        title="Completion Rate" 
                        value={`${stats.completionRate}%`} 
                        icon={<AssignmentIcon />} 
                    />
                </Grid>
                <Grid item xs={12} md={3}>
                    <StatCard 
                        title="Avg. Task Lead Time" 
                        value={stats.taskLeadTime} 
                        icon={<TimerIcon />} 
                    />
                </Grid>
                <Grid item xs={12} md={3}>
                    <StatCard 
                        title="Avg. Ticket Lead Time" 
                        value={stats.ticketLeadTime} 
                        icon={<ConfirmationNumberIcon />} 
                    />
                </Grid>
            </Grid>

            {/* Charts Section */}
            <Paper sx={{ p: 2, mb: 4 }}>
                <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}>
                    <Tab label="Overview" />
                    <Tab label="Task Analysis" />
                </Tabs>

                {tabValue === 0 && (
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={8}>
                            <Typography variant="h6" gutterBottom>Onboarding Trend (Last 14 Days)</Typography>
                            <Box sx={{ height: 300 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={chartData.completionTrend}>
                                        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                                        <XAxis dataKey="date" />
                                        <YAxis />
                                        <RechartsTooltip />
                                        <Legend />
                                        <Line type="monotone" dataKey="completed" stroke="#FA5A50" activeDot={{ r: 8 }} />
                                        <Line type="monotone" dataKey="started" stroke="#B4DCFA" />
                                    </LineChart>
                                </ResponsiveContainer>
                            </Box>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Typography variant="h6" gutterBottom>Status Distribution</Typography>
                            <Box sx={{ height: 300, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={chartData.statusDistribution}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            outerRadius={80}
                                            fill="#8884d8"
                                            dataKey="value"
                                            nameKey="name"
                                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                        >
                                            {chartData.statusDistribution.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <RechartsTooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </Box>
                        </Grid>
                    </Grid>
                )}

                {tabValue === 1 && (
                    <Grid container spacing={3}>
                        <Grid item xs={12}>
                            <Typography variant="h6" gutterBottom>Task Type Distribution</Typography>
                            <Box sx={{ p: 2, height: 300 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartData.taskTypeDistribution}>
                                        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                                        <XAxis dataKey="name" />
                                        <YAxis />
                                        <RechartsTooltip />
                                        <Legend />
                                        <Bar dataKey="value" fill="#FA5A50" name="Number of Tasks" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </Box>
                        </Grid>
                    </Grid>
                )}
            </Paper>

            {/* Onboarding Monitor */}
            <Paper sx={{ p: 2}}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">Onboarding Monitor</Typography>
                    <Button variant="contained" onClick={handleOpenModal}>Assign Onboarding</Button>
                </Box>

                <Box sx={{ display: 'flex', mb: 2, gap: 2 }}>
                    <TextField
                        variant="outlined"
                        size="small"
                        placeholder="Search by name or template..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        sx={{ flexGrow: 1 }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon />
                                </InputAdornment>
                            ),
                        }}
                    />
                    <FormControl size="small" sx={{ minWidth: 150 }}>
                        <InputLabel id="status-filter-label">Status</InputLabel>
                        <Select
                            labelId="status-filter-label"
                            value={statusFilter}
                            label="Status"
                            onChange={(e) => setStatusFilter(e.target.value)}
                            startAdornment={
                                <InputAdornment position="start">
                                    <FilterListIcon />
                                </InputAdornment>
                            }
                        >
                            <MenuItem value="all">All Statuses</MenuItem>
                            <MenuItem value="not_started">Not Started</MenuItem>
                            <MenuItem value="in_progress">In Progress</MenuItem>
                            <MenuItem value="completed">Completed</MenuItem>
                        </Select>
                    </FormControl>
                </Box>

                <TableContainer>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>User</TableCell>
                                <TableCell>Template</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Assigned By</TableCell>
                                <TableCell>Start Date</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredInstances.length > 0 ? (
                                filteredInstances.map((inst) => (
                                    <TableRow 
                                        key={inst.id} 
                                        hover 
                                        onClick={() => handleRowClick(inst.id)} 
                                        sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
                                    >
                                        <TableCell>{inst.user_name}</TableCell>
                                        <TableCell>{inst.template_name}</TableCell>
                                        <TableCell>
                                            <Chip 
                                                label={inst.status} 
                                                color={
                                                    inst.status === 'completed' ? 'success' :
                                                    inst.status === 'in_progress' ? 'warning' : 'default'
                                                }
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell>{inst.admin_name}</TableCell>
                                        <TableCell>{new Date(inst.created_at).toLocaleDateString()}</TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} align="center">
                                        No onboarding instances found matching the filters.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            <Modal open={modalOpen} onClose={handleCloseModal}>
                <Box sx={style} component="form" onSubmit={handleConfirmAssignment}>
                    <Typography variant="h6" component="h2">Assign Onboarding</Typography>
                    <FormControl fullWidth margin="normal">
                        <InputLabel>User to Onboard</InputLabel>
                        <Select name="userId" value={assignment.userId} label="User to Onboard" onChange={handleAssignmentChange}>
                            {users.map(user => <MenuItem key={user.id} value={user.id}>{user.name}</MenuItem>)}
                        </Select>
                    </FormControl>
                    <FormControl fullWidth margin="normal">
                        <InputLabel>Onboarding Template</InputLabel>
                        <Select name="templateId" value={assignment.templateId} label="Onboarding Template" onChange={handleAssignmentChange}>
                            {templates.map(template => <MenuItem key={template.id} value={template.id}>{template.name}</MenuItem>)}
                        </Select>
                    </FormControl>
                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                        <Button onClick={handleCloseModal} sx={{ mr: 1 }}>Cancel</Button>
                        <Button type="submit" variant="contained">Assign</Button>
                    </Box>
                </Box>
            </Modal>

            <Dialog open={dialogOpen} onClose={handleCloseDialog}>
                <DialogTitle>Confirm Assignment</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to assign the template "{templates.find(t => t.id === assignment.templateId)?.name}" to the user "{users.find(u => u.id === assignment.userId)?.name}"?
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Cancel</Button>
                    <Button onClick={handleAssignOnboarding} color="primary">Confirm</Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default AdminDashboard;
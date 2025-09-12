import React from 'react';
import {
    Typography, Paper, Box, Grid, Card, CardContent, LinearProgress, Button, FormControl, InputLabel, Select, MenuItem, Alert
} from '@mui/material';

const OnboardingInstanceHeader = ({ instance, progress, tasksByStatus, blockedTasks, onStatusChange, onDelete, error }) => {
    return (
        <Box sx={{ mb: 4 }}>
            <Typography variant="h4" sx={{ mb: 2 }}>
                Onboarding Details for {instance.user_name}
            </Typography>
            {error && <Alert severity="warning" sx={{ mb: 2 }}>{error}</Alert>}
            
            <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>Onboarding Summary</Typography>
                        <Typography><strong>User:</strong> {instance.user_name}</Typography>
                        <FormControl fullWidth margin="normal" size="small">
                            <InputLabel>Status</InputLabel>
                            <Select
                                value={instance.status}
                                label="Status"
                                onChange={onStatusChange}
                            >
                                <MenuItem value="not_started">Not Started</MenuItem>
                                <MenuItem value="in_progress">In Progress</MenuItem>
                                <MenuItem value="completed">Completed</MenuItem>
                            </Select>
                        </FormControl>
                        <Typography><strong>Assigned By:</strong> {instance.admin_name}</Typography>
                        <Typography><strong>Start Date:</strong> {new Date(instance.created_at).toLocaleString()}</Typography>
                        
                        <Box sx={{ mt: 2 }}>
                            <Typography variant="body2" gutterBottom>Overall Progress</Typography>
                            <LinearProgress 
                                variant="determinate" 
                                value={progress} 
                                sx={{ height: 10, borderRadius: 5 }}
                            />
                            <Typography variant="caption" align="right" display="block" sx={{ mt: 0.5 }}>
                                {Math.round(progress)}% Complete
                            </Typography>
                        </Box>
                        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                            <Button color="error" onClick={onDelete}>Delete Instance</Button>
                        </Box>
                    </Paper>
                </Grid>
                
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>Task Statistics</Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={6}>
                                <Card variant="outlined" sx={{ bgcolor: 'success.light', color: 'success.contrastText' }}>
                                    <CardContent>
                                        <Typography variant="h5">{tasksByStatus.completed?.length || 0}</Typography>
                                        <Typography variant="body2">Completed Tasks</Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid item xs={6}>
                                <Card variant="outlined" sx={{ bgcolor: 'warning.light', color: 'warning.contrastText' }}>
                                    <CardContent>
                                        <Typography variant="h5">{tasksByStatus.in_progress?.length || 0}</Typography>
                                        <Typography variant="body2">In Progress</Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid item xs={6}>
                                <Card variant="outlined" sx={{ bgcolor: 'error.light', color: 'error.contrastText' }}>
                                    <CardContent>
                                        <Typography variant="h5">{blockedTasks.size || 0}</Typography>
                                        <Typography variant="body2">Blocked</Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid item xs={6}>
                                <Card variant="outlined">
                                    <CardContent>
                                        <Typography variant="h5">{tasksByStatus.not_started?.length || 0}</Typography>
                                        <Typography variant="body2">Not Started</Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                        </Grid>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default OnboardingInstanceHeader;
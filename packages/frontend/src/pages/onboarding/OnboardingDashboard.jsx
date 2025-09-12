import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    Container, Typography, Box, CircularProgress, Paper, Accordion,
    AccordionSummary, AccordionDetails, Button, Checkbox, Tooltip,
    LinearProgress, Modal, TextField, Grid
} from '@mui/material';
import {
    Timeline, TimelineItem, TimelineSeparator, TimelineConnector,
    TimelineContent, TimelineDot, TimelineOppositeContent
} from '@mui/lab';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import LockIcon from '@mui/icons-material/Lock';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import HourglassTopIcon from '@mui/icons-material/HourglassTop';
import { getActiveOnboardingForUser, updateTaskStatus, getOnboardingStatusForUser } from '../../services/onboardingService';
import { useNotification } from '../../context/NotificationContext';
import TaskComments from '../../components/TaskComments';

const style = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 400,
    bgcolor: 'background.paper',
    boxShadow: 24,
    p: 4,
};

const UserDashboard = () => {
    const [instance, setInstance] = useState(null);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const [ticketKey, setTicketKey] = useState('');
    const { showNotification } = useNotification();

    const fetchOnboardingData = useCallback(async () => {
        try {
            const data = await getActiveOnboardingForUser();
            setInstance(data);
        } catch (err) {
            showNotification('Failed to load your onboarding progress.', 'error');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [showNotification]);

    useEffect(() => {
        fetchOnboardingData();
    }, [fetchOnboardingData]);

    const handleTaskToggle = async (task) => {
        const newStatus = task.status === 'completed' ? 'in_progress' : 'completed';
        try {
            await updateTaskStatus(task.id, { status: newStatus, ticketInfo: task.ticket_info });
            showNotification('Task updated!', 'success');
            fetchOnboardingData(); // Refresh data
        } catch (err) {
            showNotification('Could not update task status.', 'error');
        }
    };

    const handleOpenModal = (task) => {
        setSelectedTask(task);
        setTicketKey(task.ticket_info?.key || '');
        setModalOpen(true);
    };

    const handleCloseModal = () => {
        setModalOpen(false);
        setSelectedTask(null);
        setTicketKey('');
    };

    const handleSaveTicket = async () => {
        try {
            await updateTaskStatus(selectedTask.id, { status: 'in_progress', ticketInfo: { key: ticketKey } });
            showNotification('Ticket information saved!', 'success');
            handleCloseModal();
            fetchOnboardingData(); // Refresh data
        } catch (err) {
            showNotification('Failed to save ticket information.', 'error');
        }
    };

    const blockedTasks = useMemo(() => {
        if (!instance?.tasks) return new Set();
        const completedTaskIds = new Set(
            instance.tasks.filter(t => t.status === 'completed').map(t => t.task_template_id)
        );
        const blocked = new Set();
        instance.tasks.forEach(task => {
            if (task.dependencies?.some(depId => !completedTaskIds.has(depId))) {
                blocked.add(task.id);
            }
        });
        return blocked;
    }, [instance]);

    const sortedTasks = useMemo(() => {
        if (!instance?.tasks) return [];
        return [...instance.tasks].sort((a, b) => {
            const aIsBlocked = blockedTasks.has(a.id);
            const bIsBlocked = blockedTasks.has(b.id);
            if (aIsBlocked && !bIsBlocked) return 1;
            if (!aIsBlocked && bIsBlocked) return -1;
            return 0; // or sort by another criterion like order/id if not blocked
        });
    }, [instance, blockedTasks]);

    const progress = useMemo(() => {
        if (!instance?.tasks || instance.tasks.length === 0) return 0;
        const completed = instance.tasks.filter(task => task.status === 'completed').length;
        return (completed / instance.tasks.length) * 100;
    }, [instance]);

    const getStatusIcon = (status, isBlocked) => {
        if (isBlocked) return <LockIcon />;
        if (status === 'completed') return <CheckCircleIcon color="primary" />;
        if (status === 'in_progress') return <HourglassTopIcon color="primary" />;
        return <RadioButtonUncheckedIcon />;
    };

    if (loading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
    }

    return (
        <Container maxWidth="md">
            <Typography variant="h4" gutterBottom>
                {instance ? 'Your Onboarding Progress' : 'Welcome!'}
            </Typography>

            {!instance ? (
                <Typography>You have no active onboarding processes assigned to you.</Typography>
            ) : (
                <>
                    <Paper sx={{ p: 3, mb: 4, borderTop: 'none' }}>
                        <Typography variant="h6" color="text.secondary" gutterBottom>
                            {instance.template_name}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                            <Box sx={{ width: '100%', mr: 1 }}>
                                <LinearProgress variant="determinate" value={progress} />
                            </Box>
                            <Box sx={{ minWidth: 35 }}>
                                <Typography variant="body2" color="text.secondary">{`${Math.round(progress)}%`}</Typography>
                            </Box>
                        </Box>
                    </Paper>

                    <Typography variant="h5" gutterBottom>Your Tasks</Typography>
                    <Timeline position="right">
                        {sortedTasks.map(task => {
                            const isBlocked = blockedTasks.has(task.id);
                            return (
                                <TimelineItem key={task.id}>
                                    <TimelineOppositeContent sx={{ display: 'none' }} />
                                    <TimelineSeparator>
                                        <TimelineDot color={isBlocked ? 'grey' : task.status === 'completed' ? 'primary' : 'grey'} variant={task.status === 'completed' ? 'filled' : 'outlined'}>
                                            {getStatusIcon(task.status, isBlocked)}
                                        </TimelineDot>
                                        <TimelineConnector />
                                    </TimelineSeparator>
                                    <TimelineContent>
                                        <Accordion defaultExpanded={!isBlocked && task.status !== 'completed'} sx={{ borderTop: `2px solid ${isBlocked ? 'grey' : 'primary.main'}` }}>
                                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                                <Checkbox
                                                    edge="start"
                                                    checked={task.status === 'completed'}
                                                    onChange={() => handleTaskToggle(task)}
                                                    disabled={isBlocked}
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                                <Typography sx={{ ml: 2, alignSelf: 'center', textDecoration: task.status === 'completed' ? 'line-through' : 'none', opacity: isBlocked ? 0.5 : 1 }}>
                                                    {task.name}
                                                </Typography>
                                                {isBlocked && (
                                                    <Tooltip title="This task is blocked by another incomplete task.">
                                                        <LockIcon fontSize="small" color="disabled" sx={{ ml: 1, alignSelf: 'center' }} />
                                                    </Tooltip>
                                                )}
                                            </AccordionSummary>
                                            <AccordionDetails>
                                                <Box
                                                    className="ql-editor" // Use Quill's class to get nice default styling
                                                    dangerouslySetInnerHTML={{ __html: task.instructions || 'No instructions provided.' }}
                                                    sx={{ mb: 2 }}
                                                />
                                                <Grid container justifyContent="space-between" alignItems="center">
                                                    <Grid item>
                                                        {task.ticket_info?.key && (
                                                            <Typography variant="caption">
                                                                Ticket: <strong>{task.ticket_info.key}</strong>
                                                            </Typography>
                                                        )}
                                                    </Grid>
                                                    <Grid item>
                                                        {task.task_type === 'manual_access_request' && (
                                                            <Button
                                                                size="small"
                                                                onClick={() => handleOpenModal(task)}
                                                                disabled={isBlocked}
                                                            >
                                                                {task.ticket_info?.key ? 'Update Ticket #' : 'Add Ticket #'}
                                                            </Button>
                                                        )}
                                                    </Grid>
                                                </Grid>
                                                <TaskComments taskId={task.id} />
                                            </AccordionDetails>
                                        </Accordion>
                                    </TimelineContent>
                                </TimelineItem>
                            );
                        })}
                    </Timeline>
                </>
            )}

            <Modal open={modalOpen} onClose={handleCloseModal}>
                <Box sx={style}>
                    <Typography variant="h6" component="h2">
                        Add Ticket Information
                    </Typography>
                    <Typography sx={{ mt: 1, mb: 2 }} color="text.secondary">
                        Please provide the ticket number you created for the task: "{selectedTask?.name}"
                    </Typography>
                    <TextField
                        fullWidth
                        label="Ticket Key (e.g., JIRA-123)"
                        value={ticketKey}
                        onChange={(e) => setTicketKey(e.target.value)}
                    />
                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                        <Button onClick={handleCloseModal} sx={{ mr: 1 }}>Cancel</Button>
                        <Button variant="contained" onClick={handleSaveTicket}>Save</Button>
                    </Box>
                </Box>
            </Modal>
        </Container>
    );
};

export default UserDashboard;
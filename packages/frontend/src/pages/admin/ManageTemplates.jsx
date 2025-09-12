import React, { useState, useEffect, useCallback } from 'react';
import {
    Container, Typography, CircularProgress, Box
} from '@mui/material';
import api from '../../services/api';
import { useNotification } from '../../context/NotificationContext';
import OnboardingTemplatesTable from '../../components/OnboardingTemplatesTable';
import TaskTemplatesTable from '../../components/TaskTemplatesTable';

const ManageTemplates = () => {
    const [taskTemplates, setTaskTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const { showNotification } = useNotification();
    
    const fetchTaskTemplates = useCallback(async () => {
        try {
            setLoading(true);
            const response = await api.get('/templates/tasks');
            setTaskTemplates(response.data);
        } catch (error) {
            showNotification("Failed to fetch task templates.", 'error');
            console.error("Failed to fetch task templates for parent", error);
        } finally {
            setLoading(false);
        }
    }, [showNotification]);

    useEffect(() => {
        fetchTaskTemplates();
    }, [fetchTaskTemplates]);

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;

    return (
        <Container maxWidth="lg">
            <Typography variant="h4" sx={{ mb: 4 }}>
                Manage Templates
            </Typography>
            <OnboardingTemplatesTable taskTemplates={taskTemplates} />
            <TaskTemplatesTable
                taskTemplates={taskTemplates}
                setTaskTemplates={setTaskTemplates}
                fetchTaskTemplates={fetchTaskTemplates}
            />
        </Container>
    );
};

export default ManageTemplates;
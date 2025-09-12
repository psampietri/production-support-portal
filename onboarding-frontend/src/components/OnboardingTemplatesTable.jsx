import React, { useState, useEffect } from 'react';
import {
    Paper, Box, Typography, Button, TableContainer, Table, TableHead,
    TableRow, TableCell, TableBody, Modal, TextField, List, ListItem,
    ListItemText, Checkbox, Dialog, DialogActions, DialogContent,
    DialogContentText, DialogTitle, Tooltip, IconButton, CircularProgress
} from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import api from '../services/api';
import { useNotification } from '../context/NotificationContext';

const style = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 600,
    bgcolor: 'background.paper',
    border: '2px solid #000',
    boxShadow: 24,
    p: 4,
};

const OnboardingTemplatesTable = ({ taskTemplates }) => {
    const [onboardingTemplates, setOnboardingTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentTemplate, setCurrentTemplate] = useState(null);
    const [selectedTasks, setSelectedTasks] = useState([]);
    const { showNotification } = useNotification();

    const fetchOnboardingTemplates = async () => {
        try {
            setLoading(true);
            const response = await api.get('/templates/onboarding');
            setOnboardingTemplates(response.data);
        } catch (err) {
            showNotification('Failed to fetch onboarding templates.', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOnboardingTemplates();
    }, []);
    
    const handleOpenCreateModal = () => {
        setIsEditing(false);
        setCurrentTemplate({ name: '', description: '' });
        setSelectedTasks([]);
        setModalOpen(true);
    };

    const handleOpenEditModal = async (template) => {
        setIsEditing(true);
        try {
            const response = await api.get(`/templates/onboarding/${template.id}`);
            setCurrentTemplate(response.data);
            setSelectedTasks(response.data.tasks || []);
            setModalOpen(true);
        } catch (err) {
            showNotification('Failed to fetch template details.', 'error');
        }
    };

    const handleOpenDeleteDialog = (template) => {
        setCurrentTemplate(template);
        setDialogOpen(true);
    };

    const handleCloseModal = () => setModalOpen(false);
    const handleCloseDialog = () => setDialogOpen(false);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setCurrentTemplate(prevState => ({ ...prevState, [name]: value }));
    };

    const handleTaskSelection = (taskId) => {
        setSelectedTasks(prev => 
            prev.includes(taskId) ? prev.filter(id => id !== taskId) : [...prev, taskId]
        );
    };

    const handleSaveTemplate = async (e) => {
        e.preventDefault();
        try {
            const currentUser = JSON.parse(localStorage.getItem('user'));
            const payload = {
                ...currentTemplate,
                created_by: currentUser.id, // Should be handled by backend
                tasks: selectedTasks.map((taskId, index) => ({ id: taskId, order: index + 1 }))
            };
            if (isEditing) {
                await api.put(`/templates/onboarding/${currentTemplate.id}`, payload);
            } else {
                await api.post('/templates/onboarding', payload);
            }
            showNotification(`Onboarding template ${isEditing ? 'updated' : 'created'} successfully!`, 'success');
            handleCloseModal();
            fetchOnboardingTemplates();
        } catch (err) {
            showNotification('Failed to save onboarding template.', 'error');
            console.error(err);
        }
    };

    const handleDeleteTemplate = async () => {
        try {
            await api.delete(`/templates/onboarding/${currentTemplate.id}`);
            showNotification('Onboarding template deleted successfully!', 'success');
            handleCloseDialog();
            fetchOnboardingTemplates();
        } catch (err) {
            showNotification('Failed to delete onboarding template.', 'error');
            console.error(err);
        }
    };

    const handleDuplicateTemplate = async (templateId) => {
        try {
            const currentUser = JSON.parse(localStorage.getItem('user'));
            const response = await api.post(`/templates/onboarding/${templateId}/duplicate`, { created_by: currentUser.id });
            
            setOnboardingTemplates(prev => [...prev, response.data]);
            showNotification('Onboarding template duplicated successfully!', 'success');
            handleOpenEditModal(response.data);
        } catch (err) {
            showNotification('Failed to duplicate onboarding template.', 'error');
            console.error(err);
        }
    };

    if (loading) return <CircularProgress />;

    return (
        <Paper sx={{ p: 2, mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Onboarding Templates</Typography>
                <Button variant="contained" startIcon={<AddCircleOutlineIcon />} onClick={handleOpenCreateModal}>
                    Create Onboarding Template
                </Button>
            </Box>
            <TableContainer>
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell>Name</TableCell>
                            <TableCell>Description</TableCell>
                            <TableCell align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {onboardingTemplates.map((template) => (
                            <TableRow key={template.id}>
                                <TableCell>{template.name}</TableCell>
                                <TableCell>{template.description}</TableCell>
                                <TableCell align="right">
                                    <Tooltip title="Duplicate">
                                        <IconButton size="small" onClick={() => handleDuplicateTemplate(template.id)}><ContentCopyIcon fontSize="small" /></IconButton>
                                    </Tooltip>
                                    <Tooltip title="Edit">
                                        <IconButton size="small" onClick={() => handleOpenEditModal(template)}><EditIcon fontSize="small" /></IconButton>
                                    </Tooltip>
                                    <Tooltip title="Delete">
                                        <IconButton size="small" onClick={() => handleOpenDeleteDialog(template)}><DeleteIcon fontSize="small" /></IconButton>
                                    </Tooltip>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
            <Modal open={modalOpen} onClose={handleCloseModal}>
                <Box sx={style} component="form" onSubmit={handleSaveTemplate}>
                    <Typography variant="h6" component="h2">{isEditing ? 'Edit' : 'Create'} Onboarding Template</Typography>
                    <TextField margin="normal" required fullWidth label="Template Name" name="name" value={currentTemplate?.name || ''} onChange={handleInputChange} />
                    <TextField margin="normal" fullWidth label="Description" name="description" value={currentTemplate?.description || ''} onChange={handleInputChange} />
                    <Typography sx={{ mt: 2 }}>Select and Order Tasks:</Typography>
                    <Paper variant="outlined" sx={{ maxHeight: 200, overflow: 'auto', mt: 1 }}>
                        <List dense>
                            {taskTemplates.map(task => (
                                <ListItem key={task.id} secondaryAction={
                                    <Checkbox edge="end" onChange={() => handleTaskSelection(task.id)} checked={selectedTasks.includes(task.id)} />
                                }>
                                    <ListItemText primary={task.name} secondary={task.task_type} />
                                </ListItem>
                            ))}
                        </List>
                    </Paper>
                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                        <Button onClick={handleCloseModal} sx={{ mr: 1 }}>Cancel</Button>
                        <Button type="submit" variant="contained">Save</Button>
                    </Box>
                </Box>
            </Modal>
            <Dialog open={dialogOpen} onClose={handleCloseDialog}>
                <DialogTitle>Delete Onboarding Template</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to delete the template "{currentTemplate?.name}"? This cannot be undone.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Cancel</Button>
                    <Button onClick={handleDeleteTemplate} color="error">Delete</Button>
                </DialogActions>
            </Dialog>
        </Paper>
    );
};

export default OnboardingTemplatesTable;
import React, { useState } from 'react';
import {
    Paper, Box, Typography, Button, TableContainer, Table, TableHead,
    TableRow, TableCell, TableBody, Modal, TextField, FormControl, InputLabel,
    Select, MenuItem, Chip, Dialog, DialogActions, DialogContent,
    DialogContentText, DialogTitle, Tooltip, IconButton, Grid
} from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import api from '../../services/api';
import useJiraIntegration from '../../hooks/onboarding/useJiraIntegration';
import { useNotification } from '../../context/onboarding/NotificationContext';
import RichTextEditor from './RichTextEditor';

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

const TaskTemplatesTable = ({ taskTemplates, setTaskTemplates, fetchTaskTemplates }) => {
    const [modalOpen, setModalOpen] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentTemplate, setCurrentTemplate] = useState(null);

    const [selectedServiceDesk, setSelectedServiceDesk] = useState('');
    const [selectedRequestType, setSelectedRequestType] = useState('');
    const [fieldMappings, setFieldMappings] = useState({});
    const { showNotification } = useNotification();

    const { serviceDesks, requestTypes, jiraFields, userFields } = useJiraIntegration(
        currentTemplate?.task_type,
        selectedServiceDesk,
        selectedRequestType
    );

    const handleOpenCreateModal = () => {
        setIsEditing(false);
        setCurrentTemplate({ name: '', description: '', instructions: '', task_type: 'manual', config: '{}', dependencies: [] });
        setSelectedServiceDesk('');
        setSelectedRequestType('');
        setFieldMappings({});
        setModalOpen(true);
    };

    const handleOpenEditModal = (template) => {
        setIsEditing(true);
        const templateData = { ...template, config: JSON.stringify(template.config || {}, null, 2) };
        setCurrentTemplate(templateData);

        if (template.task_type === 'automated_access_request' && template.config && template.config.jira) {
            const { serviceDeskId, requestTypeId, fieldMappings } = template.config.jira;
            setSelectedServiceDesk(serviceDeskId || '');
            setSelectedRequestType(requestTypeId || '');
            setFieldMappings(fieldMappings || {});
        } else {
            setSelectedServiceDesk('');
            setSelectedRequestType('');
            setFieldMappings({});
        }
        setModalOpen(true);
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

    const handleInstructionsChange = (value) => {
        setCurrentTemplate(prevState => ({ ...prevState, instructions: value }));
    };

    const handleMappingChange = (jiraFieldId, mappingType, value) => {
        setFieldMappings(prev => ({
            ...prev,
            [jiraFieldId]: { type: mappingType, value: value }
        }));
    };

    const handleSaveTemplate = async (e) => {
        e.preventDefault();
        try {
            const currentUser = JSON.parse(localStorage.getItem('user'));
            let config = {};

            if (currentTemplate.task_type === 'automated_access_request') {
                config.jira = {
                    serviceDeskId: selectedServiceDesk,
                    requestTypeId: selectedRequestType,
                    fieldMappings: fieldMappings,
                    configKey: 'MSI'
                };
            } else {
                config = JSON.parse(currentTemplate.config || '{}');
            }

            const payload = {
                ...currentTemplate,
                config,
                created_by: currentUser.id
            };

            if (isEditing) {
                await api.put(`/templates/tasks/${currentTemplate.id}`, payload);
            } else {
                await api.post('/templates/tasks', payload);
            }
            showNotification(`Task template ${isEditing ? 'updated' : 'created'} successfully!`, 'success');
            handleCloseModal();
            fetchTaskTemplates();
        } catch (err) {
            showNotification('Failed to save template. Ensure config is valid JSON if entered manually.', 'error');
            console.error(err);
        }
    };

    const handleDeleteTemplate = async () => {
        try {
            await api.delete(`/templates/tasks/${currentTemplate.id}`);
            showNotification('Task template deleted successfully!', 'success');
            handleCloseDialog();
            fetchTaskTemplates();
        } catch (err) {
            showNotification('Failed to delete template.', 'error');
            console.error(err);
        }
    };

    const handleDuplicateTemplate = async (templateId) => {
        try {
            const currentUser = JSON.parse(localStorage.getItem('user'));
            const response = await api.post(`/templates/tasks/${templateId}/duplicate`, { created_by: currentUser.id });
            
            setTaskTemplates(prev => [...prev, response.data]);
            showNotification('Task template duplicated successfully!', 'success');
            handleOpenEditModal(response.data);
        } catch (err) {
            showNotification('Failed to duplicate task template.', 'error');
            console.error(err);
        }
    };

    const renderStaticInput = (field) => {
        const mapping = fieldMappings[field.fieldId] || {};
        const hasValidValues = field.validValues && field.validValues.length > 0;
        const isMultiSelect = field.jiraSchema?.type === 'array' && field.jiraSchema?.items === 'option';

        if (hasValidValues) {
            return (
                <FormControl fullWidth size="small">
                    <InputLabel>Select Value</InputLabel>
                    <Select
                        multiple={isMultiSelect}
                        value={mapping.value || (isMultiSelect ? [] : '')}
                        label="Select Value"
                        onChange={(e) => handleMappingChange(field.fieldId, 'static', e.target.value)}
                    >
                        {field.validValues.map(opt => <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>)}
                    </Select>
                </FormControl>
            );
        }

        return (
            <TextField
                fullWidth
                size="small"
                label="Static Value"
                value={mapping.value || ''}
                onChange={(e) => handleMappingChange(field.fieldId, 'static', e.target.value)}
            />
        );
    };


    return (
        <Paper sx={{ p: 2, mt: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Task Templates</Typography>
                <Button variant="outlined" startIcon={<AddCircleOutlineIcon />} onClick={handleOpenCreateModal}>
                    Create Task Template
                </Button>
            </Box>
            <TableContainer>
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell>Name</TableCell>
                            <TableCell>Type</TableCell>
                            <TableCell>Dependencies</TableCell>
                            <TableCell align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {taskTemplates.map((template) => (
                            <TableRow key={template.id}>
                                <TableCell>{template.name}</TableCell>
                                <TableCell>{template.task_type}</TableCell>
                                <TableCell>
                                    {template.dependencies?.map(depId => {
                                        const dep = taskTemplates.find(t => t.id === depId);
                                        return <Chip key={depId} label={dep?.name || '...'} size="small" sx={{ mr: 0.5 }} />;
                                    })}
                                </TableCell>
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
                    <Typography variant="h6" component="h2">{isEditing ? 'Edit' : 'Create New'} Task Template</Typography>
                    <TextField margin="normal" required fullWidth label="Template Name" name="name" value={currentTemplate?.name || ''} onChange={handleInputChange} />
                    <TextField margin="normal" fullWidth label="Description" name="description" value={currentTemplate?.description || ''} onChange={handleInputChange} />
                    <FormControl fullWidth margin="normal">
                        <Typography variant="subtitle1" sx={{ mb: 1 }}>Instructions</Typography>
                        <RichTextEditor value={currentTemplate?.instructions || ''} onChange={handleInstructionsChange} />
                    </FormControl>
                    <FormControl fullWidth margin="normal">
                        <InputLabel>Task Type</InputLabel>
                        <Select name="task_type" value={currentTemplate?.task_type || 'manual'} label="Task Type" onChange={handleInputChange}>
                            <MenuItem value="manual">Manual Task</MenuItem>
                            <MenuItem value="manual_access_request">Manual Access Request</MenuItem>
                            <MenuItem value="automated_access_request">Automated Access Request</MenuItem>
                        </Select>
                    </FormControl>

                    <FormControl fullWidth margin="normal">
                        <InputLabel>Dependencies</InputLabel>
                        <Select
                            multiple
                            name="dependencies"
                            value={currentTemplate?.dependencies || []}
                            onChange={handleInputChange}
                            label="Dependencies"
                            renderValue={(selected) => (
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                    {selected.map((value) => {
                                        const dep = taskTemplates.find(t => t.id === value);
                                        return <Chip key={value} label={dep?.name || value} />;
                                    })}
                                </Box>
                            )}
                        >
                            {taskTemplates.filter(t => t.id !== currentTemplate?.id).map(t => (
                                <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    {currentTemplate?.task_type === 'automated_access_request' && (
                        <Paper variant="outlined" sx={{ p: 2, mt: 2, maxHeight: 300, overflowY: 'auto' }}>
                            <Typography variant="subtitle1" sx={{ mb: 1 }}>Jira Automation Config</Typography>
                            <FormControl fullWidth margin="normal">
                                <InputLabel>Service Desk</InputLabel>
                                <Select value={selectedServiceDesk} label="Service Desk" onChange={(e) => setSelectedServiceDesk(e.target.value)}>
                                    {serviceDesks.map(desk => <MenuItem key={desk.id} value={desk.id}>{desk.projectName}</MenuItem>)}
                                </Select>
                            </FormControl>
                            <FormControl fullWidth margin="normal" disabled={!selectedServiceDesk}>
                                <InputLabel>Request Type</InputLabel>
                                <Select value={selectedRequestType} label="Request Type" onChange={(e) => setSelectedRequestType(e.target.value)}>
                                    {requestTypes.map(type => <MenuItem key={type.id} value={type.id}>{type.name}</MenuItem>)}
                                </Select>
                            </FormControl>
                            
                            {jiraFields.length > 0 && (
                                <Box sx={{ mt: 2 }}>
                                    <Typography>Map Jira Fields:</Typography>
                                    {jiraFields.filter(f => f.required).map(field => (
                                        <Grid container spacing={2} key={field.fieldId} alignItems="center" sx={{mt: 1}}>
                                            <Grid item xs={12} sm={4}>
                                                <Typography variant="body2" title={field.name} noWrap>
                                                    {field.name}
                                                </Typography>
                                            </Grid>
                                            <Grid item xs={6} sm={4}>
                                                <FormControl fullWidth size="small">
                                                    <InputLabel>Type</InputLabel>
                                                    <Select
                                                        value={fieldMappings[field.fieldId]?.type || 'dynamic'}
                                                        label="Type"
                                                        onChange={(e) => handleMappingChange(field.fieldId, e.target.value, '')}
                                                    >
                                                        <MenuItem value="dynamic">Dynamic</MenuItem>
                                                        <MenuItem value="static">Static</MenuItem>
                                                    </Select>
                                                </FormControl>
                                            </Grid>
                                            <Grid item xs={6} sm={4}>
                                                {fieldMappings[field.fieldId]?.type === 'static' ? (
                                                    renderStaticInput(field)
                                                ) : (
                                                    <FormControl fullWidth size="small">
                                                        <InputLabel>User Field</InputLabel>
                                                        <Select
                                                            value={fieldMappings[field.fieldId]?.value || ''}
                                                            label="User Field"
                                                            onChange={(e) => handleMappingChange(field.fieldId, 'dynamic', e.target.value)}
                                                        >
                                                            {userFields.map(uf => <MenuItem key={uf} value={uf}>{uf}</MenuItem>)}
                                                        </Select>
                                                    </FormControl>
                                                )}
                                            </Grid>
                                        </Grid>
                                    ))}
                                </Box>
                            )}
                        </Paper>
                    )}
                    
                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                        <Button onClick={handleCloseModal} sx={{ mr: 1 }}>Cancel</Button>
                        <Button type="submit" variant="contained">Save</Button>
                    </Box>
                </Box>
            </Modal>

            <Dialog open={dialogOpen} onClose={handleCloseDialog}>
                <DialogTitle>Delete Task Template</DialogTitle>
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

export default TaskTemplatesTable;
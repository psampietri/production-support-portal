import React, { useState, useEffect } from 'react';
import {
    Container, Typography, Paper, Button, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, IconButton, Dialog, DialogActions, DialogContent, DialogTitle,
    TextField, Grid, Box, CircularProgress, Tooltip
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import api from '../../../services/api';
import { useNotification } from '../../../context/onboarding/NotificationContext';

const EmailTemplates = () => {
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [currentTemplate, setCurrentTemplate] = useState({
        id: null,
        name: '',
        subject: '',
        body_template: ''
    });
    const [previewHtml, setPreviewHtml] = useState('');
    const { showNotification } = useNotification();
    
    const fetchTemplates = async () => {
        try {
            setLoading(true);
            const response = await api.get('/notifications/email/templates');
            setTemplates(response.data);
        } catch (error) {
            console.error('Error fetching email templates:', error);
            showNotification('Failed to load email templates', 'error');
        } finally {
            setLoading(false);
        }
    };
    
    useEffect(() => {
        fetchTemplates();
    }, []);
    
    const handleCreateNew = () => {
        setCurrentTemplate({
            id: null,
            name: '',
            subject: '',
            body_template: ''
        });
        setDialogOpen(true);
    };
    
    const handleEdit = (template) => {
        setCurrentTemplate({
            id: template.id,
            name: template.name,
            subject: template.subject,
            body_template: template.body_template
        });
        setDialogOpen(true);
    };
    
    const handlePreview = (template) => {
        // Replace placeholders with example values
        let previewBody = template.body_template;
        previewBody = previewBody.replace(/{{name}}/g, 'John Doe');
        previewBody = previewBody.replace(/{{email}}/g, 'john.doe@example.com');
        previewBody = previewBody.replace(/{{role}}/g, 'Software Developer');
        previewBody = previewBody.replace(/{{date}}/g, new Date().toLocaleDateString());
        previewBody = previewBody.replace(/{{company}}/g, 'ACME Corporation');
        
        setPreviewHtml(previewBody);
        setPreviewDialogOpen(true);
    };
    
    const handleDelete = (template) => {
        setCurrentTemplate(template);
        setDeleteDialogOpen(true);
    };
    
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setCurrentTemplate({
            ...currentTemplate,
            [name]: value
        });
    };
    
    const handleSubmit = async () => {
        try {
            if (!currentTemplate.name || !currentTemplate.subject || !currentTemplate.body_template) {
                showNotification('All fields are required', 'warning');
                return;
            }
            
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            
            if (currentTemplate.id) {
                // Update existing template
                await api.put(`/notifications/email/templates/${currentTemplate.id}`, {
                    name: currentTemplate.name,
                    subject: currentTemplate.subject,
                    bodyTemplate: currentTemplate.body_template
                });
                showNotification('Template updated successfully!', 'success');
            } else {
                // Create new template
                await api.post('/notifications/email/templates', {
                    name: currentTemplate.name,
                    subject: currentTemplate.subject,
                    bodyTemplate: currentTemplate.body_template,
                    createdBy: user.id
                });
                showNotification('Template created successfully!', 'success');
            }
            
            setDialogOpen(false);
            fetchTemplates();
        } catch (error) {
            console.error('Error saving template:', error);
            showNotification('Failed to save template', 'error');
        }
    };
    
    const handleConfirmDelete = async () => {
        try {
            await api.delete(`/notifications/email/templates/${currentTemplate.id}`);
            showNotification('Template deleted successfully!', 'success');
            setDeleteDialogOpen(false);
            fetchTemplates();
        } catch (error) {
            console.error('Error deleting template:', error);
            showNotification('Failed to delete template', 'error');
        }
    };
    
    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <CircularProgress />
            </Box>
        );
    }
    
    return (
        <Container maxWidth="lg">
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4">Email Templates</Typography>
                <Button variant="contained" color="primary" onClick={handleCreateNew}>
                    Create Template
                </Button>
            </Box>
            
            <Paper>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Name</TableCell>
                                <TableCell>Subject</TableCell>
                                <TableCell>Created At</TableCell>
                                <TableCell>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {templates.length > 0 ? (
                                templates.map((template) => (
                                    <TableRow key={template.id}>
                                        <TableCell>{template.name}</TableCell>
                                        <TableCell>{template.subject}</TableCell>
                                        <TableCell>{new Date(template.created_at).toLocaleDateString()}</TableCell>
                                        <TableCell>
                                            <Tooltip title="Preview">
                                                <IconButton onClick={() => handlePreview(template)} color="info">
                                                    <VisibilityIcon />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Edit">
                                                <IconButton onClick={() => handleEdit(template)} color="primary">
                                                    <EditIcon />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Delete">
                                                <IconButton onClick={() => handleDelete(template)} color="error">
                                                    <DeleteIcon />
                                                </IconButton>
                                            </Tooltip>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4} align="center">
                                        No email templates found
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
            
            {/* Create/Edit Dialog */}
            <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle>
                    {currentTemplate.id ? 'Edit Email Template' : 'Create Email Template'}
                </DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Template Name"
                                name="name"
                                value={currentTemplate.name}
                                onChange={handleInputChange}
                                required
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Email Subject"
                                name="subject"
                                value={currentTemplate.subject}
                                onChange={handleInputChange}
                                required
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Email Body HTML"
                                name="body_template"
                                value={currentTemplate.body_template}
                                onChange={handleInputChange}
                                multiline
                                rows={12}
                                required
                                helperText="Use {{name}}, {{email}}, etc. as placeholders for dynamic content"
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleSubmit} color="primary" variant="contained">
                        Save
                    </Button>
                </DialogActions>
            </Dialog>
            
            {/* Preview Dialog */}
            <Dialog open={previewDialogOpen} onClose={() => setPreviewDialogOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle>Email Preview</DialogTitle>
                <DialogContent>
                    <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setPreviewDialogOpen(false)}>Close</Button>
                </DialogActions>
            </Dialog>
            
            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
                <DialogTitle>Confirm Deletion</DialogTitle>
                <DialogContent>
                    Are you sure you want to delete the template "{currentTemplate.name}"?
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleConfirmDelete} color="error">
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default EmailTemplates;
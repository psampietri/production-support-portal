import React, { useState } from 'react';
import {
    Modal, Box, Typography, List, ListItem, ListItemText, IconButton, TextField, Button
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { useNotification } from '../context/NotificationContext';

const style = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 400,
    bgcolor: 'background.paper',
    border: '2px solid #000',
    boxShadow: 24,
    p: 4,
    maxHeight: '90vh',
    overflowY: 'auto',
};

const ManageFieldsModal = ({ open, onClose, userFields, onAddField, onDeleteField }) => {
    const [newFieldName, setNewFieldName] = useState('');
    const { showNotification } = useNotification();

    const handleAddField = async (e) => {
        e.preventDefault();
        if (!newFieldName) {
            showNotification('Field name cannot be empty.', 'warning');
            return;
        }
        try {
            await onAddField(newFieldName);
            showNotification('Field added successfully!', 'success');
            setNewFieldName('');
        } catch (err) {
            showNotification(err.response?.data?.error || 'Failed to add field.', 'error');
            console.error(err);
        }
    };

    const handleDeleteField = async (fieldName) => {
        try {
            await onDeleteField(fieldName);
            showNotification('Field deleted successfully!', 'success');
        } catch (err) {
            showNotification(err.response?.data?.error || 'Failed to delete field.', 'error');
            console.error(err);
        }
    };

    return (
        <Modal open={open} onClose={onClose}>
            <Box sx={style}>
                <Typography variant="h6" component="h2">Manage User Fields</Typography>
                <List sx={{ maxHeight: 200, overflow: 'auto', my: 2 }}>
                    {userFields.map(field => (
                        <ListItem key={field} secondaryAction={
                            <IconButton edge="end" aria-label="delete" onClick={() => handleDeleteField(field)}>
                                <DeleteIcon />
                            </IconButton>
                        }>
                            <ListItemText primary={field} />
                        </ListItem>
                    ))}
                </List>
                <Box component="form" onSubmit={handleAddField} sx={{ display: 'flex', gap: 1 }}>
                    <TextField
                        size="small"
                        fullWidth
                        label="New Field Name"
                        value={newFieldName}
                        onChange={(e) => setNewFieldName(e.target.value)}
                    />
                    <Button type="submit" variant="contained">Add</Button>
                </Box>
            </Box>
        </Modal>
    );
};

export default ManageFieldsModal;
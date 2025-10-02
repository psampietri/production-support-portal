import React, { useState } from 'react';
import {
    Modal, Box, Typography, List, ListItem, ListItemText, IconButton, TextField, Button
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { useNotification } from '../../context/onboarding/NotificationContext';

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
        if (!newFieldName.trim()) {
            showNotification('Field name cannot be empty.', 'warning');
            return;
        }
        try {
            await onAddField(newFieldName);
            showNotification('Field added successfully!', 'success');
            setNewFieldName('');
        } catch (err) {
            const errorMessage = err.response?.data?.error || 'Failed to add field.';
            showNotification(errorMessage, 'error');
            console.error(err);
        }
    };

    const handleDeleteField = async (fieldKey) => {
        try {
            await onDeleteField(fieldKey);
            showNotification('Field deleted successfully!', 'success');
        } catch (err) {
            const errorMessage = err.response?.data?.error || 'Failed to delete field.';
            showNotification(errorMessage, 'error');
            console.error(err);
        }
    };

    return (
        <Modal open={open} onClose={onClose}>
            <Box sx={style}>
                <Typography variant="h6" component="h2">Manage Custom Fields</Typography>
                <List sx={{ maxHeight: 200, overflow: 'auto', my: 2 }}>
                    {/* FIX: The component now expects an array of objects */}
                    {userFields.map(field => (
                        <ListItem key={field.field_key} secondaryAction={
                            <IconButton edge="end" aria-label="delete" onClick={() => handleDeleteField(field.field_key)}>
                                <DeleteIcon />
                            </IconButton>
                        }>
                            <ListItemText primary={field.label} secondary={field.field_key} />
                        </ListItem>
                    ))}
                </List>
                <Box component="form" onSubmit={handleAddField} sx={{ display: 'flex', gap: 1 }}>
                    <TextField
                        size="small"
                        fullWidth
                        label="New Field Label"
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
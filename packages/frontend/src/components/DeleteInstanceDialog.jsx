import React from 'react';
import {
    Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Button
} from '@mui/material';

const DeleteInstanceDialog = ({ open, onClose, onConfirm }) => {
    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>Delete Onboarding Instance</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    Are you sure you want to delete this onboarding instance? This action cannot be undone.
                </DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button onClick={onConfirm} color="error">Delete</Button>
            </DialogActions>
        </Dialog>
    );
};

export default DeleteInstanceDialog;
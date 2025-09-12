import React from 'react';
import {
    Modal, Box, Typography, IconButton, Divider
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import TaskComments from './TaskComments';

const style = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 600,
    bgcolor: 'background.paper',
    boxShadow: 24,
    p: 4,
    maxHeight: '90vh',
    overflowY: 'auto',
};

const TaskDetailModal = ({ open, onClose, task }) => {
    if (!task) return null;

    return (
        <Modal open={open} onClose={onClose}>
            <Box sx={style}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6" component="h2">
                        {task.name}
                    </Typography>
                    <IconButton onClick={onClose}>
                        <CloseIcon />
                    </IconButton>
                </Box>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle1" gutterBottom>Instructions</Typography>
                <Box
                    className="ql-editor"
                    dangerouslySetInnerHTML={{ __html: task.instructions || '<p>No instructions provided.</p>' }}
                    sx={{ mb: 2, p: 1, border: 1, borderColor: 'divider', borderRadius: 1 }}
                />
                <TaskComments taskId={task.id} />
            </Box>
        </Modal>
    );
};

export default TaskDetailModal;
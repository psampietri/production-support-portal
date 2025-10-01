import React, { useState, useEffect } from 'react';
import { Box, Typography, TextField, Button, List, ListItem, ListItemText, Divider, CircularProgress, Avatar, IconButton, Menu, MenuItem } from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { getComments, addComment, updateComment, deleteComment } from '../services/onboardingService';
import { useNotification } from '../context/NotificationContext';

const TaskComments = ({ taskId }) => {
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [editingComment, setEditingComment] = useState(null); // State to track the comment being edited
    const [editedText, setEditedText] = useState('');
    const [loading, setLoading] = useState(true);
    const [anchorEl, setAnchorEl] = useState(null);
    const [selectedComment, setSelectedComment] = useState(null);
    const { showNotification } = useNotification();
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

    const fetchComments = async () => {
        try {
            const data = await getComments(taskId);
            setComments(data);
        } catch (error) {
            showNotification('Failed to load comments.', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchComments();
    }, [taskId]);

    const handleSubmitComment = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;
        try {
            await addComment(taskId, newComment);
            setNewComment('');
            fetchComments();
        } catch (error) {
            showNotification('Failed to post comment.', 'error');
        }
    };

    const handleMenuClick = (event, comment) => {
        setAnchorEl(event.currentTarget);
        setSelectedComment(comment);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
        setSelectedComment(null);
    };

    const handleEditStart = () => {
        setEditingComment(selectedComment.id);
        setEditedText(selectedComment.comment_text);
        handleMenuClose();
    };

    const handleEditCancel = () => {
        setEditingComment(null);
        setEditedText('');
    };

    const handleEditSave = async () => {
        try {
            await updateComment(editingComment, editedText);
            setEditingComment(null);
            setEditedText('');
            showNotification('Comment updated!', 'success');
            fetchComments();
        } catch (error) {
            showNotification('Failed to update comment.', 'error');
        }
    };

    const handleDelete = async () => {
        try {
            await deleteComment(selectedComment.id);
            showNotification('Comment deleted!', 'success');
            handleMenuClose();
            fetchComments();
        } catch (error) {
            showNotification('Failed to delete comment.', 'error');
        }
    };

    if (loading) {
        return <CircularProgress size={24} />;
    }

    return (
        <Box 
            sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}
            onKeyDown={(e) => e.stopPropagation()}
        >
            <Typography variant="subtitle2" gutterBottom>Comments</Typography>
            <List sx={{ maxHeight: 200, overflow: 'auto', mb: 2 }}>
                {comments.map((comment, index) => (
                    <React.Fragment key={comment.id}>
                        <ListItem alignItems="flex-start" secondaryAction={
                            currentUser.id === comment.user_id && (
                                <IconButton edge="end" onClick={(e) => handleMenuClick(e, comment)}>
                                    <MoreVertIcon />
                                </IconButton>
                            )
                        }>
                            <Avatar sx={{ mr: 2, bgcolor: 'secondary.main' }}>
                                {comment.user_name ? comment.user_name[0].toUpperCase() : '?'}
                            </Avatar>
                            {editingComment === comment.id ? (
                                <Box sx={{ width: '100%' }}>
                                    <TextField
                                        fullWidth
                                        multiline
                                        size="small"
                                        value={editedText}
                                        onChange={(e) => setEditedText(e.target.value)}
                                    />
                                    <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                                        <Button size="small" variant="contained" onClick={handleEditSave}>Save</Button>
                                        <Button size="small" onClick={handleEditCancel}>Cancel</Button>
                                    </Box>
                                </Box>
                            ) : (
                                <ListItemText
                                    primary={comment.user_name}
                                    secondary={
                                        <>
                                            <Typography component="span" variant="body2" color="text.primary">
                                                {comment.comment_text}
                                            </Typography>
                                            <Typography component="span" sx={{ display: 'block', fontSize: '0.75rem' }}>
                                                {new Date(comment.created_at).toLocaleString()}
                                            </Typography>
                                        </>
                                    }
                                />
                            )}
                        </ListItem>
                        {index < comments.length - 1 && <Divider variant="inset" component="li" />}
                    </React.Fragment>
                ))}
            </List>
            <Box component="form" onSubmit={handleSubmitComment} sx={{ display: 'flex', gap: 1 }}>
                <TextField
                    fullWidth
                    size="small"
                    label="Add a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                />
                <Button type="submit" variant="contained" size="small">Post</Button>
            </Box>
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
            >
                <MenuItem onClick={handleEditStart}>Edit</MenuItem>
                <MenuItem onClick={handleDelete}>Delete</MenuItem>
            </Menu>
        </Box>
    );
};

export default TaskComments;
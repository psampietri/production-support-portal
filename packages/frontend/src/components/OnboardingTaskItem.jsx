import React from 'react';
import {
    Box, Typography, Link, Tooltip, IconButton, FormControl, Select, MenuItem, Button, Chip, CircularProgress
} from '@mui/material';
import { TreeItem } from '@mui/x-tree-view';
import LockIcon from '@mui/icons-material/Lock';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumber';
import LinkOffIcon from '@mui/icons-material/LinkOff';

const OnboardingTaskItem = ({
    node, blockedTasks, taskLoading, handleStatusChange,
    handleOpenTicketModal, handleUnassignTicket, handleDryRun,
    handleExecuteTask, renderTree, onTaskNameClick
}) => {
    const isBlocked = blockedTasks.has(node.id);
    const hasTicket = node.ticket_info?.key;
    const canExecute = node.task_type === 'automated_access_request' && node.status === 'not_started' && !isBlocked;

    const getStatusChipColor = (status) => {
        switch (status) {
            case 'completed': return 'success';
            case 'in_progress': return 'warning';
            case 'blocked': return 'error';
            default: return 'default';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'completed': return <CheckCircleIcon color="primary" />;
            case 'in_progress': return <AccessTimeIcon color="primary" />;
            case 'blocked': return <ErrorIcon color="primary" />;
            default: return <HourglassEmptyIcon color="disabled" />;
        }
    };

    return (
        <TreeItem
            key={node.id}
            itemId={String(node.id)}
            label={
                <Box sx={{ display: 'flex', alignItems: 'center', p: 1, width: '100%', opacity: isBlocked ? 0.6 : 1 }}>
                    {/* Column 1: Status & Name */}
                    <Box sx={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                        {getStatusIcon(node.status)}
                        <Typography 
                            onClick={() => onTaskNameClick(node)}
                            sx={{ ml: 1.5, cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                        >
                            {node.name}
                        </Typography>
                        {isBlocked && (
                            <Tooltip title={`Blocked by dependencies.`}>
                                <LockIcon fontSize="small" color="disabled" sx={{ ml: 1 }} />
                            </Tooltip>
                        )}
                    </Box>

                    {/* Column 2: Ticket Info */}
                    <Box sx={{ flex: '0 0 150px', textAlign: 'center' }}>
                        {hasTicket ? (
                             <Typography variant="h7" color="text.secondary">
                                <Link href={node.ticket_info.self} target="_blank" rel="noopener noreferrer">{node.ticket_info.key}</Link>
                            </Typography>
                        ) : (
                            <Typography variant="h7" color="text.disabled">No Ticket</Typography>
                        )}
                    </Box>

                    {/* Column 3: Status Selector */}
                    <Box sx={{ flex: '0 0 140px' }}>
                        <FormControl size="small" fullWidth disabled={isBlocked}>
                            <Select
                                value={node.status}
                                onChange={(e) => handleStatusChange(node.id, e.target.value)}
                                renderValue={(selected) => (
                                    <Chip label={selected} color={getStatusChipColor(selected)} size="small" />
                                )}
                            >
                                <MenuItem value="not_started">Not Started</MenuItem>
                                <MenuItem value="in_progress">In Progress</MenuItem>
                                <MenuItem value="completed">Completed</MenuItem>
                                <MenuItem value="blocked">Blocked</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>

                    {/* Column 4: Actions */}
                    <Box sx={{ flex: '0 0 250px', display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                        <Tooltip title="View/Edit Ticket">
                            <span>
                                <IconButton onClick={() => handleOpenTicketModal(node)} disabled={isBlocked}>
                                    <ConfirmationNumberIcon color={isBlocked ? "disabled" : "primary"} />
                                </IconButton>
                            </span>
                        </Tooltip>
                         <Tooltip title="Unassign Ticket">
                            <span>
                                <IconButton onClick={() => handleUnassignTicket(node.id)} disabled={!hasTicket}>
                                    <LinkOffIcon color={!hasTicket ? "disabled" : "primary"} />
                                </IconButton>
                            </span>
                        </Tooltip>
                        <Button variant="outlined" size="small" onClick={() => handleDryRun(node.id)} disabled={!canExecute || taskLoading === node.id}>Dry Run</Button>
                        <Button variant="contained" size="small" onClick={() => handleExecuteTask(node.id)} disabled={!canExecute || taskLoading === node.id}>
                            {taskLoading === node.id ? <CircularProgress size={20} /> : 'Run'}
                        </Button>
                    </Box>
                </Box>
            }
        >
            {Array.isArray(node.children) && node.children.length > 0
                ? renderTree(node.children)
                : null}
        </TreeItem>
    );
};

export default OnboardingTaskItem;
import React from 'react';
import {
    Paper, Box, TextField, FormControl, InputLabel, Select, MenuItem, Divider, Typography, InputAdornment
} from '@mui/material';
import { SimpleTreeView } from '@mui/x-tree-view';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import OnboardingTaskItem from './OnboardingTaskItem';

const OnboardingTaskTree = ({
    taskTree, expandedNodes, setExpandedNodes, blockedTasks, taskLoading,
    handleStatusChange, handleOpenTicketModal, handleUnassignTicket,
    handleDryRun, handleExecuteTask, taskSearchTerm, setTaskSearchTerm,
    taskStatusFilter, setTaskStatusFilter, onTaskNameClick
}) => {

    const renderTree = (nodes) => (
        nodes.map((node) => (
            <OnboardingTaskItem
                key={node.id}
                node={node}
                blockedTasks={blockedTasks}
                taskLoading={taskLoading}
                handleStatusChange={handleStatusChange}
                handleOpenTicketModal={handleOpenTicketModal}
                handleUnassignTicket={handleUnassignTicket}
                handleDryRun={handleDryRun}
                handleExecuteTask={handleExecuteTask}
                renderTree={renderTree}
                onTaskNameClick={onTaskNameClick}
            />
        ))
    );

    return (
        <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', mb: 2, gap: 2 }}>
                <TextField
                    variant="outlined"
                    size="small"
                    placeholder="Search tasks..."
                    value={taskSearchTerm}
                    onChange={(e) => setTaskSearchTerm(e.target.value)}
                    sx={{ flexGrow: 1 }}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon />
                            </InputAdornment>
                        ),
                    }}
                />
                <FormControl size="small" sx={{ minWidth: 150 }}>
                    <InputLabel>Status</InputLabel>
                    <Select
                        value={taskStatusFilter}
                        label="Status"
                        onChange={(e) => setTaskStatusFilter(e.target.value)}
                        startAdornment={
                            <InputAdornment position="start">
                                <FilterListIcon />
                            </InputAdornment>
                        }
                    >
                        <MenuItem value="all">All Statuses</MenuItem>
                        <MenuItem value="not_started">Not Started</MenuItem>
                        <MenuItem value="in_progress">In Progress</MenuItem>
                        <MenuItem value="completed">Completed</MenuItem>
                        <MenuItem value="blocked">Blocked</MenuItem>
                    </Select>
                </FormControl>
            </Box>
            <Divider sx={{ mb: 2 }} />
            {taskTree.length > 0 ? (
                <SimpleTreeView
                    expandedItems={expandedNodes}
                    onExpandedItemsChange={(event, ids) => setExpandedNodes(ids)}
                    slots={{ collapseIcon: ExpandMoreIcon, expandIcon: ChevronRightIcon }}
                    sx={{ flexGrow: 1, overflowY: 'auto' }}
                >
                    {renderTree(taskTree)}
                </SimpleTreeView>
            ) : (
                <Typography sx={{ textAlign: 'center', p: 3, color: 'text.secondary' }}>
                    No tasks match the current filters.
                </Typography>
            )}
        </Paper>
    );
};

export default OnboardingTaskTree;
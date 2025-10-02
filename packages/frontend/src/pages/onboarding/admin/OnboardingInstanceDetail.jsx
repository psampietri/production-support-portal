import React, { useState, useEffect, useMemo, useRef, useLayoutEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Container, Typography, Box, CircularProgress, Alert
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers';
import api from '../../../services/api';
import { executeAutomatedTask, dryRunAutomatedTask, updateOnboardingInstance, deleteOnboardingInstance, updateTaskStatus, unassignTicket } from '../../../services/onboarding/onboardingService';
import { getTicketDetails } from '../../../services/onboarding/integrationService';
import { useNotification } from '../../../context/onboarding/NotificationContext';

import OnboardingInstanceHeader from '../../../components/onboarding/OnboardingInstanceHeader';
import OnboardingTaskTree from '../../../components/onboarding/OnboardingTaskTree';
import TicketModal from '../../../components/onboarding/TicketModal';
import DryRunModal from '../../../components/onboarding/DryRunModal';
import DeleteInstanceDialog from '../../../components/onboarding/DeleteInstanceDialog';
import TaskDetailModal from '../../../components/onboarding/TaskDetailModal';


// Custom hook to get the previous value of a prop or state.
function usePrevious(value) {
    const ref = useRef();
    useEffect(() => {
        ref.current = value;
    });
    return ref.current;
}

const OnboardingInstanceDetail = () => {
    const { instanceId } = useParams();
    const navigate = useNavigate();
    const [instance, setInstance] = useState(null);
    const [loading, setLoading] = useState(true);
    const [taskLoading, setTaskLoading] = useState(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [dryRunModalOpen, setDryRunModalOpen] = useState(false);
    const [dryRunResult, setDryRunResult] = useState(null);
    const [taskTree, setTaskTree] = useState([]);
    const [ticketModalOpen, setTicketModalOpen] = useState(false);
    const [selectedTaskForTicket, setSelectedTaskForTicket] = useState(null);
    const [liveTicketDetails, setLiveTicketDetails] = useState(null);
    const [ticketDetailsLoading, setTicketDetailsLoading] = useState(false);
    const [manualTicketInfo, setManualTicketInfo] = useState({ key: '', self: '' });
    const [isManualTicketEntry, setIsManualTicketEntry] = useState(false);
    const [manualTicketCreatedDate, setManualTicketCreatedDate] = useState(null);
    const [manualTicketClosedDate, setManualTicketClosedDate] = useState(null);
    const [expandedNodes, setExpandedNodes] = useState([]);
    const [taskSearchTerm, setTaskSearchTerm] = useState('');
    const [taskStatusFilter, setTaskStatusFilter] = useState('all');
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [selectedTaskForDetail, setSelectedTaskForDetail] = useState(null);
    const scrollPositionRef = useRef(0);
    const { showNotification } = useNotification();

    const fetchInstanceDetails = async () => {
        if (instance) {
            scrollPositionRef.current = window.scrollY;
        }
        try {
            if (!instance) setLoading(true);
            const response = await api.get(`/onboarding/instances/${instanceId}`);
            setInstance(response.data);
        } catch (err) {
            showNotification('Failed to fetch onboarding instance details.', 'error');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInstanceDetails();
    }, [instanceId]);

    useLayoutEffect(() => {
        if (scrollPositionRef.current > 0) {
            window.scrollTo(0, scrollPositionRef.current);
        }
    }, [instance]);

    useEffect(() => {
        if (instance?.tasks) {
            const tasks = instance.tasks;
            const nodes = new Map(tasks.map(task => [task.id, { ...task, children: [] }]));
            const templateIdToTaskId = new Map(tasks.map(task => [task.task_template_id, task.id]));
            
            const assignedChildren = new Set();

            tasks.forEach(task => {
                if (task.dependencies && task.dependencies.length > 0) {
                    for (const depTemplateId of task.dependencies) {
                        if (assignedChildren.has(task.id)) break;

                        const parentId = templateIdToTaskId.get(depTemplateId);
                        if (parentId) {
                            const parentNode = nodes.get(parentId);
                            const childNode = nodes.get(task.id);
                            if (parentNode && childNode) {
                                parentNode.children.push(childNode);
                                assignedChildren.add(childNode.id);
                            }
                        }
                    }
                }
            });

            const rootNodes = Array.from(nodes.values()).filter(node => !assignedChildren.has(node.id));
            setTaskTree(rootNodes);
        }
    }, [instance]);

    const filteredTaskTree = useMemo(() => {
        if (!taskSearchTerm && taskStatusFilter === 'all') {
            return { tree: taskTree, expandedIds: [] };
        }

        const expandedIds = new Set();
        const filterNodes = (nodes) => {
            const result = [];
            for (const node of nodes) {
                const filteredChildren = node.children ? filterNodes(node.children) : [];
                
                const nameMatch = node.name.toLowerCase().includes(taskSearchTerm.toLowerCase());
                const statusMatch = taskStatusFilter === 'all' || node.status === taskStatusFilter;

                if ((nameMatch && statusMatch) || filteredChildren.length > 0) {
                    if (filteredChildren.length > 0) {
                        expandedIds.add(String(node.id));
                    }
                    result.push({ ...node, children: filteredChildren });
                }
            }
            return result;
        };

        const tree = filterNodes(taskTree);
        return { tree, expandedIds: Array.from(expandedIds) };
    }, [taskTree, taskSearchTerm, taskStatusFilter]);

    const prevSearchTerm = usePrevious(taskSearchTerm);
    const prevStatusFilter = usePrevious(taskStatusFilter);

    useEffect(() => {
        if (taskSearchTerm !== prevSearchTerm || taskStatusFilter !== prevStatusFilter) {
            setExpandedNodes(filteredTaskTree.expandedIds);
        }
    }, [taskSearchTerm, taskStatusFilter, filteredTaskTree.expandedIds, prevSearchTerm, prevStatusFilter]);

    const handleStatusChange = async (taskId, newStatus) => {
        try {
            const task = instance.tasks.find(t => t.id === taskId);
            if (!task) {
                console.error("Task not found:", taskId);
                showNotification("An error occurred while updating the task.", 'error');
                return;
            }
            
            await updateTaskStatus(taskId, { status: newStatus, ticketInfo: task.ticket_info });
            showNotification('Task status updated successfully!', 'success');
            fetchInstanceDetails();
        } catch (err) {
            showNotification('Failed to update task status.', 'error');
            console.error(err);
        }
    };

    const handleInstanceStatusChange = async (e) => {
        const newStatus = e.target.value;
        try {
            await updateOnboardingInstance(instanceId, { status: newStatus });
            setInstance(prev => ({ ...prev, status: newStatus }));
            showNotification('Instance status updated successfully!', 'success');
        } catch (err) {
            showNotification('Failed to update instance status.', 'error');
            console.error(err);
        }
    };

    const handleExecuteTask = async (taskId) => {
        setTaskLoading(taskId);
        try {
            await executeAutomatedTask(taskId);
            showNotification('Automated task executed successfully!', 'success');
            fetchInstanceDetails();
        } catch (err) {
            showNotification('Failed to execute automated task.', 'error');
            console.error(err);
        } finally {
            setTaskLoading(null);
        }
    };

    const handleDryRun = async (taskId) => {
        setTaskLoading(taskId);
        try {
            const result = await dryRunAutomatedTask(taskId);
            setDryRunResult(result);
            setDryRunModalOpen(true);
        } catch (err) {
            showNotification('Failed to perform dry run.', 'error');
            console.error(err);
        } finally {
            setTaskLoading(null);
        }
    };

    const handleOpenDeleteDialog = () => {
        setDeleteDialogOpen(true);
    };

    const handleDelete = async () => {
        try {
            await deleteOnboardingInstance(instanceId);
            showNotification('Onboarding instance deleted successfully!', 'success');
            navigate('/admin/dashboard');
        } catch (err) {
            showNotification('Failed to delete onboarding instance.', 'error');
            console.error(err);
        }
    };

    const handleUnassignTicket = async (taskId) => {
        if (window.confirm('Are you sure you want to unassign this ticket? The task status will be reset.')) {
            try {
                await unassignTicket(taskId);
                showNotification("Ticket unassigned successfully.", 'success');
                fetchInstanceDetails();
            } catch (err) {
                showNotification("Failed to unassign ticket.", 'error');
                console.error("Unassign ticket error:", err);
            }
        }
    };

    const blockedTasks = useMemo(() => {
        if (!instance?.tasks) return new Map();
        const tasksMap = new Map(instance.tasks.map(t => [t.task_template_id, t]));
        const completedTaskIds = new Set(
            instance.tasks.filter(t => t.status === 'completed').map(t => t.task_template_id)
        );
        const blocked = new Map();
        instance.tasks.forEach(task => {
            if (task.dependencies?.some(depId => !completedTaskIds.has(depId))) {
                const blockers = task.dependencies
                    .filter(depId => !completedTaskIds.has(depId))
                    .map(depId => tasksMap.get(depId)?.name || `Task ID ${depId}`);
                if (blockers.length > 0) {
                    blocked.set(task.id, blockers);
                }
            }
        });
        return blocked;
    }, [instance]);

    const handleOpenTicketModal = async (task) => {
        setSelectedTaskForTicket(task);
        setLiveTicketDetails(null);
        setTicketDetailsLoading(false);
        setManualTicketInfo(task.ticket_info || { key: '', self: '' });
        setManualTicketCreatedDate(task.ticket_created_at ? new Date(task.ticket_created_at) : null);
        setManualTicketClosedDate(task.ticket_closed_at ? new Date(task.ticket_closed_at) : null);
        
        const isAutomated = task.task_type === 'automated_access_request';
        const hasTicket = task.ticket_info && task.ticket_info.key;

        setIsManualTicketEntry(!isAutomated || (isAutomated && !hasTicket));

        if (isAutomated && hasTicket) {
            setTicketDetailsLoading(true);
            try {
                const details = await getTicketDetails('jira', task.ticket_info.key);
                setLiveTicketDetails(details);
            } catch (err) {
                console.error("Failed to fetch live ticket details", err);
                showNotification("Failed to fetch live ticket details from Jira.", 'error');
            } finally {
                setTicketDetailsLoading(false);
            }
        }
        setTicketModalOpen(true);
    };

    const handleSaveTicketInfo = async () => {
        try {
            const ticketInfoToSave = { key: manualTicketInfo.key };
            const ticket_created_at = manualTicketCreatedDate ? manualTicketCreatedDate.toISOString() : null;
            const ticket_closed_at = manualTicketClosedDate ? manualTicketClosedDate.toISOString() : null;
            
            await updateTaskStatus(selectedTaskForTicket.id, { 
                status: selectedTaskForTicket.status, 
                ticketInfo: ticketInfoToSave, 
                ticket_created_at, 
                ticket_closed_at 
            });
            showNotification('Ticket information saved successfully!', 'success');
            fetchInstanceDetails();
            setTicketModalOpen(false);
        } catch (err) {
            console.error("Failed to save ticket info:", err);
            showNotification("Failed to save ticket information.", 'error');
        }
    };
    
    const handleTaskNameClick = (task) => {
        setSelectedTaskForDetail(task);
        setDetailModalOpen(true);
    };

    const progress = useMemo(() => {
        if (!instance?.tasks || instance.tasks.length === 0) return 0;
        const completed = instance.tasks.filter(task => task.status === 'completed').length;
        return (completed / instance.tasks.length) * 100;
    }, [instance]);

    const tasksByStatus = useMemo(() => {
        if (!instance?.tasks) return {};
        return instance.tasks.reduce((acc, task) => {
            if (!acc[task.status]) acc[task.status] = [];
            acc[task.status].push(task);
            return acc;
        }, {});
    }, [instance]);

    if (loading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
    }

    if (!instance) {
        return <Alert severity="error">Onboarding instance not found.</Alert>;
    }

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Container maxWidth="lg">
                <OnboardingInstanceHeader
                    instance={instance}
                    progress={progress}
                    tasksByStatus={tasksByStatus}
                    blockedTasks={blockedTasks}
                    onStatusChange={handleInstanceStatusChange}
                    onDelete={handleOpenDeleteDialog}
                />
                
                <OnboardingTaskTree
                    taskTree={filteredTaskTree.tree}
                    expandedNodes={expandedNodes}
                    setExpandedNodes={setExpandedNodes}
                    blockedTasks={blockedTasks}
                    taskLoading={taskLoading}
                    handleStatusChange={handleStatusChange}
                    handleOpenTicketModal={handleOpenTicketModal}
                    handleUnassignTicket={handleUnassignTicket}
                    handleDryRun={handleDryRun}
                    handleExecuteTask={handleExecuteTask}
                    taskSearchTerm={taskSearchTerm}
                    setTaskSearchTerm={setTaskSearchTerm}
                    taskStatusFilter={taskStatusFilter}
                    setTaskStatusFilter={setTaskStatusFilter}
                    onTaskNameClick={handleTaskNameClick}
                />

                <DeleteInstanceDialog
                    open={deleteDialogOpen}
                    onClose={() => setDeleteDialogOpen(false)}
                    onConfirm={handleDelete}
                />

                <DryRunModal
                    open={dryRunModalOpen}
                    onClose={() => setDryRunModalOpen(false)}
                    dryRunResult={dryRunResult}
                />
                
                <TicketModal
                    open={ticketModalOpen}
                    onClose={() => setTicketModalOpen(false)}
                    task={selectedTaskForTicket}
                    isManualEntry={isManualTicketEntry}
                    setIsManualEntry={setIsManualTicketEntry}
                    manualTicketInfo={manualTicketInfo}
                    setManualTicketInfo={setManualTicketInfo}
                    manualTicketCreatedDate={manualTicketCreatedDate}
                    setManualTicketCreatedDate={setManualTicketCreatedDate}
                    manualTicketClosedDate={manualTicketClosedDate}
                    setManualTicketClosedDate={setManualTicketClosedDate}
                    onSave={handleSaveTicketInfo}
                />

                <TaskDetailModal
                    open={detailModalOpen}
                    onClose={() => setDetailModalOpen(false)}
                    task={selectedTaskForDetail}
                />
            </Container>
        </LocalizationProvider>
    );
};

export default OnboardingInstanceDetail;
import axios from 'axios';
import * as OnboardingModel from '../models/onboardingModel.js';
import * as UserService from '../../../user-service/src/services/userService.js';
import logger from '@production-support-portal/logger';
import prisma from '../../../database/client.js';

const integrationServiceApi = axios.create({
    baseURL: `http://localhost:${process.env.JIRA_SERVICE_PORT || 5005}`,
});

export const createOnboardingInstance = async (instanceData) => {
    // Wrap creation in a transaction to ensure instance and tasks are created together
    const instance = await prisma.$transaction(async (tx) => {
        return await OnboardingModel.createOnboardingInstance(
            instanceData.userId,
            instanceData.templateId,
            instanceData.assignedBy,
            tx
        );
    });
    logger.info({ instanceId: instance.id, userId: instanceData.userId }, "New onboarding instance created.");
    return instance;
};

export const getActiveOnboardingForUser = async (userId) => {
    return await OnboardingModel.findActiveOnboardingByUserId(parseInt(userId, 10));
};

export const getAllOnboardingInstances = async () => {
    return await OnboardingModel.findAllOnboardingInstances();
};

export const getOnboardingInstanceById = async (id) => {
    return await OnboardingModel.findOnboardingInstanceById(parseInt(id, 10));
};

export const getTasksByUserId = async (userId) => {
    return await OnboardingModel.findTasksByUserId(parseInt(userId, 10));
};

export const updateTaskStatus = async (taskId, data) => {
    return await prisma.$transaction(async (tx) => {
        const { status, ticketInfo, ticket_created_at, ticket_closed_at } = data;
        const id = parseInt(taskId, 10);

        const currentTask = await OnboardingModel.findTaskInstanceById(id, tx);
        if (!currentTask) {
            throw new Error("Task not found");
        }
        
        const originalStatus = currentTask.status;
        const fieldsToUpdate = { status };

        if (status === 'in_progress' && !currentTask.task_started_at) {
            fieldsToUpdate.task_started_at = new Date();
        }
        if (ticketInfo !== undefined) {
            fieldsToUpdate.ticket_info = ticketInfo || undefined;
            fieldsToUpdate.issue_key = ticketInfo ? ticketInfo.key : null;
        }
        if (ticket_created_at) fieldsToUpdate.ticket_created_at = ticket_created_at;
        if (ticket_closed_at) fieldsToUpdate.ticket_closed_at = ticket_closed_at;
        if (status === 'completed') {
            fieldsToUpdate.task_completed_at = new Date();
        }
        
        logger.info({ taskId: id, newStatus: status, oldStatus: originalStatus }, "Updating task status.");
        const updatedTask = await OnboardingModel.updateTaskInstance(id, fieldsToUpdate, tx);

        if (status === 'completed' && originalStatus !== 'completed') {
            logger.info({ completedTaskId: id }, "Task completed. Checking for dependent tasks to unblock.");
            const dependentTasks = await OnboardingModel.findDependentTaskInstances(
                currentTask.onboarding_instance_id,
                currentTask.task_template_id,
                tx
            );

            for (const dependentTask of dependentTasks) {
                if (dependentTask.status === 'blocked') {
                    const allDependenciesMet = await OnboardingModel.checkAllDependenciesComplete(
                        dependentTask.onboarding_instance_id,
                        dependentTask.task_template_id,
                        tx
                    );
                    if (allDependenciesMet) {
                        logger.info({ taskIdToUnblock: dependentTask.id }, "All dependencies met. Unblocking task.");
                        await OnboardingModel.updateTaskInstance(dependentTask.id, { status: 'not_started' }, tx);
                    }
                }
            }
        }
        
        if (originalStatus === 'completed' && status !== 'completed') {
            logger.info({ revertedTaskId: id }, "Task reverted from completed. Re-blocking dependent tasks.");
            const dependentTasks = await OnboardingModel.findDependentTaskInstances(
                currentTask.onboarding_instance_id,
                currentTask.task_template_id,
                tx
            );
            for (const dependentTask of dependentTasks) {
                if (dependentTask.status !== 'blocked') {
                    logger.info({ taskIdToBlock: dependentTask.id }, "Dependency incomplete. Blocking task.");
                    await OnboardingModel.updateTaskInstance(dependentTask.id, { status: 'blocked' }, tx);
                }
            }
        }

        return updatedTask;
    });
};

export const executeAutomatedTask = async (taskId) => {
    logger.info({ taskId }, "Attempting to execute automated task.");
    const id = parseInt(taskId, 10);
    const task = await OnboardingModel.findTaskInstanceById(id);
    if (!task || task.taskTemplate.task_type !== 'automated_access_request') {
        logger.warn({ taskId }, "Execution failed: Task is not an automated access request.");
        throw new Error('Task is not an automated access request.');
    }

    const user = await UserService.getUserById(task.onboardingInstance.user_id);
    
    try {
        const response = await integrationServiceApi.post('/api/jira/MSI/requests/create', {
            jiraConfig: task.taskTemplate.config.jira,
            user: user
        });
        const result = response.data;
        logger.info({ taskId: id, ticketKey: result.issueKey }, "Successfully created ticket for automated task.");
        
        return await updateTaskStatus(taskId, {
            status: 'in_progress',
            ticketInfo: result,
            ticket_created_at: new Date()
        });
    } catch (error) {
        const errorMessage = error.response?.data?.error || error.message || 'An unknown error occurred.';
        logger.error({ err: error, taskId }, `Error executing automated task: ${errorMessage}`);
        throw new Error(`Failed to create Jira ticket: ${errorMessage}`);
    }
};

export const dryRunAutomatedTask = async (taskId) => {
    logger.info({ taskId }, "Performing dry run for automated task.");
    const id = parseInt(taskId, 10);
    const task = await OnboardingModel.findTaskInstanceById(id);
    if (!task || task.taskTemplate.task_type !== 'automated_access_request') {
        throw new Error('Task is not an automated access request.');
    }

    const user = await UserService.getUserById(task.onboardingInstance.user_id);

    const response = await integrationServiceApi.post('/api/jira/MSI/requests/dry-run', {
        jiraConfig: task.taskTemplate.config.jira,
        user: user
    });
    
    return response.data;
};

export const updateOnboardingInstance = async (instanceId, data) => {
    logger.info({ instanceId, newStatus: data.status }, "Updating onboarding instance status.");
    return await OnboardingModel.updateOnboardingInstance(parseInt(instanceId, 10), data);
};

export const deleteOnboardingInstance = async (instanceId) => {
    logger.warn({ instanceId }, "Deleting onboarding instance.");
    return await OnboardingModel.deleteOnboardingInstance(parseInt(instanceId, 10));
};

export const unassignTicket = async (taskId) => {
    logger.info({ taskId }, "Unassigning ticket from task.");
    return await updateTaskStatus(taskId, {
        status: 'not_started',
        ticket_info: null,
        ticket_created_at: null,
        ticket_closed_at: null,
        task_started_at: null,
        task_completed_at: null,
    });
};

export const getCommentsForTask = async (taskId) => {
    const comments = await OnboardingModel.findCommentsByTaskId(parseInt(taskId, 10));
    return comments.map(c => ({...c, user_name: c.user.name }));
};

export const addCommentToTask = async (taskId, userId, commentText) => {
    if (!commentText || !commentText.trim()) {
        throw new Error('Comment text cannot be empty.');
    }
    return await OnboardingModel.createComment(parseInt(taskId, 10), userId, commentText);
};

export const updateComment = async (commentId, userId, commentText) => {
    if (!commentText || !commentText.trim()) {
        throw new Error('Comment text cannot be empty.');
    }
    const result = await OnboardingModel.updateComment(parseInt(commentId, 10), userId, commentText);
    return result.count > 0 ? OnboardingModel.findCommentsByTaskId(commentId) : null;
};

export const deleteComment = async (commentId, userId) => {
    return await OnboardingModel.deleteComment(parseInt(commentId, 10), userId);
};

export const syncTemplateChangesToInstances = async (templateId, newTasks) => {
    return await prisma.$transaction(async (tx) => {
        // 1. Find all active instances for this template
        const instances = await tx.onboardingInstance.findMany({
            where: {
                onboarding_template_id: templateId,
                status: { in: ['not_started', 'in_progress'] },
            },
            include: {
                taskInstances: true,
            },
        });

        logger.info({ templateId, numInstances: instances.length }, "Syncing template changes to instances.");

        for (const instance of instances) {
            const currentTaskIds = new Set(instance.taskInstances.map(ti => ti.task_template_id));
            const newTaskTemplateIds = new Set(newTasks.map(task => task.id));

            // 3. Delete tasks that are no longer in the template
            const tasksToDelete = instance.taskInstances.filter(
                ti => !newTaskTemplateIds.has(ti.task_template_id) && ['not_started', 'blocked'].includes(ti.status)
            );

            if (tasksToDelete.length > 0) {
                const idsToDelete = tasksToDelete.map(ti => ti.id);
                await tx.taskInstance.deleteMany({
                    where: { id: { in: idsToDelete } },
                });
                logger.info({ instanceId: instance.id, deletedCount: idsToDelete.length }, "Deleted tasks no longer in template.");
            }

            // 4. Add new tasks from the template that are not in the instance
            const tasksToAdd = newTasks.filter(task => !currentTaskIds.has(task.id));

            for (const newTask of tasksToAdd) {
                 const allDependenciesMet = await OnboardingModel.checkAllDependenciesComplete(
                    instance.id,
                    newTask.id,
                    tx
                );
                const status = allDependenciesMet ? 'not_started' : 'blocked';

                await tx.taskInstance.create({
                    data: {
                        onboarding_instance_id: instance.id,
                        task_template_id: newTask.id,
                        status: status,
                    },
                });
                logger.info({ instanceId: instance.id, taskTemplateId: newTask.id }, "Added new task from updated template.");
            }
        }
    });
};
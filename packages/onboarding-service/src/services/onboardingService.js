import axios from 'axios';
import * as OnboardingModel from '../models/onboardingModel.js';
import * as UserService from '../../../user-service/src/services/userService.js';
import logger from '@production-support-portal/logger';
import pool from '../../../database/client.js'

const integrationServiceApi = axios.create({
    baseURL: 'http://localhost:5005',
});

export const createOnboardingInstance = async (instanceData) => {
    const instance = await OnboardingModel.createOnboardingInstance(instanceData.userId, instanceData.templateId, instanceData.assignedBy);
    logger.info({ instanceId: instance.id, userId: instanceData.userId }, "New onboarding instance created.");
    return instance;
};

export const getActiveOnboardingForUser = async (userId) => {
    return await OnboardingModel.findActiveOnboardingByUserId(userId);
};

export const getAllOnboardingInstances = async () => {
    return await OnboardingModel.findAllOnboardingInstances();
};

export const getOnboardingInstanceById = async (id) => {
    return await OnboardingModel.findOnboardingInstanceById(id);
};

export const getTasksByUserId = async (userId) => {
    return await OnboardingModel.findTasksByUserId(userId);
};

export const updateTaskStatus = async (taskId, data) => {
    const { status, ticketInfo, ticket_created_at, ticket_closed_at } = data;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const currentTask = await OnboardingModel.findTaskInstanceById(taskId, client);
        if (!currentTask) {
            throw new Error("Task not found");
        }
        
        const originalStatus = currentTask.status;

        const fieldsToUpdate = { status };

        if (status === 'in_progress' && !currentTask.task_started_at) {
            fieldsToUpdate.task_started_at = new Date().toISOString();
        }

        if (ticketInfo !== undefined) {
            fieldsToUpdate.ticket_info = ticketInfo;
            fieldsToUpdate.issue_key = ticketInfo ? ticketInfo.issueKey : null;
        }
        
        if (ticket_created_at) {
            fieldsToUpdate.ticket_created_at = ticket_created_at;
        }
        if (ticket_closed_at) {
            fieldsToUpdate.ticket_closed_at = ticket_closed_at;
        }

        if (status === 'completed') {
            fieldsToUpdate.task_completed_at = new Date().toISOString();
        }
        
        logger.info({ taskId, newStatus: status, oldStatus: originalStatus }, "Updating task status.");
        const updatedTask = await OnboardingModel.updateTaskInstance(taskId, fieldsToUpdate, client);

        if (status === 'completed' && originalStatus !== 'completed') {
            logger.info({ completedTaskId: taskId }, "Task completed. Checking for dependent tasks to unblock.");
            const dependentTasks = await OnboardingModel.findDependentTaskInstances(
                currentTask.onboarding_instance_id,
                currentTask.task_template_id,
                client
            );

            for (const dependentTask of dependentTasks) {
                if (dependentTask.status === 'blocked') {
                    const allDependenciesMet = await OnboardingModel.checkAllDependenciesComplete(
                        dependentTask.onboarding_instance_id,
                        dependentTask.task_template_id,
                        client
                    );

                    if (allDependenciesMet) {
                        logger.info({ taskIdToUnblock: dependentTask.id }, "All dependencies met. Unblocking task.");
                        await OnboardingModel.updateTaskInstance(dependentTask.id, { status: 'not_started' }, client);
                    }
                }
            }
        }
        
        if (originalStatus === 'completed' && status !== 'completed') {
            logger.info({ revertedTaskId: taskId }, "Task reverted from completed. Re-blocking dependent tasks.");
            const dependentTasks = await OnboardingModel.findDependentTaskInstances(
                currentTask.onboarding_instance_id,
                currentTask.task_template_id,
                client
            );

            for (const dependentTask of dependentTasks) {
                if(dependentTask.status !== 'blocked') {
                    logger.info({ taskIdToBlock: dependentTask.id }, "Dependency incomplete. Blocking task.");
                    await OnboardingModel.updateTaskInstance(dependentTask.id, { status: 'blocked' }, client);
                }
            }
        }

        await client.query('COMMIT');
        return updatedTask;
    } catch (error) {
        await client.query('ROLLBACK');
        logger.error({ err: error, taskId }, "Failed to update task status.");
        throw error;
    } finally {
        client.release();
    }
};

export const executeAutomatedTask = async (taskId) => {
    logger.info({ taskId }, "Attempting to execute automated task.");
    const task = await OnboardingModel.findTaskInstanceById(taskId);
    if (!task || task.task_type !== 'automated_access_request') {
        logger.warn({ taskId }, "Execution failed: Task is not an automated access request.");
        throw new Error('Task is not an automated access request.');
    }

    const user = await UserService.getUserById(task.user_id);
    
    try {
        const response = await integrationServiceApi.post('/requests/create', {
            jiraConfig: task.config.jira,
            user: user
        });
        const result = response.data;
        logger.info({ taskId, ticketKey: result.key }, "Successfully created ticket for automated task.");
        
        const fieldsToUpdate = {
            status: 'in_progress',
            ticket_info: result,
            issue_key: result.key,
            ticket_created_at: new Date().toISOString(),
            task_started_at: new Date().toISOString()
        };
        return await OnboardingModel.updateTaskInstance(taskId, fieldsToUpdate);
    } catch (error) {
        logger.error({ err: error, taskId }, "Error executing automated task.");
        throw new Error('Failed to create Jira ticket. Please check the integration service logs for details.');
    }
};

export const dryRunAutomatedTask = async (taskId) => {
    logger.info({ taskId }, "Performing dry run for automated task.");
    const task = await OnboardingModel.findTaskInstanceById(taskId);
    if (!task || task.task_type !== 'automated_access_request') {
        throw new Error('Task is not an automated access request.');
    }

    const user = await UserService.getUserById(task.user_id);

    const response = await integrationServiceApi.post('/requests/dry-run', {
        jiraConfig: task.config.jira,
        user: user
    });
    
    return response.data;
};

export const updateOnboardingInstance = async (instanceId, data) => {
    logger.info({ instanceId, newStatus: data.status }, "Updating onboarding instance status.");
    return await OnboardingModel.updateOnboardingInstance(instanceId, data);
};

export const deleteOnboardingInstance = async (instanceId) => {
    logger.warn({ instanceId }, "Deleting onboarding instance.");
    return await OnboardingModel.deleteOnboardingInstance(instanceId);
};

export const unassignTicket = async (taskId) => {
    logger.info({ taskId }, "Unassigning ticket from task.");
    const fieldsToUpdate = {
        status: 'not_started',
        ticket_info: null,
        issue_key: null,
        task_started_at: null,
        task_completed_at: null,
        ticket_created_at: null,
        ticket_closed_at: null
    };
    return await OnboardingModel.updateTaskInstance(taskId, fieldsToUpdate);
};

export const getCommentsForTask = async (taskId) => {
    return await OnboardingModel.findCommentsByTaskId(taskId);
};

export const addCommentToTask = async (taskId, userId, commentText) => {
    if (!commentText || !commentText.trim()) {
        throw new Error('Comment text cannot be empty.');
    }
    return await OnboardingModel.createComment(taskId, userId, commentText);
};

export const updateComment = async (commentId, userId, commentText) => {
    if (!commentText || !commentText.trim()) {
        throw new Error('Comment text cannot be empty.');
    }
    return await OnboardingModel.updateComment(commentId, userId, commentText);
};

export const deleteComment = async (commentId, userId) => {
    return await OnboardingModel.deleteComment(commentId, userId);
};

export const syncTemplateChangesToInstances = async (templateId, newTasks) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        // 1. Find all active instances for this template
        const instancesRes = await client.query(
            `SELECT * FROM onboarding_instances WHERE onboarding_template_id = $1 AND status IN ('not_started', 'in_progress')`,
            [templateId]
        );
        const instances = instancesRes.rows;

        logger.info({ templateId, numInstances: instances.length }, "Syncing template changes to instances.");

        for (const instance of instances) {
            // 2. Get existing tasks for this instance
            const currentTasksRes = await client.query(
                `SELECT task_template_id FROM task_instances WHERE onboarding_instance_id = $1`,
                [instance.id]
            );
            const currentTaskIds = new Set(currentTasksRes.rows.map(row => row.task_template_id));
            const newTaskTemplateIds = new Set(newTasks.map(task => task.id));

            // 3. Delete tasks that are no longer in the template (but only if they are not already completed)
            for (const currentTaskId of currentTaskIds) {
                if (!newTaskTemplateIds.has(currentTaskId)) {
                    // Check if the task is not in_progress or completed before deleting
                    const taskStatusRes = await client.query(
                        `SELECT status FROM task_instances WHERE onboarding_instance_id = $1 AND task_template_id = $2`,
                        [instance.id, currentTaskId]
                    );
                    const status = taskStatusRes.rows[0]?.status;
                    if (status && (status === 'not_started' || status === 'blocked')) {
                         await client.query(
                            `DELETE FROM task_instances WHERE onboarding_instance_id = $1 AND task_template_id = $2`,
                            [instance.id, currentTaskId]
                        );
                        logger.info({ instanceId: instance.id, taskTemplateId: currentTaskId }, "Deleted task no longer in template.");
                    }
                }
            }

            // 4. Add new tasks that are in the template but not in the instance
            for (const newTask of newTasks) {
                if (!currentTaskIds.has(newTask.id)) {
                    const status = (await OnboardingModel.checkAllDependenciesComplete(instance.id, newTask.id, client)) ? 'not_started' : 'blocked';
                    await client.query(
                        'INSERT INTO task_instances (onboarding_instance_id, task_template_id, status) VALUES ($1, $2, $3)',
                        [instance.id, newTask.id, status]
                    );
                    logger.info({ instanceId: instance.id, taskTemplateId: newTask.id }, "Added new task from updated template.");
                }
            }
        }

        await client.query('COMMIT');
    } catch (e) {
        await client.query('ROLLBACK');
        logger.error({ err: e, templateId }, "Failed to sync template changes to instances.");
        throw e;
    } finally {
        client.release();
    }
};
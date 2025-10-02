import api from '../api';

export const getActiveOnboardingForUser = async () => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || !user.id) {
        return null; 
    }
    // FIX: Added the /api/ prefix to match the gateway's routing rules
    const response = await api.get(`/api/onboarding/users/${user.id}/active-onboarding`);
    return response.data;
};

export const getOnboardingInstances = async () => {
    const response = await api.get('/api/onboarding/instances');
    return response.data;
};

export const getOnboardingInstanceById = async (instanceId) => {
    const response = await api.get(`/api/onboarding/instances/${instanceId}`);
    return response.data;
};

export const executeAutomatedTask = async (taskId) => {
    const response = await api.post(`/api/onboarding/tasks/${taskId}/execute`);
    return response.data;
};

export const dryRunAutomatedTask = async (taskId) => {
    const response = await api.post(`/api/onboarding/tasks/${taskId}/dry-run`);
    return response.data;
};

export const updateOnboardingInstance = async (instanceId, data) => {
    const response = await api.put(`/api/onboarding/instances/${instanceId}`, data);
    return response.data;
};

export const deleteOnboardingInstance = async (instanceId) => {
    const response = await api.delete(`/api/onboarding/instances/${instanceId}`);
    return response.data;
};

export const getOnboardingStatusForUser = async (userId) => {
    if (!userId) {
        return [];
    }
    const response = await api.get(`/api/onboarding/users/${userId}/tasks`);
    return response.data;
};

export const updateTaskStatus = async (taskId, payload) => {
    const response = await api.put(`/api/onboarding/tasks/${taskId}`, payload);
    return response.data;
};

export const associateTicket = async (taskId, issueKey) => {
    const response = await api.post(`/api/onboarding/tasks/${taskId}/associate`, { issue_key: issueKey });
    return response.data;
};

export const unassignTicket = async (taskId) => {
    const response = await api.post(`/api/onboarding/tasks/${taskId}/unassign`);
    return response.data;
};

export const getComments = async (taskId) => {
    const response = await api.get(`/api/onboarding/tasks/${taskId}/comments`);
    return response.data;
};

export const addComment = async (taskId, commentText) => {
    const user = JSON.parse(localStorage.getItem('user'));
    const response = await api.post(`/api/onboarding/tasks/${taskId}/comments`, {
        userId: user.id,
        commentText,
    });
    return response.data;
};

export const updateComment = async (commentId, commentText) => {
    const user = JSON.parse(localStorage.getItem('user'));
    const response = await api.put(`/api/onboarding/tasks/comments/${commentId}`, {
        userId: user.id,
        commentText,
    });
    return response.data;
};

export const deleteComment = async (commentId) => {
    const user = JSON.parse(localStorage.getItem('user'));
    // Pass userId in the body for the backend to authorize the deletion
    const response = await api.delete(`/api/onboarding/tasks/comments/${commentId}`, {
        data: { userId: user.id }
    });
    return response.data;
};
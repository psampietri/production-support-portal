import api from '../api';

export const getAuditLogs = async (filters = {}) => {
    const queryParams = new URLSearchParams();
    
    if (filters.userId) queryParams.append('userId', filters.userId);
    if (filters.action) queryParams.append('action', filters.action);
    if (filters.entityType) queryParams.append('entityType', filters.entityType);
    if (filters.entityId) queryParams.append('entityId', filters.entityId);
    if (filters.dateFrom) queryParams.append('dateFrom', filters.dateFrom);
    if (filters.dateTo) queryParams.append('dateTo', filters.dateTo);
    if (filters.limit) queryParams.append('limit', filters.limit);
    if (filters.offset) queryParams.append('offset', filters.offset);
    
    const response = await api.get(`/audit?${queryParams.toString()}`);
    return response.data;
};

export default {
    getAuditLogs
};
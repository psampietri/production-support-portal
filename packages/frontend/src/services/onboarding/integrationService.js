import api from '../api';

export const getServiceDesks = async (platform, configKey) => {
    const response = await api.get(`/integrations/${platform}/servicedesks`, { params: { configKey } });
    return response.data;
};

export const getRequestTypes = async (platform, configKey, serviceDeskId) => {
    const response = await api.get(`/integrations/${platform}/servicedesks/${serviceDeskId}/requesttypes`, { params: { configKey } });
    return response.data;
};

export const getRequestTypeFields = async (platform, configKey, serviceDeskId, requestTypeId) => {
    const response = await api.get(`/integrations/${platform}/servicedesks/${serviceDeskId}/requesttypes/${requestTypeId}/fields`, { params: { configKey } });
    return response.data;
};

export const getTicketDetails = async (platform, ticketKey) => {
    const response = await api.get(`/integrations/${platform}/requests/${ticketKey}`);
    return response.data;
};
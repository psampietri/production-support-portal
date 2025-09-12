import api from './api';

export const getUserFields = async () => {
    const response = await api.get('/users/fields');
    return response.data;
};

export const addUserField = async (fieldName) => {
    const response = await api.post('/users/fields', { fieldName });
    return response.data;
};

export const deleteUserField = async (fieldName) => {
    const response = await api.delete(`/users/fields/${fieldName}`);
    return response.data;
};
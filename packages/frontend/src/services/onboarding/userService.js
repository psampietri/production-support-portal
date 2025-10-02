import api from '../api'; // Correct path to the central api instance

export const getUserFields = async () => {
    // FIX: Add the /api/ prefix
    const response = await api.get('/api/users/fields');
    return response.data;
};

export const addUserField = async (fieldName) => {
    // FIX: Add the /api/ prefix
    const response = await api.post('/api/users/fields', { fieldName });
    return response.data;
};

export const deleteUserField = async (fieldName) => {
    // FIX: Add the /api/ prefix
    const response = await api.delete(`/api/users/fields/${fieldName}`);
    return response.data;
};
import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { 
    getUserFields as fetchUserFields, 
    addUserField as postUserField, 
    deleteUserField as removeUserField 
} from '../../services/onboarding/userService';

const useUserManagement = () => {
    const [users, setUsers] = useState([]);
    const [userFields, setUserFields] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            setError('');
            const [usersRes, fieldsRes] = await Promise.all([
                api.get('/api/users'),
                fetchUserFields()
            ]);
            setUsers(usersRes.data);
            setUserFields(fieldsRes);
        } catch (err) {
            setError('Failed to fetch user data.');
            console.error('Fetch users error:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleAddField = async (fieldName) => {
        await postUserField(fieldName);
        fetchData();
    };

    const handleDeleteField = async (fieldKey) => {
        await removeUserField(fieldKey);
        fetchData();
    };

    const saveUser = async (user, isEditing) => {
        const payload = { ...user };
        // Ensure customFields is a valid object
        if (payload.customFields && typeof payload.customFields === 'string') {
            try {
                payload.customFields = JSON.parse(payload.customFields);
            } catch (e) {
                throw new Error('Custom fields is not valid JSON.');
            }
        }
        
        if (isEditing) {
            await api.put(`/api/users/${user.id}`, payload);
        } else {
            await api.post('/api/users/register', payload);
        }
        fetchData();
    };

    const deleteUserById = async (userId, newOwnerId) => {
        await api.delete(`/api/users/${userId}`, { data: { newOwnerId } });
        fetchData();
    };

    return {
        users,
        userFields,
        loading,
        error,
        setError,
        handleAddField,
        handleDeleteField,
        saveUser,
        deleteUserById,
        refreshData: fetchData
    };
};

export default useUserManagement;
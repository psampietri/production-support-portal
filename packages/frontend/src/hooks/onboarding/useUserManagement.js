import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { getUserFields as fetchUserFields, addUserField, deleteUserField } from '../services/userService';

const useUserManagement = () => {
    const [users, setUsers] = useState([]);
    const [userFields, setUserFields] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [usersRes, fieldsRes] = await Promise.all([
                api.get('/users'),
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
        await addUserField(fieldName);
        fetchData();
    };

    const handleDeleteField = async (fieldName) => {
        await deleteUserField(fieldName);
        fetchData();
    };

    const saveUser = async (user, isEditing) => {
        if (isEditing) {
            await api.put(`/users/${user.id}`, user);
        } else {
            await api.post('/auth/register', user);
        }
        fetchData();
    };

    const deleteUserById = async (userId, newOwnerId) => {
        await api.delete(`/users/${userId}`, { data: { newOwnerId } });
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
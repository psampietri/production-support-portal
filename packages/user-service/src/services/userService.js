import * as UserModel from '../models/userModel.js';
import pool from '../../../database/client.js'

export const getAllUsers = async () => {
    return await UserModel.findAllUsers();
};

export const getUserById = async (id) => {
    return await UserModel.findUserById(id);
};

export const updateUser = async (id, userData) => {
    return await UserModel.updateUser(id, userData);
};

export const deleteUser = async (id, newOwnerId) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Reassign assets to the new owner
        await client.query('UPDATE onboarding_templates SET created_by = $1 WHERE created_by = $2', [newOwnerId, id]);
        await client.query('UPDATE task_templates SET created_by = $1 WHERE created_by = $2', [newOwnerId, id]);
        await client.query('UPDATE onboarding_instances SET assigned_by = $1 WHERE assigned_by = $2', [newOwnerId, id]);
        await client.query('UPDATE email_templates SET created_by = $1 WHERE created_by = $2', [newOwnerId, id]);
        
        // Now it's safe to delete the user within the same transaction
        await UserModel.deleteUser(id, client);

        await client.query('COMMIT');
    } catch (e) {
        await client.query('ROLLBACK');
        throw e;
    } finally {
        client.release();
    }
};

export const getUserFields = async () => {
    return await UserModel.findUserFields();
};

export const addUserField = async (fieldName) => {
    return await UserModel.addUserField(fieldName);
};

export const deleteUserField = async (fieldName) => {
    return await UserModel.deleteUserField(fieldName);
};
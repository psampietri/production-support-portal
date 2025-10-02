import * as UserModel from '../models/userModel.js';
import prisma from '../../../database/client.js';

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
    return await prisma.$transaction(async (tx) => {
        const userId = parseInt(id, 10);
        const ownerId = parseInt(newOwnerId, 10);

        await tx.onboardingTemplate.updateMany({
            where: { created_by: userId },
            data: { created_by: ownerId },
        });
        await tx.taskTemplate.updateMany({
            where: { created_by: userId },
            data: { created_by: ownerId },
        });
        await tx.onboardingInstance.updateMany({
            where: { assigned_by: userId },
            data: { assigned_by: ownerId },
        });
        await tx.emailTemplate.updateMany({
            where: { created_by: userId },
            data: { created_by: ownerId },
        });
        
        await UserModel.deleteUser(userId, tx);
    });
};

// --- Custom Field Management ---

export const findUserCustomFields = async () => {
    return await UserModel.findUserCustomFields();
};

export const addUserCustomField = async (fieldName) => {
    return await UserModel.addUserCustomField(fieldName);
};

export const deleteUserCustomField = async (fieldKey) => {
    return await UserModel.deleteUserCustomField(fieldKey);
};
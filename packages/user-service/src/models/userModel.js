import prisma from '../../../database/client.js';

export const findUserByEmail = async (email) => {
    return await prisma.user.findUnique({ where: { email } });
};

export const createUser = async (userData) => {
    // With Prisma, you pass the whole data object.
    // It will only use the fields defined in the schema.
    return await prisma.user.create({
        data: userData,
        // Select only the fields that should be returned
        select: {
            id: true,
            email: true,
            name: true,
            role: true,
        },
    });
};

export const findAllUsers = async () => {
    return await prisma.user.findMany({
        orderBy: {
            name: 'asc',
        },
    });
};

export const findUserById = async (id) => {
    // Prisma automatically handles parsing the ID to an integer
    return await prisma.user.findUnique({ where: { id: parseInt(id, 10) } });
};

export const updateUser = async (id, userData) => {
    const { customFields, ...coreData } = userData;
    return await prisma.user.update({
        where: { id: parseInt(id, 10) },
        data: {
            ...coreData,
            customFields: customFields || undefined,
        },
    });
};

export const deleteUser = async (id, client = prisma) => {
    return await client.user.delete({ where: { id: parseInt(id, 10) } });
};

// --- Custom Field Management ---
export const findUserCustomFields = async () => {
    return await prisma.userCustomField.findMany({
        orderBy: { label: 'asc' },
    });
};

export const addUserCustomField = async (fieldName) => {
    return await prisma.userCustomField.create({
        data: {
            field_key: fieldName.toLowerCase().replace(/ /g, '_'),
            label: fieldName,
        },
    });
};

export const deleteUserCustomField = async (fieldKey) => {
    return await prisma.userCustomField.delete({
        where: { field_key: fieldKey },
    });
};
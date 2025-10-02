import prisma from '../../../database/client.js';

export const createNotification = async (userId, title, message, type, relatedEntityType = null, relatedEntityId = null) => {
    return await prisma.notification.create({
        data: {
            user_id: userId,
            title,
            message,
            type,
            related_entity_type: relatedEntityType,
            related_entity_id: relatedEntityId,
        },
    });
};

export const getUserNotifications = async (userId, limit = 20, offset = 0) => {
    return await prisma.notification.findMany({
        where: { user_id: userId },
        orderBy: {
            created_at: 'desc',
        },
        take: limit,
        skip: offset,
    });
};

export const getUserUnreadCount = async (userId) => {
    return await prisma.notification.count({
        where: {
            user_id: userId,
            is_read: false,
        },
    });
};

export const markAsRead = async (notificationId, userId) => {
    // Using updateMany to ensure we only update if the user ID matches
    const { count } = await prisma.notification.updateMany({
        where: {
            id: notificationId,
            user_id: userId,
        },
        data: {
            is_read: true,
        },
    });
    // Return the updated record if one was found and updated
    return count > 0 ? prisma.notification.findUnique({ where: { id: notificationId } }) : null;
};

export const markAllAsRead = async (userId) => {
    return await prisma.notification.updateMany({
        where: {
            user_id: userId,
            is_read: false,
        },
        data: {
            is_read: true,
        },
    });
};

export const deleteNotification = async (notificationId, userId) => {
    // Using deleteMany to ensure we only delete if the user ID matches
    return await prisma.notification.deleteMany({
        where: {
            id: notificationId,
            user_id: userId,
        },
    });
};

// --- Email template management ---

export const createEmailTemplate = async (name, subject, bodyTemplate, createdBy) => {
    return await prisma.emailTemplate.create({
        data: {
            name,
            subject,
            body_template: bodyTemplate,
            created_by: createdBy,
        },
    });
};

export const getAllEmailTemplates = async () => {
    return await prisma.emailTemplate.findMany({
        orderBy: {
            name: 'asc',
        },
    });
};

export const getEmailTemplateById = async (id) => {
    return await prisma.emailTemplate.findUnique({
        where: { id },
    });
};

export const updateEmailTemplate = async (id, name, subject, bodyTemplate) => {
    return await prisma.emailTemplate.update({
        where: { id },
        data: {
            name,
            subject,
            body_template: bodyTemplate,
        },
    });
};

export const deleteEmailTemplate = async (id) => {
    return await prisma.emailTemplate.delete({
        where: { id },
    });
};
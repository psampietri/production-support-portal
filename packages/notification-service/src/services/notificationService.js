import nodemailer from 'nodemailer';

import * as NotificationModel from '../models/notificationModel.js';
import logger from '@production-support-portal/logger';

// Configure nodemailer (for a real implementation, use environment variables)
let transporter;
try {
    transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: process.env.SMTP_SECURE,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD
        }
    });
} catch (error) {
    logger.error({ err: error }, 'Error configuring email transport:');
}

// Create an in-app notification
export const createNotification = async (userId, title, message, type, relatedEntityType = null, relatedEntityId = null) => {
    logger.info({ userId, type, relatedEntityId }, 'Creating in-app notification.');
    return await NotificationModel.createNotification(userId, title, message, type, relatedEntityType, relatedEntityId);
};

// Get user notifications
export const getUserNotifications = async (userId, limit = 20, offset = 0) => {
    return await NotificationModel.getUserNotifications(userId, limit, offset);
};

// Get count of unread notifications
export const getUserUnreadCount = async (userId) => {
    return await NotificationModel.getUserUnreadCount(userId);
};

// Mark notification as read
export const markAsRead = async (notificationId, userId) => {
    return await NotificationModel.markAsRead(notificationId, userId);
};

// Mark all notifications as read
export const markAllAsRead = async (userId) => {
    return await NotificationModel.markAllAsRead(userId);
};

// Delete notification
export const deleteNotification = async (notificationId, userId) => {
    return await NotificationModel.deleteNotification(notificationId, userId);
};

// Send an email notification
export const sendEmailNotification = async (to, subject, html, cc = [], bcc = []) => {
    if (!transporter) {
        logger.error('Email transport not configured.');
        return false;
    }

    try {
        const info = await transporter.sendMail({
            from: process.env.EMAIL_FROM || '"Access Request System" <no-reply@example.com>',
            to: Array.isArray(to) ? to.join(',') : to,
            cc: Array.isArray(cc) ? cc.join(',') : cc,
            bcc: Array.isArray(bcc) ? bcc.join(',') : bcc,
            subject,
            html
        });
        
        logger.info({ messageId: info.messageId, recipient: to }, 'Email sent successfully.');
        return true;
    } catch (error) {
        logger.error({ err: error, recipient: to }, 'Error sending email:');
        return false;
    }
};

// Send notification with template
export const sendTemplatedEmail = async (templateId, userData, recipientEmail) => {
    logger.info({ templateId, recipientEmail }, 'Sending templated email.');
    try {
        // Get the email template
        const template = await NotificationModel.getEmailTemplateById(templateId);
        if (!template) {
            throw new Error(`Email template not found: ${templateId}`);
        }
        
        // Replace placeholders in the template
        let subject = template.subject;
        let html = template.body_template;
        
        // Replace all {{placeholder}} with actual values from userData
        Object.keys(userData).forEach(key => {
            const regex = new RegExp(`{{${key}}}`, 'g');
            subject = subject.replace(regex, userData[key]);
            html = html.replace(regex, userData[key]);
        });
        
        // Send the email
        return await sendEmailNotification(recipientEmail, subject, html);
    } catch (error) {
        logger.error({ err: error, templateId, recipientEmail }, 'Error sending templated email:');
        return false;
    }
};

// Email template management
export const createEmailTemplate = async (name, subject, bodyTemplate, createdBy) => {
    logger.info({ name, createdBy }, 'Creating email template.');
    return await NotificationModel.createEmailTemplate(name, subject, bodyTemplate, createdBy);
};

export const getAllEmailTemplates = async () => {
    return await NotificationModel.getAllEmailTemplates();
};

export const getEmailTemplateById = async (id) => {
    return await NotificationModel.getEmailTemplateById(id);
};

export const updateEmailTemplate = async (id, name, subject, bodyTemplate) => {
    logger.info({ id, name }, 'Updating email template.');
    return await NotificationModel.updateEmailTemplate(id, name, subject, bodyTemplate);
};

export const deleteEmailTemplate = async (id) => {
    logger.warn({ id }, 'Deleting email template.');
    return await NotificationModel.deleteEmailTemplate(id);
};
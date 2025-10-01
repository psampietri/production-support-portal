import { Router } from 'express';
import * as NotificationService from '../services/notificationService.js';

const router = Router();

// Get notifications for a user
router.get('/user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { limit, offset } = req.query;
        
        const notifications = await NotificationService.getUserNotifications(
            parseInt(userId),
            limit ? parseInt(limit) : 20,
            offset ? parseInt(offset) : 0
        );
        
        res.json(notifications);
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get unread count for a user
router.get('/user/:userId/unread', async (req, res) => {
    try {
        const { userId } = req.params;
        const count = await NotificationService.getUserUnreadCount(parseInt(userId));
        res.json({ count });
    } catch (error) {
        console.error('Error fetching unread count:', error);
        res.status(500).json({ error: error.message });
    }
});

// Create a new notification
router.post('/', async (req, res) => {
    try {
        const { userId, title, message, type, relatedEntityType, relatedEntityId } = req.body;
        
        if (!userId || !title || !message || !type) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        
        const notification = await NotificationService.createNotification(
            userId, title, message, type, relatedEntityType, relatedEntityId
        );
        
        res.status(201).json(notification);
    } catch (error) {
        console.error('Error creating notification:', error);
        res.status(500).json({ error: error.message });
    }
});

// Mark notification as read
router.put('/:notificationId/read', async (req, res) => {
    try {
        const { notificationId } = req.params;
        const { userId } = req.body;
        
        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }
        
        const notification = await NotificationService.markAsRead(parseInt(notificationId), parseInt(userId));
        
        if (!notification) {
            return res.status(404).json({ error: 'Notification not found or not owned by user' });
        }
        
        res.json(notification);
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({ error: error.message });
    }
});

// Mark all notifications as read for a user
router.put('/user/:userId/read-all', async (req, res) => {
    try {
        const { userId } = req.params;
        const notifications = await NotificationService.markAllAsRead(parseInt(userId));
        res.json(notifications);
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        res.status(500).json({ error: error.message });
    }
});

// Delete a notification
router.delete('/:notificationId', async (req, res) => {
    try {
        const { notificationId } = req.params;
        const { userId } = req.body;
        
        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }
        
        const notification = await NotificationService.deleteNotification(parseInt(notificationId), parseInt(userId));
        
        if (!notification) {
            return res.status(404).json({ error: 'Notification not found or not owned by user' });
        }
        
        res.json(notification);
    } catch (error) {
        console.error('Error deleting notification:', error);
        res.status(500).json({ error: error.message });
    }
});

// Send an email
router.post('/email', async (req, res) => {
    try {
        const { to, subject, html, cc, bcc } = req.body;
        
        if (!to || !subject || !html) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        
        const result = await NotificationService.sendEmailNotification(to, subject, html, cc, bcc);
        
        if (result) {
            res.json({ success: true, message: 'Email sent successfully' });
        } else {
            res.status(500).json({ success: false, message: 'Failed to send email' });
        }
    } catch (error) {
        console.error('Error sending email:', error);
        res.status(500).json({ error: error.message });
    }
});

// Send templated email
router.post('/email/template', async (req, res) => {
    try {
        const { templateId, userData, recipientEmail } = req.body;
        
        if (!templateId || !userData || !recipientEmail) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        
        const result = await NotificationService.sendTemplatedEmail(templateId, userData, recipientEmail);
        
        if (result) {
            res.json({ success: true, message: 'Email sent successfully' });
        } else {
            res.status(500).json({ success: false, message: 'Failed to send email' });
        }
    } catch (error) {
        console.error('Error sending templated email:', error);
        res.status(500).json({ error: error.message });
    }
});

// Email template endpoints
router.post('/email/templates', async (req, res) => {
    try {
        const { name, subject, bodyTemplate, createdBy } = req.body;
        
        if (!name || !subject || !bodyTemplate || !createdBy) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        
        const template = await NotificationService.createEmailTemplate(name, subject, bodyTemplate, createdBy);
        res.status(201).json(template);
    } catch (error) {
        console.error('Error creating email template:', error);
        res.status(500).json({ error: error.message });
    }
});

router.get('/email/templates', async (req, res) => {
    try {
        const templates = await NotificationService.getAllEmailTemplates();
        res.json(templates);
    } catch (error) {
        console.error('Error fetching email templates:', error);
        res.status(500).json({ error: error.message });
    }
});

router.get('/email/templates/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const template = await NotificationService.getEmailTemplateById(parseInt(id));
        
        if (!template) {
            return res.status(404).json({ error: 'Email template not found' });
        }
        
        res.json(template);
    } catch (error) {
        console.error('Error fetching email template:', error);
        res.status(500).json({ error: error.message });
    }
});

router.put('/email/templates/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, subject, bodyTemplate } = req.body;
        
        if (!name || !subject || !bodyTemplate) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        
        const template = await NotificationService.updateEmailTemplate(parseInt(id), name, subject, bodyTemplate);
        
        if (!template) {
            return res.status(404).json({ error: 'Email template not found' });
        }
        
        res.json(template);
    } catch (error) {
        console.error('Error updating email template:', error);
        res.status(500).json({ error: error.message });
    }
});

router.delete('/email/templates/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const template = await NotificationService.deleteEmailTemplate(parseInt(id));
        
        if (!template) {
            return res.status(404).json({ error: 'Email template not found' });
        }
        
        res.json(template);
    } catch (error) {
        console.error('Error deleting email template:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
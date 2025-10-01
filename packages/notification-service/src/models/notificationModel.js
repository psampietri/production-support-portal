import { pool } from '../../../database/client.js'

export const createNotification = async (userId, title, message, type, relatedEntityType = null, relatedEntityId = null) => {
    const { rows } = await pool.query(
        `INSERT INTO notifications (user_id, title, message, type, related_entity_type, related_entity_id) 
         VALUES ($1, $2, $3, $4, $5, $6) 
         RETURNING *`,
        [userId, title, message, type, relatedEntityType, relatedEntityId]
    );
    return rows[0];
};

export const getUserNotifications = async (userId, limit = 20, offset = 0) => {
    const { rows } = await pool.query(
        `SELECT * FROM notifications 
         WHERE user_id = $1 
         ORDER BY created_at DESC
         LIMIT $2 OFFSET $3`,
        [userId, limit, offset]
    );
    return rows;
};

export const getUserUnreadCount = async (userId) => {
    const { rows } = await pool.query(
        `SELECT COUNT(*) as count FROM notifications 
         WHERE user_id = $1 AND is_read = false`,
        [userId]
    );
    return parseInt(rows[0].count);
};

export const markAsRead = async (notificationId, userId) => {
    const { rows } = await pool.query(
        `UPDATE notifications 
         SET is_read = true 
         WHERE id = $1 AND user_id = $2
         RETURNING *`,
        [notificationId, userId]
    );
    return rows[0];
};

export const markAllAsRead = async (userId) => {
    const { rows } = await pool.query(
        `UPDATE notifications 
         SET is_read = true 
         WHERE user_id = $1 AND is_read = false
         RETURNING *`,
        [userId]
    );
    return rows;
};

export const deleteNotification = async (notificationId, userId) => {
    const { rows } = await pool.query(
        `DELETE FROM notifications 
         WHERE id = $1 AND user_id = $2
         RETURNING *`,
        [notificationId, userId]
    );
    return rows[0];
};

// Email template management
export const createEmailTemplate = async (name, subject, bodyTemplate, createdBy) => {
    const { rows } = await pool.query(
        `INSERT INTO email_templates (name, subject, body_template, created_by) 
         VALUES ($1, $2, $3, $4) 
         RETURNING *`,
        [name, subject, bodyTemplate, createdBy]
    );
    return rows[0];
};

export const getAllEmailTemplates = async () => {
    const { rows } = await pool.query('SELECT * FROM email_templates ORDER BY name');
    return rows;
};

export const getEmailTemplateById = async (id) => {
    const { rows } = await pool.query('SELECT * FROM email_templates WHERE id = $1', [id]);
    return rows[0];
};

export const updateEmailTemplate = async (id, name, subject, bodyTemplate) => {
    const { rows } = await pool.query(
        `UPDATE email_templates 
         SET name = $2, subject = $3, body_template = $4, updated_at = CURRENT_TIMESTAMP
         WHERE id = $1
         RETURNING *`,
        [id, name, subject, bodyTemplate]
    );
    return rows[0];
};

export const deleteEmailTemplate = async (id) => {
    const { rows } = await pool.query('DELETE FROM email_templates WHERE id = $1 RETURNING *', [id]);
    return rows[0];
};
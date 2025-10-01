// backend/database/auditLogger.js
import pool from './client.js';

/**
 * Log an audit event
 * @param {Object} logData - The log data
 * @param {number} logData.userId - The ID of the user who performed the action
 * @param {string} logData.action - The action performed (e.g., 'create', 'update', 'delete')
 * @param {string} logData.entityType - The type of entity affected (e.g., 'user', 'template')
 * @param {number} logData.entityId - The ID of the entity affected
 * @param {Object} logData.details - Additional details about the action
 * @param {string} logData.ipAddress - The IP address of the user
 * @param {string} logData.userAgent - The user agent of the user
 * @returns {Promise<Object>} The created audit log record
 */
export const logAuditEvent = async (logData) => {
    const {
        userId,
        action,
        entityType,
        entityId,
        details,
        ipAddress,
        userAgent
    } = logData;

    try {
        const { rows } = await pool.query(
            `INSERT INTO audit_logs (
                user_id, action, entity_type, entity_id, details, ip_address, user_agent
            ) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [userId, action, entityType, entityId, details, ipAddress, userAgent]
        );
        
        return rows[0];
    } catch (error) {
        console.error('Error logging audit event:', error);
        // Just log the error but don't throw, to avoid disrupting the main flow
    }
};

/**
 * Get audit logs with filters
 * @param {Object} filters - The filters to apply
 * @param {number} filters.userId - Filter by user ID
 * @param {string} filters.action - Filter by action
 * @param {string} filters.entityType - Filter by entity type
 * @param {number} filters.entityId - Filter by entity ID
 * @param {string} filters.dateFrom - Filter by date from (ISO string)
 * @param {string} filters.dateTo - Filter by date to (ISO string)
 * @param {number} limit - The maximum number of records to return
 * @param {number} offset - The offset for pagination
 * @returns {Promise<Array>} The audit logs that match the filters
 */
export const getAuditLogs = async (filters = {}, limit = 100, offset = 0) => {
    const conditions = [];
    const values = [];
    
    if (filters.userId) {
        conditions.push(`user_id = $${values.length + 1}`);
        values.push(filters.userId);
    }
    
    if (filters.action) {
        conditions.push(`action = $${values.length + 1}`);
        values.push(filters.action);
    }
    
    if (filters.entityType) {
        conditions.push(`entity_type = $${values.length + 1}`);
        values.push(filters.entityType);
    }
    
    if (filters.entityId) {
        conditions.push(`entity_id = $${values.length + 1}`);
        values.push(filters.entityId);
    }
    
    if (filters.dateFrom) {
        conditions.push(`created_at >= $${values.length + 1}`);
        values.push(filters.dateFrom);
    }
    
    if (filters.dateTo) {
        conditions.push(`created_at <= $${values.length + 1}`);
        values.push(filters.dateTo);
    }
    
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    
    values.push(limit);
    values.push(offset);
    
    const { rows } = await pool.query(
        `SELECT al.*, u.name as user_name
         FROM audit_logs al
         LEFT JOIN users u ON al.user_id = u.id
         ${whereClause}
         ORDER BY al.created_at DESC
         LIMIT $${values.length - 1} OFFSET $${values.length}`,
        values
    );
    
    return rows;
};

export default { logAuditEvent, getAuditLogs };
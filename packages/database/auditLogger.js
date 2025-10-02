import prisma from './client.js';

/**
 * Log an audit event
 * @param {Object} logData - The log data
 * @param {number} logData.userId - The ID of the user who performed the action
 * @param {string} logData.action - The action performed (e.g., 'create', 'update', 'delete')
 * @param {string} logData.entityType - The type of entity being affected
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
        const auditLog = await prisma.auditLog.create({
            data: {
                user_id: userId,
                action,
                entity_type: entityType,
                entity_id: entityId,
                details,
                ip_address: ipAddress,
                user_agent: userAgent,
            },
        });
        
        return auditLog;
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
    const where = {};

    if (filters.userId) where.user_id = filters.userId;
    if (filters.action) where.action = filters.action;
    if (filters.entityType) where.entity_type = filters.entityType;
    if (filters.entityId) where.entity_id = filters.entityId;
    if (filters.dateFrom) where.created_at = { ...where.created_at, gte: new Date(filters.dateFrom) };
    if (filters.dateTo) where.created_at = { ...where.created_at, lte: new Date(filters.dateTo) };

    const logs = await prisma.auditLog.findMany({
        where,
        include: {
            user: {
                select: {
                    name: true,
                },
            },
        },
        orderBy: {
            created_at: 'desc',
        },
        take: limit,
        skip: offset,
    });

    return logs.map(log => ({
        ...log,
        user_name: log.user ? log.user.name : null,
    }));
};

export default { logAuditEvent, getAuditLogs };
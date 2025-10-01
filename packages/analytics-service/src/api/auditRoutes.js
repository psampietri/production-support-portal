import { Router } from 'express';
import { getAuditLogs } from '../../../database/auditLogger.js';

const router = Router();

// Get audit logs with filters
router.get('/', async (req, res) => {
    try {
        const { 
            userId, action, entityType, entityId, dateFrom, dateTo, 
            limit = 100, offset = 0 
        } = req.query;
        
        const filters = {};
        
        if (userId) filters.userId = parseInt(userId);
        if (action) filters.action = action;
        if (entityType) filters.entityType = entityType;
        if (entityId) filters.entityId = parseInt(entityId);
        if (dateFrom) filters.dateFrom = dateFrom;
        if (dateTo) filters.dateTo = dateTo;
        
        const logs = await getAuditLogs(
            filters,
            parseInt(limit),
            parseInt(offset)
        );
        
        res.json(logs);
    } catch (error) {
        console.error('Error fetching audit logs:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
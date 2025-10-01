import { logAuditEvent } from 'database/auditLogger.js';
import jwt from 'jsonwebtoken';

/**
 * Middleware to log audit events for specific routes
 * @param {Object} options - Configuration options
 * @param {string} options.action - The action being performed
 * @param {string} options.entityType - The type of entity being affected
 * @param {Function} options.getEntityId - Function to extract entity ID from request
 * @param {Function} options.getDetails - Function to extract details from request
 */
export const auditLogger = (options) => {
    return async (req, res, next) => {
        // Store the original end function
        const originalEnd = res.end;
        
        // Override the end function
        res.end = function(...args) {
            // Only log successful operations
            if (res.statusCode >= 200 && res.statusCode < 300) {
                try {
                    // Extract user ID from JWT token
                    const authHeader = req.headers['authorization'];
                    const token = authHeader && authHeader.split(' ')[1];
                    let userId = null;
                    
                    if (token) {
                        try {
                            const decoded = jwt.verify(token, process.env.SECRET_KEY);
                            userId = decoded.id;
                        } catch (err) {
                            console.error('Invalid token in audit log:', err);
                        }
                    }
                    
                    // Get entity ID and details
                    const entityId = options.getEntityId ? options.getEntityId(req) : null;
                    const details = options.getDetails ? options.getDetails(req, res) : null;
                    
                    // Log the audit event
                    logAuditEvent({
                        userId,
                        action: options.action,
                        entityType: options.entityType,
                        entityId,
                        details,
                        ipAddress: req.ip,
                        userAgent: req.headers['user-agent']
                    });
                } catch (error) {
                    console.error('Error in audit logging middleware:', error);
                }
            }
            
            // Call the original end function
            originalEnd.apply(res, args);
        };
        
        next();
    };
};

export default auditLogger;
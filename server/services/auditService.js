

class AuditService {
    constructor(auditLogModel) {
        this.auditLogModel = auditLogModel;
    }

    async logAction(actionData) {
        try {
            const auditLogData = {
                user_id: actionData.user_id,
                username: actionData.username || null, // Store username for display
                action_type: actionData.action, // Map 'action' to 'action_type' for database
                entity_type: actionData.entity_type || null,
                entity_id: actionData.entity_id || null,
                details: actionData.details ? JSON.stringify(actionData.details) : null,
                ip_address: actionData.ip_address || null,
                user_agent: actionData.user_agent || null,
                timestamp: new Date().toISOString()
            };

            // Create the audit log entry
            const auditLog = await this.auditLogModel.create(auditLogData);

            return auditLog;
        } catch (error) {
            console.error('[AuditService] Error logging action:', error);
            // Don't throw the error to prevent breaking the main functionality
            return null;
        }
    }

    async getEntityAuditLogs(entityType, entityId) {
        try {
            const filters = {
                entity_type: entityType,
                entity_id: entityId
            };

            const auditLogs = await this.auditLogModel.findAll(filters, '', null, 0);
            return auditLogs.rows || [];
        } catch (error) {
            console.error('[AuditService] Error fetching audit logs:', error);
            return [];
        }
    }

    async getUserAuditLogs(userId, limit = 50) {
        try {
            const filters = {
                user_id: userId
            };

            const auditLogs = await this.auditLogModel.findAll(filters, '', limit, 0);
            return auditLogs.rows || [];
        } catch (error) {
            console.error('[AuditService] Error fetching user audit logs:', error);
            return [];
        }
    }
}

module.exports = AuditService;

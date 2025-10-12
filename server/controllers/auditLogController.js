

module.exports = (auditLogModel) => {

    const getAuditLogs = async (req, res, next) => {
        try {
            // Extract filter parameters from the request query
            const filters = {
                user_id: req.query.user_id,
                action_type: req.query.action_type,
                entity_type: req.query.entity_type,
                entity_id: req.query.entity_id,
                start_date: req.query.start_date,
                end_date: req.query.end_date,
            };
            // Extract search query, defaulting to an empty string if not provided
            const search = req.query.search || '';
            // Parse limit and offset for pagination, ensuring they are integers or null/0
            const limit = parseInt(req.query.limit, 10) || null; // null means no limit
            const offset = parseInt(req.query.offset, 10) || 0; // 0 means start from the beginning

            // The model is expected to return an object containing 'rows' (the logs) and 'totalCount'.
            const { rows: auditLogs, totalCount } = await auditLogModel.findAll(filters, search, limit, offset);

            // CRITICAL FIX: Ensure auditLogs is an array before trying to access .length
            const actualAuditLogsCount = Array.isArray(auditLogs) ? auditLogs.length : 0;

            // Respond with the fetched audit logs and the total count for pagination
            res.status(200).json({ auditLogs, totalCount });

        } catch (error) {
            // Log the error and pass it to the next middleware (error handler)
            console.error('[AuditLogController] Error fetching audit logs:', error.message, error.stack);
            next(error);
        }
    };

    const getAuditLogById = async (req, res, next) => {
        try {
            const { id } = req.params;

            const auditLog = await auditLogModel.findById(id);

            if (!auditLog) {

                return res.status(404).json({ message: 'Audit log not found' });
            }

            res.status(200).json(auditLog);

        } catch (error) {
            // Log the error and pass it to the next middleware (error handler)
            console.error(`[AuditLogController] Error fetching audit log by ID ${req.params.id}:`, error.message, error.stack);
            next(error);
        }
    };

    // Return the controller methods
    return {
        getAuditLogs,
        getAuditLogById,
    };
};

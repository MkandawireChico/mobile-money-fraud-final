const express = require('express');

module.exports = (auditLogController, protect, authorize) => {
    const router = express.Router();

    const checkAdminRole = authorize(['admin']);

    router.use(protect);

    router.get('/', checkAdminRole, auditLogController.getAuditLogs);
    router.get('/:id', checkAdminRole, auditLogController.getAuditLogById);

    return router;
};

const express = require('express');

module.exports = (systemController, protect, authorize) => {
    const router = express.Router();

    // This ensures that only authenticated users can access any system endpoints.
    router.use(protect);

    router.get(
        '/health',
        authorize(['admin', 'analyst', 'viewer']),
        systemController.getSystemHealth
    );

    return router;
};
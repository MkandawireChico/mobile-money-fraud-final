const express = require('express');

module.exports = (settingsController, protect, authorize) => {
    const router = express.Router();

    const checkAdminAnalystRole = authorize(['admin', 'analyst']);
    const checkAdminRole = authorize(['admin']);

    router.get('/', protect, checkAdminRole, settingsController.getAllSettings);
    router.get('/:category', protect, checkAdminRole, settingsController.getSettingsByCategory);
    router.put('/:category', protect, checkAdminRole, settingsController.updateSettings);

    return router;
};

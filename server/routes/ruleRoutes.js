const express = require('express');

module.exports = (ruleController, protect, authorize) => {
    const router = express.Router();

    const checkAdminRole = authorize(['admin']);
    const checkAdminAnalystRole = authorize(['admin', 'analyst']);

    router.use(protect);

    router.get('/', checkAdminRole, ruleController.getRules);
    router.get('/:id', checkAdminRole, ruleController.getRuleById);
    router.post('/', checkAdminRole, ruleController.createRule);
    router.put('/:id', checkAdminRole, ruleController.updateRule);
    router.delete('/:id', checkAdminRole, ruleController.deleteRule);
    router.patch('/:id/status', checkAdminRole, ruleController.toggleRuleStatus);

    return router;
};

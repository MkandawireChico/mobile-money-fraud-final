

const ruleController = (ruleModel, auditLogModel) => {

    const getRules = async (req, res, next) => {
        try {
            const { rule_type, severity, status, search } = req.query;
            const filters = { rule_type, severity, status };
            const limit = parseInt(req.query.limit, 10) || null; // Default to null if not provided or invalid
            const offset = parseInt(req.query.offset, 10) || 0; // Default to 0 if not provided or invalid

            // Fetch rules and total count from the rule model
            const { rows: rules, totalCount } = await ruleModel.findAll(filters, search, limit, offset);

            // Log audit event for viewing rules
            if (req.user) {
                await auditLogModel.create({
                    user_id: req.user.id,
                    username: req.user.username,
                    action_type: 'VIEW_RULES',
                    entity_type: 'Rule',
                    entity_id: null, // No specific entity ID for listing
                    description: `User ${req.user.username} viewed the list of fraud rules.`,
                    details: { filters, search, limit, offset, retrieved_count: rules.length, total_count: totalCount }
                });

            } else {
                console.warn('[RuleController] Audit log for viewing rules skipped: req.user is undefined.');
            }

            res.status(200).json({ rules, totalCount });
        } catch (error) {
            console.error('[RuleController] Error fetching rules:', error.message, error.stack);
            next(error);
        }
    };

    const getRuleById = async (req, res, next) => {
        try {
            const { id } = req.params;

            const rule = await ruleModel.findById(id);

            if (!rule) {

                return res.status(404).json({ message: 'Rule not found.' });
            }

            // Log audit event for viewing specific rule details
            if (req.user) {
                await auditLogModel.create({
                    user_id: req.user.id,
                    username: req.user.username,
                    action_type: 'VIEW_RULE_DETAILS',
                    entity_type: 'Rule',
                    entity_id: rule.id,
                    description: `User ${req.user.username} viewed details for rule ID: ${id} (${rule.rule_name}).`,
                    details: { rule_name: rule.rule_name, rule_type: rule.rule_type, severity: rule.severity, status: rule.status }
                });

            } else {
                console.warn('[RuleController] Audit log for viewing rule details skipped: req.user is undefined.');
            }

            res.status(200).json(rule);
        } catch (error) {
            console.error(`[RuleController] Error fetching rule by ID ${req.params.id}:`, error.message, error.stack);
            next(error);
        }
    };

    const createRule = async (req, res, next) => {
        const { rule_name, description, rule_type, criteria, severity, status, action_type } = req.body;

        if (!rule_name || !rule_type || !criteria || !severity) {
            return res.status(400).json({ message: 'Rule name, type, criteria, and severity are required.' });
        }
        // Validate that criteria is a valid JSON object
        if (typeof criteria !== 'object' || criteria === null || Array.isArray(criteria)) {
            return res.status(400).json({ message: 'Criteria must be a valid JSON object.' });
        }

        try {
            // Check if a rule with the same name already exists to ensure uniqueness
            const existingRuleCheck = await ruleModel.findByName(rule_name); // Assuming findByName exists or findAll with rule_name filter
            if (existingRuleCheck) { // If a rule with this name is found
                return res.status(409).json({ message: 'Rule with this name already exists.' });
            }

            // Create the new rule in the database
            const newRule = await ruleModel.create({
                rule_name,
                description,
                rule_type,
                criteria,
                action_type: action_type || 'flag', // Default action_type to 'flag'
                severity,
                status: status || 'active', // Default status to 'active'
                created_by: req.user.id, // Set creator from authenticated user
                last_modified_by: req.user.id // Set last modifier as creator initially
            });

            // Log audit event for rule creation
            if (req.user) {
                await auditLogModel.create({
                    user_id: req.user.id,
                    username: req.user.username,
                    action_type: 'CREATE_RULE',
                    entity_type: 'Rule',
                    entity_id: newRule.id,
                    description: `Admin ${req.user.username} created new rule: ${newRule.rule_name} (${newRule.rule_type}).`,
                    details: { rule_id: newRule.id, rule_name: newRule.rule_name, rule_type: newRule.rule_type, severity: newRule.severity, status: newRule.status }
                });

            } else {
                console.warn('[RuleController] Audit log for creating rule skipped: req.user is undefined.');
            }

            res.status(201).json({ message: 'Rule created successfully', rule: newRule });
        } catch (error) {
            console.error('[RuleController] Error creating rule:', error.message, error.stack);
            next(error);
        }
    };

    const updateRule = async (req, res, next) => {
        const { id } = req.params;
        const updateData = req.body;

        try {
            const existingRule = await ruleModel.findById(id);
            if (!existingRule) {

                return res.status(404).json({ message: 'Rule not found.' });
            }

            // If rule_name is being updated, check for uniqueness against other rules
            if (updateData.rule_name && updateData.rule_name !== existingRule.rule_name) {
                const existingWithName = await ruleModel.findByName(updateData.rule_name); // Assuming findByName exists
                if (existingWithName && existingWithName.id !== id) { // Ensure it's a different rule
                    return res.status(409).json({ message: 'Another rule with this name already exists.' });
                }
            }

            // Ensure criteria is handled as a valid JSON object if provided
            if (updateData.criteria !== undefined && (typeof updateData.criteria !== 'object' || updateData.criteria === null || Array.isArray(updateData.criteria))) {
                return res.status(400).json({ message: 'Criteria must be a valid JSON object if provided.' });
            }

            // Set the last_modified_by to the current authenticated user's ID
            updateData.last_modified_by = req.user.id;

            const updatedRule = await ruleModel.update(id, updateData);

            if (!updatedRule) {
                // This case means the rule was found, but the update operation in the model
                // did not result in any changes (e.g., all provided data was identical to existing).
                const auditUsername = req.user?.username || 'System/Unknown User';
                const auditUserId = req.user?.id || 'system';
                await auditLogModel.create({
                    user_id: auditUserId,
                    username: auditUsername,
                    action_type: 'ATTEMPTED_RULE_UPDATE_NO_CHANGE',
                    entity_type: 'Rule',
                    entity_id: existingRule.id,
                    description: `Admin ${auditUsername} attempted to update rule ${existingRule.rule_name} (${existingRule.id}), but no changes were applied (data was identical).`,
                    details: { update_data: updateData, current_state: existingRule }
                });

                return res.status(200).json({ message: 'Rule found, but no changes were applied.', rule: existingRule });
            }

            // Log audit event for rule update
            if (req.user) {
                await auditLogModel.create({
                    user_id: req.user.id,
                    username: req.user.username,
                    action_type: 'UPDATE_RULE',
                    entity_type: 'Rule',
                    entity_id: updatedRule.id,
                    description: `Admin ${req.user.username} updated rule: ${updatedRule.rule_name} (${updatedRule.id}).`,
                    details: { updated_fields: Object.keys(updateData), previous_rule_state: existingRule, new_rule_state: updatedRule }
                });

            } else {
                console.warn('[RuleController] Audit log for updating rule skipped: req.user is undefined.');
            }

            res.status(200).json({ message: 'Rule updated successfully', rule: updatedRule });
        } catch (error) {
            console.error(`[RuleController] Error updating rule ID ${id}:`, error.message, error.stack);
            next(error);
        }
    };

    const deleteRule = async (req, res, next) => {
        const { id } = req.params;
        try {
            const existingRule = await ruleModel.findById(id);
            if (!existingRule) {

                return res.status(404).json({ message: 'Rule not found.' });
            }

            const deleted = await ruleModel.del(id); // Assuming 'del' is the delete method

            if (deleted) {
                // Log audit event for rule deletion
                if (req.user) {
                    await auditLogModel.create({
                        user_id: req.user.id,
                        username: req.user.username,
                        action_type: 'DELETE_RULE',
                        entity_type: 'Rule',
                        entity_id: existingRule.id,
                        description: `Admin ${req.user.username} deleted rule: ${existingRule.rule_name} (${existingRule.id}).`,
                        details: { deleted_rule_name: existingRule.rule_name, deleted_rule_id: existingRule.id, previous_rule_state: existingRule }
                    });

                } else {
                    console.warn('[RuleController] Audit log for deleting rule skipped: req.user is undefined.');
                }
                res.status(200).json({ message: 'Rule deleted successfully.' });
            } else {
                // This case might occur if the rule was found but the delete operation
                // somehow didn't affect any rows (e.g., race condition, or DB issue).

                res.status(404).json({ message: 'Rule not found or could not be deleted.' });
            }
        } catch (error) {
            console.error(`[RuleController] Error deleting rule ID ${id}:`, error.message, error.stack);
            next(error);
        }
    };

    const toggleRuleStatus = async (req, res, next) => {
        const { id } = req.params;
        const { status } = req.body; // Expected: 'active', 'inactive', or 'draft'

        try {
            // Validate the provided status
            if (!['active', 'inactive', 'draft'].includes(status)) {
                return res.status(400).json({ message: 'Invalid status provided. Must be "active", "inactive", or "draft".' });
            }

            const existingRule = await ruleModel.findById(id);
            if (!existingRule) {

                return res.status(404).json({ message: 'Rule not found.' });
            }

            // If the rule is already in the requested status, report no change
            if (existingRule.status === status) {
                const auditUsername = req.user?.username || 'System/Unknown User';
                const auditUserId = req.user?.id || 'system';
                await auditLogModel.create({
                    user_id: auditUserId,
                    username: auditUsername,
                    action_type: 'ATTEMPTED_RULE_STATUS_CHANGE_NO_CHANGE',
                    entity_type: 'Rule',
                    entity_id: existingRule.id,
                    description: `Admin ${auditUsername} attempted to change status of rule ${existingRule.rule_name} (${existingRule.id}) to ${status}, but it was already that status.`,
                    details: { requested_status: status, current_status: existingRule.status }
                });

                return res.status(200).json({ message: `Rule status is already ${status}.`, rule: existingRule });
            }

            // Update the rule's status and set last_modified_by
            const updatedRule = await ruleModel.update(id, { status, last_modified_by: req.user.id });

            // Log audit event for toggling rule status
            if (req.user) {
                await auditLogModel.create({
                    user_id: req.user.id,
                    username: req.user.username,
                    action_type: 'TOGGLE_RULE_STATUS',
                    entity_type: 'Rule',
                    entity_id: updatedRule.id,
                    description: `Admin ${req.user.username} changed status of rule ${updatedRule.rule_name} (${updatedRule.id}) from ${existingRule.status} to ${updatedRule.status}.`,
                    details: { previous_status: existingRule.status, new_status: updatedRule.status, rule_id: updatedRule.id, rule_name: updatedRule.rule_name }
                });

            } else {
                console.warn('[RuleController] Audit log for toggling rule status skipped: req.user is undefined.');
            }

            res.status(200).json({ message: 'Rule status updated successfully', rule: updatedRule });
        } catch (error) {
            console.error(`[RuleController] Error toggling rule status for ID ${id}:`, error.message, error.stack);
            next(error);
        }
    };

    // Return all controller methods
    return {
        getRules,
        getRuleById,
        createRule,
        updateRule,
        deleteRule,
        toggleRuleStatus,
    };
};

module.exports = ruleController;

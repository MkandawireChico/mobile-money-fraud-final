

const settingsController = (settingModel, auditLogModel) => {

    const getAllSettings = async (req, res, next) => {
        try {

            const settings = await settingModel.getAllSettings();

            // Log audit event for viewing all settings
            if (req.user) {
                await auditLogModel.create({
                    user_id: req.user.id,
                    username: req.user.username,
                    action_type: 'VIEW_ALL_SETTINGS',
                    entity_type: 'Setting',
                    entity_id: null, // No specific entity ID for listing all settings
                    description: `User ${req.user.username} viewed all application settings.`,
                    details: {} // No specific details needed for a general view
                });

            } else {
                console.warn('[SettingsController] Audit log for viewing all settings skipped: req.user is undefined.');
            }

            res.status(200).json(settings);
        } catch (error) {
            console.error('[SettingsController] Error fetching all settings:', error.message, error.stack);
            next(error);
        }
    };

    const getSettingsByCategory = async (req, res, next) => {
        try {
            const { category } = req.params;

            const settings = await settingModel.getSetting(category); // Assuming getSetting returns the settings object for the category

            // If no settings found for the category, return an empty object (200 OK)
            // This is crucial for the frontend to initialize properly without errors,
            // treating absence of settings as an empty configuration for that category.
            if (!settings) {

                return res.status(200).json({});
            }

            // Log audit event for viewing settings by category
            if (req.user) {
                await auditLogModel.create({
                    user_id: req.user.id,
                    username: req.user.username,
                    action_type: 'VIEW_CATEGORY_SETTINGS',
                    entity_type: 'Setting',
                    entity_id: category, // Use category as entity_id for specific settings
                    description: `User ${req.user.username} viewed settings for category: ${category}.`,
                    details: { category }
                });

            } else {
                console.warn('[SettingsController] Audit log for viewing category settings skipped: req.user is undefined.');
            }

            res.status(200).json(settings);
        } catch (error) {
            console.error(`[SettingsController] Error fetching settings for category ${req.params.category}:`, error.message, error.stack);
            next(error);
        }
    };

    const updateSettings = async (req, res, next) => {
        try {
            const { category } = req.params;
            const updatedData = req.body;

            // Validate if updatedData is a non-null object
            if (typeof updatedData !== 'object' || updatedData === null || Array.isArray(updatedData)) {
                return res.status(400).json({ message: 'Invalid data format provided for settings update. Expected a JSON object.' });
            }

            // Ensure the user is authenticated to perform this action
            if (!req.user || !req.user.id) {
                return res.status(401).json({ message: 'Authentication required to update settings.' });
            }

            console.log(`[SettingsController] User ${req.user.username} attempting to update settings for category: ${category} with data:`, updatedData);

            // Fetch existing settings to log previous state in audit log
            const existingSettings = await settingModel.getSetting(category);

            // Perform the update operation via the setting model
            const success = await settingModel.updateSetting(category, updatedData);

            if (success) {
                // Log audit event for successful settings update
                await auditLogModel.create({
                    user_id: req.user.id,
                    username: req.user.username,
                    action_type: 'UPDATE_SETTINGS',
                    entity_type: 'Setting',
                    entity_id: category,
                    description: `Admin ${req.user.username} updated settings for category: ${category}.`,
                    details: {
                        category,
                        previous_values: existingSettings || {}, // Log previous state, default to empty object if none
                        new_values: updatedData
                    }
                });

                res.status(200).json({ message: `${category} settings updated successfully!` });
            } else {
                // This case might mean the category was not found, or the update query
                // did not result in any changes (e.g., provided data was identical).
                // It's better to return 200 OK with a message if no actual change but operation was valid.
                // Or 404 if the category genuinely doesn't exist.
                // Assuming `updateSetting` returns false if category not found or no rows affected.
                console.warn(`[SettingsController] Settings category '${category}' not found or no changes applied by ${req.user.username}.`);
                res.status(404).json({ message: `Settings category '${category}' not found or no changes applied.` });
            }
        } catch (error) {
            console.error(`[SettingsController] Error updating settings for category ${req.params.category}:`, error.message, error.stack);
            next(error);
        }
    };

    // Return all controller methods
    return {
        getAllSettings,
        getSettingsByCategory,
        updateSettings,
    };
};

module.exports = settingsController;

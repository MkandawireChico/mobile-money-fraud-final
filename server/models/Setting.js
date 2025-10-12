

class Setting {

    constructor(pool) {
        this.pool = pool;
    }

    async getSetting(category) {
        try {

            const query = 'SELECT data FROM app_settings WHERE category = $1;';
            const { rows } = await this.pool.query(query, [category]);

            if (rows.length > 0) {

                // Return the 'data' JSON object directly, as pg will parse JSONB automatically
                return rows[0].data;
            }

            return null; // Return null if no setting found for the category
        } catch (error) {
            console.error(`[SettingModel] Error fetching setting for category '${category}':`, error.message, error.stack);
            throw new Error(`Failed to fetch setting for category '${category}': ${error.message}`);
        }
    }

    async getAllSettings() {
        try {

            const query = 'SELECT category, data FROM app_settings;';
            const { rows } = await this.pool.query(query);

            // Transform rows into an object where keys are categories for easy access
            const settings = {};
            rows.forEach(row => {
                settings[row.category] = row.data;
            });

            return settings;
        } catch (error) {
            console.error('[SettingModel] Error fetching all settings:', error.message, error.stack);
            throw new Error(`Failed to fetch all settings: ${error.message}`);
        }
    }

    async updateSetting(category, newData) {
        try {
            // Validate newData to ensure it's a valid object before stringifying
            if (typeof newData !== 'object' || newData === null || Array.isArray(newData)) {
                throw new Error('Invalid data format provided for settings update. Expected a non-null JSON object.');
            }

            // Stringify the newData object to be stored as JSONB
            const dataJson = JSON.stringify(newData);

            // Use ON CONFLICT DO UPDATE for an UPSERT operation
            const query = `
                INSERT INTO app_settings (category, data, created_at, updated_at)
                VALUES ($1, $2::jsonb, NOW(), NOW())
                ON CONFLICT (category) DO UPDATE
                SET data = EXCLUDED.data, updated_at = NOW()
                RETURNING *;
            `;
            const values = [category, dataJson];

            const result = await this.pool.query(query, values);

            // Check if any row was affected (inserted or updated)
            if (result.rowCount > 0) {

                return true;
            }
            console.warn(`[SettingModel] Setting for category '${category}' not updated/inserted. Row count was 0.`);
            return false;
        } catch (error) {
            console.error(`[SettingModel] Error updating setting for category '${category}':`, error.message, error.stack);
            throw new Error(`Failed to update setting for category '${category}': ${error.message}`);
        }
    }

    async initializeDefaultSettings() {
        try {
            const countQuery = 'SELECT COUNT(*)::int AS count FROM app_settings;';
            const { rows } = await this.pool.query(countQuery);
            const currentSettingsCount = rows[0].count;

            if (currentSettingsCount === 0) {

                const defaultSettings = [
                    {
                        category: 'general',
                        data: {
                            app_name: 'Fraud Detection System',
                            timezone: 'Africa/Blantyre',
                            default_currency: 'MWK'
                        }
                    },
                    {
                        category: 'security',
                        data: {
                            password_policy_enabled: true,
                            min_password_length: 8,
                            password_requires_uppercase: true,
                            password_requires_lowercase: true,
                            password_requires_digit: true,
                            password_requires_symbol: false,
                            account_lockout_enabled: true,
                            max_login_attempts: 5,
                            lockout_duration_minutes: 30,
                            ip_whitelist_enabled: false,
                            whitelisted_ips: []
                        }
                    },
                    {
                        category: 'alert',
                        data: {
                            enabled: true,
                            notification_channels: ['email'],
                            email_recipients: ['admin@example.com'],
                            webhook_url: '',
                            alert_escalation_enabled: true,
                            max_open_alerts_per_user: 5,
                            min_risk_score: 70,
                            escalation_threshold: 24
                        }
                    },
                    {
                        category: 'data',
                        data: {
                            retention_policy_enabled: true,
                            transaction_retention_days: 365,
                            alert_retention_days: 180,
                            audit_log_retention_days: 90,
                            data_export_formats: ['CSV', 'JSON']
                        }
                    },
                    {
                        category: 'integration',
                        data: {
                            ml_service_enabled: false,
                            ml_service_url: 'http://localhost:8000/ml-service',
                            ml_threshold: 0.75,
                            sms_gateway_enabled: false,
                            sms_gateway_api_key: '',
                            sms_gateway_url: ''
                        }
                    },
                    {
                        category: 'notification',
                        data: {
                            email_alerts_enabled: true,
                            sms_alerts_enabled: false,
                            webhook_enabled: false,
                            notification_channels: ['email'],
                            email_recipients: ['admin@example.com'],
                            webhook_url: '',
                            template_type: 'email',
                            preview_message: 'Default test message',
                            recipient_email: 'test@example.com',
                            recipient_phone: ''
                        }
                    },
                    {
                        category: 'rule',
                        data: {
                            rule_engine_enabled: true,
                            auto_block_suspicious_transactions: true,
                            // Rules themselves are managed via /api/rules, but this top-level setting holds engine status
                            // The 'settings' array here seems redundant if rules are in their own table.
                            // Keeping it as an empty array for backward compatibility if needed, but it's not used for actual rules.
                            settings: []
                        }
                    },
                    {
                        category: 'webhook',
                        data: {
                            webhook_url: 'https://example.com/default-webhook',
                            webhook_secret: 'default-secret'
                        }
                    }
                ];

                // Insert each default setting. Using ON CONFLICT DO NOTHING ensures idempotence
                // if multiple instances try to initialize concurrently.
                for (const setting of defaultSettings) {
                    const query = `
                        INSERT INTO app_settings (category, data, created_at, updated_at)
                        VALUES ($1, $2::jsonb, NOW(), NOW())
                        ON CONFLICT (category) DO NOTHING;
                    `;
                    // Ensure the data object is stringified for JSONB column
                    await this.pool.query(query, [setting.category, JSON.stringify(setting.data)]);
                }

            } else {

            }
        } catch (error) {
            console.error('[SettingModel] Error initializing default settings:', error.message, error.stack);
            throw new Error(`Failed to initialize default settings: ${error.message}`);
        }
    }
}

module.exports = Setting;

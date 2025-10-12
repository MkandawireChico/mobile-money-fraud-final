// client/src/components/settings/AlertSettings.tsx
import React, { useState, useEffect } from 'react';
// import axios from '../../api/axios.ts'; // Removed: axios is not directly used in this component

interface AlertSettingsData {
    enabled: boolean;
    notification_channels: string[];
    email_recipients: string[];
    webhook_url: string;
    alert_escalation_enabled: boolean;
    max_open_alerts_per_user: number;
    min_risk_score: number;
    escalation_threshold: number;
}

interface AlertSettingsProps {
    settings: AlertSettingsData | null;
    onSave: (values: AlertSettingsData) => Promise<void>;
    isReadOnly: boolean;
}

const AlertSettings: React.FC<AlertSettingsProps> = ({ settings: initialSettings, onSave, isReadOnly }) => {
    const [settings, setSettings] = useState<AlertSettingsData | null>(initialSettings);
    const [loading, setLoading] = useState<boolean>(true);
    const [saving, setSaving] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (initialSettings) {
            setSettings(initialSettings);
            setLoading(false);
        } else {
            setLoading(true); // Keep loading true until initialSettings are provided
        }
    }, [initialSettings]);

    const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | { name?: string; value: unknown }>) => {
        if (isReadOnly) return;

        const target = event.target as HTMLInputElement;
        const { name, value, type, checked } = target;

        if (settings) {
            setSettings(prev => ({
                ...prev!,
                [name || '']: type === 'checkbox' ? checked : value,
            }));
        }
    };

    const handleChannelChange = (event: React.ChangeEvent<{ value: unknown }>) => {
        if (isReadOnly) return;

        if (settings) {
            setSettings(prev => ({
                ...prev!,
                notification_channels: event.target.value as string[],
            }));
        }
    };

    const handleSave = async () => {
        if (isReadOnly) return;

        if (!settings) return;

        // Validation check for risk score and escalation threshold
        if (settings.min_risk_score < 0 || settings.min_risk_score > 100) {
            setError('Minimum risk score must be between 0 and 100.');
            return;
        }
        if (settings.escalation_threshold < 1) {
            setError('Escalation threshold must be at least 1.');
            return;
        }

        setSaving(true);
        setError(null);

        try {
            await onSave(settings);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to save alert settings.');
        } finally {
            setSaving(false);
        }
    };

    // Alert preview for user feedback
    const alertPreview = [
        settings?.enabled && 'Alerting Enabled',
        settings?.notification_channels.length > 0 && `Channels: ${settings.notification_channels.join(', ')}`,
        settings?.email_recipients.length > 0 && `Email Recipients: ${settings.email_recipients.join(', ')}`,
        settings?.webhook_url && `Webhook URL: ${settings.webhook_url}`,
        settings?.min_risk_score && `Min Risk Score: ${settings.min_risk_score}`,
        settings?.escalation_threshold && `Escalation Threshold: ${settings.escalation_threshold} alerts`,
    ].filter(Boolean).join(', ');

    if (loading || settings === null) {
        return (
            <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg mb-6 flex flex-col items-center justify-center min-h-[200px]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-500 dark:border-blue-400"></div>
                <p className="mt-4 text-lg text-gray-700 dark:text-gray-300">Loading alert settings...</p>
            </div>
        );
    }

    return (
        <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Alerting Configuration</h2>
            {error && (
                <div className="mb-4 p-4 text-red-700 bg-red-100 dark:bg-red-900 dark:text-red-100 rounded-lg border border-red-200 dark:border-red-700" role="alert">
                    <p>{error}</p>
                </div>
            )}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <div className="col-span-full">
                    <label className="flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            checked={settings.enabled}
                            onChange={handleChange}
                            name="enabled"
                            className="mr-3 h-5 w-5 rounded form-checkbox text-blue-600 dark:text-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400 transition duration-150 ease-in-out"
                            disabled={isReadOnly}
                        />
                        <span className="text-lg font-medium text-gray-800 dark:text-gray-200">Enable Alerting</span>
                    </label>
                </div>

                <div>
                    <label htmlFor="notification-channels" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Notification Channels</label>
                    <select
                        id="notification-channels"
                        multiple
                        value={settings.notification_channels || []}
                        onChange={handleChannelChange}
                        className="mt-1 block w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg text-base text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:text-gray-500 transition duration-150 ease-in-out"
                        disabled={isReadOnly}
                    >
                        {['email', 'webhook', 'sms'].map((channel) => (
                            <option key={channel} value={channel}>
                                {channel.charAt(0).toUpperCase() + channel.slice(1)}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label htmlFor="email-recipients" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email Recipients (comma-separated)</label>
                    <input
                        id="email-recipients"
                        type="text"
                        name="email_recipients"
                        value={settings.email_recipients.join(', ')}
                        onChange={(e) => {
                            if (!isReadOnly) {
                                setSettings(prev => ({
                                    ...prev!,
                                    email_recipients: e.target.value.split(',').map(email => email.trim()),
                                }));
                            }
                        }}
                        className="mt-1 block w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg text-base text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:text-gray-500 transition duration-150 ease-in-out"
                        disabled={!settings.notification_channels.includes('email') || isReadOnly}
                        placeholder="e.g., user1@example.com, user2@example.com"
                    />
                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Enter email addresses separated by commas.</p>
                </div>

                <div>
                    <label htmlFor="webhook-url" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Webhook URL</label>
                    <input
                        id="webhook-url"
                        type="text"
                        name="webhook_url"
                        value={settings.webhook_url}
                        onChange={handleChange}
                        className="mt-1 block w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg text-base text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:text-gray-500 transition duration-150 ease-in-out"
                        disabled={!settings.notification_channels.includes('webhook') || isReadOnly}
                        placeholder="e.g., https://your-webhook-endpoint.com"
                    />
                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">The endpoint where webhook notifications will be sent.</p>
                </div>

                <div>
                    <label htmlFor="min-risk-score" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Minimum Risk Score for Alert (0-100)</label>
                    <input
                        id="min-risk-score"
                        type="number"
                        name="min_risk_score"
                        value={settings.min_risk_score}
                        onChange={handleChange}
                        className="mt-1 block w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg text-base text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:text-gray-500 transition duration-150 ease-in-out"
                        min="0"
                        max="100"
                        disabled={isReadOnly}
                    />
                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Alerts will only be generated for transactions with risk scores above this value.</p>
                </div>

                <div>
                    <label htmlFor="escalation-threshold" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Escalation Threshold (alerts)</label>
                    <input
                        id="escalation-threshold"
                        type="number"
                        name="escalation_threshold"
                        value={settings.escalation_threshold}
                        onChange={handleChange}
                        className="mt-1 block w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg text-base text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:text-gray-500 transition duration-150 ease-in-out"
                        min="1"
                        disabled={isReadOnly}
                    />
                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Number of alerts before an alert is escalated (e.g., to a higher priority team).</p>
                </div>
            </div>

            <div className="mt-8 flex justify-end">
                <button
                    onClick={handleSave}
                    disabled={saving || isReadOnly}
                    className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-400 dark:bg-blue-700 dark:hover:bg-blue-600 dark:disabled:bg-blue-800 transition-colors duration-200 text-lg"
                >
                    {saving ? (
                        <>
                            <span className="mr-3">Saving...</span>
                            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-white"></div>
                        </>
                    ) : (
                        'Save Settings'
                    )}
                </button>
            </div>

            {alertPreview && (
                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900 rounded-lg text-sm text-blue-700 dark:text-blue-200 border border-blue-200 dark:border-blue-700">
                    <p className="font-semibold mb-1">Current Alert Settings Summary:</p>
                    <p>{alertPreview}</p>
                </div>
            )}
        </div>
    );
};

export default AlertSettings;

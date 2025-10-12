// client/src/components/settings/NotificationSettings.tsx
import React from 'react';

interface NotificationSettingsProps {
    settings: {
        email_alerts_enabled?: boolean;
        sms_alerts_enabled?: boolean;
        webhook_enabled?: boolean;
        notification_channels?: string[];
        email_recipients?: string;
        webhook_url?: string;
    };
    onSettingsChange: (newValues: NotificationSettingsProps['settings']) => void;
    isReadOnly: boolean;
}

const NotificationSettings: React.FC<NotificationSettingsProps> = ({ settings, onSettingsChange, isReadOnly }) => {
    const handleCheckboxChange = (field: keyof NotificationSettingsProps['settings']) => (event: React.ChangeEvent<HTMLInputElement>) => {
        if (isReadOnly) return;
        onSettingsChange({ [field]: event.target.checked });
    };

    const handleChange = (field: keyof NotificationSettingsProps['settings']) => (event: React.ChangeEvent<HTMLInputElement>) => {
        if (isReadOnly) return;
        onSettingsChange({ [field]: event.target.value });
    };

    // Validation and preview for email recipients
    const validateEmailRecipients = (emails: string) => {
        if (!emails) return true;
        const emailList = emails.split(',').map(email => email.trim());
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailList.every(email => emailRegex.test(email));
    };

    const notificationPreview = [
        settings.email_alerts_enabled && 'Email Alerts Enabled',
        settings.email_recipients && `Recipients: ${settings.email_recipients}`,
        settings.sms_alerts_enabled && 'SMS Alerts Enabled',
        settings.webhook_url && `Webhook URL: ${settings.webhook_url}`,
    ].filter(Boolean).join(', ');

    return (
        <div className="p-3 bg-white rounded-lg shadow-md mb-3">
            <h2 className="text-xl font-semibold mb-2">Notification Settings</h2>
            <hr className="mb-2 border-gray-300" />
            <div className="grid gap-3">
                <div>
                    <label className="flex items-center">
                        <input
                            type="checkbox"
                            checked={settings.email_alerts_enabled || false}
                            onChange={handleCheckboxChange('email_alerts_enabled')}
                            className="mr-2 form-checkbox text-blue-600"
                            disabled={isReadOnly}
                        />
                        <span className="text-sm text-gray-700">Enable Email Alerts</span>
                    </label>
                </div>
                <div>
                    <label htmlFor="email-recipients" className="block text-sm font-medium text-gray-700">Email Recipients (comma-separated)</label>
                    <input
                        id="email-recipients"
                        type="text"
                        value={settings.email_recipients || ''}
                        onChange={handleChange('email_recipients')}
                        className="mt-1 block w-full p-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-200 disabled:text-gray-500"
                        disabled={!settings.email_alerts_enabled || isReadOnly}
                        placeholder="e.g., admin@example.com, security@example.com"
                    />
                    <p className={`mt-1 text-xs ${!validateEmailRecipients(settings.email_recipients || '') && settings.email_alerts_enabled ? 'text-red-500' : 'text-gray-500'}`}>
                        {!validateEmailRecipients(settings.email_recipients || '') && settings.email_alerts_enabled ? 'Invalid email format detected.' : 'Emails to send alerts to (e.g., admin@example.com, security@example.com)'}
                    </p>
                </div>
                <div>
                    <label className="flex items-center">
                        <input
                            type="checkbox"
                            checked={settings.sms_alerts_enabled || false}
                            onChange={handleCheckboxChange('sms_alerts_enabled')}
                            className="mr-2 form-checkbox text-blue-600"
                            disabled={isReadOnly}
                        />
                        <span className="text-sm text-gray-700">Enable SMS Alerts</span>
                    </label>
                </div>
                <div>
                    <label htmlFor="webhook-url" className="block text-sm font-medium text-gray-700">Default Webhook URL</label>
                    <input
                        id="webhook-url"
                        type="text"
                        value={settings.webhook_url || ''}
                        onChange={handleChange('webhook_url')}
                        className="mt-1 block w-full p-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-200 disabled:text-gray-500"
                        disabled={isReadOnly}
                        placeholder="e.g., https://api.example.com/webhook"
                    />
                    <p className="mt-1 text-xs text-gray-500">The default webhook URL for sending notifications (if webhooks enabled globally)</p>
                </div>
            </div>

            {notificationPreview && (
                <div className="mt-2 p-2 bg-gray-100 rounded text-sm text-gray-700">
                    <p>Preview: {notificationPreview}</p>
                </div>
            )}
        </div>
    );
};

export default NotificationSettings;
// client/src/components/settings/IntegrationSettings.tsx
import React, { useState, useEffect } from 'react';
// import axios from '../../api/axios.ts'; // Removed: axios is not directly used in this component
import { HelpCircle, Loader2 } from 'lucide-react'; // Added Loader2 for saving state

interface IntegrationSettingsData {
    ml_service_enabled?: boolean;
    ml_service_url?: string;
    ml_threshold?: number;
    sms_gateway_enabled?: boolean;
    sms_gateway_api_key?: string;
    sms_gateway_url?: string;
}

interface IntegrationSettingsProps {
    settings: IntegrationSettingsData;
    onSettingsChange: (newValues: any) => void; // This prop is not used in the component's logic
    onSave: (values: IntegrationSettingsData) => Promise<void>;
    isReadOnly: boolean;
}

const IntegrationSettings: React.FC<IntegrationSettingsProps> = ({
    settings: initialSettings,
    onSettingsChange, // Declared but not explicitly used in the component's logic
    onSave,
    isReadOnly
}) => {
    const [settings, setSettings] = useState<IntegrationSettingsData>(initialSettings);
    const [saving, setSaving] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setSettings(initialSettings);
    }, [initialSettings]);

    const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | { name?: string; value: unknown }>) => {
        if (isReadOnly) return;

        const target = event.target as HTMLInputElement;
        const { name, value, type, checked } = target;

        setSettings(prev => ({
            ...prev!,
            [name || '']: type === 'checkbox' ? checked : value,
        }));
        // onSettingsChange is commented out as it's not being actively used or defined in parent (causing warning before)
        // If needed by parent, consider dispatching update in onSave after successful API call
        // onSettingsChange({ [name || '']: type === 'checkbox' ? checked : value });
    };

    const handleSave = async () => {
        if (isReadOnly) return;

        // Validation check
        if (settings.ml_service_enabled && (!settings.ml_service_url || settings.ml_threshold === undefined || settings.ml_threshold < 0 || settings.ml_threshold > 1)) {
            setError('Invalid ML settings: URL and threshold (0-1) are required.');
            return;
        }
        if (settings.sms_gateway_enabled && (!settings.sms_gateway_api_key || !settings.sms_gateway_url)) {
            setError('Invalid SMS settings: API key and URL are required.');
            return;
        }

        // IMPORTANT: window.confirm should be replaced with a custom modal/dialog UI.
        // As per instructions, avoid using window.confirm/alert.
        // For now, we proceed directly, assuming a custom modal would handle user confirmation.
        // if (!await showCustomConfirmDialog('Are you sure you want to save these integration settings? This action cannot be undone.')) {
        //     return;
        // }

        setSaving(true);
        setError(null);
        try {
            await onSave(settings);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to save integration settings.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center">
                Integration Settings
                <span className="ml-3">
                    <button
                        className="p-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full transition-colors duration-200"
                        aria-label="help"
                    >
                        <HelpCircle size={20} />
                    </button>
                </span>
            </h2>
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
                            checked={settings.ml_service_enabled || false}
                            onChange={handleChange}
                            name="ml_service_enabled"
                            className="mr-3 h-5 w-5 rounded form-checkbox text-blue-600 dark:text-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400 transition duration-150 ease-in-out"
                            disabled={isReadOnly}
                        />
                        <span className="text-lg font-medium text-gray-800 dark:text-gray-200">Enable ML Fraud Detection Service</span>
                    </label>
                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 ml-8">Integrate with an external Machine Learning service for fraud scoring.</p>
                </div>

                {settings.ml_service_enabled && (
                    <>
                        <div>
                            <label htmlFor="ml-service-url" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">ML Service URL</label>
                            <input
                                id="ml-service-url"
                                type="text"
                                name="ml_service_url"
                                value={settings.ml_service_url || ''}
                                onChange={handleChange}
                                className="mt-1 block w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg text-base text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:text-gray-500 transition duration-150 ease-in-out"
                                disabled={isReadOnly}
                                placeholder="e.g., https://your-ml-service.com/predict"
                            />
                            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Endpoint for the Machine Learning fraud detection service.</p>
                        </div>
                        <div>
                            <label htmlFor="ml-threshold" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">ML Threshold (0-1)</label>
                            <input
                                id="ml-threshold"
                                type="number"
                                name="ml_threshold"
                                value={settings.ml_threshold || ''}
                                onChange={handleChange}
                                className="mt-1 block w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg text-base text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:text-gray-500 transition duration-150 ease-in-out"
                                min="0"
                                max="1"
                                step="0.01"
                                disabled={isReadOnly}
                                placeholder="e.g., 0.75"
                            />
                            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Transactions with ML score above this threshold will be flagged.</p>
                        </div>
                    </>
                )}

                <div className="col-span-full">
                    <label className="flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            checked={settings.sms_gateway_enabled || false}
                            onChange={handleChange}
                            name="sms_gateway_enabled"
                            className="mr-3 h-5 w-5 rounded form-checkbox text-blue-600 dark:text-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400 transition duration-150 ease-in-out"
                            disabled={isReadOnly}
                        />
                        <span className="text-lg font-medium text-gray-800 dark:text-gray-200">Enable SMS Gateway</span>
                    </label>
                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 ml-8">Allow sending SMS notifications via an external gateway.</p>
                </div>

                {settings.sms_gateway_enabled && (
                    <>
                        <div>
                            <label htmlFor="sms-gateway-api-key" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">SMS Gateway API Key</label>
                            <input
                                id="sms-gateway-api-key"
                                type="text"
                                name="sms_gateway_api_key"
                                value={settings.sms_gateway_api_key || ''}
                                onChange={handleChange}
                                className="mt-1 block w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg text-base text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:text-gray-500 transition duration-150 ease-in-out"
                                disabled={isReadOnly}
                                placeholder="e.g., your_sms_api_key_123"
                            />
                            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">API key for authentication with the SMS gateway.</p>
                        </div>
                        <div>
                            <label htmlFor="sms-gateway-url" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">SMS Gateway URL</label>
                            <input
                                id="sms-gateway-url"
                                type="text"
                                name="sms_gateway_url"
                                value={settings.sms_gateway_url || ''}
                                onChange={handleChange}
                                className="mt-1 block w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg text-base text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:text-gray-500 transition duration-150 ease-in-out"
                                disabled={isReadOnly}
                                placeholder="e.g., https://api.smsservice.com"
                            />
                            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Endpoint for the SMS gateway service.</p>
                        </div>
                    </>
                )}
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
                            <Loader2 size={20} className="animate-spin" />
                        </>
                    ) : (
                        'Save Settings'
                    )}
                </button>
            </div>
        </div>
    );
};

export default IntegrationSettings;

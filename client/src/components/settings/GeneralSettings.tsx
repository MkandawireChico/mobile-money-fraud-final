// client/src/components/settings/GeneralSettings.tsx
import React, { useState, useEffect } from 'react';
// import axios from '../../api/axios.ts'; // Removed: axios is not directly used in this component
import { HelpCircle, Loader2 } from 'lucide-react'; // Added Loader2 for loading state

interface GeneralSettingsData {
    app_name?: string;
    timezone?: string;
    default_currency?: string;
    system_name?: string;
    enable_two_factor_auth?: boolean;
    session_timeout_minutes?: number;
}

interface GeneralSettingsProps {
    onSettingsChange: (newValues: any) => void; // This prop is not used in the component's logic
    settings: GeneralSettingsData;
    onSave: (values: GeneralSettingsData) => Promise<void>;
    isReadOnly: boolean;
}

const GeneralSettings: React.FC<GeneralSettingsProps> = ({ settings: initialSettings, onSave, isReadOnly }) => {
    const [settings, setSettings] = useState<GeneralSettingsData | null>(initialSettings);
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

    const handleSave = async () => {
        if (isReadOnly || !settings) return;

        // Validation check for session timeout
        if (settings.session_timeout_minutes !== undefined && (settings.session_timeout_minutes < 5 || settings.session_timeout_minutes > 120)) {
            setError('Session timeout must be between 5 and 120 minutes.');
            return;
        }

        setSaving(true);
        setError(null);

        try {
            await onSave(settings);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to save general settings.');
        } finally {
            setSaving(false);
        }
    };

    // Settings preview for user feedback
    const settingsPreview = [
        settings?.system_name && `System Name: ${settings.system_name}`,
        settings?.default_currency && `Default Currency: ${settings.default_currency}`,
        settings?.timezone && `Timezone: ${settings.timezone}`,
        settings?.enable_two_factor_auth && '2FA Enabled',
        settings?.session_timeout_minutes && `Session Timeout: ${settings.session_timeout_minutes} mins`,
    ].filter(Boolean).join(', ');

    if (loading || settings === null) {
        return (
            <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg mb-6 flex flex-col items-center justify-center min-h-[200px]">
                <Loader2 size={60} className="animate-spin text-blue-500 dark:text-blue-400 mb-4" />
                <p className="mt-4 text-lg text-gray-700 dark:text-gray-300">Loading general settings...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {error && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg" role="alert">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm font-medium text-red-800 dark:text-red-200">{error}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* System Identity Section */}
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-gray-800/50 dark:to-gray-700/50 rounded-xl p-6 border border-emerald-100 dark:border-gray-600 shadow-sm">
                <div className="flex items-center mb-6">
                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900 dark:to-teal-900 rounded-xl flex items-center justify-center mr-4 shadow-sm">
                        <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">System Identity</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Configure your system's basic information and branding</p>
                    </div>
                </div>
                
                <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="system-name" className="block text-sm font-bold text-gray-900 dark:text-gray-100 mb-2">
                                System Name
                            </label>
                            <input
                                id="system-name"
                                type="text"
                                name="system_name"
                                value={settings.system_name || ''}
                                onChange={handleChange}
                                className="block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:focus:ring-emerald-400 disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:text-gray-500 transition-all duration-200 shadow-sm hover:shadow-md"
                                disabled={isReadOnly}
                                placeholder="e.g., FraudGuard Pro"
                            />
                            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                                The display name for your fraud detection system
                            </p>
                        </div>

                        <div>
                            <label htmlFor="default-currency" className="block text-sm font-bold text-gray-900 dark:text-gray-100 mb-2">
                                Default Currency
                            </label>
                            <select
                                id="default-currency"
                                name="default_currency"
                                value={settings.default_currency || 'MWK'}
                                onChange={handleChange}
                                className="block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:focus:ring-emerald-400 disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:text-gray-500 transition-all duration-200 shadow-sm hover:shadow-md"
                                disabled={isReadOnly}
                            >
                                <option value="MWK">Malawian Kwacha (MWK)</option>
                                <option value="USD">US Dollar (USD)</option>
                                <option value="EUR">Euro (EUR)</option>
                                <option value="GBP">British Pound (GBP)</option>
                            </select>
                            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                                Primary currency for transaction displays and reports
                            </p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label htmlFor="timezone" className="block text-sm font-bold text-gray-900 dark:text-gray-100 mb-2">
                                System Timezone
                            </label>
                            <select
                                id="timezone"
                                name="timezone"
                                value={settings.timezone || 'Africa/Blantyre'}
                                onChange={handleChange}
                                className="block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:focus:ring-emerald-400 disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:text-gray-500 transition-all duration-200 shadow-sm hover:shadow-md"
                                disabled={isReadOnly}
                            >
                                <option value="Africa/Blantyre">Africa/Blantyre (CAT)</option>
                                <option value="Africa/Lilongwe">Africa/Lilongwe (CAT)</option>
                                <option value="UTC">UTC (Coordinated Universal Time)</option>
                            </select>
                            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                                All timestamps and date calculations will use this timezone
                            </p>
                        </div>

                        <div>
                            <label htmlFor="session-timeout" className="block text-sm font-bold text-gray-900 dark:text-gray-100 mb-2">
                                Session Timeout (minutes)
                            </label>
                            <input
                                id="session-timeout"
                                type="number"
                                name="session_timeout_minutes"
                                value={settings.session_timeout_minutes || ''}
                                onChange={handleChange}
                                className="block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:focus:ring-emerald-400 disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:text-gray-500 transition-all duration-200 shadow-sm hover:shadow-md"
                                min="5"
                                max="120"
                                disabled={isReadOnly}
                                placeholder="30"
                            />
                            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                                Users will be automatically logged out after this period of inactivity (5-120 minutes)
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Security Features Section */}
            <div className="bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-gray-800/50 dark:to-gray-700/50 rounded-xl p-6 border border-teal-100 dark:border-gray-600 shadow-sm">
                <div className="flex items-center mb-6">
                    <div className="w-10 h-10 bg-gradient-to-br from-teal-100 to-emerald-100 dark:from-teal-900 dark:to-emerald-900 rounded-xl flex items-center justify-center mr-4 shadow-sm">
                        <svg className="w-5 h-5 text-teal-600 dark:text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Security Features</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Configure system-wide security and authentication settings</p>
                    </div>
                </div>
                
                <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                        <div className="flex items-center h-5">
                            <input
                                type="checkbox"
                                checked={settings.enable_two_factor_auth || false}
                                onChange={handleChange}
                                name="enable_two_factor_auth"
                                className="w-5 h-5 text-emerald-600 bg-gray-100 border-gray-300 rounded-md focus:ring-emerald-500 dark:focus:ring-emerald-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 disabled:opacity-50 transition-colors duration-200"
                                disabled={isReadOnly}
                            />
                        </div>
                        <div className="text-sm">
                            <label className="font-semibold text-gray-900 dark:text-gray-100">
                                Enable Two-Factor Authentication (2FA)
                            </label>
                            <p className="text-gray-600 dark:text-gray-300 mt-1">
                                Globally enables 2FA capability for all user accounts. Individual users still need to configure their own 2FA settings.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GeneralSettings;

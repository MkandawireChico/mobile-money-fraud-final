// client/src/components/settings/SecuritySettings.tsx
import React, { useState, useEffect } from 'react';
// import axios from '../../api/axios.ts'; // Removed: axios is not directly used in this component
import { HelpCircle, Loader2 } from 'lucide-react'; // CheckCircle and XCircle were unused, added Loader2 for saving state

interface SecuritySettingsData {
    password_policy_enabled: boolean;
    min_password_length: number;
    password_requires_uppercase: boolean;
    password_requires_lowercase: boolean;
    password_requires_digit: boolean;
    password_requires_symbol: boolean;
    account_lockout_enabled: boolean;
    max_login_attempts: number;
    lockout_duration_minutes: number;
    ip_whitelist_enabled: boolean;
    whitelisted_ips: string[];
    session_timeout_minutes?: number; // Not directly used in this component, but kept for interface consistency
}

interface SecuritySettingsProps {
    settings: SecuritySettingsData;
    onSettingsChange: (newValues: any) => void; // This prop is not used in the component's logic
    onSave: (values: SecuritySettingsData) => Promise<void>;
    currentUser: any; // Not directly used in this component, but kept for interface consistency
    isReadOnly: boolean;
}

const SecuritySettings: React.FC<SecuritySettingsProps> = ({ settings: initialSettings, onSave, isReadOnly }) => {
    const [settings, setSettings] = useState<SecuritySettingsData | null>(initialSettings);
    const [loading, setLoading] = useState<boolean>(true);
    const [saving, setSaving] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [tempWhitelistedIps, setTempWhitelistedIps] = useState<string>('');

    useEffect(() => {
        if (initialSettings) {
            setSettings(initialSettings);
            setTempWhitelistedIps(initialSettings.whitelisted_ips ? initialSettings.whitelisted_ips.join(', ') : '');
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

    const handleIpWhitelistChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        if (isReadOnly) return;

        const value = event.target.value;
        setTempWhitelistedIps(value);
        if (settings) {
            // Trim and filter out empty strings to ensure a clean array of IPs
            const ipsArray = value.split(',').map(ip => ip.trim()).filter(ip => ip !== '');
            setSettings(prev => ({
                ...prev!,
                whitelisted_ips: ipsArray,
            }));
        }
    };

    const handleSave = async () => {
        if (isReadOnly) return;

        if (!settings) return;

        // Add client-side validation for password policy and lockout settings
        if (settings.password_policy_enabled) {
            if (settings.min_password_length < 6 || settings.min_password_length > 32) {
                setError('Minimum password length must be between 6 and 32 characters.');
                return;
            }
        }
        if (settings.account_lockout_enabled) {
            if (settings.max_login_attempts < 1) {
                setError('Maximum login attempts must be at least 1.');
                return;
            }
            if (settings.lockout_duration_minutes < 1) {
                setError('Lockout duration must be at least 1 minute.');
                return;
            }
        }

        // IMPORTANT: window.confirm should be replaced with a custom modal/dialog UI.
        // As per instructions, avoid using window.confirm/alert.
        // For now, we proceed directly, assuming a custom modal would handle user confirmation.
        // if (!await showCustomConfirmDialog('Are you sure you want to save these security settings? This action cannot be undone.')) {
        //     return;
        // }

        setSaving(true);
        setError(null);

        try {
            await onSave(settings);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to save security settings.');
        } finally {
            setSaving(false);
        }
    };

    // Settings preview for user feedback
    const settingsPreview = [
        settings?.password_policy_enabled && 'Password Policy Enabled',
        settings?.min_password_length && `Min Password Length: ${settings.min_password_length}`,
        settings?.password_requires_uppercase && 'Requires Uppercase',
        settings?.password_requires_lowercase && 'Requires Lowercase',
        settings?.password_requires_digit && 'Requires Digit',
        settings?.password_requires_symbol && 'Requires Symbol',
        settings?.account_lockout_enabled && 'Account Lockout Enabled',
        settings?.max_login_attempts && `Max Login Attempts: ${settings.max_login_attempts}`,
        settings?.lockout_duration_minutes && `Lockout Duration: ${settings.lockout_duration_minutes} mins`,
        settings?.ip_whitelist_enabled && 'IP Whitelisting Enabled',
        settings?.whitelisted_ips && settings.whitelisted_ips.length > 0 && `Whitelisted IPs: ${settings.whitelisted_ips.join(', ')}`,
    ].filter(Boolean).join(', ');

    if (loading || settings === null) {
        return (
            <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg mb-6 flex flex-col items-center justify-center min-h-[200px]">
                <Loader2 size={60} className="animate-spin text-blue-500 dark:text-blue-400 mb-4" />
                <p className="mt-4 text-lg text-gray-700 dark:text-gray-300">Loading security settings...</p>
            </div>
        );
    }

    return (
        <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center">
                Security Configuration
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
                {/* Password Policy Section */}
                <div className="col-span-full border-b border-gray-200 dark:border-gray-700 pb-4 mb-4">
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Password Policy</h3>
                    <div className="ml-0 md:ml-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="col-span-full">
                            <label className="flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={settings.password_policy_enabled || false}
                                    onChange={handleChange}
                                    name="password_policy_enabled"
                                    className="mr-3 h-5 w-5 rounded form-checkbox text-blue-600 dark:text-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400 transition duration-150 ease-in-out"
                                    disabled={isReadOnly}
                                />
                                <span className="text-lg font-medium text-gray-800 dark:text-gray-200">Enable Password Policy</span>
                            </label>
                            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 ml-8">Enforce strong password requirements for all user accounts.</p>
                        </div>

                        <div>
                            <label htmlFor="min_password_length" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Minimum Length (6-32)</label>
                            <input
                                id="min_password_length"
                                type="number"
                                value={settings.min_password_length || ''}
                                onChange={handleChange}
                                name="min_password_length"
                                className="mt-1 block w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg text-base text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:text-gray-500 transition duration-150 ease-in-out"
                                min="6"
                                max="32"
                                disabled={!settings.password_policy_enabled || isReadOnly}
                                placeholder="e.g., 8"
                            />
                            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Minimum number of characters required for a password.</p>
                        </div>

                        <div className="col-span-2">
                            <div className="space-y-3">
                                <label className="flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={settings.password_requires_uppercase || false}
                                        onChange={handleChange}
                                        name="password_requires_uppercase"
                                        className="mr-3 h-5 w-5 rounded form-checkbox text-blue-600 dark:text-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400 transition duration-150 ease-in-out"
                                        disabled={!settings.password_policy_enabled || isReadOnly}
                                    />
                                    <span className="text-base text-gray-800 dark:text-gray-200">Require Uppercase Letter</span>
                                </label>
                                <label className="flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={settings.password_requires_lowercase || false}
                                        onChange={handleChange}
                                        name="password_requires_lowercase"
                                        className="mr-3 h-5 w-5 rounded form-checkbox text-blue-600 dark:text-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400 transition duration-150 ease-in-out"
                                        disabled={!settings.password_policy_enabled || isReadOnly}
                                    />
                                    <span className="text-base text-gray-800 dark:text-gray-200">Require Lowercase Letter</span>
                                </label>
                                <label className="flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={settings.password_requires_digit || false}
                                        onChange={handleChange}
                                        name="password_requires_digit"
                                        className="mr-3 h-5 w-5 rounded form-checkbox text-blue-600 dark:text-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400 transition duration-150 ease-in-out"
                                        disabled={!settings.password_policy_enabled || isReadOnly}
                                    />
                                    <span className="text-base text-gray-800 dark:text-gray-200">Require Digit (0-9)</span>
                                </label>
                                <label className="flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={settings.password_requires_symbol || false}
                                        onChange={handleChange}
                                        name="password_requires_symbol"
                                        className="mr-3 h-5 w-5 rounded form-checkbox text-blue-600 dark:text-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400 transition duration-150 ease-in-out"
                                        disabled={!settings.password_policy_enabled || isReadOnly}
                                    />
                                    <span className="text-base text-gray-800 dark:text-gray-200">Require Symbol (!@#$%^&*)</span>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Account Lockout Section */}
                <div className="col-span-full border-b border-gray-200 dark:border-gray-700 pb-4 mb-4">
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Account Lockout</h3>
                    <div className="ml-0 md:ml-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="col-span-full">
                            <label className="flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={settings.account_lockout_enabled || false}
                                    onChange={handleChange}
                                    name="account_lockout_enabled"
                                    className="mr-3 h-5 w-5 rounded form-checkbox text-blue-600 dark:text-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400 transition duration-150 ease-in-out"
                                    disabled={isReadOnly}
                                />
                                <span className="text-lg font-medium text-gray-800 dark:text-gray-200">Enable Account Lockout</span>
                            </label>
                            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 ml-8">Automatically lock user accounts after too many failed login attempts.</p>
                        </div>
                        <div>
                            <label htmlFor="max_login_attempts" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Max Login Attempts</label>
                            <input
                                id="max_login_attempts"
                                type="number"
                                value={settings.max_login_attempts || ''}
                                onChange={handleChange}
                                name="max_login_attempts"
                                className="mt-1 block w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg text-base text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:text-gray-500 transition duration-150 ease-in-out"
                                min="1"
                                disabled={!settings.account_lockout_enabled || isReadOnly}
                                placeholder="e.g., 5"
                            />
                            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Number of incorrect password attempts before an account is locked.</p>
                        </div>
                        <div>
                            <label htmlFor="lockout_duration_minutes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Lockout Duration (minutes)</label>
                            <input
                                id="lockout_duration_minutes"
                                type="number"
                                value={settings.lockout_duration_minutes || ''}
                                onChange={handleChange}
                                name="lockout_duration_minutes"
                                className="mt-1 block w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg text-base text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:text-gray-500 transition duration-150 ease-in-out"
                                min="1"
                                disabled={!settings.account_lockout_enabled || isReadOnly}
                                placeholder="e.g., 60"
                            />
                            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">How long a locked account remains inaccessible.</p>
                        </div>
                    </div>
                </div>

                {/* IP Whitelisting Section */}
                <div className="col-span-full pb-4">
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">IP Whitelisting</h3>
                    <div className="ml-0 md:ml-6 grid grid-cols-1 gap-4">
                        <div className="col-span-full">
                            <label className="flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={settings.ip_whitelist_enabled || false}
                                    onChange={handleChange}
                                    name="ip_whitelist_enabled"
                                    className="mr-3 h-5 w-5 rounded form-checkbox text-blue-600 dark:text-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400 transition duration-150 ease-in-out"
                                    disabled={isReadOnly}
                                />
                                <span className="text-lg font-medium text-gray-800 dark:text-gray-200">Enable IP Whitelisting</span>
                            </label>
                            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 ml-8">Restrict system access to a predefined list of IP addresses.</p>
                        </div>
                        <div>
                            <label htmlFor="whitelisted_ips" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Whitelisted IP Addresses (comma-separated)</label>
                            <textarea
                                id="whitelisted_ips"
                                value={tempWhitelistedIps}
                                onChange={handleIpWhitelistChange}
                                className="mt-1 block w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg text-base text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:text-gray-500 transition duration-150 ease-in-out"
                                rows={4}
                                disabled={!settings.ip_whitelist_enabled || isReadOnly}
                                placeholder="e.g., 192.168.1.1, 10.0.0.5, 203.0.113.45"
                            />
                            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Only users from these IP addresses will be allowed to access the system. Use commas to separate multiple IPs.</p>
                        </div>
                    </div>
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
                            <Loader2 size={20} className="animate-spin" />
                        </>
                    ) : (
                        'Save Settings'
                    )}
                </button>
            </div>

            {settingsPreview && (
                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900 rounded-lg text-sm text-blue-700 dark:text-blue-200 border border-blue-200 dark:border-blue-700">
                    <p className="font-semibold mb-1">Current Security Settings Summary:</p>
                    <p>{settingsPreview}</p>
                </div>
            )}
        </div>
    );
};

export default SecuritySettings;

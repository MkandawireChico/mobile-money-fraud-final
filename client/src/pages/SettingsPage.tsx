// client/src/pages/SettingsPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';

import {
    Settings as SettingsIcon,
    Save as SaveIcon,
    RefreshCw as RefreshIcon,
    CheckCircle as CheckCircleIcon,
    AlertCircle as ErrorOutlineIcon,
    Info as InfoIcon,
    AlertTriangle as WarningIcon,
    X as CloseIcon,
    Loader2,
} from 'lucide-react';
import clsx from 'clsx';

import { useAuth } from '../context/AuthContext.tsx';

import GeneralSettings from '../components/settings/GeneralSettings.tsx';
import SecuritySettings from '../components/settings/SecuritySettings.tsx';
import IntegrationSettings from '../components/settings/IntegrationSettings.tsx';
import NotificationSettings from '../components/settings/NotificationSettings.tsx';
import AlertSettings from '../components/settings/AlertSettings.tsx';
import DataSettings from '../components/settings/DataSettings.tsx';
import RuleSettings from '../components/settings/RuleSettings.tsx';
import WebhookSettings from '../components/settings/WebhookTest.tsx';
import NotificationPreview from '../components/settings/NotificationPreview.tsx'; // <--- THIS WAS THE MISSING IMPORT

import api from '../api/axios.ts';

interface AppSettings {
    general?: {
        app_name?: string;
        timezone?: string;
        default_currency?: string;
        system_name?: string;
        enable_two_factor_auth?: boolean;
        session_timeout_minutes?: number;
    };
    security?: {
        password_policy_enabled?: boolean;
        min_password_length?: number;
        account_lockout_enabled?: boolean;
        max_login_attempts?: number;
        password_requires_uppercase?: boolean;
        password_requires_lowercase?: boolean;
        password_requires_digit?: boolean;
        password_requires_symbol?: boolean;
        lockout_duration_minutes?: number;
        ip_whitelist_enabled?: boolean;
        whitelisted_ips?: string[];
    };
    alert?: {
        enabled?: boolean;
        alert_escalation_enabled?: boolean;
        max_open_alerts_per_user?: number;
        min_risk_score?: number;
        notification_channels?: string[];
        email_recipients?: string[];
        webhook_url?: string;
        escalation_threshold?: number;
    };
    data?: {
        retention_policy_enabled?: boolean;
        transaction_retention_days?: number;
        alert_retention_days?: number;
        audit_log_retention_days?: number;
        data_export_formats?: string[];
    };
    integration?: {
        ml_service_enabled?: boolean;
        ml_service_url?: string;
        ml_threshold?: number;
        sms_gateway_enabled?: boolean;
        sms_gateway_api_key?: string;
        sms_gateway_url?: string;
    };
    notification?: {
        email_alerts_enabled?: boolean;
        sms_alerts_enabled?: boolean;
        webhook_enabled?: boolean;
        notification_channels?: string[];
        email_recipients?: string | string[];
        webhook_url?: string;
        template_type?: string;
        preview_message?: string;
        recipient_email?: string;
        recipient_phone?: string;
    };
    rule?: {
        rule_engine_enabled?: boolean;
        auto_block_suspicious_transactions?: boolean;
    };
    webhook?: {
        webhook_url?: string;
        webhook_secret?: string;
    };
}

const SettingsPage: React.FC = () => {
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin';
    const isReadOnly = !isAdmin;

    const { tab } = useParams<{ tab?: string }>();
    const [currentTab, setCurrentTab] = useState<string>(tab || 'general');

    const [settings, setSettings] = useState<AppSettings | null>(null);
    const [originalSettings, setOriginalSettings] = useState<AppSettings | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [saving, setSaving] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);
    const [snackbarMessage, setSnackbarMessage] = useState<string>('');
    const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info' | 'warning'>('success');

    useEffect(() => {
        if (tab) {
            setCurrentTab(tab);
        }
    }, [tab]);

    const fetchSettings = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.get('/settings');
            const backendSettings = response.data;

            const normalizedSettings: AppSettings = {
                general: backendSettings.general || {},
                security: backendSettings.security || {},
                alert: backendSettings.alert || {},
                data: backendSettings.data || {},
                integration: backendSettings.integration || {},
                notification: backendSettings.notification || {},
                rule: backendSettings.rule || {},
                webhook: backendSettings.webhook || {},
            };

            if (normalizedSettings.security && !normalizedSettings.security.whitelisted_ips) {
                normalizedSettings.security.whitelisted_ips = [];
            }
            if (normalizedSettings.data && !normalizedSettings.data.data_export_formats) {
                normalizedSettings.data.data_export_formats = [];
            }

            if (!normalizedSettings.notification) normalizedSettings.notification = {};
            if (!normalizedSettings.notification.notification_channels) normalizedSettings.notification.notification_channels = [];
            if (Array.isArray(normalizedSettings.notification.email_recipients)) {
                normalizedSettings.notification.email_recipients = normalizedSettings.notification.email_recipients.join(', ');
            } else if (normalizedSettings.notification.email_recipients === undefined || normalizedSettings.notification.email_recipients === null) {
                normalizedSettings.notification.email_recipients = '';
            }

            if (!normalizedSettings.alert) normalizedSettings.alert = {};
            if (!normalizedSettings.alert.notification_channels) normalizedSettings.alert.notification_channels = [];
            if (!normalizedSettings.alert.email_recipients) {
                normalizedSettings.alert.email_recipients = [];
            }

            setSettings(normalizedSettings);
            setOriginalSettings(normalizedSettings);
            console.log('Settings fetched and normalized:', normalizedSettings);
        } catch (err: any) {
            console.error('Error fetching settings:', err.response?.data?.message || err.message);
            setError(err.response?.data?.message || 'Failed to load settings.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    const handleSettingChange = useCallback((category: keyof AppSettings, newValues: any) => {
        if (isReadOnly) return;

        setSettings(prev => {
            if (!prev) return null;

            let updatedValues = { ...newValues };

            if (category === 'notification' && typeof newValues.email_recipients === 'string') {
                updatedValues.email_recipients = newValues.email_recipients
                    .split(',')
                    .map((email: string) => email.trim())
                    .filter((email: string) => email !== '');
            }
            if (category === 'alert' && typeof newValues.email_recipients === 'string') {
                updatedValues.email_recipients = newValues.email_recipients
                    .split(',')
                    .map((email: string) => email.trim())
                    .filter((email: string) => email !== '');
            }

            return {
                ...prev,
                [category]: {
                    ...(prev[category] || {}),
                    ...updatedValues,
                },
            };
        });
    }, [isReadOnly]);

    const handleSaveSettings = async () => {
        if (isReadOnly || !settings) return;

        setSaving(true);
        setError(null);
        let errorMessages: string[] = [];
        let successfulSaves = 0;

        const categoriesToSave: (keyof AppSettings)[] = [
            'general', 'security', 'alert', 'data', 'integration', 'notification', 'rule', 'webhook'
        ];

        for (const category of categoriesToSave) {
            if (
                settings[category] &&
                originalSettings &&
                JSON.stringify(settings[category]) !== JSON.stringify(originalSettings[category])
            ) {
                try {
                    let payload = { ...settings[category] };
                    if (category === 'notification' && Array.isArray((payload as any).email_recipients)) {
                        (payload as any).email_recipients = (payload as any).email_recipients.join(', ');
                    }
                    if (category === 'alert' && Array.isArray((payload as any).email_recipients)) {
                        (payload as any).email_recipients = (payload as any).email_recipients.join(', ');
                    }

                    await api.put(`/settings/${category}`, payload);
                    successfulSaves++;
                } catch (err: any) {
                    console.error(`Error saving ${category} settings:`, err.response?.data?.message || err.message);
                    errorMessages.push(`Failed to save ${category} settings: ${err.response?.data?.message || err.message}`);
                }
            }
        }

        setSaving(false);

        if (errorMessages.length > 0) {
            setSnackbarSeverity('error');
            setSnackbarMessage(`Errors encountered: ${errorMessages.join('; ')}`);
            setSnackbarOpen(true);
            fetchSettings();
        } else {
            setSnackbarSeverity('success');
            setSnackbarMessage(`All settings saved successfully!`);
            setSnackbarOpen(true);
            fetchSettings();
        }
    };

    const handleSnackbarClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
        if (reason === 'clickaway') {
            return;
        }
        setSnackbarOpen(false);
    };

    const tabList = [
        { id: 'general', label: 'General', component: <GeneralSettings settings={settings?.general || {}} onSettingsChange={(newValues) => handleSettingChange('general', newValues)} onSave={handleSaveSettings} isReadOnly={isReadOnly} /> },
        { id: 'security', label: 'Security', component: <SecuritySettings settings={settings?.security || {} as any} onSettingsChange={(newValues) => handleSettingChange('security', newValues)} onSave={handleSaveSettings} currentUser={user} isReadOnly={isReadOnly} /> },
        { id: 'integration', label: 'Integration', component: <IntegrationSettings settings={settings?.integration || {}} onSettingsChange={(newValues) => handleSettingChange('integration', newValues)} onSave={handleSaveSettings} isReadOnly={isReadOnly} /> },
        { id: 'alert', label: 'Alerting', component: <AlertSettings settings={settings?.alert || {}} onSave={handleSaveSettings} isReadOnly={isReadOnly} /> },
        { id: 'data', label: 'Data', component: <DataSettings settings={settings?.data || {}} onSettingsChange={(newValues) => handleSettingChange('data', newValues)} onSave={handleSaveSettings} isReadOnly={isReadOnly} /> },
        { id: 'rule', label: 'Rule Engine', component: <RuleSettings settings={settings?.rule || {} as any} onSettingsChange={(newValues) => handleSettingChange('rule', newValues)} isReadOnly={isReadOnly} /> },
        { id: 'webhook', label: 'Webhooks', component: <WebhookSettings settings={settings?.webhook || {}} onSettingsChange={(newValues) => handleSettingChange('webhook', newValues)} onSave={handleSaveSettings} isReadOnly={isReadOnly} /> },
        { id: 'notification-preview', label: 'Notification Preview', component: <NotificationPreview settings={settings?.notification || {}} onSettingsChange={(newValues) => handleSettingChange('notification', newValues)} isReadOnly={isReadOnly} /> },
    ].filter(tabItem => {
        return true;
    });


    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
                <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg flex flex-col items-center justify-center">
                    <Loader2 size={60} className="animate-spin text-blue-500 dark:text-blue-400 mb-4" />
                    <p className="text-xl text-gray-700 dark:text-gray-300">
                        Loading settings...
                    </p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg text-red-600 dark:text-red-400 text-lg font-semibold flex items-center">
                    <ErrorOutlineIcon size={24} className="mr-3" /> Error: {error}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
            {/* Header */}
            <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900 dark:to-teal-900 rounded-xl shadow-sm">
                                <SettingsIcon size={28} className="text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                                    Settings
                                </h1>
                                <p className="text-sm text-gray-600 dark:text-gray-300">
                                    Manage your application configuration and preferences
                                </p>
                            </div>
                        </div>
                        {isReadOnly && (
                            <div className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900 dark:to-orange-900 rounded-full border border-amber-200 dark:border-amber-700 shadow-sm">
                                <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                                <span className="text-sm font-semibold text-amber-800 dark:text-amber-200">Read Only Mode</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Sidebar Navigation */}
                    <div className="lg:w-80 flex-shrink-0">
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                            <div className="p-6 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-gray-800 dark:to-gray-700 border-b border-emerald-100 dark:border-gray-600">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                                    Configuration
                                </h2>
                                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                                    Choose a category to configure
                                </p>
                            </div>
                            <nav className="p-3">
                                {tabList.map((tabItem, index) => (
                                    <button
                                        key={tabItem.id}
                                        onClick={() => setCurrentTab(tabItem.id)}
                                        className={clsx(
                                            "w-full flex items-center px-4 py-3 text-left rounded-xl transition-all duration-200 group mb-2 relative overflow-hidden",
                                            currentTab === tabItem.id
                                                ? "bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/30 text-emerald-700 dark:text-emerald-300 shadow-md border border-emerald-200 dark:border-emerald-700 transform scale-105"
                                                : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:scale-102"
                                        )}
                                    >
                                        <div className={clsx(
                                            "w-3 h-3 rounded-full mr-3 transition-all duration-200",
                                            currentTab === tabItem.id
                                                ? "bg-gradient-to-r from-emerald-500 to-teal-500 shadow-sm"
                                                : "bg-gray-300 dark:bg-gray-600 group-hover:bg-gray-400"
                                        )}></div>
                                        <span className="font-semibold">{tabItem.label}</span>
                                        {currentTab === tabItem.id && (
                                            <div className="ml-auto w-1 h-8 bg-gradient-to-b from-emerald-500 to-teal-500 rounded-full shadow-sm"></div>
                                        )}
                                        {currentTab === tabItem.id && (
                                            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-teal-500/5 rounded-xl"></div>
                                        )}
                                    </button>
                                ))}
                            </nav>
                        </div>

                        {/* Action Buttons - Moved to Sidebar */}
                        <div className="mt-6 space-y-4">
                            <button
                                onClick={fetchSettings}
                                disabled={loading || saving}
                                className="w-full inline-flex items-center justify-center px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm text-sm font-semibold text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-md"
                            >
                                <RefreshIcon size={18} className={clsx("mr-2", { 'animate-spin': loading })} />
                                Refresh Settings
                            </button>
                            <button
                                onClick={handleSaveSettings}
                                disabled={loading || saving || isReadOnly}
                                className="w-full inline-flex items-center justify-center px-4 py-3 border border-transparent rounded-xl shadow-lg text-sm font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-xl transform hover:scale-105"
                            >
                                {saving ? (
                                    <>
                                        <Loader2 size={18} className="animate-spin mr-2" />
                                        Saving Changes...
                                    </>
                                ) : (
                                    <>
                                        <SaveIcon size={18} className="mr-2" />
                                        Save All Changes
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 min-w-0">
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                            {/* Content Header */}
                            <div className="px-6 py-6 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 border-b border-gray-200 dark:border-gray-600">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
                                            <div className="w-8 h-8 bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900 dark:to-teal-900 rounded-lg flex items-center justify-center">
                                                <div className="w-3 h-3 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full"></div>
                                            </div>
                                            {tabList.find(tab => tab.id === currentTab)?.label}
                                        </h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                                            Configure your {tabList.find(tab => tab.id === currentTab)?.label.toLowerCase()} settings and preferences
                                        </p>
                                    </div>
                                    <div className="flex items-center space-x-3">
                                        {saving && (
                                            <div className="flex items-center space-x-2 px-3 py-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg border border-emerald-200 dark:border-emerald-700">
                                                <Loader2 size={16} className="animate-spin text-emerald-600 dark:text-emerald-400" />
                                                <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">Saving...</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Content Body */}
                            <div className="p-6">
                                {tabList.map((tabItem) => (
                                    <div
                                        key={tabItem.id}
                                        className={clsx("transition-opacity duration-200", {
                                            "hidden": currentTab !== tabItem.id,
                                        })}
                                    >
                                        {currentTab === tabItem.id && (
                                            <div className="animate-fadeIn">
                                                {tabItem.component}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {snackbarOpen && (
                <div
                    className={clsx(
                        "fixed bottom-6 left-1/2 -translate-x-1/2 p-4 rounded-xl shadow-2xl flex items-center space-x-3 z-50 transition-all duration-300 transform-gpu backdrop-blur-sm border",
                        {
                            'bg-emerald-600 text-white border-emerald-500 shadow-emerald-500/25': snackbarSeverity === 'success',
                            'bg-red-600 text-white border-red-500 shadow-red-500/25': snackbarSeverity === 'error',
                            'bg-blue-600 text-white border-blue-500 shadow-blue-500/25': snackbarSeverity === 'info',
                            'bg-amber-500 text-white border-amber-400 shadow-amber-500/25': snackbarSeverity === 'warning',
                        }
                    )}
                    role="alert"
                >
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/20">
                        {snackbarSeverity === 'success' && <CheckCircleIcon size={20} />}
                        {snackbarSeverity === 'error' && <ErrorOutlineIcon size={20} />}
                        {snackbarSeverity === 'info' && <InfoIcon size={20} />}
                        {snackbarSeverity === 'warning' && <WarningIcon size={20} />}
                    </div>
                    <p className="text-base font-semibold">{snackbarMessage}</p>
                    <button
                        onClick={handleSnackbarClose}
                        className="p-1.5 rounded-full hover:bg-white hover:bg-opacity-20 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-white/50"
                        aria-label="Close notification"
                    >
                        <CloseIcon size={16} />
                    </button>
                </div>
            )}
        </div>
    );
};

export default SettingsPage;

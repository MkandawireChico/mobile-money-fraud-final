// client/src/components/settings/DataSettings.tsx
import React, { useState, useEffect } from 'react';
import axios from '../../api/axios.ts';
import { HelpCircle } from 'lucide-react';

interface DataSettingsData {
    retention_policy_enabled: boolean;
    transaction_retention_days: number;
    alert_retention_days: number;
    audit_log_retention_days: number;
    data_export_formats: string[];
}

interface DataSettingsProps {
    settings: DataSettingsData | null;
    onSettingsChange: (newValues: any) => void;
    onSave: (values: DataSettingsData) => Promise<void>;
    isReadOnly: boolean;
}

const DataSettings: React.FC<DataSettingsProps> = ({ settings: initialSettings, onSave, isReadOnly }) => {
    const [settings, setSettings] = useState<DataSettingsData | null>(initialSettings);
    const [loading, setLoading] = useState<boolean>(true);
    const [saving, setSaving] = useState<boolean>(false);
    const [cleanupLoading, setCleanupLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (initialSettings) {
            setSettings(initialSettings);
            setLoading(false);
        } else {
            setLoading(true);
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
        if (isReadOnly) return;

        if (!settings) return;

        // Validation check for retention days
        if (settings.transaction_retention_days < 0 || settings.alert_retention_days < 0 || settings.audit_log_retention_days < 0) {
            setError('Retention days cannot be negative.');
            return;
        }

        setSaving(true);
        setError(null);

        try {
            await onSave(settings);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to save data settings.');
        } finally {
            setSaving(false);
        }
    };

    const handleManualCleanup = async () => {
        if (isReadOnly) return;

        setCleanupLoading(true);
        setError(null);

        try {
            await axios.post('/api/data/cleanup');
            console.log('Manual data cleanup initiated successfully!');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to initiate manual data cleanup.');
            console.error('Error initiating manual cleanup:', err);
        } finally {
            setCleanupLoading(false);
        }
    };

    // Retention preview for user feedback
    const retentionPreview = [
        settings?.retention_policy_enabled && 'Retention Policy Enabled',
        settings?.transaction_retention_days && `Transaction Retention: ${settings.transaction_retention_days} days`,
        settings?.alert_retention_days && `Alert Retention: ${settings.alert_retention_days} days`,
        settings?.audit_log_retention_days && `Audit Log Retention: ${settings.audit_log_retention_days} days`,
        settings?.data_export_formats.length > 0 && `Export Formats: ${settings.data_export_formats.join(', ')}`,
    ].filter(Boolean).join(', ');

    if (loading || settings === null) {
        return (
            <div className="p-3 bg-white rounded-lg shadow-md mb-3">
                <div className="flex justify-center p-4">
                    <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-blue-500"></div>
                    <p className="ml-4 text-gray-600">Loading data settings...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-3 bg-white rounded-lg shadow-md mb-3">
            <h2 className="text-xl font-semibold mb-2 flex items-center">
                Data Retention & Management
                <span className="ml-2">
                    <button
                        className="p-1 text-gray-500 hover:text-gray-700"
                        aria-label="help"
                    >
                        <HelpCircle className="h-5 w-5" />
                    </button>
                </span>
            </h2>
            {error && (
                <div className="mb-2">
                    <p className="text-red-600">{error}</p>
                </div>
            )}
            <div className="grid gap-3">
                <div>
                    <label className="flex items-center">
                        <input
                            type="checkbox"
                            checked={settings.retention_policy_enabled}
                            onChange={handleChange}
                            name="retention_policy_enabled"
                            className="mr-2 form-checkbox text-blue-600"
                            disabled={isReadOnly}
                        />
                        <span className="text-sm text-gray-700">Enable Data Retention Policies</span>
                    </label>
                </div>

                <div>
                    <label htmlFor="transaction-retention-days" className="block text-sm font-medium text-gray-700">Transaction Data Retention (days)</label>
                    <input
                        id="transaction-retention-days"
                        type="number"
                        name="transaction_retention_days"
                        value={settings.transaction_retention_days}
                        onChange={handleChange}
                        className="mt-1 block w-full p-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-200 disabled:text-gray-500"
                        min="0"
                        disabled={!settings.retention_policy_enabled || isReadOnly}
                    />
                    <p className="mt-1 text-xs text-gray-500">Number of days to keep transaction records.</p>
                </div>

                <div>
                    <label htmlFor="alert-retention-days" className="block text-sm font-medium text-gray-700">Alert Data Retention (days)</label>
                    <input
                        id="alert-retention-days"
                        type="number"
                        name="alert_retention_days"
                        value={settings.alert_retention_days}
                        onChange={handleChange}
                        className="mt-1 block w-full p-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-200 disabled:text-gray-500"
                        min="0"
                        disabled={!settings.retention_policy_enabled || isReadOnly}
                    />
                    <p className="mt-1 text-xs text-gray-500">Number of days to keep fraud alert records.</p>
                </div>

                <div>
                    <label htmlFor="audit-log-retention-days" className="block text-sm font-medium text-gray-700">Audit Log Retention (days)</label>
                    <input
                        id="audit-log-retention-days"
                        type="number"
                        name="audit_log_retention_days"
                        value={settings.audit_log_retention_days}
                        onChange={handleChange}
                        className="mt-1 block w-full p-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-200 disabled:text-gray-500"
                        min="0"
                        disabled={!settings.retention_policy_enabled || isReadOnly}
                    />
                    <p className="mt-1 text-xs text-gray-500">Number of days to keep system audit logs.</p>
                </div>

                <div>
                    <label htmlFor="export-formats" className="block text-sm font-medium text-gray-700">Available Export Formats</label>
                    <select
                        id="export-formats"
                        multiple
                        value={settings.data_export_formats || []}
                        onChange={(e) => {
                            if (!isReadOnly) {
                                setSettings(prev => ({ ...prev!, data_export_formats: Array.from(e.target.selectedOptions, option => option.value) }));
                            }
                        }}
                        className="mt-1 block w-full p-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-200 disabled:text-gray-500"
                        disabled={isReadOnly}
                    >
                        {['CSV', 'JSON', 'XML', 'PDF'].map((format) => (
                            <option key={format} value={format}>
                                {format}
                            </option>
                        ))}
                    </select>
                    <p className="mt-1 text-xs text-gray-500">Select the file formats users can export data in.</p>
                </div>
            </div>

            <div className="mt-3 flex justify-between items-center">
                <button
                    onClick={handleManualCleanup}
                    disabled={cleanupLoading || isReadOnly}
                    className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center relative"
                >
                    {cleanupLoading ? (
                        <>
                            Cleaning...
                            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-white absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" style={{ marginTop: '-12px', marginLeft: '-12px' }}></div>
                        </>
                    ) : (
                        'Run Manual Cleanup'
                    )}
                </button>
                <button
                    onClick={handleSave}
                    disabled={saving || isReadOnly}
                    className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center relative"
                >
                    {saving ? (
                        <>
                            Saving...
                            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-white absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" style={{ marginTop: '-12px', marginLeft: '-12px' }}></div>
                        </>
                    ) : (
                        'Save Settings'
                    )}
                </button>
            </div>

            {retentionPreview && (
                <div className="mt-2 p-2 bg-gray-100 rounded text-sm text-gray-700">
                    <p>Preview: {retentionPreview}</p>
                </div>
            )}
        </div>
    );
};

export default DataSettings;